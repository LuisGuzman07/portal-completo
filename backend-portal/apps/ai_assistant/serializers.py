from rest_framework import serializers
from apps.publications.models import Publicacion, DocumentoDigital
from .models import ConversacionIA, MensajeIA, FuenteMensajeIA, DocumentoIndexado


class FuenteMensajeIASerializer(serializers.ModelSerializer):
    publicacion_titulo = serializers.CharField(source='publicacion.titulo', read_only=True)
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = FuenteMensajeIA
        fields = [
            'id',
            'publicacion_id',
            'publicacion_titulo',
            'documento_id',
            'numero_pagina',
            'orden_cita',
            'texto_citado',
            'cita_bibliografica',
            'pdf_url',
        ]

    def get_pdf_url(self, obj):
        if obj.documento_id:
            return f'/api/v1/publications/documents/{obj.documento_id}/download/?inline=1'
        return None


class MensajeIASerializer(serializers.ModelSerializer):
    fuentes = FuenteMensajeIASerializer(many=True, read_only=True)

    class Meta:
        model = MensajeIA
        fields = [
            'id',
            'conversacion_id',
            'rol',
            'contenido',
            'valoracion',
            'es_favorito',
            'fecha_envio',
            'fuentes',
        ]


class ConversacionIAListSerializer(serializers.ModelSerializer):
    total_mensajes = serializers.SerializerMethodField()
    ultimo_mensaje = serializers.SerializerMethodField()

    class Meta:
        model = ConversacionIA
        fields = [
            'id',
            'titulo',
            'es_favorita',
            'fecha_creacion',
            'fecha_actualizacion',
            'total_mensajes',
            'ultimo_mensaje',
        ]

    def get_total_mensajes(self, obj):
        return obj.mensajes.count()

    def get_ultimo_mensaje(self, obj):
        last = obj.mensajes.order_by('-fecha_envio').first()
        if last:
            return {
                'id': last.id,
                'rol': last.rol,
                'contenido': last.contenido[:100] + ('...' if len(last.contenido) > 100 else ''),
                'fecha_envio': last.fecha_envio,
            }
        return None


class ConversacionIADetailSerializer(serializers.ModelSerializer):
    mensajes = MensajeIASerializer(many=True, read_only=True)

    class Meta:
        model = ConversacionIA
        fields = [
            'id',
            'titulo',
            'es_favorita',
            'fecha_creacion',
            'fecha_actualizacion',
            'mensajes',
        ]


class ConsultaIARequestSerializer(serializers.Serializer):
    query_text = serializers.CharField(
        max_length=4000,
        required=True,
        trim_whitespace=True,
        error_messages={'required': 'Debe ingresar una pregunta o consulta.'}
    )
    conversacion_id = serializers.IntegerField(required=False, allow_null=True)


class MensajeFeedbackSerializer(serializers.Serializer):
    valoracion = serializers.ChoiceField(
        choices=['like', 'dislike'],
        required=False,
        allow_null=True
    )
    es_favorito = serializers.BooleanField(required=False)


class ConversacionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversacionIA
        fields = ['titulo', 'es_favorita']
