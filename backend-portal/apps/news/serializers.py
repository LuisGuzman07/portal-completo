from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers

from .models import Noticia, RecursoMultimedia
from apps.multimedia.serializers import RecursoMultimediaPublicoSerializer
from apps.multimedia.storage import remove_multimedia_file, save_multimedia_file


class NoticiaSerializer(serializers.ModelSerializer):
    material_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, allow_null=True,
    )
    imagen_portada = serializers.FileField(write_only=True, required=False, allow_null=True)
    eliminar_imagen = serializers.BooleanField(write_only=True, required=False, default=False)
    imagen_portada_url = serializers.SerializerMethodField()

    class Meta:
        model = Noticia
        fields = [
            'id', 'titulo', 'contenido', 'estado', 'fecha_publicacion',
            'material_url', 'imagen_portada', 'eliminar_imagen', 'imagen_portada_url',
        ]
        read_only_fields = ['id', 'fecha_publicacion', 'imagen_portada_url']

    def validate_titulo(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El título es obligatorio.')
        return value

    def validate_contenido(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El contenido es obligatorio.')
        return value

    def validate_material_url(self, value):
        if value and not value.lower().startswith(('http://', 'https://')):
            raise serializers.ValidationError('El material debe ser un enlace HTTP o HTTPS válido.')
        return value.strip() if value else ''

    def get_imagen_portada_url(self, obj):
        resource = obj.recursos_multimedia.filter(
            tipo__in=['imagen', 'jpg', 'jpeg', 'png', 'webp'],
        ).order_by('-id').first()
        if not resource:
            return ''
        if resource.ruta_o_url.lower().startswith(('http://', 'https://')):
            return resource.ruta_o_url
        path = reverse('multimedia-download', kwargs={'pk': resource.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path

    def to_representation(self, instance):
        data = super().to_representation(instance)
        resource = next((item for item in instance.recursos_multimedia.all()
                         if item.tipo == 'enlace_noticia' and item.nivel_acceso == 'publico'), None)
        data['material_url'] = resource.ruta_o_url if resource else ''
        return data

    def create(self, validated_data):
        material_url = validated_data.pop('material_url', '')
        imagen_file = validated_data.pop('imagen_portada', None)
        validated_data.pop('eliminar_imagen', False)
        creator = validated_data.pop('creada_por')
        status_value = validated_data.get('estado', 'borrador')
        noticia = Noticia.objects.create(
            creada_por=creator,
            fecha_publicacion=timezone.now() if status_value == 'publicado' else None,
            **validated_data,
        )
        self._save_material(noticia, creator, material_url)
        if imagen_file:
            self._save_image(noticia, creator, imagen_file)
        return noticia

    def update(self, instance, validated_data):
        material_url = validated_data.pop('material_url', None)
        imagen_file = validated_data.pop('imagen_portada', None)
        eliminar_imagen = validated_data.pop('eliminar_imagen', False)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if instance.estado == 'publicado':
            if not instance.fecha_publicacion:
                instance.fecha_publicacion = timezone.now()
        else:
            instance.fecha_publicacion = None
        instance.save()

        user = self.context['request'].user
        if material_url is not None:
            self._save_material(instance, user, material_url)

        if eliminar_imagen:
            self._delete_images(instance)
        if imagen_file:
            self._delete_images(instance)
            self._save_image(instance, user, imagen_file)

        return instance

    @staticmethod
    def _delete_images(noticia):
        images = RecursoMultimedia.objects.filter(
            noticia=noticia,
            tipo__in=['imagen', 'jpg', 'jpeg', 'png', 'webp'],
        )
        for img in images:
            if not img.ruta_o_url.lower().startswith(('http://', 'https://')):
                remove_multimedia_file(img.ruta_o_url)
            img.delete()

    @staticmethod
    def _save_image(noticia, user, image_file):
        rel_path, ext = save_multimedia_file(image_file)
        RecursoMultimedia.objects.create(
            cargado_por=user,
            noticia=noticia,
            titulo=f'Portada: {noticia.titulo}'[:250],
            tipo='imagen',
            ruta_o_url=rel_path,
            nivel_acceso='publico',
        )

    @staticmethod
    def _save_material(noticia, user, material_url):
        resource = RecursoMultimedia.objects.filter(
            noticia=noticia, tipo='enlace_noticia', nivel_acceso='publico',
        ).first()
        if not material_url:
            if resource:
                resource.delete()
            return
        if resource:
            resource.titulo = f'Material complementario: {noticia.titulo}'[:250]
            resource.ruta_o_url = material_url
            resource.save(update_fields=['titulo', 'ruta_o_url'])
        else:
            RecursoMultimedia.objects.create(
                cargado_por=user,
                noticia=noticia,
                titulo=f'Material complementario: {noticia.titulo}'[:250],
                tipo='enlace_noticia',
                ruta_o_url=material_url,
                nivel_acceso='publico',
            )


class NoticiaPublicaSerializer(serializers.ModelSerializer):
    material_url = serializers.SerializerMethodField()
    imagen_portada_url = serializers.SerializerMethodField()
    recursos_multimedia = serializers.SerializerMethodField()

    class Meta:
        model = Noticia
        fields = [
            'id', 'titulo', 'contenido', 'fecha_publicacion',
            'material_url', 'imagen_portada_url', 'recursos_multimedia',
        ]

    def get_imagen_portada_url(self, obj):
        resources = obj.recursos_publicos if hasattr(obj, 'recursos_publicos') else obj.recursos_multimedia.filter(nivel_acceso='publico')
        resource = next((item for item in resources if item.tipo in ('imagen', 'jpg', 'jpeg', 'png', 'webp') or any(item.ruta_o_url.lower().endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.webp'))), None)
        if not resource:
            return ''
        if resource.ruta_o_url.lower().startswith(('http://', 'https://')):
            return resource.ruta_o_url
        path = reverse('multimedia-download', kwargs={'pk': resource.pk})
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path

    def get_material_url(self, obj):
        resources = obj.recursos_publicos if hasattr(obj, 'recursos_publicos') else obj.recursos_multimedia.all()
        resource = next((item for item in resources
                         if item.tipo == 'enlace_noticia' and item.nivel_acceso == 'publico'), None)
        return resource.ruta_o_url if resource else ''

    def get_recursos_multimedia(self, obj):
        public_resources = obj.recursos_publicos if hasattr(obj, 'recursos_publicos') else obj.recursos_multimedia.filter(nivel_acceso='publico')
        resources = [item for item in public_resources
                     if item.tipo != 'enlace_noticia']
        return RecursoMultimediaPublicoSerializer(resources, many=True, context=self.context).data
