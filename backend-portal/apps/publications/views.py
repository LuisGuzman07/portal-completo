import hashlib
import os
import uuid
from pathlib import Path

from django.conf import settings
from django.db import connection, transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import AreaTematica, Investigador
from apps.audit.models import registrar_auditoria
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
    CanRegisterPublication,
    CanReviewPublication,
)
from .serializers import (
    AutorSerializer,
    CategoriaSerializer,
    DocumentoDigitalSerializer,
    PalabraClaveSerializer,
    PublicacionCreateUpdateSerializer,
    PublicacionDetailSerializer,
    PublicacionListSerializer,
    RevisionPublicacionSerializer,
    TipoDocumentoSerializer,
    TipoPublicacionSerializer,
)


# ==============================================================================
# Helper de Almacenamiento Local Seguro de Documentos
# ==============================================================================

MAX_FILE_SIZE = 26214400  # 25 MB


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

    # Directorio persistente
    media_root = Path(settings.MEDIA_ROOT)
    pub_dir = media_root / 'publicaciones' / str(publicacion_id)
    pub_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f'{uuid.uuid4().hex}.pdf'
    full_path = pub_dir / safe_filename

    # Guardar en disco
    file_obj.seek(0)
    with open(full_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)

    rel_path = f'publicaciones/{publicacion_id}/{safe_filename}'
    return {
        'ruta_privada': rel_path,
        'nombre_original': os.path.basename(filename),
        'tamano_bytes': file_obj.size,
        'checksum_sha256': checksum,
        'mime': 'application/pdf',
    }


def delete_physical_file(ruta_privada):
    """Elimina el archivo físico del almacenamiento si existe, evitando path traversal."""
    if not ruta_privada:
        return
    media_root = Path(settings.MEDIA_ROOT).resolve()
    target_path = (media_root / ruta_privada).resolve()
    try:
        # Verificar que el path esté dentro de MEDIA_ROOT
        if media_root in target_path.parents and target_path.is_file():
            target_path.unlink()
    except Exception as e:
        print(f'Error al eliminar archivo físico {target_path}: {e}')


def ensure_catalogs_seeded():
    """Siembra catálogos estándar si están vacíos para garantizar operatividad inmediata."""
    if TipoPublicacion.objects.count() == 0:
        default_types = [
            'Artículo Científico',
            'Ensayo Monográfico',
            'Dictamen Pericial Forense',
            'Estudio de Caso Criminológico',
            'Tesis / Disertación Académica',
        ]
        for t in default_types:
            TipoPublicacion.objects.get_or_create(nombre=t)

    if TipoDocumento.objects.count() == 0:
        default_doc_types = [
            'Artículo Completo (PDF)',
            'Manuscrito Pre-print',
            'Dictamen / Informe Técnico',
            'Anexo Metodológico / Evidencia',
        ]
        for dt in default_doc_types:
            TipoDocumento.objects.get_or_create(nombre=dt)

    if Categoria.objects.count() == 0:
        area = AreaTematica.objects.first()
        if not area:
            area = AreaTematica.objects.create(
                nombre='Ciencias Penales y Criminológicas',
                descripcion='Línea de investigación institucional en criminología empírica y peritaje'
            )
        default_categories = [
            'Criminología Clínica y Diagnóstica',
            'Criminalística y Balística Forense',
            'Psicología Jurídica y Forense',
            'Victimología y Derechos Humanos',
            'Política Criminal y Prevención',
        ]
        for cat_name in default_categories:
            Categoria.objects.get_or_create(
                area=area,
                nombre=cat_name,
                defaults={'descripcion': f'Investigación especializada en {cat_name}'}
            )


# ==============================================================================
# CU15: Catálogos de Clasificación Académica
# ==============================================================================

class TipoPublicacionListView(generics.ListCreateAPIView):
    serializer_class = TipoPublicacionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        ensure_catalogs_seeded()
        return TipoPublicacion.objects.all().order_by('nombre')


class TipoDocumentoListView(generics.ListCreateAPIView):
    serializer_class = TipoDocumentoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        ensure_catalogs_seeded()
        return TipoDocumento.objects.all().order_by('nombre')


class CategoriaListCreateView(generics.ListCreateAPIView):
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        qs = PalabraClave.objects.all()
        if search:
            qs = qs.filter(termino__icontains=search)
        return qs.order_by('termino')


class InvestigadoresDisponiblesAutoresView(views.APIView):
    """Retorna la lista de investigadores activos para asignarlos fácilmente como autores."""
    permission_classes = [IsAuthenticated]

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
                'email': u.email,
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

        # Parsear listas si vienen en form-data multipart
        categoria_ids = data.getlist('categoria_ids') if hasattr(data, 'getlist') and data.getlist('categoria_ids') else data.get('categoria_ids', [])
        if isinstance(categoria_ids, str):
            categoria_ids = [int(c.strip()) for c in categoria_ids.split(',') if c.strip().isdigit()]

        palabras_clave = data.getlist('palabras_clave') if hasattr(data, 'getlist') and data.getlist('palabras_clave') else data.get('palabras_clave', [])
        if isinstance(palabras_clave, str):
            palabras_clave = [p.strip() for p in palabras_clave.split(',') if p.strip()]

        serializer = PublicacionCreateUpdateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Estado inicial: 'pendiente' para entrar a revisión académica
        pub = serializer.save(
            registrada_por=request.user,
            estado=data.get('estado', 'pendiente')
        )

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
        uploaded_doc = None
        archivo = request.FILES.get('archivo')
        if archivo:
            try:
                doc_tipo_id = data.get('documento_tipo_id')
                if doc_tipo_id and str(doc_tipo_id).isdigit():
                    tipo_doc = TipoDocumento.objects.get(id=int(doc_tipo_id))
                else:
                    tipo_doc = TipoDocumento.objects.first()

                doc_meta = validate_and_save_pdf(archivo, pub.id)
                uploaded_doc = DocumentoDigital.objects.create(
                    publicacion=pub,
                    tipo=tipo_doc,
                    cargado_por=request.user,
                    titulo=data.get('documento_titulo') or f'Documento Principal: {pub.titulo[:100]}',
                    ruta_privada=doc_meta['ruta_privada'],
                    nombre_original=doc_meta['nombre_original'],
                    mime=doc_meta['mime'],
                    tamano_bytes=doc_meta['tamano_bytes'],
                    checksum_sha256=doc_meta['checksum_sha256'],
                    nivel_acceso=data.get('documento_nivel_acceso', 'restringido'),
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

        detail_serializer = PublicacionDetailSerializer(pub)
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
        serializer = PublicacionDetailSerializer(pub)
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
        serializer = PublicacionCreateUpdateSerializer(pub, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pub = serializer.save()

        # Actualizar categorías si se especifican
        if 'categoria_ids' in data:
            cat_ids = data.get('categoria_ids', [])
            if isinstance(cat_ids, str):
                cat_ids = [int(c.strip()) for c in cat_ids.split(',') if c.strip().isdigit()]
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

        detail_serializer = PublicacionDetailSerializer(pub)
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
        nivel_acceso = request.data.get('nivel_acceso', 'restringido')

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

        resultado = request.data.get('resultado', '').strip().lower()
        if resultado not in ('aprobada', 'rechazada', 'observada', 'pendiente'):
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
        has_review_privileges = bool(
            user and user.is_authenticated and (
                user.is_superuser
                or user.has_role('superadmin')
                or user.has_role('admin_academico')
                or user.has_role('comite_academico')
            )
        )

        qs = Publicacion.objects.select_related('tipo', 'registrada_por').prefetch_related(
            'autores_relacion__autor', 'categorias__area', 'palabras_clave', 'documentos'
        )

        solicitud_estado = request.query_params.get('estado')
        if has_review_privileges and solicitud_estado:
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

        serializer = PublicacionListSerializer(qs, many=True)
        return Response(serializer.data)


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
        has_review_privileges = bool(
            user and user.is_authenticated and (
                user.is_superuser
                or user.has_role('superadmin')
                or user.has_role('admin_academico')
                or user.has_role('comite_academico')
            )
        )
        is_owner = bool(user and user.is_authenticated and pub.registrada_por_id == user.id)

        # Si no está aprobada, solo el propietario o revisor puede verla
        if pub.estado != 'aprobada' and not (has_review_privileges or is_owner):
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

        serializer = PublicacionDetailSerializer(pub)
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

        has_review_privileges = bool(
            user and user.is_authenticated and (
                user.is_superuser
                or user.has_role('superadmin')
                or user.has_role('admin_academico')
                or user.has_role('comite_academico')
            )
        )
        is_author = bool(user and user.is_authenticated and pub.registrada_por_id == user.id)
        is_member = bool(
            user and user.is_authenticated and (
                has_review_privileges
                or user.has_role('investigador')
                or user.has_role('miembro')
            )
        )

        # Regla 1: Si la publicación no está aprobada, solo autor o revisor pueden acceder al documento
        if pub.estado != 'aprobada' and not (is_author or has_review_privileges):
            return Response(
                {'detail': 'No tiene autorización para descargar documentos de una publicación no aprobada.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Regla 2: Niveles de acceso del documento
        nivel = doc.nivel_acceso.lower()
        if nivel == 'restringido':
            if not (is_author or has_review_privileges):
                return Response(
                    {'detail': 'Este documento es confidencial/restringido y solo puede ser accedido por el autor o revisores.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif nivel == 'miembros':
            if not is_member and not is_author:
                return Response(
                    {'detail': 'Este documento es exclusivo para miembros e investigadores acreditados de ABOCCRIM. Inicie sesión.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Regla 3: Comprobar existencia física del archivo
        media_root = Path(settings.MEDIA_ROOT).resolve()
        file_path = (media_root / doc.ruta_privada).resolve()

        if not (media_root in file_path.parents and file_path.is_file()):
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
        response = FileResponse(open(file_path, 'rb'), content_type=doc.mime or 'application/pdf')
        disposition = 'inline' if inline else 'attachment'
        # Limpieza de nombre para Content-Disposition
        safe_filename = doc.nombre_original.replace('"', '').replace('\r', '').replace('\n', '')
        response['Content-Disposition'] = f'{disposition}; filename="{safe_filename}"'
        return response
