from rest_framework import serializers

from .models import Evento
from apps.multimedia.serializers import RecursoMultimediaPublicoSerializer


class EventoSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'lugar',
            'estado', 'creado_por', 'creado_por_nombre',
        ]
        read_only_fields = ['id', 'creado_por', 'creado_por_nombre']

    def get_creado_por_nombre(self, obj):
        return f'{obj.creado_por.nombres} {obj.creado_por.apellidos}'.strip()

    def validate(self, attrs):
        inicio = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        fin = attrs.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))
        if fin and inicio and fin < inicio:
            raise serializers.ValidationError({'fecha_fin': 'La fecha final no puede ser anterior a la fecha de inicio.'})
        return attrs


class EventoPublicoSerializer(serializers.ModelSerializer):
    recursos_multimedia = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'lugar', 'recursos_multimedia']

    def get_recursos_multimedia(self, obj):
        resources = obj.recursos_publicos if hasattr(obj, 'recursos_publicos') else obj.recursos_multimedia.filter(nivel_acceso='publico')
        return RecursoMultimediaPublicoSerializer(resources, many=True, context=self.context).data
