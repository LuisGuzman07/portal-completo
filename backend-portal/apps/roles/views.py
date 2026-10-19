from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Rol, Permiso, RolPermiso
from .serializers import (
    RolSerializer,
    RolDetailSerializer,
    PermisoSerializer,
    AssignPermissionsSerializer
)
from .permissions import CanManageRoles, IsSuperAdmin
from apps.audit.models import registrar_auditoria

class RolListCreateView(generics.ListCreateAPIView):
    queryset = Rol.objects.prefetch_related('permisos', 'rol_usuario_rel').all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]
    pagination_class = None

    def perform_create(self, serializer):
        rol = serializer.save()
        registrar_auditoria(
            request=self.request,
            accion='CREAR_ROL',
            entidad='Rol',
            registro_afectado_id=rol.id,
            detalle=f"Rol creado: {rol.codigo} ({rol.nombre})"
        )


class RolDetailView(generics.RetrieveUpdateAPIView):
    queryset = Rol.objects.prefetch_related('permisos', 'rol_usuario_rel__usuario').all()
    serializer_class = RolDetailSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]

    def perform_update(self, serializer):
        rol = serializer.save()
        registrar_auditoria(
            request=self.request,
            accion='EDITAR_ROL',
            entidad='Rol',
            registro_afectado_id=rol.id,
            detalle=f"Rol actualizado: {rol.codigo}"
        )


class PermisoListView(generics.ListAPIView):
    queryset = Permiso.objects.all().order_by('codigo')
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]
    pagination_class = None


class AssignPermissionsView(APIView):
    permission_classes = [IsAuthenticated, CanManageRoles]

    def post(self, request, pk):
        try:
            rol = Rol.objects.get(pk=pk)
        except Rol.DoesNotExist:
            return Response({'error': 'Rol no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AssignPermissionsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permisos_codigos = serializer.validated_data['permisos_codigos']
        permisos_objs = Permiso.objects.filter(codigo__in=permisos_codigos)

        # Superadmin safeguards: avoid removing superadmin's key permissions
        if rol.codigo == 'superadmin' and len(permisos_objs) == 0:
            return Response(
                {'error': 'No se pueden revocar todos los permisos del rol Superadministrador'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Clear and reassign
        RolPermiso.objects.filter(rol=rol).delete()
        for p in permisos_objs:
            RolPermiso.objects.create(rol=rol, permiso=p)

        registrar_auditoria(
            request=request,
            accion='ASIGNAR_PERMISOS_A_ROL',
            entidad='Rol',
            registro_afectado_id=rol.id,
            detalle=f"Permisos asignados a rol {rol.codigo}: {', '.join(permisos_codigos)}"
        )

        return Response({
            'message': f"Permisos actualizados para rol {rol.nombre}",
            'rol': RolDetailSerializer(rol).data
        })
