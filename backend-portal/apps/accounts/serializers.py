from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import Usuario
from apps.roles.models import Rol, UsuarioRol
from apps.roles.serializers import RolSerializer

class UserProfileSerializer(serializers.ModelSerializer):
    roles = RolSerializer(many=True, read_only=True)
    roles_codigos = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='codigo',
        source='roles'
    )
    permisos_efectivos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id',
            'email',
            'nombres',
            'apellidos',
            'activo',
            'fecha_registro',
            'last_login',
            'roles',
            'roles_codigos',
            'permisos_efectivos',
            'is_staff',
            'is_superuser'
        ]

    def get_permisos_efectivos(self, obj):
        if obj.is_superuser:
            from apps.roles.models import Permiso
            return list(Permiso.objects.values_list('codigo', flat=True))
        return list(
            obj.roles.prefetch_related('permisos')
            .values_list('permisos__codigo', flat=True)
            .distinct()
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Usuario
        fields = ['email', 'nombres', 'apellidos', 'password', 'password_confirm']

    def validate_email(self, value):
        norm_email = value.lower().strip()
        if Usuario.objects.filter(email__iexact=norm_email).exists():
            raise serializers.ValidationError("Ya existe una cuenta registrada con este correo electrónico.")
        return norm_email

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            password=password,
            nombres=validated_data['nombres'],
            apellidos=validated_data['apellidos'],
            activo=True
        )
        # Asignar rol mínimo de 'usuario' (Usuario registrado sin acreditación)
        rol_usuario, _ = Rol.objects.get_or_create(
            codigo='usuario',
            defaults={
                'nombre': 'Usuario Registrado',
                'descripcion': 'Usuario con acceso básico al portal, sin acreditación institucional'
            }
        )
        UsuarioRol.objects.get_or_create(usuario=user, rol=rol_usuario)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        try:
            user = Usuario.objects.get(email__iexact=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Credenciales inválidas. Por favor verifique su correo y contraseña.")

        if not user.check_password(password):
            raise serializers.ValidationError("Credenciales inválidas. Por favor verifique su correo y contraseña.")

        if not user.activo:
            raise serializers.ValidationError("Su cuenta se encuentra desactivada. Comuníquese con la administración de ABOCCRIM.")

        attrs['user'] = user
        return attrs


class UsuarioListSerializer(serializers.ModelSerializer):
    roles = RolSerializer(many=True, read_only=True)
    roles_codigos = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='codigo',
        source='roles'
    )

    class Meta:
        model = Usuario
        fields = [
            'id',
            'email',
            'nombres',
            'apellidos',
            'activo',
            'fecha_registro',
            'last_login',
            'roles',
            'roles_codigos'
        ]


class UsuarioCreateAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    roles = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Usuario
        fields = ['email', 'nombres', 'apellidos', 'password', 'activo', 'roles']

    def validate_email(self, value):
        norm_email = value.lower().strip()
        if Usuario.objects.filter(email__iexact=norm_email).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este correo.")
        return norm_email

    def create(self, validated_data):
        roles_codigos = validated_data.pop('roles', ['usuario'])
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(
            password=password,
            **validated_data
        )
        for r_cod in roles_codigos:
            try:
                r = Rol.objects.get(codigo=r_cod)
                UsuarioRol.objects.get_or_create(usuario=user, rol=r)
            except Rol.DoesNotExist:
                pass
        return user


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['nombres', 'apellidos', 'activo']


class AssignRolesSerializer(serializers.Serializer):
    roles_codigos = serializers.ListField(
        child=serializers.CharField(max_length=60),
        allow_empty=False
    )
