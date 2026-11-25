import math
import re
from django.db import transaction
from django.utils import timezone

from apps.publications.models import Publicacion, DocumentoDigital
from apps.ai_assistant.models import ConversacionIA, MensajeIA, FuenteMensajeIA, FragmentoDocumento
from .embedding_service import get_query_embedding
from .llm_service import LLMService


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Calcula la similitud coseno entre dos vectores normalizados o estándar."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def is_conversational_or_greeting(text: str) -> bool:
    """Detecta si el mensaje es un saludo o pregunta conversacional básica sobre el asistente."""
    cleaned = re.sub(r'[^\w\s]', '', text.lower()).strip()
    words = cleaned.split()
    if len(words) <= 8:
        greeting_patterns = [
            'hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches',
            'saludos', 'que tal', 'como estas', 'en que puedes ayudarme', 'en que me ayudas',
            'que puedes hacer', 'quien eres', 'para que sirves', 'ayuda', 'hola que tal',
            'gracias', 'muchas gracias', 'adios', 'chao', 'hasta luego'
        ]
        for pattern in greeting_patterns:
            if pattern in cleaned:
                return True
    return False


def is_catalog_or_overview_query(text: str) -> bool:
    """
    Detecta si el usuario está consultando sobre el catálogo, inventario,
    qué documentos o qué publicaciones existen en el repositorio.
    """
    cleaned = text.lower().strip()
    # Normalizar errores tipográficos comunes (ej. docuementos, documetos)
    cleaned = re.sub(r'docuem[a-z]*', 'documento', cleaned)
    cleaned = re.sub(r'docum[a-z]*', 'documento', cleaned)
    cleaned = re.sub(r'[^\w\s]', '', cleaned)

    # 1. Frases y patrones exactos de inventario
    catalog_exact = [
        'que documentos tenemos', 'que documentos hay', 'que documentos existen',
        'que publicaciones tenemos', 'que publicaciones hay', 'que publicaciones existen',
        'cuales son los documentos', 'cuales son las publicaciones', 'cuales documentos',
        'que investigaciones tenemos', 'que investigaciones hay', 'que investigaciones existen',
        'que tesis tenemos', 'que tesis hay', 'que tesis existen',
        'catalogo de publicaciones', 'catalogo de documentos', 'catalogo del repositorio',
        'listar publicaciones', 'listar documentos', 'mostrar publicaciones', 'mostrar documentos',
        'que hay en el repositorio', 'que contiene el repositorio',
        'que tenemos en el repositorio', 'que libros tenemos', 'que articulos tenemos',
        'cuales son las investigaciones', 'que temas tenemos', 'con que documentos contamos',
        'que documentos contiene', 'que investigaciones contiene',
        'todos los documentos', 'todas las publicaciones'
    ]
    for pattern in catalog_exact:
        if pattern in cleaned:
            return True

    # 2. Análisis semántico por palabras clave combinadas
    has_inquiry = bool(re.search(r'\b(que|cuales|cual|listar|muestra|mostrar|ver|dime|conoce|lista|inventario|catalogo|resumen)\b', cleaned))
    has_entity = bool(re.search(r'\b(documento|documentos|publicacion|publicaciones|investigacion|investigaciones|tesis|articulo|articulos|temas)\b', cleaned))
    has_scope = bool(re.search(r'\b(repositorio|biblioteca|plataforma|academia|aboccrim|tenemos|hay|cuenta|existen|disponibles?|registrad[ao]s?)\b', cleaned))

    if has_inquiry and has_entity and has_scope:
        return True

    return False


def format_apa_citation(pub: Publicacion) -> str:
    """Genera la cita bibliográfica en formato estándar académico."""
    autores = [a.nombre_completo for a in pub.autores.all()]
    if autores:
        autores_str = ', '.join(autores)
    else:
        autor_registra = getattr(pub, 'registrada_por_nombre', None)
        if not autor_registra and getattr(pub, 'registrada_por', None):
            autor_registra = pub.registrada_por.get_full_name() or pub.registrada_por.email
        autores_str = autor_registra or 'ABOCCRIM'

    anio_str = str(pub.anio) if pub.anio else 's.f.'
    return f"{autores_str} ({anio_str}). {pub.titulo}. Repositorio Académico ABOCCRIM."


class RAGQueryEngine:
    """
    Motor principal de Generación Aumentada por Recuperación (RAG) de ABOCCRIM.
    Combina recuperación precisa del repositorio institucional con capacidad de respuesta general.
    """

    SYSTEM_INSTRUCTION_CATALOG = (
        "Eres el Asistente Académico Inteligente de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM).\n"
        "El usuario está consultando sobre el catálogo, inventario o publicaciones disponibles en el repositorio institucional.\n"
        "Se te proporciona la lista oficial y completa de publicaciones registradas y aprobadas en ABOCCRIM.\n\n"
        "REGLAS ESTATUTARIAS:\n"
        "1. Presenta de forma ordenada, clara, estructurada y académica TODAS las publicaciones disponibles en el repositorio institucional.\n"
        "2. Para cada publicación, menciona su título exacto, autor(es), año y tipo de documento (Tesis, Artículo, etc.).\n"
        "3. Brinda una breve orientación de qué áreas temáticas abarcan (por ejemplo: peritajes criminalísticos, informática forense / desarrollo de sistemas, derecho procesal penal, etc.).\n"
        "4. Usa citas numéricas como [1], [2], etc., correspondientes al número de cada publicación provista.\n"
        "5. Concluye invitando cordialmente al investigador a consultar en detalle sobre cualquiera de estas publicaciones."
    )

    SYSTEM_INSTRUCTION_RAG = (
        "Eres el Asistente Académico Inteligente de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM).\n"
        "Se te han proporcionado fragmentos relevantes del repositorio institucional para responder la consulta.\n\n"
        "REGLAS ESTATUTARIAS:\n"
        "1. Responde con rigurosidad académica y fundamenta tus afirmaciones en los fragmentos provistos.\n"
        "2. Cada afirmación importante debe llevar su cita numérica entre corchetes, por ejemplo [1], [2], correspondiente al orden de los documentos provistos.\n"
        "3. Emplea un lenguaje académico, formal, riguroso y pedagógico, propio de las ciencias criminológicas y jurídicas.\n"
        "4. Si algún aspecto de la pregunta no está en los fragmentos, puedes complementar brevemente desde la doctrina general aclarando dicha distinción."
    )

    SYSTEM_INSTRUCTION_GREETING = (
        "Eres el Asistente Académico Inteligente de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM).\n"
        "El usuario te está saludando o consultando sobre tus funciones.\n"
        "Responde con cordialidad, elegancia académica y brevedad (máximo 3 párrafos cortos).\n"
        "Preséntate, dale la bienvenida a la plataforma institucional y explícale que puedes orientarlo sobre las "
        "publicaciones, tesis e investigaciones del repositorio de ABOCCRIM, así como resolver dudas sobre ciencias criminológicas, "
        "criminalística y derecho penal. Invítalo amablemente a realizar su consulta."
    )

    SYSTEM_INSTRUCTION_GENERAL = (
        "Eres el Asistente Académico Inteligente de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM).\n"
        "El usuario realiza una consulta académica para la cual NO se encontraron documentos específicos en el repositorio de ABOCCRIM.\n\n"
        "REGLAS OBLIGATORIAS:\n"
        "1. Inicia OBLIGATORIAMENTE tu respuesta advirtiendo claramente con este aviso:\n"
        "*(Nota: Esta respuesta se fundamenta en doctrina y principios criminológicos/jurídicos generales, ya que actualmente no contamos con publicaciones específicas sobre este tema dentro del repositorio institucional de ABOCCRIM.)*\n\n"
        "2. Responde a la pregunta del usuario con una explicación clara, rigurosa, pedagógica y completa basada en tus conocimientos.\n"
        "3. NO uses citas con números como [1] o [2] porque no provienen de documentos del repositorio.\n"
        "4. Concluye invitando amablemente al usuario a consultar sobre otras investigaciones o temas del repositorio."
    )

    @classmethod
    def determine_user_access(cls, user) -> list[str]:
        """Determina los niveles de acceso permitidos para el usuario."""
        if not user or not user.is_authenticated:
            return ['publico']

        # Superadministrador o comisiones académicas
        if getattr(user, 'is_superuser', False) or user.has_role('superadmin') or user.has_role('admin_academico') or user.has_role('comite_academico'):
            return ['publico', 'miembros', 'restringido']

        # Miembros activos o investigadores acreditados
        from apps.academics.models import Miembro, Investigador
        has_member = Miembro.objects.filter(usuario_id=user.id, estado='activo').exists()
        has_inv = Investigador.objects.filter(perfil_academico__usuario_id=user.id, estado='activo').exists()

        if has_member or has_inv:
            return ['publico', 'miembros']

        return ['publico']

    @classmethod
    def execute_query(cls, user, query_text: str, conversacion_id: int = None) -> dict:
        """
        Ejecuta el flujo completo RAG para una consulta de usuario.
        """
        query_text = query_text.strip()
        if not query_text:
            raise ValueError('La consulta no puede estar vacía.')

        # 1. Obtener o crear conversación
        if conversacion_id:
            conversacion = ConversacionIA.objects.get(pk=conversacion_id, usuario=user)
        else:
            titulo_auto = query_text[:50] + ('...' if len(query_text) > 50 else '')
            conversacion = ConversacionIA.objects.create(
                usuario=user,
                titulo=titulo_auto
            )

        # 2. Registrar mensaje del usuario
        mensaje_usuario = MensajeIA.objects.create(
            conversacion=conversacion,
            rol='user',
            contenido=query_text
        )

        # CASO 1: Saludos o preguntas sobre el asistente
        if is_conversational_or_greeting(query_text):
            respuesta_texto = LLMService.generate_content(
                prompt=query_text,
                system_instruction=cls.SYSTEM_INSTRUCTION_GREETING
            )
            with transaction.atomic():
                mensaje_asistente = MensajeIA.objects.create(
                    conversacion=conversacion,
                    rol='assistant',
                    contenido=respuesta_texto
                )
                conversacion.save(update_fields=['fecha_actualizacion'])

            return {
                'conversacion_id': conversacion.id,
                'conversacion_titulo': conversacion.titulo,
                'mensaje_id': mensaje_asistente.id,
                'contenido': respuesta_texto,
                'fuentes_consultadas': [],
            }

        # 3. Determinar permisos de acceso a documentos
        allowed_access = cls.determine_user_access(user)

        # CASO 2: Consulta sobre el catálogo o inventario de publicaciones
        if is_catalog_or_overview_query(query_text):
            publicaciones_qs = Publicacion.objects.filter(
                estado__in=['aprobada', 'aprobado', 'publicada', 'publicado']
            ).select_related('tipo', 'registrada_por').prefetch_related('autores', 'documentos').order_by('-anio', 'titulo')

            # Filtrar por nivel de acceso de documentos
            publicaciones_autorizadas = []
            for pub in publicaciones_qs:
                docs = pub.documentos.all()
                if not docs.exists() or any(d.nivel_acceso in allowed_access for d in docs):
                    publicaciones_autorizadas.append(pub)

            if not publicaciones_autorizadas:
                respuesta_texto = (
                    "Actualmente no se encuentran publicaciones aprobadas disponibles en el repositorio institucional de ABOCCRIM."
                )
                with transaction.atomic():
                    mensaje_asistente = MensajeIA.objects.create(
                        conversacion=conversacion,
                        rol='assistant',
                        contenido=respuesta_texto
                    )
                    conversacion.save(update_fields=['fecha_actualizacion'])

                return {
                    'conversacion_id': conversacion.id,
                    'conversacion_titulo': conversacion.titulo,
                    'mensaje_id': mensaje_asistente.id,
                    'contenido': respuesta_texto,
                    'fuentes_consultadas': [],
                }

            catalog_lines = []
            fuentes_data = []
            for idx, pub in enumerate(publicaciones_autorizadas, start=1):
                autores = ', '.join([a.nombre_completo for a in pub.autores.all()])
                if not autores and pub.registrada_por:
                    autores = pub.registrada_por.get_full_name() or pub.registrada_por.email
                if not autores:
                    autores = 'ABOCCRIM'

                tipo_nombre = pub.tipo.nombre if pub.tipo else 'Publicación Académica'
                doc_first = pub.documentos.first()
                resumen_corto = (pub.resumen[:220] + '...') if pub.resumen and len(pub.resumen) > 220 else (pub.resumen or 'Investigación académica institucional.')

                catalog_lines.append(
                    f"[{idx}] \"{pub.titulo}\"\n"
                    f"    - Tipo: {tipo_nombre}\n"
                    f"    - Autor(es): {autores}\n"
                    f"    - Año: {pub.anio or 's.f.'}\n"
                    f"    - Enfoque / Resumen: {resumen_corto}\n\n"
                )

                fuentes_data.append({
                    'orden': idx,
                    'publicacion_id': pub.id,
                    'documento_id': doc_first.id if doc_first else None,
                    'titulo': pub.titulo,
                    'autor': autores,
                    'anio': pub.anio,
                    'pagina': 1,
                    'cita_bibliografica': format_apa_citation(pub),
                    'pdf_url': f'/api/v1/publications/documents/{doc_first.id}/download/?inline=1' if doc_first else None,
                    'texto_citado': f"{pub.titulo} ({tipo_nombre}, {pub.anio or 's.f.'}) - {resumen_corto}",
                    'similitud': 1.0,
                })

            prompt_catalog = (
                f"CATÁLOGO OFICIAL DE INVESTIGACIONES Y PUBLICACIONES EN EL REPOSITORIO ABOCCRIM ({len(publicaciones_autorizadas)} publicaciones registradas):\n\n"
                f"{''.join(catalog_lines)}\n"
                f"CONSULTA DEL INVESTIGADOR:\n{query_text}\n\n"
                f"RESPUESTA ACADÉMICA (Enumera y describe con claridad todas las publicaciones disponibles, utilizando citas numéricas [1], [2], etc.):"
            )

            respuesta_texto = LLMService.generate_content(
                prompt=prompt_catalog,
                system_instruction=cls.SYSTEM_INSTRUCTION_CATALOG
            )

            with transaction.atomic():
                mensaje_asistente = MensajeIA.objects.create(
                    conversacion=conversacion,
                    rol='assistant',
                    contenido=respuesta_texto
                )
                for f in fuentes_data:
                    FuenteMensajeIA.objects.create(
                        mensaje=mensaje_asistente,
                        publicacion_id=f['publicacion_id'],
                        documento_id=f['documento_id'],
                        numero_pagina=f['pagina'],
                        orden_cita=f['orden'],
                        texto_citado=f['texto_citado'],
                        cita_bibliografica=f['cita_bibliografica'],
                    )
                conversacion.save(update_fields=['fecha_actualizacion'])

            return {
                'conversacion_id': conversacion.id,
                'conversacion_titulo': conversacion.titulo,
                'mensaje_id': mensaje_asistente.id,
                'contenido': respuesta_texto,
                'fuentes_consultadas': fuentes_data,
            }

        # 4. Generar embedding de la consulta
        query_vector = get_query_embedding(query_text)

        # 5. Recuperar fragmentos candidatos autorizados
        fragmentos_qs = FragmentoDocumento.objects.filter(
            publicacion__estado__in=['aprobada', 'aprobado', 'publicada', 'publicado'],
            documento_indexado__documento__nivel_acceso__in=allowed_access,
        ).select_related(
            'publicacion',
            'documento_indexado',
            'documento_indexado__documento',
        ).prefetch_related('publicacion__autores')

        # 6. Calcular similitud coseno con umbral de relevancia
        # Para nomic-embed-text o text-embedding-004
        SIMILARITY_THRESHOLD = 0.65
        scored_fragments = []
        for frag in fragmentos_qs:
            emb = frag.embedding
            if emb and isinstance(emb, list):
                sim = cosine_similarity(query_vector, emb)
                if sim >= SIMILARITY_THRESHOLD:
                    scored_fragments.append((sim, frag))

        scored_fragments.sort(key=lambda x: x[0], reverse=True)

        # Diversidad de fuentes: evitar que un solo documento extenso acapare todos los fragmentos
        seen_publications = set()
        diverse_top_fragments = []
        for sim, frag in scored_fragments:
            pub_id = frag.publicacion_id
            if pub_id not in seen_publications:
                diverse_top_fragments.append((sim, frag))
                seen_publications.add(pub_id)
                if len(diverse_top_fragments) >= 3:
                    break

        # Si aún hay cupo, rellenar con los mejores restantes aunque repitan publicación
        if len(diverse_top_fragments) < 3:
            for sim, frag in scored_fragments:
                if (sim, frag) not in diverse_top_fragments:
                    diverse_top_fragments.append((sim, frag))
                    if len(diverse_top_fragments) >= 3:
                        break

        top_fragments = diverse_top_fragments

        # CASO 2: No hay fragmentos relevantes en el repositorio -> Responder con conocimiento general + aviso
        if not top_fragments:
            general_prompt = (
                f"CONSULTA DEL INVESTIGADOR:\n{query_text}\n\n"
                f"RESPUESTA DOCTRINARIA (recuerda incluir el aviso institucional al inicio):"
            )
            respuesta_texto = LLMService.generate_content(
                prompt=general_prompt,
                system_instruction=cls.SYSTEM_INSTRUCTION_GENERAL
            )
            with transaction.atomic():
                mensaje_asistente = MensajeIA.objects.create(
                    conversacion=conversacion,
                    rol='assistant',
                    contenido=respuesta_texto
                )
                conversacion.save(update_fields=['fecha_actualizacion'])

            return {
                'conversacion_id': conversacion.id,
                'conversacion_titulo': conversacion.titulo,
                'mensaje_id': mensaje_asistente.id,
                'contenido': respuesta_texto,
                'fuentes_consultadas': [],
            }

        # CASO 3: Hay fragmentos relevantes en el repositorio -> RAG con citas [1], [2]
        context_parts = []
        fuentes_data = []

        for idx, (sim, frag) in enumerate(top_fragments, start=1):
            pub = frag.publicacion
            doc = frag.documento_indexado.documento
            autores = ', '.join([a.nombre_completo for a in pub.autores.all()]) or pub.registrada_por_nombre or 'ABOCCRIM'

            context_parts.append(
                f"[{idx}] PUBLICACIÓN: {pub.titulo}\n"
                f"AUTORES: {autores}\n"
                f"AÑO: {pub.anio or 's.f.'}\n"
                f"PÁGINA: {frag.numero_pagina}\n"
                f"CONTENIDO: {frag.contenido}\n\n"
            )

            fuentes_data.append({
                'orden': idx,
                'publicacion_id': pub.id,
                'documento_id': doc.id if doc else None,
                'titulo': pub.titulo,
                'autor': autores,
                'anio': pub.anio,
                'pagina': frag.numero_pagina,
                'cita_bibliografica': format_apa_citation(pub),
                'pdf_url': f'/api/v1/publications/documents/{doc.id}/download/?inline=1' if doc else None,
                'texto_citado': frag.contenido[:250],
                'similitud': round(sim, 3),
            })

        context_prompt = (
            f"DOCUMENTOS RECUPERADOS DEL REPOSITORIO ABOCCRIM:\n\n"
            f"{''.join(context_parts)}\n"
            f"CONSULTA DEL INVESTIGADOR:\n{query_text}\n\n"
            f"RESPUESTA ACADÉMICA FUNDAMENTADA:"
        )

        respuesta_texto = LLMService.generate_content(
            prompt=context_prompt,
            system_instruction=cls.SYSTEM_INSTRUCTION_RAG
        )

        with transaction.atomic():
            mensaje_asistente = MensajeIA.objects.create(
                conversacion=conversacion,
                rol='assistant',
                contenido=respuesta_texto
            )

            for f in fuentes_data:
                FuenteMensajeIA.objects.create(
                    mensaje=mensaje_asistente,
                    publicacion_id=f['publicacion_id'],
                    documento_id=f['documento_id'],
                    numero_pagina=f['pagina'],
                    orden_cita=f['orden'],
                    texto_citado=f['texto_citado'],
                    cita_bibliografica=f['cita_bibliografica'],
                )

            conversacion.save(update_fields=['fecha_actualizacion'])

        return {
            'conversacion_id': conversacion.id,
            'conversacion_titulo': conversacion.titulo,
            'mensaje_id': mensaje_asistente.id,
            'contenido': respuesta_texto,
            'fuentes_consultadas': fuentes_data,
        }
