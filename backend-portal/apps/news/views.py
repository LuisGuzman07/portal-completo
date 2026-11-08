from django.db import transaction
from django.db.models import Prefetch, Q
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.audit.models import registrar_auditoria
from apps.multimedia.models import RecursoMultimedia
from .models import Noticia
from .permissions import CanManageNews
from .serializers import NoticiaPublicaSerializer, NoticiaSerializer


class NoticiaPublicaListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = NoticiaPublicaSerializer

    def get_queryset(self):
        queryset = Noticia.objects.filter(estado='publicado').prefetch_related(
            Prefetch(
                'recursos_multimedia',
                queryset=RecursoMultimedia.objects.filter(nivel_acceso='publico'),
                to_attr='recursos_publicos',
            )
        )
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(titulo__icontains=search) | Q(contenido__icontains=search))
        return queryset


class NoticiaAdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageNews]
    serializer_class = NoticiaSerializer

    def get_queryset(self):
        queryset = Noticia.objects.prefetch_related('recursos_multimedia')
        estado = self.request.query_params.get('estado', '').strip()
        search = self.request.query_params.get('search', '').strip()
        if estado:
            queryset = queryset.filter(estado=estado)
        if search:
            queryset = queryset.filter(Q(titulo__icontains=search) | Q(contenido__icontains=search))
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        noticia = serializer.save(creada_por=self.request.user)
        registrar_auditoria(
            request=self.request, accion='CREAR_NOTICIA', entidad='Noticia',
            registro_afectado_id=noticia.id,
            detalle=f'Noticia creada: {noticia.titulo} (estado={noticia.estado}).',
        )


class NoticiaAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageNews]
    queryset = Noticia.objects.prefetch_related('recursos_multimedia')
    serializer_class = NoticiaSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        noticia = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_NOTICIA', entidad='Noticia',
            registro_afectado_id=noticia.id,
            detalle=f'Noticia actualizada: {noticia.titulo} (estado={noticia.estado}).',
        )
