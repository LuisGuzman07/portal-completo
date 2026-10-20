import re

from django.utils import timezone
from rest_framework import serializers

from apps.audit.models import RegistroAuditoria

from .models import AreaTematica, CategoriaMiembro, Investigador, Miembro, PerfilAcademico


class CategoriaMiembroSerializer(serializers.ModelSerializer):
    miembros_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = CategoriaMiembro
        fields = ['id', 'nombre', 'descripcion', 'miembros_count']
        read_only_fields = ['id', 'miembros_count']

    def validate_nombre(self, value):
        value = value.strip()
        duplicates = CategoriaMiembro.objects.filter(nombre__iexact=value)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError('Ya existe una categoría con ese nombre.')
        return value


class MiembroSerializer(serializers.ModelSerializer):
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    categoria_id = serializers.PrimaryKeyRelatedField(
        source='categoria', queryset=CategoriaMiembro.objects.all(), write_only=True
    )
    nombres = serializers.CharField(source='usuario.nombres', read_only=True)
    apellidos = serializers.CharField(source='usuario.apellidos', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_id_display = serializers.IntegerField(source='usuario_id', read_only=True)
    categoria = CategoriaMiembroSerializer(read_only=True)
    estado = serializers.ChoiceField(choices=Miembro.ESTADOS, required=False)

    class Meta:
        model = Miembro
        fields = [
            'id', 'usuario_id', 'usuario_id_display', 'nombres', 'apellidos', 'email',
            'categoria_id', 'categoria', 'estado', 'fecha_incorporacion',
        ]
        read_only_fields = ['id', 'usuario_id_display']

    def validate_usuario_id(self, value):
        from apps.accounts.models import Usuario
        if not Usuario.objects.filter(pk=value).exists():
            raise serializers.ValidationError('La cuenta seleccionada no existe.')
        if Miembro.objects.filter(usuario_id=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError('Esta cuenta ya tiene una membresía registrada.')
        return value

    def validate(self, attrs):
        if not self.instance and not attrs.get('usuario_id'):
            raise serializers.ValidationError({'usuario_id': 'Selecciona una cuenta para registrar la membresía.'})
        estado = attrs.get('estado', self.instance.estado if self.instance else 'pendiente')
        fecha = attrs.get('fecha_incorporacion', self.instance.fecha_incorporacion if self.instance else None)
        if estado == 'activo' and not fecha:
            from django.utils import timezone
            attrs['fecha_incorporacion'] = timezone.localdate()
        return attrs

    def create(self, validated_data):
        from apps.accounts.models import Usuario
        usuario_id = validated_data.pop('usuario_id')
        return Miembro.objects.create(usuario=Usuario.objects.get(pk=usuario_id), **validated_data)


class PerfilAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilAcademico
        fields = [
            'id',
            'grado_academico',
            'institucion',
            'especialidad',
            'biografia',
            'orcid',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_actualizacion']

    def validate_orcid(self, value):
        value = (value or '').strip()
        if value.startswith('https://orcid.org/'):
            value = value.removeprefix('https://orcid.org/').strip('/')
        value = value.replace(' ', '')
        if value and re.fullmatch(r'\d{16}', value):
            value = '-'.join((value[:4], value[4:8], value[8:12], value[12:]))
        if value and not re.fullmatch(r'\d{4}-\d{4}-\d{4}-\d{3}[\dXx]', value):
            raise serializers.ValidationError(
                'El ORCID debe tener 16 dígitos, escritos juntos o con el formato 0000-0000-0000-0000.'
            )
        if value:
            value = value[:-1] + value[-1].upper()
        return value or None


class AreaTematicaSerializer(serializers.ModelSerializer):
    investigadores_count = serializers.SerializerMethodField()

    class Meta:
        model = AreaTematica
        fields = ['id', 'nombre', 'descripcion', 'investigadores_count']

    def get_investigadores_count(self, instance):
        annotated_count = getattr(instance, 'investigadores_count', None)
        if annotated_count is not None:
            return annotated_count
        return instance.investigadores.count()


class PerfilDisponibleSerializer(serializers.ModelSerializer):
    nombres = serializers.CharField(source='usuario.nombres', read_only=True)
    apellidos = serializers.CharField(source='usuario.apellidos', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model = PerfilAcademico
        fields = ['id', 'nombres', 'apellidos', 'email', 'grado_academico', 'institucion', 'especialidad']


class InvestigadorPublicoSerializer(serializers.ModelSerializer):
    nombres = serializers.CharField(source='perfil_academico.usuario.nombres', read_only=True)
    apellidos = serializers.CharField(source='perfil_academico.usuario.apellidos', read_only=True)
    grado_academico = serializers.CharField(source='perfil_academico.grado_academico', read_only=True, allow_null=True)
    institucion = serializers.CharField(source='perfil_academico.institucion', read_only=True, allow_null=True)
    especialidad = serializers.CharField(source='perfil_academico.especialidad', read_only=True, allow_null=True)
    areas = AreaTematicaSerializer(many=True, read_only=True)

    class Meta:
        model = Investigador
        fields = ['id', 'nombres', 'apellidos', 'grado_academico', 'institucion', 'especialidad', 'areas']


class InvestigadorPublicoDetalleSerializer(InvestigadorPublicoSerializer):
    biografia = serializers.CharField(source='perfil_academico.biografia', read_only=True, allow_null=True)
    orcid = serializers.CharField(source='perfil_academico.orcid', read_only=True, allow_null=True)
    fecha_alta = serializers.DateField(read_only=True, allow_null=True)

    class Meta(InvestigadorPublicoSerializer.Meta):
        fields = InvestigadorPublicoSerializer.Meta.fields + ['biografia', 'orcid', 'fecha_alta']


class InvestigadorListSerializer(serializers.ModelSerializer):
    perfil_academico_id = serializers.IntegerField(read_only=True)
    nombres = serializers.CharField(source='perfil_academico.usuario.nombres', read_only=True)
    apellidos = serializers.CharField(source='perfil_academico.usuario.apellidos', read_only=True)
    email = serializers.EmailField(source='perfil_academico.usuario.email', read_only=True)
    grado_academico = serializers.CharField(source='perfil_academico.grado_academico', read_only=True, allow_null=True)
    institucion = serializers.CharField(source='perfil_academico.institucion', read_only=True, allow_null=True)
    especialidad = serializers.CharField(source='perfil_academico.especialidad', read_only=True, allow_null=True)
    biografia = serializers.CharField(source='perfil_academico.biografia', read_only=True, allow_null=True)
    orcid = serializers.CharField(source='perfil_academico.orcid', read_only=True, allow_null=True)
    areas = AreaTematicaSerializer(many=True, read_only=True)

    class Meta:
        model = Investigador
        fields = [
            'id', 'perfil_academico_id', 'nombres', 'apellidos', 'email',
            'grado_academico', 'institucion', 'especialidad', 'estado',
            'biografia', 'orcid', 'fecha_alta', 'visible_directorio', 'areas',
        ]


class InvestigadorDetalleSerializer(InvestigadorListSerializer):
    historial_revision = serializers.SerializerMethodField()

    class Meta(InvestigadorListSerializer.Meta):
        fields = InvestigadorListSerializer.Meta.fields + ['historial_revision']

    def get_historial_revision(self, instance):
        entries = RegistroAuditoria.objects.filter(
            entidad='Investigador',
            registro_afectado_id=str(instance.id),
            accion__in=[
                'SOLICITAR_DIRECTORIO_INVESTIGADOR',
                'ACTUALIZAR_INVESTIGADOR',
                'CREAR_INVESTIGADOR',
            ],
        ).select_related('usuario').order_by('-fecha')[:20]
        return [{
            'accion': entry.accion,
            'detalle': entry.detalle,
            'fecha': entry.fecha,
            'usuario': entry.usuario.get_full_name() if entry.usuario else 'Sistema',
        } for entry in entries]


class InvestigadorAdminSerializer(serializers.ModelSerializer):
    perfil_academico = serializers.PrimaryKeyRelatedField(queryset=PerfilAcademico.objects.all())
    observacion_revision = serializers.CharField(required=False, allow_blank=True, max_length=1000, write_only=True)
    areas = serializers.PrimaryKeyRelatedField(
        queryset=AreaTematica.objects.all(), many=True, required=False
    )
    estado = serializers.ChoiceField(choices=Investigador.ESTADOS, required=False)

    class Meta:
        model = Investigador
        fields = ['id', 'perfil_academico', 'estado', 'fecha_alta', 'visible_directorio', 'areas', 'observacion_revision']
        read_only_fields = ['id']

    def validate_perfil_academico(self, perfil):
        existing = Investigador.objects.filter(perfil_academico=perfil)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('Este perfil ya está registrado como investigador.')
        return perfil

    def validate(self, attrs):
        estado = attrs.get('estado', self.instance.estado if self.instance else 'pendiente')
        visible = attrs.get(
            'visible_directorio',
            self.instance.visible_directorio if self.instance else False,
        )
        if estado != 'activo' and visible:
            attrs['visible_directorio'] = False
        observation = (attrs.get('observacion_revision') or '').strip()
        if (
            estado in ('observado', 'rechazado')
            and self.instance
            and self.instance.estado != estado
            and not observation
        ):
            raise serializers.ValidationError({
                'observacion_revision': 'Escribe una observación para explicar esta decisión al solicitante.'
            })
        profile = attrs.get('perfil_academico', self.instance.perfil_academico if self.instance else None)
        areas = attrs.get('areas', list(self.instance.areas.all()) if self.instance else [])
        if estado == 'activo':
            required = ('grado_academico', 'institucion', 'especialidad', 'biografia')
            missing = [field for field in required if not (getattr(profile, field, '') or '').strip()]
            if missing:
                raise serializers.ValidationError({
                    'estado': 'No se puede aprobar: el perfil debe incluir grado académico, institución, especialidad y biografía.'
                })
            if not areas:
                raise serializers.ValidationError({'areas': 'Asigna al menos un área temática antes de aprobar.'})
        if estado == 'activo' and not attrs.get('fecha_alta', self.instance.fecha_alta if self.instance else None):
            attrs['fecha_alta'] = timezone.localdate()
        if self.instance and estado == 'activo' and self.instance.estado != 'activo':
            fecha_alta = attrs.get('fecha_alta', self.instance.fecha_alta)
            if fecha_alta is None:
                attrs['fecha_alta'] = timezone.localdate()
        return attrs

    def create(self, validated_data):
        areas = validated_data.pop('areas', [])
        validated_data.pop('observacion_revision', None)
        investigador = Investigador.objects.create(**validated_data)
        investigador.areas.set(areas)
        return investigador

    def update(self, instance, validated_data):
        areas = validated_data.pop('areas', None)
        self.observacion_revision = (validated_data.pop('observacion_revision', '') or '').strip()
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if areas is not None:
            instance.areas.set(areas)
        return instance


class AreaTematicaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaTematica
        fields = ['id', 'nombre', 'descripcion']
        read_only_fields = ['id']

    def validate_nombre(self, value):
        value = value.strip()
        duplicates = AreaTematica.objects.filter(nombre__iexact=value)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError('Ya existe un área temática con ese nombre.')
        return value
