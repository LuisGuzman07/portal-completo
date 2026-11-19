from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils.http import content_disposition_header
from rest_framework import generics, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.audit.models import registrar_auditoria
from apps.common.storage_service import storage_service
from .models import RecursoMultimedia
from .permissions import (
    CanManageMultimedia,
    has_accredited_member_access,
    has_multimedia_admin_access,
    has_multimedia_review_access,
)
from .serializers import RecursoMultimediaPublicoSerializer, RecursoMultimediaSerializer
from .storage import multimedia_content_type, multimedia_download_name


class RecursoMultimediaPublicoListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = RecursoMultimediaPublicoSerializer

    def get_queryset(self):
        user = self.request.user
        access_levels = ['publico']
        if has_accredited_member_access(user):
            access_levels.append('miembros')
        if has_multimedia_review_access(user):
            access_levels.append('restringido')
        visible_parent = (
            Q(evento__isnull=True, noticia__isnull=True)
            | Q(evento__estado='publicado', noticia__isnull=True)
            | Q(noticia__estado='publicado', evento__isnull=True)
        )
        queryset = RecursoMultimedia.objects.filter(
            nivel_acceso__in=access_levels,
        ).filter(visible_parent).select_related('evento', 'noticia', 'cargado_por')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search)
                | Q(descripcion__icontains=search)
                | Q(tipo__icontains=search)
                | Q(evento__titulo__icontains=search)
                | Q(noticia__titulo__icontains=search)
            )
        return queryset


class RecursoMultimediaAdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageMultimedia]
    serializer_class = RecursoMultimediaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = RecursoMultimedia.objects.select_related('evento', 'noticia', 'cargado_por')
        nivel = self.request.query_params.get('nivel_acceso', '').strip()
        search = self.request.query_params.get('search', '').strip()
        if nivel:
            queryset = queryset.filter(nivel_acceso=nivel)
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search)
                | Q(descripcion__icontains=search)
                | Q(tipo__icontains=search)
                | Q(evento__titulo__icontains=search)
                | Q(noticia__titulo__icontains=search)
            )
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        resource = serializer.save(cargado_por=self.request.user)
        registrar_auditoria(
            request=self.request, accion='CREAR_RECURSO_MULTIMEDIA', entidad='RecursoMultimedia',
            registro_afectado_id=resource.id,
            detalle=f'Recurso multimedia creado: {resource.titulo} (tipo={resource.tipo}, acceso={resource.nivel_acceso}).',
        )


class RecursoMultimediaAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, CanManageMultimedia]
    queryset = RecursoMultimedia.objects.select_related('evento', 'noticia', 'cargado_por')
    serializer_class = RecursoMultimediaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic
    def perform_update(self, serializer):
        resource = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_RECURSO_MULTIMEDIA', entidad='RecursoMultimedia',
            registro_afectado_id=resource.id,
            detalle=f'Recurso multimedia actualizado: {resource.titulo} (tipo={resource.tipo}, acceso={resource.nivel_acceso}).',
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        ruta = instance.ruta_o_url
        titulo = instance.titulo
        res_id = instance.id
        if instance.tipo not in ('enlace', 'enlace_noticia') and not ruta.lower().startswith(('http://', 'https://')):
            from .storage import remove_multimedia_file
            remove_multimedia_file(ruta)
        instance.delete()
        registrar_auditoria(
            request=self.request, accion='ELIMINAR_RECURSO_MULTIMEDIA', entidad='RecursoMultimedia',
            registro_afectado_id=res_id,
            detalle=f'Recurso multimedia eliminado: {titulo}.',
        )


class RecursoMultimediaDescargaView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        resource = RecursoMultimedia.objects.select_related('evento', 'noticia', 'cargado_por').filter(pk=pk).first()
        if not resource:
            return Response({'detail': 'El recurso solicitado no existe.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._can_access(request.user, resource):
            return Response({'detail': 'No tienes autorización para acceder a este recurso.'}, status=status.HTTP_403_FORBIDDEN)
        if resource.ruta_o_url.lower().startswith(('http://', 'https://')):
            return Response({'detail': 'Este recurso se encuentra en un servicio externo.', 'enlace': resource.ruta_o_url}, status=status.HTTP_400_BAD_REQUEST)

        if not storage_service.file_exists(resource.ruta_o_url):
            return Response({'detail': 'El archivo no se encuentra disponible en el almacenamiento.'}, status=status.HTTP_404_NOT_FOUND)

        filename = multimedia_download_name(resource)
        inline = request.query_params.get('inline') in ('true', '1') or request.query_params.get('stream') in ('true', '1')
        extension = Path(resource.ruta_o_url).suffix.lower().lstrip('.')
        if 'inline' not in request.query_params and extension in ('jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'mp4', 'mov', 'webm'):
            inline = True

        response = storage_service.stream_file_response(
            relative_path=resource.ruta_o_url,
            filename=filename,
            content_type=multimedia_content_type(resource),
            inline=inline
        )
        response['Content-Disposition'] = content_disposition_header(not inline, filename)
        response['Accept-Ranges'] = 'bytes'
        response['X-Content-Type-Options'] = 'nosniff'
        if resource.nivel_acceso == 'publico':
            response['Cache-Control'] = 'public, max-age=300'
        else:
            response['Cache-Control'] = 'private, no-store'
        return response

    @staticmethod
    def _can_access(user, resource):
        if has_multimedia_admin_access(user):
            return True

        if resource.evento_id and resource.evento.estado != 'publicado':
            return False
        if resource.noticia_id and resource.noticia.estado != 'publicado':
            return False

        if resource.nivel_acceso == 'publico':
            return True
        if resource.nivel_acceso == 'miembros':
            return has_accredited_member_access(user)
        if resource.nivel_acceso == 'restringido':
            return has_multimedia_review_access(user)
        return False
