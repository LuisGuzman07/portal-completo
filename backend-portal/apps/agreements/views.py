from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils import timezone
from django.utils.http import content_disposition_header
from rest_framework import generics, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.audit.models import registrar_auditoria
from .models import Convenio, Institucion
from .permissions import CanManageAgreements, can_manage_agreements
from .serializers import ConvenioAdminSerializer, ConvenioPublicoSerializer, InstitucionSerializer
from .storage import agreement_download_name


def current_agreements():
    today = timezone.localdate()
    return Convenio.objects.filter(
        estado='vigente', fecha_inicio__lte=today,
    ).filter(Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=today))


def public_document_audit_note(agreement):
    if agreement.estado == 'vigente' and agreement.referencia_documental:
        return ' El administrador confirmó que el documento adjunto está autorizado para difusión pública.'
    return ''


class InstitucionAdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageAgreements]
    serializer_class = InstitucionSerializer
    queryset = Institucion.objects.all()

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        queryset = Institucion.objects.all()
        if search:
            queryset = queryset.filter(Q(nombre__icontains=search) | Q(pais__icontains=search))
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        institution = serializer.save()
        registrar_auditoria(
            request=self.request, accion='CREAR_INSTITUCION_CONVENIO', entidad='Institucion',
            registro_afectado_id=institution.id,
            detalle=f'Institución registrada para convenios: {institution.nombre}.',
        )


class InstitucionAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageAgreements]
    queryset = Institucion.objects.all()
    serializer_class = InstitucionSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        institution = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_INSTITUCION_CONVENIO', entidad='Institucion',
            registro_afectado_id=institution.id,
            detalle=f'Institución actualizada: {institution.nombre}.',
        )


class ConvenioPublicoListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ConvenioPublicoSerializer

    def get_queryset(self):
        queryset = current_agreements().select_related('institucion')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(institucion__nombre__icontains=search)
                | Q(institucion__pais__icontains=search)
                | Q(objeto__icontains=search)
            )
        return queryset


class ConvenioAdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageAgreements]
    serializer_class = ConvenioAdminSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Convenio.objects.select_related('institucion', 'registrado_por')
        state = self.request.query_params.get('estado', '').strip()
        search = self.request.query_params.get('search', '').strip()
        if state:
            queryset = queryset.filter(estado=state)
        if search:
            queryset = queryset.filter(
                Q(institucion__nombre__icontains=search)
                | Q(institucion__pais__icontains=search)
                | Q(objeto__icontains=search)
            )
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        agreement = serializer.save(registrado_por=self.request.user)
        registrar_auditoria(
            request=self.request, accion='CREAR_CONVENIO', entidad='Convenio',
            registro_afectado_id=agreement.id,
            detalle=f'Convenio registrado con {agreement.institucion.nombre} (estado={agreement.estado}).{public_document_audit_note(agreement)}',
        )


class ConvenioAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageAgreements]
    queryset = Convenio.objects.select_related('institucion', 'registrado_por')
    serializer_class = ConvenioAdminSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic
    def perform_update(self, serializer):
        agreement = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_CONVENIO', entidad='Convenio',
            registro_afectado_id=agreement.id,
            detalle=f'Convenio actualizado con {agreement.institucion.nombre} (estado={agreement.estado}).{public_document_audit_note(agreement)}',
        )


class ConvenioDocumentoView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        agreement = Convenio.objects.select_related('institucion').filter(pk=pk).first()
        if not agreement or not agreement.referencia_documental:
            return Response({'detail': 'El documento del convenio no está disponible.'}, status=status.HTTP_404_NOT_FOUND)

        is_public = current_agreements().filter(pk=agreement.pk).exists()
        if not is_public and not can_manage_agreements(request.user):
            return Response({'detail': 'El convenio no está publicado o no tienes permiso para acceder.'}, status=status.HTTP_403_FORBIDDEN)
        if agreement.referencia_documental.lower().startswith(('http://', 'https://')):
            return Response({'detail': 'La referencia documental corresponde a un enlace externo.'}, status=status.HTTP_400_BAD_REQUEST)
        media_root = Path(settings.MEDIA_ROOT).resolve()
        agreements_root = (media_root / 'convenios').resolve()
        file_path = (media_root / agreement.referencia_documental).resolve()
        if agreements_root not in file_path.parents or not file_path.is_file():
            return Response({'detail': 'El documento no se encuentra disponible en el almacenamiento.'}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = content_disposition_header(True, agreement_download_name(agreement))
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
