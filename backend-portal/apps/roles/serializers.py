from rest_framework import serializers
from .models import Rol, Permiso, RolPermiso, UsuarioRol

class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id', 'codigo', 'descripcion']


class RolSerializer(serializers.ModelSerializer):
    permisos = PermisoSerializer(many=True, read_only=True)
    permisos_codigos = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='codigo',
        source='permisos'
    )
    total_usuarios = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'permisos', 'permisos_codigos', 'total_usuarios']

    def get_total_usuarios(self, obj):
        return obj.rol_usuario_rel.count()


class RolDetailSerializer(serializers.ModelSerializer):
    permisos = PermisoSerializer(many=True, read_only=True)
    permisos_codigos = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='codigo',
        source='permisos'
    )
    usuarios = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'permisos', 'permisos_codigos', 'usuarios']

    def get_usuarios(self, obj):
        return [
            {
                'id': ur.usuario.id,
                'email': ur.usuario.email,
                'nombres': ur.usuario.nombres,
                'apellidos': ur.usuario.apellidos,
                'activo': ur.usuario.activo
            }
            for ur in obj.rol_usuario_rel.select_related('usuario').all()[:50]
        ]


class AssignPermissionsSerializer(serializers.Serializer):
    permisos_codigos = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=True
    )
