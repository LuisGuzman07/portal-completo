from django.utils import timezone
from django.db import models
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Usuario
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UsuarioListSerializer,
    UsuarioCreateAdminSerializer,
    UsuarioUpdateSerializer,
    AssignRolesSerializer
)
from apps.roles.models import Rol, UsuarioRol
from apps.roles.permissions import CanManageUsers, IsSuperAdmin
from apps.audit.models import registrar_auditoria

class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            registrar_auditoria(
                request=request,
                accion='REGISTRO_FALLIDO',
                entidad='Usuario',
                detalle=f"Intento de registro fallido para: {request.data.get('email', '')} - Errores: {list(serializer.errors.keys())}"
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        registrar_auditoria(
            request=request,
            usuario=user,
            accion='REGISTRO_CUENTA',
            entidad='Usuario',
            registro_afectado_id=user.id,
            detalle=f"Registro público de cuenta: {user.email}"
        )

        return Response({
            'message': 'Cuenta registrada exitosamente.',
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            email_attempt = request.data.get('email', '')
            registrar_auditoria(
                request=request,
                accion='LOGIN_FALLIDO',
                entidad='Usuario',
                detalle=f"Intento de login fallido para: {email_attempt}"
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = RefreshToken.for_user(user)

        registrar_auditoria(
            request=request,
            usuario=user,
            accion='LOGIN_EXITOSO',
            entidad='Usuario',
            registro_afectado_id=user.id,
            detalle=f"Inicio de sesión exitoso: {user.email}"
        )

        return Response({
            'message': 'Inicio de sesión exitoso.',
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        registrar_auditoria(
            request=request,
            usuario=request.user,
            accion='LOGOUT',
            entidad='Usuario',
            registro_afectado_id=request.user.id,
            detalle=f"Cierre de sesión: {request.user.email}"
        )

        return Response({'message': 'Sesión cerrada exitosamente.'}, status=status.HTTP_200_OK)


class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)


class UsuarioListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageUsers]
    serializer_class = UsuarioListSerializer

    def get_queryset(self):
        queryset = Usuario.objects.prefetch_related('roles', 'roles__permisos').all()

        search = self.request.query_parser_search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(nombres__icontains=search) |
                models.Q(apellidos__icontains=search)
            )

        rol_cod = self.request.query_params.get('rol', '').strip()
        if rol_cod:
            queryset = queryset.filter(roles__codigo=rol_cod)

        activo_param = self.request.query_params.get('activo', '').strip()
        if activo_param.lower() in ('true', '1'):
            queryset = queryset.filter(activo=True)
        elif activo_param.lower() in ('false', '0'):
            queryset = queryset.filter(activo=False)

        return queryset.order_by('-fecha_registro')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UsuarioCreateAdminSerializer
        return UsuarioListSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        registrar_auditoria(
            request=self.request,
            accion='CREAR_USUARIO_ADMIN',
            entidad='Usuario',
            registro_afectado_id=user.id,
            detalle=f"Usuario creado administrativamente: {user.email}"
        )


class UsuarioDetailView(generics.RetrieveUpdateAPIView):
    queryset = Usuario.objects.prefetch_related('roles').all()
    serializer_class = UsuarioUpdateSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response(UserProfileSerializer(instance).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if 'activo' in request.data:
            val = request.data.get('activo')
            is_deactivating = val in (False, 'false', 'False', 0, '0')
            if is_deactivating:
                # Safeguard 1: Cannot deactivate oneself
                if instance.id == request.user.id:
                    return Response(
                        {'error': 'No puede desactivar su propia cuenta en sesión.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Safeguard 2: Cannot deactivate the last active superadmin
                if instance.has_role('superadmin'):
                    active_superadmins = Usuario.objects.filter(
                        activo=True,
                        roles__codigo='superadmin'
                    ).exclude(id=instance.id).count()
                    if active_superadmins == 0:
                        return Response(
                            {'error': 'No se puede desactivar al único Superadministrador activo del sistema.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        registrar_auditoria(
            request=request,
            accion='ACTUALIZAR_USUARIO',
            entidad='Usuario',
            registro_afectado_id=instance.id,
            detalle=f"Usuario modificado: {instance.email} (activo={instance.activo})"
        )

        return Response(serializer.data)


class AssignRolesView(views.APIView):
    permission_classes = [IsAuthenticated, CanManageUsers]

    def post(self, request, pk):
        try:
            target_user = Usuario.objects.prefetch_related('roles').get(pk=pk)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AssignRolesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        roles_codigos = serializer.validated_data['roles_codigos']

        # Safeguard: Protecting the last active superadmin
        if target_user.has_role('superadmin') and 'superadmin' not in roles_codigos:
            other_active_superadmins = Usuario.objects.filter(
                activo=True,
                roles__codigo='superadmin'
            ).exclude(id=target_user.id).count()
            if other_active_superadmins == 0:
                return Response(
                    {'error': 'No se puede revocar el rol de Superadministrador al único superadministrador activo.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        roles_objs = Rol.objects.filter(codigo__in=roles_codigos)
        if not roles_objs.exists():
            return Response({'error': 'Ninguno de los roles especificados es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Clear and reassign
        UsuarioRol.objects.filter(usuario=target_user).delete()
        for r in roles_objs:
            UsuarioRol.objects.create(
                usuario=target_user,
                rol=r,
                asignado_por=request.user
            )

        registrar_auditoria(
            request=request,
            accion='ASIGNAR_ROLES_A_USUARIO',
            entidad='Usuario',
            registro_afectado_id=target_user.id,
            detalle=f"Roles asignados a {target_user.email}: {', '.join(roles_codigos)}"
        )

        return Response({
            'message': f"Roles actualizados para {target_user.get_full_name()}",
            'user': UserProfileSerializer(target_user).data
        })
