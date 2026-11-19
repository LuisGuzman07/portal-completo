from django.urls import reverse
from rest_framework import serializers

from .models import Evento
from apps.multimedia.models import RecursoMultimedia
from apps.multimedia.serializers import RecursoMultimediaPublicoSerializer
from apps.multimedia.storage import remove_multimedia_file, save_multimedia_file


class EventoSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()
    imagen = serializers.FileField(write_only=True, required=False, allow_null=True)
    eliminar_imagen = serializers.BooleanField(write_only=True, required=False, default=False)
    imagen_url = serializers.SerializerMethodField()
    recursos_multimedia = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'lugar',
            'estado', 'creado_por', 'creado_por_nombre', 'imagen', 'eliminar_imagen',
            'imagen_url', 'recursos_multimedia',
        ]
        read_only_fields = ['id', 'creado_por', 'creado_por_nombre', 'imagen_url', 'recursos_multimedia']

    def get_creado_por_nombre(self, obj):
        return f'{obj.creado_por.nombres} {obj.creado_por.apellidos}'.strip()

    def get_imagen_url(self, obj):
        resource = obj.recursos_multimedia.filter(
            tipo__in=['imagen', 'jpg', 'jpeg', 'png', 'webp'],
        ).order_by('-id').first()
        if not resource:
            # Si tiene un recurso de tipo 'enlace' que es imagen o enlace externo
            resource = obj.recursos_multimedia.filter(
                ruta_o_url__iregex=r'\.(jpg|jpeg|png|webp)($|\?)'
            ).first()
        if not resource:
            return ''
        if resource.ruta_o_url.lower().startswith(('http://', 'https://')):
            return resource.ruta_o_url
        path = reverse('multimedia-download', kwargs={'pk': resource.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path

    def get_recursos_multimedia(self, obj):
        return RecursoMultimediaPublicoSerializer(obj.recursos_multimedia.all(), many=True, context=self.context).data

    def validate(self, attrs):
        inicio = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        fin = attrs.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))
        if fin and inicio and fin < inicio:
            raise serializers.ValidationError({'fecha_fin': 'La fecha final no puede ser anterior a la fecha de inicio.'})
        return attrs

    def create(self, validated_data):
        imagen_file = validated_data.pop('imagen', None)
        validated_data.pop('eliminar_imagen', False)
        creator = validated_data.pop('creado_por', None) or self.context['request'].user
        evento = Evento.objects.create(creado_por=creator, **validated_data)
        if imagen_file:
            self._save_image(evento, creator, imagen_file)
        return evento

    def update(self, instance, validated_data):
        imagen_file = validated_data.pop('imagen', None)
        eliminar_imagen = validated_data.pop('eliminar_imagen', False)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        user = self.context['request'].user
        if eliminar_imagen:
            self._delete_images(instance)
        if imagen_file:
            self._delete_images(instance)
            self._save_image(instance, user, imagen_file)

        return instance

    @staticmethod
    def _delete_images(evento):
        images = RecursoMultimedia.objects.filter(
            evento=evento,
            tipo__in=['imagen', 'jpg', 'jpeg', 'png', 'webp'],
        )
        for img in images:
            if not img.ruta_o_url.lower().startswith(('http://', 'https://')):
                remove_multimedia_file(img.ruta_o_url)
            img.delete()

    @staticmethod
    def _save_image(evento, user, image_file):
        rel_path, ext = save_multimedia_file(image_file)
        RecursoMultimedia.objects.create(
            cargado_por=user,
            evento=evento,
            titulo=f'Fotografía: {evento.titulo}'[:250],
            tipo='imagen',
            ruta_o_url=rel_path,
            nivel_acceso='publico',
        )


class EventoPublicoSerializer(serializers.ModelSerializer):
    recursos_multimedia = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'lugar', 'imagen_url', 'recursos_multimedia']

    def get_imagen_url(self, obj):
        resources = obj.recursos_publicos if hasattr(obj, 'recursos_publicos') else obj.recursos_multimedia.filter(nivel_acceso='publico')
        resource = next((r for r in resources if r.tipo in ('imagen', 'jpg', 'jpeg', 'png', 'webp') or any(r.ruta_o_url.lower().endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.webp'))), None)
        if not resource:
            return ''
        if resource.ruta_o_url.lower().startswith(('http://', 'https://')):
            return resource.ruta_o_url
        path = reverse('multimedia-download', kwargs={'pk': resource.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path

    def get_recursos_multimedia(self, obj):
        resources = obj.recursos_publicos if hasattr(obj, 'recursos_publicos') else obj.recursos_multimedia.filter(nivel_acceso='publico')
        return RecursoMultimediaPublicoSerializer(resources, many=True, context=self.context).data
