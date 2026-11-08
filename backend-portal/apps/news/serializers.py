from django.utils import timezone
from rest_framework import serializers

from .models import Noticia, RecursoMultimedia
from apps.multimedia.serializers import RecursoMultimediaPublicoSerializer


class NoticiaSerializer(serializers.ModelSerializer):
    material_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, allow_null=True,
    )

    class Meta:
        model = Noticia
        fields = ['id', 'titulo', 'contenido', 'estado', 'fecha_publicacion', 'material_url']
        read_only_fields = ['id', 'fecha_publicacion']

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        resource = next((item for item in instance.recursos_multimedia.all()
                         if item.tipo == 'enlace_noticia' and item.nivel_acceso == 'publico'), None)
        data['material_url'] = resource.ruta_o_url if resource else ''
        return data

    def create(self, validated_data):
        material_url = validated_data.pop('material_url', '')
        creator = validated_data.pop('creada_por')
        status_value = validated_data.get('estado', 'borrador')
        noticia = Noticia.objects.create(
            creada_por=creator,
            fecha_publicacion=timezone.now() if status_value == 'publicado' else None,
            **validated_data,
        )
        self._save_material(noticia, creator, material_url)
        return noticia

    def update(self, instance, validated_data):
        material_url = validated_data.pop('material_url', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if instance.estado == 'publicado':
            if not instance.fecha_publicacion:
                instance.fecha_publicacion = timezone.now()
        else:
            instance.fecha_publicacion = None
        instance.save()
        if material_url is not None:
            self._save_material(instance, self.context['request'].user, material_url)
        return instance

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
    recursos_multimedia = serializers.SerializerMethodField()

    class Meta:
        model = Noticia
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'material_url', 'recursos_multimedia']

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
