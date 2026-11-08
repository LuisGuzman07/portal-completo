from django.urls import reverse
from rest_framework import serializers

from apps.events.models import Evento
from apps.news.models import Noticia
from .models import RecursoMultimedia
from .storage import remove_multimedia_file, save_multimedia_file


class RecursoMultimediaSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False, allow_empty_file=False)
    enlace = serializers.URLField(write_only=True, required=False, max_length=500)
    evento_id = serializers.PrimaryKeyRelatedField(
        source='evento', queryset=Evento.objects.all(), required=False, allow_null=True,
    )
    noticia_id = serializers.PrimaryKeyRelatedField(
        source='noticia', queryset=Noticia.objects.all(), required=False, allow_null=True,
    )
    evento_titulo = serializers.SerializerMethodField()
    noticia_titulo = serializers.SerializerMethodField()
    cargado_por_nombre = serializers.SerializerMethodField()
    es_archivo = serializers.SerializerMethodField()
    enlace_externo = serializers.SerializerMethodField()
    descarga_url = serializers.SerializerMethodField()

    class Meta:
        model = RecursoMultimedia
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'nivel_acceso',
            'evento_id', 'evento_titulo', 'noticia_id', 'noticia_titulo',
            'cargado_por', 'cargado_por_nombre', 'es_archivo', 'enlace_externo',
            'descarga_url', 'archivo', 'enlace',
        ]
        read_only_fields = [
            'id', 'tipo', 'cargado_por', 'cargado_por_nombre', 'es_archivo',
            'enlace_externo', 'descarga_url', 'evento_titulo', 'noticia_titulo',
        ]

    def validate_titulo(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El título es obligatorio.')
        return value

    def validate_enlace(self, value):
        value = value.strip()
        if not value.lower().startswith(('http://', 'https://')):
            raise serializers.ValidationError('El enlace debe comenzar con http:// o https://.')
        return value

    def validate(self, attrs):
        evento = attrs.get('evento', getattr(self.instance, 'evento', None))
        noticia = attrs.get('noticia', getattr(self.instance, 'noticia', None))
        if evento and noticia:
            raise serializers.ValidationError('Asocia el recurso a un evento o a una noticia, no a ambos.')

        if self.instance and self.instance.tipo == 'enlace_noticia':
            raise serializers.ValidationError('Este enlace complementario se administra desde CU19 · Noticias institucionales.')

        archivo = attrs.get('archivo')
        enlace = attrs.get('enlace')
        if self.instance is None and bool(archivo) == bool(enlace):
            raise serializers.ValidationError('Registra un enlace o un archivo, exactamente uno.')
        if archivo and enlace:
            raise serializers.ValidationError('No se puede enviar un enlace y un archivo al mismo tiempo.')
        return attrs

    def create(self, validated_data):
        upload = validated_data.pop('archivo', None)
        enlace = validated_data.pop('enlace', None)
        creator = validated_data.pop('cargado_por')
        if upload:
            ruta_o_url, tipo = save_multimedia_file(upload)
        else:
            ruta_o_url, tipo = enlace, 'enlace'

        try:
            return RecursoMultimedia.objects.create(
                cargado_por=creator,
                ruta_o_url=ruta_o_url,
                tipo=tipo,
                **validated_data,
            )
        except Exception:
            if upload:
                remove_multimedia_file(ruta_o_url)
            raise

    def update(self, instance, validated_data):
        upload = validated_data.pop('archivo', None)
        enlace = validated_data.pop('enlace', None)
        old_file = instance.ruta_o_url if self._is_stored_file(instance) else None
        new_file = None

        if upload:
            new_file, new_type = save_multimedia_file(upload)
            instance.ruta_o_url = new_file
            instance.tipo = new_type
        elif enlace:
            instance.ruta_o_url = enlace
            instance.tipo = 'enlace'

        for field, value in validated_data.items():
            setattr(instance, field, value)

        try:
            instance.save()
        except Exception:
            if new_file:
                remove_multimedia_file(new_file)
            raise

        if old_file and (new_file or enlace):
            remove_multimedia_file(old_file)
        return instance

    @staticmethod
    def _is_stored_file(obj):
        return obj.tipo not in ('enlace', 'enlace_noticia') and not obj.ruta_o_url.lower().startswith(('http://', 'https://'))

    def get_evento_titulo(self, obj):
        return obj.evento.titulo if obj.evento_id else None

    def get_noticia_titulo(self, obj):
        return obj.noticia.titulo if obj.noticia_id else None

    def get_cargado_por_nombre(self, obj):
        return f'{obj.cargado_por.nombres} {obj.cargado_por.apellidos}'.strip()

    def get_es_archivo(self, obj):
        return self._is_stored_file(obj)

    def get_enlace_externo(self, obj):
        return obj.ruta_o_url if obj.ruta_o_url.lower().startswith(('http://', 'https://')) else ''

    def get_descarga_url(self, obj):
        if not self._is_stored_file(obj):
            return ''
        path = reverse('multimedia-download', kwargs={'pk': obj.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path


class RecursoMultimediaPublicoSerializer(serializers.ModelSerializer):
    tipo = serializers.SerializerMethodField()
    enlace_externo = serializers.SerializerMethodField()
    descarga_url = serializers.SerializerMethodField()
    evento_titulo = serializers.CharField(source='evento.titulo', read_only=True, default=None)
    noticia_titulo = serializers.CharField(source='noticia.titulo', read_only=True, default=None)

    class Meta:
        model = RecursoMultimedia
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'nivel_acceso',
            'evento_titulo', 'noticia_titulo', 'enlace_externo', 'descarga_url',
        ]

    def get_tipo(self, obj):
        return 'enlace' if obj.ruta_o_url.lower().startswith(('http://', 'https://')) else obj.tipo

    def get_enlace_externo(self, obj):
        return obj.ruta_o_url if obj.ruta_o_url.lower().startswith(('http://', 'https://')) else ''

    def get_descarga_url(self, obj):
        if obj.ruta_o_url.lower().startswith(('http://', 'https://')):
            return ''
        path = reverse('multimedia-download', kwargs={'pk': obj.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path
