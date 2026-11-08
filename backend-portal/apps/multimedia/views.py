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


class RecursoMultimediaAdminDetailView(generics.RetrieveUpdateAPIView):
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

        media_root = Path(settings.MEDIA_ROOT).resolve()
        file_path = (media_root / resource.ruta_o_url).resolve()
        if media_root not in file_path.parents or not file_path.is_file():
            return Response({'detail': 'El archivo no se encuentra disponible en el almacenamiento.'}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(open(file_path, 'rb'), content_type=multimedia_content_type(resource))
        filename = multimedia_download_name(resource)
        response['Content-Disposition'] = content_disposition_header(True, filename)
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
