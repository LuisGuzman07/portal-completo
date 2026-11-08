from pathlib import Path

from django.conf import settings
from django.core import signing
from django.db import transaction
from django.db.models import Prefetch, Q
from django.http import FileResponse
from django.utils.http import content_disposition_header
from rest_framework import generics, status, views
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.audit.models import registrar_auditoria
from .models import DecisionIncorporacion, DocumentoSolicitud, EvaluacionSolicitud, SolicitudIncorporacion
from .permissions import CanEvaluateIncorporation
from .serializers import (
    EvaluacionSolicitudCreateSerializer,
    EvaluacionSolicitudSerializer,
    SolicitudIncorporacionCreateSerializer,
    DocumentacionComplementariaSerializer,
    SolicitudIncorporacionReviewDetailSerializer,
    SolicitudIncorporacionReviewListSerializer,
)
from .storage import remove_application_file, save_application_file


ACTIVE_REVIEW_STATES = ('recibida', 'pendiente', 'en_revision', 'observada', 'lista_decision')
TRACKING_TOKEN_SALT = 'aboccrim.incorporacion.tracking.v1'


def create_tracking_token(application):
    return signing.dumps(
        {'id': application.id},
        salt=TRACKING_TOKEN_SALT,
        compress=True,
    )


def get_application_from_tracking_token(token, *, lock=False):
    if not isinstance(token, str) or not token or len(token) > 2048:
        return None
    try:
        payload = signing.loads(token, salt=TRACKING_TOKEN_SALT)
        application_id = int(payload['id'])
    except (signing.BadSignature, KeyError, TypeError, ValueError):
        return None

    queryset = SolicitudIncorporacion.objects.all()
    if lock:
        queryset = queryset.select_for_update()
    return queryset.filter(pk=application_id).first()


def applicant_tracking_data(application):
    requirement = ''
    if application.estado == 'observada':
        latest_request = application.evaluaciones.filter(
            resultado_propuesto='requiere_documentacion',
        ).first()
        if latest_request:
            requirement = latest_request.observaciones or ''

    return {
        'id': application.id,
        'codigo': f'ABO-SOL-{application.id:06d}',
        'nombres': application.nombres,
        'apellidos': application.apellidos,
        'estado': application.estado,
        'fecha_envio': application.fecha_envio,
        'requerimiento': requirement,
        'documentos': [
            {'id': document.id, 'nombre': document.nombre, 'tipo': document.tipo, 'fecha_carga': document.fecha_carga}
            for document in application.documentos.all()
        ],
    }


class SolicitudIncorporacionCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = SolicitudIncorporacionCreateSerializer
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        registrar_auditoria(
            request=request,
            accion='ENVIAR_SOLICITUD_INCORPORACION',
            entidad='SolicitudIncorporacion',
            registro_afectado_id=application.id,
            detalle=f'Solicitud de incorporación recibida (estado={application.estado}, adjuntos={application.documentos.count()}).',
        )
        response_data = {
            'id': application.id,
            'codigo': f'ABO-SOL-{application.id:06d}',
            'estado': application.estado,
            'fecha_envio': application.fecha_envio,
            'token_seguimiento': create_tracking_token(application),
            'mensaje': 'Tu solicitud fue recibida y quedó pendiente de revisión institucional.',
        }
        response = Response(response_data, status=status.HTTP_201_CREATED)
        response['Cache-Control'] = 'private, no-store'
        return response


class SolicitudIncorporacionTrackingView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token') if hasattr(request.data, 'get') else None
        application = get_application_from_tracking_token(token)
        if not application:
            return Response(
                {'detail': 'No se encontró una solicitud con esta credencial de seguimiento.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        response = Response(applicant_tracking_data(application))
        response['Cache-Control'] = 'private, no-store'
        return response


class SolicitudIncorporacionSupportingDocumentsView(views.APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        token = request.data.get('token') if hasattr(request.data, 'get') else None
        application = get_application_from_tracking_token(token, lock=True)
        if not application:
            return Response(
                {'detail': 'No se encontró una solicitud con esta credencial de seguimiento.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if application.estado != 'observada' or DecisionIncorporacion.objects.filter(solicitud_id=application.id).exists():
            return Response(
                {'detail': 'La solicitud no tiene requerimientos documentales pendientes.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = DocumentacionComplementariaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_paths = []
        try:
            for upload in serializer.validated_data['archivos']:
                path = save_application_file(upload, application.id)
                saved_paths.append(path)
                original_name = (upload.name or 'Documento complementario.pdf').replace('\\', '/').split('/')[-1][:200]
                DocumentoSolicitud.objects.create(
                    solicitud=application,
                    nombre=original_name,
                    ruta_privada=path,
                    tipo='documentacion_complementaria',
                )

            previous_state = application.estado
            application.estado = 'en_revision'
            application.save(update_fields=['estado'])
            registrar_auditoria(
                request=request,
                accion='ENVIAR_DOCUMENTACION_COMPLEMENTARIA',
                entidad='SolicitudIncorporacion',
                registro_afectado_id=application.id,
                detalle=f'Documentación complementaria recibida ({len(saved_paths)} archivo(s)); estado {previous_state} → en_revision.',
            )
        except Exception:
            for path in saved_paths:
                remove_application_file(path)
            raise

        response = Response({
            **applicant_tracking_data(application),
            'mensaje': 'Recibimos tus documentos. La solicitud volvió a revisión institucional.',
        }, status=status.HTTP_201_CREATED)
        response['Cache-Control'] = 'private, no-store'
        return response


class SolicitudIncorporacionReviewListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, CanEvaluateIncorporation]
    serializer_class = SolicitudIncorporacionReviewListSerializer

    def get_queryset(self):
        queryset = SolicitudIncorporacion.objects.filter(
            estado__in=ACTIVE_REVIEW_STATES,
            decision_incorporacion__isnull=True,
        ).prefetch_related('documentos', 'evaluaciones')
        state = self.request.query_params.get('estado', '').strip()
        search = self.request.query_params.get('search', '').strip()
        if state:
            queryset = queryset.filter(estado=state)
        if search:
            queryset = queryset.filter(
                Q(nombres__icontains=search)
                | Q(apellidos__icontains=search)
                | Q(email__icontains=search)
            )
        return queryset


class SolicitudIncorporacionReviewDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, CanEvaluateIncorporation]
    serializer_class = SolicitudIncorporacionReviewDetailSerializer

    def get_queryset(self):
        return SolicitudIncorporacion.objects.filter(
            estado__in=ACTIVE_REVIEW_STATES,
            decision_incorporacion__isnull=True,
        ).prefetch_related(
            'documentos',
            Prefetch('evaluaciones', queryset=EvaluacionSolicitud.objects.select_related('evaluador')),
        )


class SolicitudIncorporacionEvaluateView(views.APIView):
    permission_classes = [IsAuthenticated, CanEvaluateIncorporation]

    @transaction.atomic
    def post(self, request, pk):
        application = SolicitudIncorporacion.objects.select_for_update().filter(pk=pk).first()
        if not application:
            return Response({'detail': 'La solicitud no existe.'}, status=status.HTTP_404_NOT_FOUND)
        if DecisionIncorporacion.objects.filter(solicitud_id=application.id).exists() or application.estado not in ACTIVE_REVIEW_STATES:
            return Response(
                {'detail': 'La solicitud ya fue resuelta o no está disponible para evaluación.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = EvaluacionSolicitudCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.validated_data['resultado_propuesto']
        next_state = {
            'favorable': 'lista_decision',
            'desfavorable': 'lista_decision',
            'requiere_documentacion': 'observada',
            'continuar_revision': 'en_revision',
        }[result]

        evaluation = serializer.save(solicitud=application, evaluador=request.user)
        previous_state = application.estado
        application.estado = next_state
        application.save(update_fields=['estado'])
        registrar_auditoria(
            request=request,
            accion=f'EVALUAR_SOLICITUD_INCORPORACION_{result.upper()}',
            entidad='SolicitudIncorporacion',
            registro_afectado_id=application.id,
            detalle=f'Evaluación #{evaluation.id} registrada por Comité Académico; estado {previous_state} → {next_state}.',
        )

        detail = SolicitudIncorporacionReviewDetailSerializer(
            application, context={'request': request},
        ).data
        return Response({
            'solicitud': detail,
            'evaluacion': EvaluacionSolicitudSerializer(evaluation).data,
            'mensaje': 'La evaluación se registró. La decisión institucional se gestiona en CU24.',
        }, status=status.HTTP_201_CREATED)


class DocumentoSolicitudReviewDownloadView(views.APIView):
    permission_classes = [IsAuthenticated, CanEvaluateIncorporation]

    def get(self, request, solicitud_id, documento_id):
        document = DocumentoSolicitud.objects.filter(
            pk=documento_id, solicitud_id=solicitud_id,
            solicitud__estado__in=ACTIVE_REVIEW_STATES,
            solicitud__decision_incorporacion__isnull=True,
        ).first()
        if not document:
            return Response({'detail': 'El documento no existe o la solicitud ya fue resuelta.'}, status=status.HTTP_404_NOT_FOUND)

        media_root = Path(settings.MEDIA_ROOT).resolve()
        applications_root = (media_root / 'solicitudes_incorporacion').resolve()
        file_path = (media_root / document.ruta_privada).resolve()
        if applications_root not in file_path.parents or not file_path.is_file():
            return Response({'detail': 'El documento no se encuentra disponible en el almacenamiento.'}, status=status.HTTP_404_NOT_FOUND)

        filename = Path(document.nombre.replace('\\', '/')).name
        filename = ''.join(char for char in filename if char >= ' ' and char not in '\r\n"')[:190] or 'documento'
        if not filename.lower().endswith('.pdf'):
            filename = f'{filename}.pdf'
        response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = content_disposition_header(True, filename)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
