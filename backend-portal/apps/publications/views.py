import hashlib
import os
import uuid
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import AreaTematica, Investigador, Miembro
from apps.audit.models import registrar_auditoria
from apps.common.storage_service import storage_service
from .models import (
    Autor,
    Categoria,
    DescargaDocumento,
    DocumentoDigital,
    PalabraClave,
    Publicacion,
    PublicacionAutor,
    PublicacionCategoria,
    PublicacionPalabra,
    RevisionPublicacion,
    TipoDocumento,
    TipoPublicacion,
    VisualizacionContenido,
)
from .permissions import (
    CanManageDocument,
    CanManagePublication,
    CanManagePublicationCatalog,
    CanRegisterPublication,
    CanReviewPublication,
)
from .serializers import (
    CategoriaSerializer,
    DocumentoDigitalSerializer,
    PalabraClaveSerializer,
    PublicacionCreateUpdateSerializer,
    PublicacionDetailSerializer,
    PublicacionListSerializer,
    PublicacionPublicaDetailSerializer,
    PublicacionPublicaListSerializer,
    PublicacionPropietarioDetailSerializer,
    RevisionPublicacionSerializer,
    TipoDocumentoSerializer,
    TipoPublicacionSerializer,
)


# ==============================================================================
# Helper de Almacenamiento Local Seguro de Documentos
# ==============================================================================

MAX_FILE_SIZE = 26214400  # 25 MB


def user_has_review_privileges(user):
    return bool(
        user and user.is_authenticated and (
            user.is_superuser
            or user.has_role('superadmin')
            or user.has_role('admin_academico')
            or user.has_role('comite_academico')
        )
    )


def publication_is_owned_by(user, publication):
    return bool(
        user and user.is_authenticated and (
            publication.registrada_por_id == user.id
            or publication.autores.filter(investigador__perfil_academico__usuario_id=user.id).exists()
        )
    )


def publication_is_visible_to(user, publication):
    return user_has_review_privileges(user) or publication_is_owned_by(user, publication)


def validate_and_save_pdf(file_obj, publicacion_id):
    """
    Valida que el archivo sea un PDF auténtico, calcula su hash SHA-256
    y lo almacena de forma segura en MEDIA_ROOT/publicaciones/<publicacion_id>/<uuid>.pdf.
    Retorna (ruta_relativa, nombre_original, tamano, checksum, mime).
    """
    if not file_obj:
        raise ValueError('No se proporcionó ningún archivo.')

    filename = file_obj.name or 'documento.pdf'
    ext = os.path.splitext(filename)[1].lower()
    if ext != '.pdf':
        raise ValueError('El archivo debe tener extensión .pdf.')

    if file_obj.size > MAX_FILE_SIZE:
        raise ValueError(f'El tamaño del archivo supera el límite permitido de {MAX_FILE_SIZE // (1024 * 1024)} MB.')

    # Validar cabecera mágica de PDF (%PDF-)
    file_obj.seek(0)
    header = file_obj.read(1024)
    if b'%PDF-' not in header:
        raise ValueError('El archivo no tiene un formato PDF válido o está corrupto.')

    # Calcular SHA-256
    file_obj.seek(0)
    sha256 = hashlib.sha256()
    for chunk in file_obj.chunks():
        sha256.update(chunk)
    checksum = sha256.hexdigest()

    safe_filename = f'{uuid.uuid4().hex}.pdf'
    rel_path = f'publicaciones/{publicacion_id}/{safe_filename}'

    # Guardar en almacenamiento MinIO / local
    file_obj.seek(0)
    storage_service.upload_file(
        file_obj=file_obj,
        relative_path=rel_path,
        content_type='application/pdf'
    )

    return {
        'ruta_privada': rel_path,
        'nombre_original': os.path.basename(filename),
        'tamano_bytes': file_obj.size,
        'checksum_sha256': checksum,
        'mime': 'application/pdf',
    }


def delete_physical_file(ruta_privada):
    """Elimina el archivo del almacenamiento si existe."""
    if not ruta_privada:
        return
    try:
        storage_service.delete_file(ruta_privada)
    except Exception as e:
        print(f'Error al eliminar archivo {ruta_privada}: {e}')


TAXONOMIA_INSTITUCIONAL = [
    {
        'numero': 1,
        'nombre': '1. Criminología',
        'descripcion': 'Estudio interdisciplinario de las conductas antisociales, etiología del delito y control social.',
        'subareas': [
            'Criminología Clínica',
            'Criminología Crítica',
            'Criminología Ambiental',
            'Criminología Corporativa',
        ],
    },
    {
        'numero': 2,
        'nombre': '2. Criminalística',
        'descripcion': 'Aplicación de métodos y técnicas de investigación científica del hecho delictivo y sus indicios materiales.',
        'subareas': [
            'Escena del Crimen',
            'Balística Forense',
            'Documentología',
            'Huellas y Lofoscopia',
        ],
    },
    {
        'numero': 3,
        'nombre': '3. Ciencias Forenses',
        'descripcion': 'Disciplinas biomédicas y científicas orientadas al auxilio pericial de la administración de justicia.',
        'subareas': [
            'Medicina Legal',
            'Psicología Forense',
            'Antropología Forense',
            'Genética Forense / ADN',
        ],
    },
    {
        'numero': 4,
        'nombre': '4. Victimología',
        'descripcion': 'Atención integral, mitigación del daño y estudio científico de los procesos de victimización.',
        'subareas': [
            'Atención a Víctimas',
            'Reparación Integral',
            'Victimización Secundaria',
            'Restitución de Derechos',
        ],
    },
    {
        'numero': 5,
        'nombre': '5. Sistema Penal',
        'descripcion': 'Dogmática jurídica penal, garantías procesales y gestión de los regímenes de ejecución penitenciaria.',
        'subareas': [
            'Política Criminal',
            'Proceso Penal',
            'Ejecución Penal',
            'Justicia Restaurativa',
        ],
    },
    {
        'numero': 6,
        'nombre': '6. Seguridad',
        'descripcion': 'Estrategias de prevención situacional, seguridad pública, penitenciaria y gobernanza institucional.',
        'subareas': [
            'Seguridad Ciudadana',
            'Seguridad Penitenciaria',
            'Seguridad Institucional',
            'Análisis Delictual',
        ],
    },
    {
        'numero': 7,
        'nombre': '7. Violencia, Conflicto y Vulnerabilidad',
        'descripcion': 'Fenomenología de la violencia interpersonal, colectiva y estructural en grupos en situación de vulnerabilidad.',
        'subareas': [
            'Violencia de Género',
            'Violencia contra la Niñez',
            'Trata y Tráfico Ilícito',
            'Violencia Social e Interpersonal',
        ],
    },
]


def parse_and_resolve_category_ids(raw_cat_ids):
    """
    Convierte cualquier formato de IDs de categorías (enteros, strings numéricos,
    strings con prefijo 'predef_' o nombres de categorías) en IDs enteros válidos de la BD.
    """
    if isinstance(raw_cat_ids, str):
        raw_cat_ids = [c.strip() for c in raw_cat_ids.split(',') if c.strip()]
    elif not isinstance(raw_cat_ids, (list, tuple)):
        raw_cat_ids = [raw_cat_ids] if raw_cat_ids else []

    clean_ids = []
    for item in raw_cat_ids:
        if item is None or item == '':
            continue
        item_str = str(item).strip()
        if item_str.isdigit():
            clean_ids.append(int(item_str))
            continue

        cat_name = item_str[7:].strip() if item_str.startswith('predef_') else item_str
        cat_obj = Categoria.objects.filter(nombre__iexact=cat_name).first()
        if not cat_obj:
            default_area = AreaTematica.objects.first()
            if not default_area:
                default_area = AreaTematica.objects.create(
                    nombre='1. Criminología',
                    descripcion='Área institucional por defecto'
                )
            cat_obj = Categoria.objects.create(
                area=default_area,
                nombre=cat_name,
                descripcion=f'Categoría institucional: {cat_name}'
            )
        clean_ids.append(cat_obj.id)

    return list(dict.fromkeys(clean_ids))


def ensure_catalogs_seeded():
    """Siembra catálogos estándar y taxonomía institucional completa si faltan."""
    if TipoPublicacion.objects.count() == 0:
        default_types = [
            'Artículo Científico',
            'Ensayo Monográfico',
            'Dictamen Pericial Forense',
            'Estudio de Caso Criminológico',
            'Tesis / Disertación Académica',
            'Libro / Monografía Especializada',
        ]
        for t in default_types:
            TipoPublicacion.objects.get_or_create(nombre=t)

    if TipoDocumento.objects.count() == 0:
        default_doc_types = [
            'Artículo Completo (PDF)',
            'Manuscrito Pre-print',
            'Dictamen / Informe Técnico',
            'Anexo Metodológico / Evidencia',
            'Libro Completo (PDF)',
        ]
        for dt in default_doc_types:
            TipoDocumento.objects.get_or_create(nombre=dt)

    # Siembra y sincronización de las 7 Áreas y 28 Categorías institucionales
    for item in TAXONOMIA_INSTITUCIONAL:
        area, _ = AreaTematica.objects.get_or_create(
            nombre=item['nombre'],
            defaults={'descripcion': item['descripcion']}
        )
        for sub_name in item['subareas']:
            Categoria.objects.get_or_create(
                area=area,
                nombre=sub_name,
                defaults={'descripcion': f'Investigación institucional en {sub_name} ({item["nombre"]})'}
            )


# ==============================================================================
# CU15: Catálogos de Clasificación Académica
# ==============================================================================

class TipoPublicacionListView(generics.ListCreateAPIView):
    serializer_class = TipoPublicacionSerializer
    permission_classes = [CanManagePublicationCatalog]
    pagination_class = None

    def get_queryset(self):
        ensure_catalogs_seeded()
        return TipoPublicacion.objects.all().order_by('nombre')


class TipoDocumentoListView(generics.ListCreateAPIView):
    serializer_class = TipoDocumentoSerializer
    permission_classes = [CanManagePublicationCatalog]
    pagination_class = None

    def get_queryset(self):
        ensure_catalogs_seeded()
        return TipoDocumento.objects.all().order_by('nombre')


class CategoriaListCreateView(generics.ListCreateAPIView):
    serializer_class = CategoriaSerializer
    permission_classes = [CanManagePublicationCatalog]
    pagination_class = None

    def get_queryset(self):
        ensure_catalogs_seeded()
        qs = Categoria.objects.select_related('area')
        area_id = self.request.query_params.get('area_id')
        if area_id and area_id.isdigit():
            qs = qs.filter(area_id=int(area_id))
        return qs.order_by('area__nombre', 'nombre')

    @transaction.atomic
    def perform_create(self, serializer):
        cat = serializer.save()
        registrar_auditoria(
            request=self.request,
            accion='CREAR_CATEGORIA',
            entidad='Categoria',
            registro_afectado_id=cat.id,
            detalle=f'Categoría creada: {cat.nombre} en área {cat.area.nombre}',
        )


class PalabraClaveListView(generics.ListCreateAPIView):
    serializer_class = PalabraClaveSerializer
    permission_classes = [CanManagePublicationCatalog]
    pagination_class = None

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        qs = PalabraClave.objects.all()
        if search:
            qs = qs.filter(termino__icontains=search)
        return qs.order_by('termino')


class InvestigadoresDisponiblesAutoresView(views.APIView):
    """Retorna la lista de investigadores activos para asignarlos fácilmente como autores."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Investigador.objects.select_related(
            'perfil_academico__usuario'
        ).filter(estado='activo')
        items = []
        for inv in qs:
            u = inv.perfil_academico.usuario
            p = inv.perfil_academico
            items.append({
                'investigador_id': inv.id,
                'nombre_completo': f'{u.nombres} {u.apellidos}'.strip(),
                'nombres': u.nombres,
                'apellidos': u.apellidos,
                'institucion': p.institucion or 'ABOCCRIM',
                'orcid': p.orcid or '',
            })
        return Response(items)


# ==============================================================================
# CU10: Registrar y Administrar Publicaciones Científicas
# ==============================================================================

class PublicacionListCreateView(views.APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [CanRegisterPublication]

    def get(self, request):
        ensure_catalogs_seeded()
        qs = Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
            'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos'
        )

        if not user_has_review_privileges(request.user):
            qs = qs.filter(
                Q(registrada_por=request.user)
                | Q(autores__investigador__perfil_academico__usuario=request.user)
            ).distinct()

        # Filtros
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(titulo__icontains=search)
                | Q(resumen__icontains=search)
                | Q(autores__nombres__icontains=search)
                | Q(autores__apellidos__icontains=search)
                | Q(palabras_clave__termino__icontains=search)
            ).distinct()

        tipo_id = request.query_params.get('tipo_id')
        if tipo_id and tipo_id.isdigit():
            qs = qs.filter(tipo_id=int(tipo_id))

        categoria_id = request.query_params.get('categoria_id')
        if categoria_id and categoria_id.isdigit():
            qs = qs.filter(categorias__id=int(categoria_id))

        area_id = request.query_params.get('area_id')
        if area_id and area_id.isdigit():
            qs = qs.filter(categorias__area_id=int(area_id))

        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        anio = request.query_params.get('anio')
        if anio and anio.isdigit():
            qs = qs.filter(anio=int(anio))

        investigador_id = request.query_params.get('investigador_id')
        if investigador_id and investigador_id.isdigit():
            qs = qs.filter(autores__investigador_id=int(investigador_id))

        # Filtro "mis publicaciones"
        mine = request.query_params.get('mine')
        if mine in ('true', '1'):
            qs = qs.filter(
                Q(registrada_por=request.user)
                | Q(autores__investigador__perfil_academico__usuario=request.user)
            ).distinct()

        serializer = PublicacionListSerializer(qs, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        ensure_catalogs_seeded()
        data = request.data.copy()

        # Parsear y resolver categorías para soportar enteros, strings o prefijos predef_
        raw_cats = data.getlist('categoria_ids') if hasattr(data, 'getlist') and data.getlist('categoria_ids') else data.get('categoria_ids', [])
        categoria_ids = parse_and_resolve_category_ids(raw_cats)
        if hasattr(data, 'setlist'):
            data.setlist('categoria_ids', categoria_ids)
        else:
            data['categoria_ids'] = categoria_ids

        palabras_clave = data.getlist('palabras_clave') if hasattr(data, 'getlist') and data.getlist('palabras_clave') else data.get('palabras_clave', [])
        if isinstance(palabras_clave, str):
            palabras_clave = [p.strip() for p in palabras_clave.split(',') if p.strip()]
        if hasattr(data, 'setlist'):
            data.setlist('palabras_clave', palabras_clave)

        serializer = PublicacionCreateUpdateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Estado inicial: 'pendiente' para entrar a revisión académica
        pub = serializer.save(registrada_por=request.user, estado='pendiente')

        # Vincular autor principal si viene investigador_id o autor_nombre
        investigador_id = data.get('investigador_id')
        if investigador_id:
            try:
                inv = Investigador.objects.select_related('perfil_academico__usuario').get(id=investigador_id)
                u = inv.perfil_academico.usuario
                p = inv.perfil_academico
                autor, _ = Autor.objects.get_or_create(
                    investigador=inv,
                    defaults={
                        'nombres': u.nombres,
                        'apellidos': u.apellidos,
                        'afiliacion': p.institucion or 'ABOCCRIM',
                        'orcid': p.orcid or '',
                    }
                )
                PublicacionAutor.objects.create(
                    publicacion=pub,
                    autor=autor,
                    orden=1,
                    es_correspondencia=True
                )
            except Investigador.DoesNotExist:
                pass
        else:
            # Crear autor con datos del usuario actual
            autor, _ = Autor.objects.get_or_create(
                nombres=request.user.nombres,
                apellidos=request.user.apellidos,
                defaults={'afiliacion': 'ABOCCRIM'}
            )
            PublicacionAutor.objects.create(
                publicacion=pub,
                autor=autor,
                orden=1,
                es_correspondencia=True
            )

        # Vincular categorías (CU15)
        for cat_id in categoria_ids:
            try:
                cat = Categoria.objects.get(id=cat_id)
                PublicacionCategoria.objects.get_or_create(publicacion=pub, categoria=cat)
            except Categoria.DoesNotExist:
                pass

        # Vincular palabras clave
        for termino in palabras_clave:
            t = termino.strip().lower()
            if t:
                palabra, _ = PalabraClave.objects.get_or_create(termino=t)
                PublicacionPalabra.objects.get_or_create(publicacion=pub, palabra=palabra)

        # CU14: Si se adjuntó archivo PDF directamente en el formulario
        archivo = request.FILES.get('archivo')
        if archivo:
            try:
                access_level = data.get('documento_nivel_acceso', 'restringido')
                if access_level not in dict(DocumentoDigital.NIVELES_ACCESO):
                    raise ValueError('El nivel de acceso del documento no es válido.')
                doc_tipo_id = data.get('documento_tipo_id')
                if doc_tipo_id and str(doc_tipo_id).isdigit():
                    tipo_doc = TipoDocumento.objects.get(id=int(doc_tipo_id))
                else:
                    tipo_doc = TipoDocumento.objects.first()

                doc_meta = validate_and_save_pdf(archivo, pub.id)
                DocumentoDigital.objects.create(
                    publicacion=pub,
                    tipo=tipo_doc,
                    cargado_por=request.user,
                    titulo=data.get('documento_titulo') or f'Documento Principal: {pub.titulo[:100]}',
                    ruta_privada=doc_meta['ruta_privada'],
                    nombre_original=doc_meta['nombre_original'],
                    mime=doc_meta['mime'],
                    tamano_bytes=doc_meta['tamano_bytes'],
                    checksum_sha256=doc_meta['checksum_sha256'],
                    nivel_acceso=access_level,
                )
            except Exception as e:
                # Si falla la validación del archivo, lanzar error para rollback
                transaction.set_rollback(True)
                return Response({'error': f'Error al procesar el archivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        registrar_auditoria(
            request=request,
            accion='CREAR_PUBLICACION',
            entidad='Publicacion',
            registro_afectado_id=pub.id,
            detalle=f'Publicación registrada: "{pub.titulo}" (estado={pub.estado}).',
        )

        serializer_class = (
            PublicacionDetailSerializer
            if user_has_review_privileges(request.user)
            else PublicacionPropietarioDetailSerializer
        )
        detail_serializer = serializer_class(pub, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class PublicacionDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
                'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos__tipo', 'revisiones__revisor'
            ).get(pk=pk)
        except Publicacion.DoesNotExist:
            return None

    def get(self, request, pk):
        pub = self.get_object(pk)
        if not pub:
            return Response({'detail': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        if not publication_is_visible_to(request.user, pub):
            return Response({'detail': 'No tiene autorización para consultar esta publicación.'}, status=status.HTTP_404_NOT_FOUND)
        serializer_class = (
            PublicacionDetailSerializer
            if user_has_review_privileges(request.user)
            else PublicacionPropietarioDetailSerializer
        )
        serializer = serializer_class(pub, context={'request': request})
        return Response(serializer.data)

    @transaction.atomic
    def put(self, request, pk):
        pub = self.get_object(pk)
        if not pub:
            return Response({'detail': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Permisos de modificación
        perm = CanManagePublication()
        if not perm.has_object_permission(request, self, pub):
            return Response({'detail': perm.message}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        # Parsear y resolver categorías para soportar enteros, strings o prefijos predef_
        if 'categoria_ids' in data or (hasattr(data, 'getlist') and data.getlist('categoria_ids')):
            raw_cats = data.getlist('categoria_ids') if hasattr(data, 'getlist') and data.getlist('categoria_ids') else data.get('categoria_ids', [])
            clean_patch_cats = parse_and_resolve_category_ids(raw_cats)
            if hasattr(data, 'setlist'):
                data.setlist('categoria_ids', clean_patch_cats)
            else:
                data['categoria_ids'] = clean_patch_cats

        serializer = PublicacionCreateUpdateSerializer(pub, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pub = serializer.save()

        # Actualizar categorías si se especifican
        if 'categoria_ids' in data:
            raw_cats = data.getlist('categoria_ids') if hasattr(data, 'getlist') and data.getlist('categoria_ids') else data.get('categoria_ids', [])
            cat_ids = parse_and_resolve_category_ids(raw_cats)
            PublicacionCategoria.objects.filter(publicacion=pub).delete()
            for cat_id in cat_ids:
                try:
                    cat = Categoria.objects.get(id=cat_id)
                    PublicacionCategoria.objects.create(publicacion=pub, categoria=cat)
                except Categoria.DoesNotExist:
                    pass

        # Actualizar palabras clave si se especifican
        if 'palabras_clave' in data:
            palabras = data.get('palabras_clave', [])
            if isinstance(palabras, str):
                palabras = [p.strip() for p in palabras.split(',') if p.strip()]
            PublicacionPalabra.objects.filter(publicacion=pub).delete()
            for termino in palabras:
                t = termino.strip().lower()
                if t:
                    palabra, _ = PalabraClave.objects.get_or_create(termino=t)
                    PublicacionPalabra.objects.create(publicacion=pub, palabra=palabra)

        registrar_auditoria(
            request=request,
            accion='ACTUALIZAR_PUBLICACION',
            entidad='Publicacion',
            registro_afectado_id=pub.id,
            detalle=f'Publicación actualizada: "{pub.titulo}" (estado={pub.estado}).',
        )

        serializer_class = (
            PublicacionDetailSerializer
            if user_has_review_privileges(request.user)
            else PublicacionPropietarioDetailSerializer
        )
        detail_serializer = serializer_class(pub, context={'request': request})
        return Response(detail_serializer.data)


# ==============================================================================
# CU14: Administrar Documentos Digitales
# ==============================================================================

class DocumentoDigitalListCreateView(views.APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def get(self, request, pub_id):
        try:
            pub = Publicacion.objects.get(pk=pub_id)
        except Publicacion.DoesNotExist:
            return Response({'detail': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if not publication_is_visible_to(request.user, pub):
            return Response({'detail': 'No tiene autorización para consultar los documentos de esta publicación.'}, status=status.HTTP_404_NOT_FOUND)

        docs = DocumentoDigital.objects.filter(publicacion=pub).select_related('tipo', 'cargado_por')
        serializer = DocumentoDigitalSerializer(docs, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request, pub_id):
        try:
            pub = Publicacion.objects.get(pk=pub_id)
        except Publicacion.DoesNotExist:
            return Response({'detail': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        perm = CanManageDocument()
        if not perm.has_object_permission(request, self, pub):
            return Response({'detail': perm.message}, status=status.HTTP_403_FORBIDDEN)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'Debe seleccionar un archivo PDF para subir.'}, status=status.HTTP_400_BAD_REQUEST)

        nivel_acceso = request.data.get('nivel_acceso', 'restringido')
        if nivel_acceso not in dict(DocumentoDigital.NIVELES_ACCESO):
            return Response({'error': 'El nivel de acceso del documento no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            doc_meta = validate_and_save_pdf(archivo, pub.id)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

        tipo_id = request.data.get('tipo_id')
        if tipo_id and str(tipo_id).isdigit():
            try:
                tipo = TipoDocumento.objects.get(id=int(tipo_id))
            except TipoDocumento.DoesNotExist:
                tipo = TipoDocumento.objects.first()
        else:
            tipo = TipoDocumento.objects.first()

        titulo = request.data.get('titulo') or doc_meta['nombre_original']
        doc = DocumentoDigital.objects.create(
            publicacion=pub,
            tipo=tipo,
            cargado_por=request.user,
            titulo=titulo,
            ruta_privada=doc_meta['ruta_privada'],
            nombre_original=doc_meta['nombre_original'],
            mime=doc_meta['mime'],
            tamano_bytes=doc_meta['tamano_bytes'],
            checksum_sha256=doc_meta['checksum_sha256'],
            nivel_acceso=nivel_acceso,
        )

        registrar_auditoria(
            request=request,
            accion='SUBIR_DOCUMENTO',
            entidad='DocumentoDigital',
            registro_afectado_id=doc.id,
            detalle=f'Documento subido: "{doc.titulo}" ({doc.nombre_original}) para publicación #{pub.id}.',
        )

        return Response(DocumentoDigitalSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentoDigitalDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, doc_id):
        try:
            return DocumentoDigital.objects.select_related('publicacion', 'tipo', 'cargado_por').get(pk=doc_id)
        except DocumentoDigital.DoesNotExist:
            return None

    def get(self, request, doc_id):
        doc = self.get_object(doc_id)
        if not doc:
            return Response({'detail': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if not publication_is_visible_to(request.user, doc.publicacion):
            return Response({'detail': 'No tiene autorización para consultar este documento.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(DocumentoDigitalSerializer(doc).data)

    @transaction.atomic
    def patch(self, request, doc_id):
        doc = self.get_object(doc_id)
        if not doc:
            return Response({'detail': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        perm = CanManageDocument()
        if not perm.has_object_permission(request, self, doc):
            return Response({'detail': perm.message}, status=status.HTTP_403_FORBIDDEN)

        serializer = DocumentoDigitalSerializer(doc, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        doc = serializer.save()

        registrar_auditoria(
            request=request,
            accion='ACTUALIZAR_DOCUMENTO',
            entidad='DocumentoDigital',
            registro_afectado_id=doc.id,
            detalle=f'Metadatos actualizados para documento #{doc.id}: "{doc.titulo}".',
        )

        return Response(DocumentoDigitalSerializer(doc).data)

    @transaction.atomic
    def delete(self, request, doc_id):
        doc = self.get_object(doc_id)
        if not doc:
            return Response({'detail': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        perm = CanManageDocument()
        if not perm.has_object_permission(request, self, doc):
            return Response({'detail': perm.message}, status=status.HTTP_403_FORBIDDEN)

        pub_id = doc.publicacion_id
        doc_titulo = doc.titulo
        ruta = doc.ruta_privada

        # Eliminar registro y archivo físico
        doc.delete()
        delete_physical_file(ruta)

        registrar_auditoria(
            request=request,
            accion='ELIMINAR_DOCUMENTO',
            entidad='DocumentoDigital',
            registro_afectado_id=doc_id,
            detalle=f'Documento eliminado: "{doc_titulo}" de publicación #{pub_id}.',
        )

        return Response({'message': 'Documento eliminado exitosamente.'}, status=status.HTTP_200_OK)


class DocumentoDigitalReplaceView(views.APIView):
    """Reemplaza el archivo físico de un documento digital existente."""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, doc_id):
        try:
            doc = DocumentoDigital.objects.select_related('publicacion').get(pk=doc_id)
        except DocumentoDigital.DoesNotExist:
            return Response({'detail': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        perm = CanManageDocument()
        if not perm.has_object_permission(request, self, doc):
            return Response({'detail': perm.message}, status=status.HTTP_403_FORBIDDEN)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'Debe seleccionar un archivo PDF para el reemplazo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            old_path = doc.ruta_privada
            new_meta = validate_and_save_pdf(archivo, doc.publicacion_id)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar datos del documento
        doc.ruta_privada = new_meta['ruta_privada']
        doc.nombre_original = new_meta['nombre_original']
        doc.tamano_bytes = new_meta['tamano_bytes']
        doc.checksum_sha256 = new_meta['checksum_sha256']
        doc.mime = new_meta['mime']
        doc.fecha_carga = timezone.now()
        doc.save()

        # Eliminar archivo antiguo de forma segura
        delete_physical_file(old_path)

        registrar_auditoria(
            request=request,
            accion='REEMPLAZAR_DOCUMENTO',
            entidad='DocumentoDigital',
            registro_afectado_id=doc.id,
            detalle=f'Archivo reemplazado en documento #{doc.id}: nuevo={doc.nombre_original}.',
        )

        return Response(DocumentoDigitalSerializer(doc).data)


# ==============================================================================
# CU11: Revisión de Publicaciones Académicas
# ==============================================================================

class RevisionPublicacionListView(views.APIView):
    """
    Lista las publicaciones disponibles para revisión por parte del comité académico o administradores.
    """
    permission_classes = [CanReviewPublication]

    def get(self, request):
        ensure_catalogs_seeded()
        qs = Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
            'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos__tipo', 'revisiones__revisor'
        )

        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        else:
            # Por defecto mostrar pendientes de revisión y observadas
            qs = qs.filter(estado__in=['pendiente', 'observada', 'en_revision'])

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(titulo__icontains=search)
                | Q(resumen__icontains=search)
                | Q(autores__nombres__icontains=search)
                | Q(autores__apellidos__icontains=search)
            ).distinct()

        tipo_id = request.query_params.get('tipo_id')
        if tipo_id and tipo_id.isdigit():
            qs = qs.filter(tipo_id=int(tipo_id))

        categoria_id = request.query_params.get('categoria_id')
        if categoria_id and categoria_id.isdigit():
            qs = qs.filter(categorias__id=int(categoria_id))

        serializer = PublicacionListSerializer(qs.order_by('-fecha_registro'), many=True)
        return Response(serializer.data)


class RevisionPublicacionActionView(views.APIView):
    """
    Permite a un revisor autorizado (superadmin, admin_academico, comite_academico)
    aprobar, rechazar u observar una publicación, registrando el dictamen oficial.
    """
    permission_classes = [CanReviewPublication]

    @transaction.atomic
    def post(self, request, pk):
        try:
            pub = Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
                'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos__tipo', 'revisiones__revisor'
            ).get(pk=pk)
        except Publicacion.DoesNotExist:
            return Response({'detail': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if pub.estado not in ('pendiente', 'en_revision', 'observada'):
            return Response(
                {'error': 'Esta publicación ya tiene un dictamen final y no está disponible para revisión.'},
                status=status.HTTP_409_CONFLICT,
            )

        resultado = request.data.get('resultado', '').strip().lower()
        if resultado not in ('aprobada', 'rechazada', 'observada'):
            return Response(
                {'error': 'El resultado de la revisión debe ser "aprobada", "rechazada" u "observada".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tipo_revision = request.data.get('tipo_revision', 'comite')
        observaciones = request.data.get('observaciones', '').strip()

        if resultado in ('rechazada', 'observada') and not observaciones:
            return Response(
                {'error': f'Es obligatorio ingresar observaciones o justificación técnica para el dictamen "{resultado}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar estado de publicación
        estado_anterior = pub.estado
        pub.estado = resultado
        if resultado == 'aprobada':
            if not pub.fecha_publicacion:
                pub.fecha_publicacion = timezone.now().date()
        pub.save()

        # Registrar revisión formal en revision_publicacion
        revision = RevisionPublicacion.objects.create(
            publicacion=pub,
            revisor=request.user,
            tipo_revision=tipo_revision,
            observaciones=observaciones or f'Dictamen emitido: {resultado}.',
            resultado_propuesto=resultado,
        )

        registrar_auditoria(
            request=request,
            accion=f'REVISAR_PUBLICACION_{resultado.upper()}',
            entidad='Publicacion',
            registro_afectado_id=pub.id,
            detalle=(
                f'Publicación #{pub.id} dictaminada como "{resultado}" (anterior: {estado_anterior}) '
                f'por {request.user.email}. Observaciones: {observaciones[:150]}'
            )
        )

        return Response({
            'message': f'La publicación ha sido dictaminada exitosamente como "{resultado}".',
            'publicacion': PublicacionDetailSerializer(pub).data,
            'revision': RevisionPublicacionSerializer(revision).data
        }, status=status.HTTP_200_OK)


# ==============================================================================
# CU12: Repositorio Académico y Consulta Pública/Privada
# ==============================================================================

class RepositorioListView(views.APIView):
    """
    Catálogo del repositorio académico institucional ABOCCRIM.
    Para usuarios generales o anónimos, solo expone publicaciones con estado 'aprobada'.
    Usuarios con privilegios de revisión pueden consultar otros estados.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        ensure_catalogs_seeded()
        user = request.user
        can_review = user_has_review_privileges(user)

        qs = Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
            'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos'
        )

        solicitud_estado = request.query_params.get('estado')
        if can_review and solicitud_estado:
            qs = qs.filter(estado=solicitud_estado)
        else:
            # Los usuarios generales solo ven publicaciones aprobadas
            qs = qs.filter(estado='aprobada')

        # Búsqueda general por texto (CU16)
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(titulo__icontains=search)
                | Q(resumen__icontains=search)
                | Q(autores__nombres__icontains=search)
                | Q(autores__apellidos__icontains=search)
                | Q(palabras_clave__termino__icontains=search)
                | Q(referencias__icontains=search)
            ).distinct()

        # Filtro por Tipo de Publicación
        tipo_id = request.query_params.get('tipo_id')
        if tipo_id and str(tipo_id).isdigit():
            qs = qs.filter(tipo_id=int(tipo_id))

        # Filtro por Categoría
        categoria_id = request.query_params.get('categoria_id')
        if categoria_id and str(categoria_id).isdigit():
            qs = qs.filter(categorias__id=int(categoria_id))

        # Filtro por Área Temática
        area_id = request.query_params.get('area_id')
        if area_id and str(area_id).isdigit():
            qs = qs.filter(categorias__area_id=int(area_id))

        # Filtro por Año
        anio = request.query_params.get('anio')
        if anio and str(anio).isdigit():
            qs = qs.filter(anio=int(anio))

        # Filtro por Investigador / Autor
        investigador_id = request.query_params.get('investigador_id')
        if investigador_id and str(investigador_id).isdigit():
            qs = qs.filter(autores__investigador_id=int(investigador_id))

        # Filtro por Rango de Fechas
        fecha_desde = request.query_params.get('fecha_desde')
        if fecha_desde:
            qs = qs.filter(Q(fecha_publicacion__gte=fecha_desde) | Q(fecha_registro__date__gte=fecha_desde))

        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_hasta:
            qs = qs.filter(Q(fecha_publicacion__lte=fecha_hasta) | Q(fecha_registro__date__lte=fecha_hasta))

        # Ordenar por fecha más reciente
        qs = qs.order_by('-fecha_publicacion', '-fecha_registro', '-id')

        serializer = PublicacionPublicaListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class RepositorioAccessStatusView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        has_active_membership = Miembro.objects.filter(
            usuario_id=request.user.id,
            estado='activo',
        ).exists()
        has_active_investigator_profile = Investigador.objects.filter(
            perfil_academico__usuario_id=request.user.id,
            estado='activo',
        ).exists()
        return Response({
            'documentos_miembros': has_active_membership or has_active_investigator_profile,
        })


class RepositorioDetailView(views.APIView):
    """
    Detalle de una publicación en el repositorio.
    Registra automáticamente la métrica en visualizacion_contenido.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            pub = Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
                'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos__tipo', 'revisiones__revisor'
            ).get(pk=pk)
        except Publicacion.DoesNotExist:
            return Response({'detail': 'Publicación no encontrada en el repositorio.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        can_review = user_has_review_privileges(user)
        is_owner = publication_is_owned_by(user, pub)

        # Si no está aprobada, solo el propietario o revisor puede verla
        if pub.estado != 'aprobada' and not (can_review or is_owner):
            return Response(
                {'detail': 'La publicación solicitada se encuentra en proceso editorial y aún no está disponible públicamente.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Registrar visualización (CU12 metric)
        try:
            VisualizacionContenido.objects.create(
                publicacion=pub,
                usuario=user if user.is_authenticated else None,
            )
        except Exception:
            pass

        if can_review:
            serializer = PublicacionDetailSerializer(pub, context={'request': request})
        elif pub.estado == 'aprobada':
            serializer = PublicacionPublicaDetailSerializer(pub, context={'request': request})
        else:
            serializer = PublicacionPropietarioDetailSerializer(pub, context={'request': request})
        return Response(serializer.data)


# ==============================================================================
# CU13: Descarga Segura de Documentos Digitales
# ==============================================================================

class DocumentoDigitalDownloadView(views.APIView):
    """
    Descarga controlada de documentos digitales asociados a publicaciones.
    Verifica estado de publicación, nivel de acceso del archivo, existencia física
    y registra auditoría y métrica en descarga_documento.
    """
    permission_classes = [AllowAny]

    def get(self, request, doc_id):
        try:
            doc = DocumentoDigital.objects.select_related('publicacion', 'cargado_por').get(pk=doc_id)
        except DocumentoDigital.DoesNotExist:
            return Response({'detail': 'El documento solicitado no existe.'}, status=status.HTTP_404_NOT_FOUND)

        pub = doc.publicacion
        user = request.user

        # Regla 0: Requiere inicio de sesión (rol de usuario o superior) para previsualizar o descargar
        if not (user and user.is_authenticated):
            return Response(
                {'detail': 'Para previsualizar o descargar este documento académico debe iniciar sesión en el portal.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        has_review_privileges = user_has_review_privileges(user)
        is_author = publication_is_owned_by(user, pub)

        # Regla 1: Si la publicación no está aprobada, solo autor o revisor pueden acceder al documento
        if pub.estado != 'aprobada' and not (is_author or has_review_privileges):
            return Response(
                {'detail': 'No tiene autorización para descargar documentos de una publicación no aprobada.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Regla 2: Niveles de acceso del documento
        nivel = doc.nivel_acceso.lower()
        if nivel not in dict(DocumentoDigital.NIVELES_ACCESO):
            return Response(
                {'detail': 'El documento tiene un nivel de acceso no válido y no puede descargarse.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if nivel == 'restringido':
            if not (is_author or has_review_privileges):
                return Response(
                    {'detail': 'Este documento es confidencial/restringido y solo puede ser accedido por el autor o revisores.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif nivel == 'miembros':
            # Por ahora, con tener sesión iniciada (rol de usuario o superior) es suficiente
            pass

        # Regla 3: Comprobar existencia del archivo en el almacenamiento (MinIO / local)
        if not storage_service.file_exists(doc.ruta_privada):
            return Response(
                {'detail': 'El archivo físico no se encuentra disponible en el almacenamiento del servidor.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Registrar descarga en la BD
        try:
            DescargaDocumento.objects.create(
                documento=doc,
                usuario=user if user.is_authenticated else None,
            )
        except Exception:
            pass

        # Registrar auditoría
        registrar_auditoria(
            request=request,
            accion='DESCARGAR_DOCUMENTO',
            entidad='DocumentoDigital',
            registro_afectado_id=doc.id,
            detalle=(
                f'Descarga autorizada de "{doc.nombre_original}" (Doc #{doc.id}, Pub #{pub.id}) '
                f'por {user.email if user.is_authenticated else "Usuario anónimo"}.'
            )
        )

        inline = request.query_params.get('inline') in ('true', '1')
        safe_filename = doc.nombre_original.replace('"', '').replace('\r', '').replace('\n', '')
        return storage_service.stream_file_response(
            relative_path=doc.ruta_privada,
            filename=safe_filename,
            content_type=doc.mime or 'application/pdf',
            inline=inline
        )
