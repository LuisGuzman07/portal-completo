from django.db import transaction
from django.urls import reverse
from rest_framework import serializers

from .models import Convenio, Institucion
from .storage import remove_agreement_file, save_agreement_pdf


class InstitucionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institucion
        fields = ['id', 'nombre', 'pais', 'sitio_web']
        read_only_fields = ['id']

    def validate_nombre(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El nombre de la institución es obligatorio.')
        duplicates = Institucion.objects.filter(nombre__iexact=value)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError('Ya existe una institución con ese nombre.')
        return value

    def validate_sitio_web(self, value):
        if not value:
            return None
        value = value.strip()
        if value and not value.lower().startswith(('http://', 'https://')):
            raise serializers.ValidationError('El sitio web debe iniciar con http:// o https://.')
        return value or None


class ConvenioAdminSerializer(serializers.ModelSerializer):
    institucion_id = serializers.PrimaryKeyRelatedField(source='institucion', queryset=Institucion.objects.all())
    institucion_nombre = serializers.CharField(source='institucion.nombre', read_only=True)
    institucion_pais = serializers.CharField(source='institucion.pais', read_only=True)
    registrado_por_nombre = serializers.SerializerMethodField()
    archivo = serializers.FileField(write_only=True, required=False, allow_empty_file=False)
    referencia_url = serializers.URLField(write_only=True, required=False, allow_blank=True, max_length=500)
    documento_externo = serializers.SerializerMethodField()
    documento_url = serializers.SerializerMethodField()
    documento_es_archivo = serializers.SerializerMethodField()
    quitar_documento = serializers.BooleanField(write_only=True, required=False, default=False)
    documento_publicable_confirmado = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Convenio
        fields = [
            'id', 'institucion_id', 'institucion_nombre', 'institucion_pais',
            'registrado_por', 'registrado_por_nombre', 'objeto', 'fecha_inicio',
            'fecha_fin', 'estado', 'documento_externo', 'documento_url',
            'documento_es_archivo', 'archivo', 'referencia_url', 'quitar_documento',
            'documento_publicable_confirmado',
        ]
        read_only_fields = [
            'id', 'registrado_por', 'registrado_por_nombre', 'institucion_nombre',
            'institucion_pais', 'documento_externo', 'documento_url', 'documento_es_archivo',
        ]

    def get_registrado_por_nombre(self, obj):
        return f'{obj.registrado_por.nombres} {obj.registrado_por.apellidos}'.strip()

    @staticmethod
    def _is_external(obj):
        return bool(obj.referencia_documental and obj.referencia_documental.lower().startswith(('http://', 'https://')))

    def get_documento_externo(self, obj):
        return obj.referencia_documental if self._is_external(obj) else ''

    def get_documento_es_archivo(self, obj):
        return bool(obj.referencia_documental and not self._is_external(obj))

    def get_documento_url(self, obj):
        if not self.get_documento_es_archivo(obj):
            return ''
        path = reverse('agreement-document', kwargs={'pk': obj.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path

    def validate_objeto(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Describe el objeto y alcance del convenio.')
        return value

    def validate(self, attrs):
        start = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        end = attrs.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))
        if start and end and end < start:
            raise serializers.ValidationError({'fecha_fin': 'La fecha final no puede ser anterior a la fecha de inicio.'})

        uploaded = attrs.get('archivo')
        url = (attrs.get('referencia_url') or '').strip()
        remove = attrs.get('quitar_documento', False)
        if uploaded and url:
            raise serializers.ValidationError('Registra un enlace o un PDF, no ambos.')
        if remove and (uploaded or url):
            raise serializers.ValidationError('No puedes quitar y reemplazar el documento en la misma operación.')
        if url and not url.lower().startswith(('http://', 'https://')):
            raise serializers.ValidationError({'referencia_url': 'La referencia debe ser un enlace HTTP o HTTPS.'})

        current_reference = getattr(self.instance, 'referencia_documental', None)
        resulting_reference = None if remove else (url or current_reference)
        if uploaded:
            resulting_reference = 'archivo-pendiente'
        resulting_state = attrs.get('estado', getattr(self.instance, 'estado', 'borrador'))
        confirmed = attrs.get('documento_publicable_confirmado', False)
        if resulting_state == 'vigente' and resulting_reference and not confirmed:
            raise serializers.ValidationError({
                'documento_publicable_confirmado': 'Confirma que la referencia adjunta es la versión autorizada para difusión pública.'
            })
        attrs['referencia_url'] = url
        return attrs

    def create(self, validated_data):
        upload = validated_data.pop('archivo', None)
        url = validated_data.pop('referencia_url', '')
        validated_data.pop('quitar_documento', None)
        validated_data.pop('documento_publicable_confirmado', None)
        creator = validated_data.pop('registrado_por')
        path = save_agreement_pdf(upload) if upload else (url or None)
        try:
            return Convenio.objects.create(registrado_por=creator, referencia_documental=path, **validated_data)
        except Exception:
            if upload:
                remove_agreement_file(path)
            raise

    def update(self, instance, validated_data):
        upload = validated_data.pop('archivo', None)
        url = validated_data.pop('referencia_url', '')
        remove = validated_data.pop('quitar_documento', False)
        validated_data.pop('documento_publicable_confirmado', None)
        old_file = instance.referencia_documental if instance.referencia_documental and not self._is_external(instance) else None
        new_path = save_agreement_pdf(upload) if upload else None
        if upload:
            instance.referencia_documental = new_path
        elif url:
            instance.referencia_documental = url
        elif remove:
            instance.referencia_documental = None
        for field, value in validated_data.items():
            setattr(instance, field, value)
        try:
            instance.save()
        except Exception:
            if new_path:
                remove_agreement_file(new_path)
            raise
        if old_file and (upload or url or remove):
            transaction.on_commit(lambda path=old_file: remove_agreement_file(path))
        return instance


class ConvenioPublicoSerializer(serializers.ModelSerializer):
    institucion = InstitucionSerializer(read_only=True)
    documento_externo = serializers.SerializerMethodField()
    documento_url = serializers.SerializerMethodField()

    class Meta:
        model = Convenio
        fields = ['id', 'institucion', 'objeto', 'fecha_inicio', 'fecha_fin', 'documento_externo', 'documento_url']

    @staticmethod
    def _is_external(obj):
        return bool(obj.referencia_documental and obj.referencia_documental.lower().startswith(('http://', 'https://')))

    def get_documento_externo(self, obj):
        return obj.referencia_documental if self._is_external(obj) else ''

    def get_documento_url(self, obj):
        if not obj.referencia_documental or self._is_external(obj):
            return ''
        path = reverse('agreement-document', kwargs={'pk': obj.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path
