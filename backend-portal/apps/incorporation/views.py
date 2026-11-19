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
from apps.common.storage_service import storage_service
from .models import DecisionIncorporacion, DocumentoSolicitud, EvaluacionSolicitud, SolicitudIncorporacion
from .permissions import CanEvaluateIncorporation
from .serializers import (
    DecisionIncorporacionCreateSerializer,
    DecisionIncorporacionSerializer,
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


def applicant_tracking_data(application, request=None):
    requirement = ''
    if application.estado == 'observada':
        latest_request = application.evaluaciones.filter(
            resultado_propuesto='requiere_documentacion',
        ).first()
        if latest_request:
            requirement = latest_request.observaciones or ''

    decision_data = None
    if hasattr(application, 'decision_incorporacion') and application.decision_incorporacion:
        d = application.decision_incorporacion
        decision_data = {
            'resultado': d.resultado,
            'referencia_acta': d.referencia_acta,
            'fecha_decision': d.fecha_decision,
            'observaciones': d.observaciones,
        }

    from apps.academics.models import Miembro
    miembro = Miembro.objects.filter(solicitud_id=application.id).select_related('categoria').first()
    categoria_nombre = miembro.categoria.nombre if miembro and miembro.categoria else None

    return {
        'id': application.id,
        'codigo': f'ABO-SOL-{application.id:06d}',
        'nombres': application.nombres,
        'apellidos': application.apellidos,
        'email': application.email,
        'telefono': application.telefono,
        'antecedentes_academicos': application.antecedentes_academicos,
        'estado': application.estado,
        'fecha_envio': application.fecha_envio,
        'requerimiento': requirement,
        'categoria_miembro': categoria_nombre,
        'decision': decision_data,
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
        state = self.request.query_params.get('estado', '').strip()
        search = self.request.query_params.get('search', '').strip()

        if state in ('aprobada', 'rechazada'):
            queryset = SolicitudIncorporacion.objects.filter(estado=state)
        elif state == 'todas':
            queryset = SolicitudIncorporacion.objects.all()
        elif state:
            queryset = SolicitudIncorporacion.objects.filter(estado=state)
        else:
            queryset = SolicitudIncorporacion.objects.filter(
                estado__in=ACTIVE_REVIEW_STATES,
                decision_incorporacion__isnull=True,
            )

        queryset = queryset.prefetch_related('documentos', 'evaluaciones')
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
        return SolicitudIncorporacion.objects.select_related('decision_incorporacion').prefetch_related(
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
            'mensaje': 'La evaluación se registró correctamente y la solicitud quedó actualizada.',
        }, status=status.HTTP_201_CREATED)


class SolicitudIncorporacionDecisionView(views.APIView):
    """
    CU24 — Registrar decisión de incorporación.
    El evaluador autorizado registra la decisión institucional sobre una solicitud
    previamente evaluada, conforme a la determinación de ABOCCRIM.
    """
    permission_classes = [IsAuthenticated, CanEvaluateIncorporation]

    @transaction.atomic
    def post(self, request, pk):
        application = SolicitudIncorporacion.objects.select_for_update().filter(pk=pk).first()
        if not application:
            return Response({'detail': 'La solicitud no existe.'}, status=status.HTTP_404_NOT_FOUND)

        if DecisionIncorporacion.objects.filter(solicitud_id=application.id).exists():
            return Response(
                {'detail': 'Esta solicitud ya cuenta con una decisión institucional registrada.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Precondición: Evaluación realizada y decisión institucional válida ya emitida
        if not application.evaluaciones.exists() and application.estado not in ('lista_decision', 'en_revision'):
            return Response(
                {
                    'detail': 'Precondición no cumplida: La solicitud debe contar con al menos una evaluación previa del Comité Académico antes de registrar la decisión institucional final.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DecisionIncorporacionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = serializer.validated_data['resultado']
        referencia_acta = serializer.validated_data.get('referencia_acta', '')
        observaciones = serializer.validated_data.get('observaciones', '')
        categoria_id = serializer.validated_data.get('categoria_id')

        # 1. Crear el registro en decision_incorporacion
        decision = DecisionIncorporacion.objects.create(
            solicitud=application,
            registrada_por=request.user,
            resultado=resultado,
            referencia_acta=referencia_acta,
            observaciones=observaciones,
        )

        # 2. Actualizar estado de la solicitud
        previous_state = application.estado
        application.estado = resultado
        application.save(update_fields=['estado'])

        # 3. Si la decisión es de aprobación, registrar incorporación en Miembro
        nuevo_miembro = None
        if resultado == 'aprobada':
            from apps.academics.models import CategoriaMiembro, Miembro
            from apps.accounts.models import Usuario
            from apps.roles.models import Rol, UsuarioRol
            from django.utils import timezone

            user = application.usuario
            if not user:
                user = Usuario.objects.filter(email__iexact=application.email).first()
                if not user:
                    user = Usuario.objects.create(
                        email=application.email.strip().lower(),
                        nombres=application.nombres,
                        apellidos=application.apellidos,
                        activo=True,
                    )
                    user.set_password(getattr(settings, 'DEMO_USER_PASSWORD', 'Aboccrim2025!'))
                    user.save()

                application.usuario = user
                application.save(update_fields=['usuario'])

            rol_miembro = Rol.objects.filter(codigo='miembro').first()
            if rol_miembro:
                UsuarioRol.objects.get_or_create(usuario=user, rol=rol_miembro)

            categoria = None
            if categoria_id:
                categoria = CategoriaMiembro.objects.filter(pk=categoria_id).first()
            if not categoria:
                categoria = CategoriaMiembro.objects.first()

            if categoria:
                nuevo_miembro, _ = Miembro.objects.update_or_create(
                    usuario=user,
                    defaults={
                        'categoria': categoria,
                        'solicitud_id': application.id,
                        'estado': 'activo',
                        'fecha_incorporacion': timezone.now().date(),
                    }
                )

        # 4. Registrar auditoría institucional
        registrar_auditoria(
            request=request,
            accion=f'REGISTRAR_DECISION_INCORPORACION_{resultado.upper()}',
            entidad='SolicitudIncorporacion',
            registro_afectado_id=application.id,
            detalle=(
                f"Decisión de incorporación registrada ({resultado}) para {application.nombres} {application.apellidos}. "
                f"Acta: {referencia_acta or 'N/A'}. Estado previo: {previous_state}."
            ),
        )

        detail_data = SolicitudIncorporacionReviewDetailSerializer(
            application, context={'request': request}
        ).data

        return Response({
            'mensaje': (
                f'Decisión institucional registrada exitosamente: Solicitud {resultado}. '
                f'{"Se ha incorporado al postulante como miembro activo de ABOCCRIM." if resultado == "aprobada" else ""}'
            ).strip(),
            'decision': DecisionIncorporacionSerializer(decision).data,
            'solicitud': detail_data,
        }, status=status.HTTP_201_CREATED)


class DocumentoSolicitudReviewDownloadView(views.APIView):
    permission_classes = [IsAuthenticated, CanEvaluateIncorporation]

    def get(self, request, solicitud_id, documento_id):
        document = DocumentoSolicitud.objects.filter(
            pk=documento_id, solicitud_id=solicitud_id,
        ).first()
        if not document:
            return Response({'detail': 'El documento no existe o no se encuentra disponible.'}, status=status.HTTP_404_NOT_FOUND)

        if not storage_service.file_exists(document.ruta_privada):
            return Response({'detail': 'El documento no se encuentra disponible en el almacenamiento.'}, status=status.HTTP_404_NOT_FOUND)

        filename = Path(document.nombre.replace('\\', '/')).name
        filename = ''.join(char for char in filename if char >= ' ' and char not in '\r\n"')[:190] or 'documento'
        if not filename.lower().endswith('.pdf'):
            filename = f'{filename}.pdf'
        response = storage_service.stream_file_response(
            relative_path=document.ruta_privada,
            filename=filename,
            content_type='application/pdf',
            inline=True
        )
        response['Content-Disposition'] = content_disposition_header(True, filename)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response


class MiSolicitudIncorporacionView(views.APIView):
    """
    Permite al usuario autenticado (rol 'usuario', 'investigador', etc.)
    consultar y enviar su propia solicitud de membresía desde su Panel de Control.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        application = SolicitudIncorporacion.objects.filter(
            Q(usuario=user) | Q(email__iexact=user.email)
        ).prefetch_related('documentos', 'evaluaciones').select_related('decision_incorporacion').order_by('-fecha_envio').first()

        if not application:
            return Response({'tiene_solicitud': False, 'solicitud': None}, status=status.HTTP_200_OK)

        return Response({
            'tiene_solicitud': True,
            'solicitud': applicant_tracking_data(application, request=request)
        }, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request):
        user = request.user
        existing = SolicitudIncorporacion.objects.filter(
            Q(usuario=user) | Q(email__iexact=user.email)
        ).exclude(estado__in=['rechazada', 'no_aprobada', 'cancelada']).first()

        if existing:
            return Response({
                'detail': f'Ya tienes una solicitud de incorporación registrada y en proceso (Código: ABO-SOL-{existing.id:06d}, Estado: {existing.estado}).'
            }, status=status.HTTP_409_CONFLICT)

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['email'] = user.email.strip().lower()
        if not data.get('nombres'):
            data['nombres'] = user.nombres
        if not data.get('apellidos'):
            data['apellidos'] = user.apellidos

        serializer = SolicitudIncorporacionCreateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()

        if not application.usuario:
            application.usuario = user
            application.save(update_fields=['usuario'])

        registrar_auditoria(
            request=request,
            accion='ENVIAR_SOLICITUD_INCORPORACION_PANEL',
            entidad='SolicitudIncorporacion',
            registro_afectado_id=application.id,
            detalle=f'Solicitud de membresía enviada desde el panel por {user.email} (Código: ABO-SOL-{application.id:06d}).',
        )

        return Response({
            'tiene_solicitud': True,
            'mensaje': '¡Tu solicitud de membresía fue enviada exitosamente y quedó en revisión institucional!',
            'solicitud': applicant_tracking_data(application, request=request)
        }, status=status.HTTP_201_CREATED)


class MiSolicitudDocumentacionComplementariaView(views.APIView):
    """
    Permite al usuario autenticado subir documentos complementarios cuando su solicitud
    ha sido 'observada' por el Comité Académico.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        user = request.user
        application = SolicitudIncorporacion.objects.select_for_update().filter(
            Q(usuario=user) | Q(email__iexact=user.email)
        ).order_by('-fecha_envio').first()

        if not application:
            return Response({'detail': 'No se encontró ninguna solicitud de incorporación asociada a tu cuenta.'}, status=status.HTTP_404_NOT_FOUND)

        if application.estado != 'observada' or DecisionIncorporacion.objects.filter(solicitud_id=application.id).exists():
            return Response({'detail': 'La solicitud no tiene requerimientos documentales pendientes en este momento.'}, status=status.HTTP_409_CONFLICT)

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
                accion='ENVIAR_DOCUMENTACION_COMPLEMENTARIA_PANEL',
                entidad='SolicitudIncorporacion',
                registro_afectado_id=application.id,
                detalle=f'Documentación complementaria enviada desde panel por {user.email} ({len(saved_paths)} archivos). Estado {previous_state} → en_revision.',
            )
        except Exception:
            for path in saved_paths:
                remove_application_file(path)
            raise

        return Response({
            'mensaje': 'Documentación complementaria recibida correctamente. Tu solicitud volvió a revisión institucional.',
            'solicitud': applicant_tracking_data(application, request=request)
        }, status=status.HTTP_201_CREATED)


class MiSolicitudDocumentoDownloadView(views.APIView):
    """
    Permite al usuario autenticado descargar sus propios documentos entregados.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, documento_id):
        user = request.user
        document = DocumentoSolicitud.objects.filter(
            pk=documento_id,
            solicitud__in=SolicitudIncorporacion.objects.filter(Q(usuario=user) | Q(email__iexact=user.email))
        ).first()

        if not document:
            return Response({'detail': 'Documento no encontrado o no autorizado.'}, status=status.HTTP_404_NOT_FOUND)

        if not storage_service.file_exists(document.ruta_privada):
            return Response({'detail': 'El archivo no se encuentra disponible en el almacenamiento.'}, status=status.HTTP_404_NOT_FOUND)

        filename = Path(document.nombre.replace('\\', '/')).name
        filename = ''.join(char for char in filename if char >= ' ' and char not in '\r\n"')[:190] or 'documento'
        if not filename.lower().endswith('.pdf'):
            filename = f'{filename}.pdf'
        response = storage_service.stream_file_response(
            relative_path=document.ruta_privada,
            filename=filename,
            content_type='application/pdf',
            inline=True
        )
        response['Content-Disposition'] = content_disposition_header(True, filename)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
