from django.db.models import Prefetch, Q
from django.db import transaction
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.audit.models import registrar_auditoria
from apps.multimedia.models import RecursoMultimedia
from .models import Evento
from .permissions import CanManageEvents
from .serializers import EventoPublicoSerializer, EventoSerializer


class EventoPublicoListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventoPublicoSerializer

    def get_queryset(self):
        queryset = Evento.objects.filter(estado='publicado')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(titulo__icontains=search) | Q(descripcion__icontains=search) | Q(lugar__icontains=search))
        return queryset.select_related('creado_por').prefetch_related(
            Prefetch(
                'recursos_multimedia',
                queryset=RecursoMultimedia.objects.filter(nivel_acceso='publico'),
                to_attr='recursos_publicos',
            )
        )


class EventoAdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageEvents]
    serializer_class = EventoSerializer

    def get_queryset(self):
        queryset = Evento.objects.select_related('creado_por')
        estado = self.request.query_params.get('estado', '').strip()
        search = self.request.query_params.get('search', '').strip()
        if estado:
            queryset = queryset.filter(estado=estado)
        if search:
            queryset = queryset.filter(Q(titulo__icontains=search) | Q(descripcion__icontains=search) | Q(lugar__icontains=search))
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        evento = serializer.save(creado_por=self.request.user)
        registrar_auditoria(
            request=self.request, accion='CREAR_EVENTO', entidad='Evento',
            registro_afectado_id=evento.id, detalle=f'Evento creado: {evento.titulo} (estado={evento.estado}).',
        )


class EventoAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageEvents]
    queryset = Evento.objects.select_related('creado_por')
    serializer_class = EventoSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        evento = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_EVENTO', entidad='Evento',
            registro_afectado_id=evento.id,
            detalle=f'Evento actualizado: {evento.titulo} (estado={evento.estado}).',
        )
