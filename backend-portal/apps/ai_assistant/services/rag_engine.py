import math
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


def format_apa_citation(pub: Publicacion) -> str:
    """Genera la cita bibliográfica en formato estándar académico."""
    autores = [a.nombre_completo for a in pub.autores.all()]
    autores_str = ', '.join(autores) if autores else pub.registrada_por_nombre or 'ABOCCRIM'
    anio_str = str(pub.anio) if pub.anio else 's.f.'
    return f"{autores_str} ({anio_str}). {pub.titulo}. Repositorio Académico ABOCCRIM."


class RAGQueryEngine:
    """
    Motor principal de Generación Aumentada por Recuperación (RAG) de ABOCCRIM.
    """

    SYSTEM_INSTRUCTION = (
        "Eres el Asistente Académico Inteligente de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM). "
        "Tu misión es responder consultas de investigadores basándote EXCLUSIVAMENTE en los fragmentos documentales provistos del repositorio institucional.\n\n"
        "REGLAS ESTATUTARIAS:\n"
        "1. No inventes autores, publicaciones, páginas, años ni datos que no figuren en los fragmentos provistos.\n"
        "2. Cada afirmación importante debe llevar su cita numérica entre corchetes, por ejemplo [1], [2], correspondiente al orden de los documentos provistos.\n"
        "3. Emplea un lenguaje académico, formal, riguroso y pedagógico, propio de las ciencias criminológicas y jurídicas.\n"
        "4. Si la información provista es insuficiente para responder a la pregunta con exactitud, declara con total honestidad: "
        "'No se encontró información suficiente en los documentos autorizados del repositorio ABOCCRIM para responder esta consulta.'\n"
        "5. No hagas alusión a fuentes ajenas a los fragmentos institucionales provistos."
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
            # Crear nueva conversación con título preliminar
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

        # 3. Determinar permisos de acceso a documentos
        allowed_access = cls.determine_user_access(user)

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

        # 6. Calcular similitud coseno y rankear
        scored_fragments = []
        for frag in fragmentos_qs:
            emb = frag.embedding
            if emb and isinstance(emb, list):
                sim = cosine_similarity(query_vector, emb)
                if sim > 0.15:  # Umbral mínimo de relevancia
                    scored_fragments.append((sim, frag))

        scored_fragments.sort(key=lambda x: x[0], reverse=True)
        # Seleccionar los 2 fragmentos más relevantes para optimizar inferencia rápida en CPU
        top_fragments = scored_fragments[:2]

        # 7. Si no hay fragmentos relevantes en el repositorio
        if not top_fragments:
            respuesta_sin_datos = (
                "No se encontró información suficiente en los documentos autorizados del repositorio ABOCCRIM "
                "para responder esta consulta. Le sugerimos revisar la Biblioteca Académica o consultar sobre "
                "líneas de investigación activas de la institución."
            )
            mensaje_asistente = MensajeIA.objects.create(
                conversacion=conversacion,
                rol='assistant',
                contenido=respuesta_sin_datos
            )
            conversacion.save(update_fields=['fecha_actualizacion'])

            return {
                'conversacion_id': conversacion.id,
                'conversacion_titulo': conversacion.titulo,
                'mensaje_id': mensaje_asistente.id,
                'contenido': respuesta_sin_datos,
                'fuentes_consultadas': [],
            }

        # 8. Construir contexto enriquecido para Gemini
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
                f"CONTENIDO: {frag.contenido}\n"
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
            f"{''.join(context_parts)}\n\n"
            f"CONSULTA DEL INVESTIGADOR:\n{query_text}\n\n"
            f"RESPUESTA ACADÉMICA FUNDAMENTADA:"
        )

        # 9. Generar respuesta con LLM
        respuesta_texto = LLMService.generate_content(
            prompt=context_prompt,
            system_instruction=cls.SYSTEM_INSTRUCTION
        )

        # 10. Persistir respuesta del asistente y fuentes consultadas en BD
        with transaction.atomic():
            mensaje_asistente = MensajeIA.objects.create(
                conversacion=conversacion,
                rol='assistant',
                contenido=respuesta_texto
            )

            # Asociar fuentes
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
