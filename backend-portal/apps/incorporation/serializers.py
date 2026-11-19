from django.db import transaction
from rest_framework import serializers

from django.urls import reverse

from .models import DecisionIncorporacion, DocumentoSolicitud, EvaluacionSolicitud, SolicitudIncorporacion
from .storage import (
    MAX_REQUEST_FILES_SIZE,
    MAX_SUPPORTING_FILES,
    remove_application_file,
    save_application_file,
    validate_pdf,
)


class SolicitudIncorporacionCreateSerializer(serializers.ModelSerializer):
    archivo_cv = serializers.FileField(write_only=True, required=True, allow_empty_file=False)
    respaldos = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False), write_only=True,
        required=True, allow_empty=False, max_length=MAX_SUPPORTING_FILES,
    )

    class Meta:
        model = SolicitudIncorporacion
        fields = ['nombres', 'apellidos', 'email', 'telefono', 'antecedentes_academicos', 'archivo_cv', 'respaldos']

    def validate_nombres(self, value):
        value = ' '.join(value.split())
        if not value:
            raise serializers.ValidationError('Los nombres son obligatorios.')
        return value

    def validate_apellidos(self, value):
        value = ' '.join(value.split())
        if not value:
            raise serializers.ValidationError('Los apellidos son obligatorios.')
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_telefono(self, value):
        value = value.strip()
        return value or None

    def validate_antecedentes_academicos(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Describe tus antecedentes académicos.')
        return value

    def validate_archivo_cv(self, upload):
        validate_pdf(upload, 'archivo_cv')
        return upload

    def validate_respaldos(self, uploads):
        if not uploads:
            raise serializers.ValidationError('Adjunta al menos un respaldo académico.')
        for upload in uploads:
            validate_pdf(upload, 'respaldos')
        return uploads

    def validate(self, attrs):
        uploads = [attrs['archivo_cv'], *attrs['respaldos']]
        if sum(upload.size for upload in uploads) > MAX_REQUEST_FILES_SIZE:
            raise serializers.ValidationError({'respaldos': 'El tamaño total de los adjuntos no puede superar 25 MB.'})
        if SolicitudIncorporacion.objects.filter(email__iexact=attrs['email']).exclude(
            estado__in=['rechazada', 'no_aprobada', 'cancelada'],
        ).exists():
            raise serializers.ValidationError({'email': 'Ya existe una solicitud en curso con este correo.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        cv = validated_data.pop('archivo_cv')
        supporting_files = validated_data.pop('respaldos')
        request = self.context.get('request')
        user = None
        if request and request.user.is_authenticated and request.user.email.lower() == validated_data['email']:
            user = request.user

        application = SolicitudIncorporacion.objects.create(
            usuario=user,
            estado='recibida',
            **validated_data,
        )
        saved_paths = []
        try:
            cv_path = save_application_file(cv, application.id)
            saved_paths.append(cv_path)
            DocumentoSolicitud.objects.create(
                solicitud=application,
                nombre='Currículum vitae',
                ruta_privada=cv_path,
                tipo='cv',
            )
            for upload in supporting_files:
                file_path = save_application_file(upload, application.id)
                saved_paths.append(file_path)
                original_name = (upload.name or 'Respaldo académico.pdf').replace('\\', '/').split('/')[-1][:200]
                DocumentoSolicitud.objects.create(
                    solicitud=application,
                    nombre=original_name,
                    ruta_privada=file_path,
                    tipo='respaldo_academico',
                )
        except Exception:
            for path in saved_paths:
                remove_application_file(path)
            raise
        return application


class DocumentoSolicitudReviewSerializer(serializers.ModelSerializer):
    descarga_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoSolicitud
        fields = ['id', 'nombre', 'tipo', 'fecha_carga', 'descarga_url']

    def get_descarga_url(self, obj):
        path = reverse('solicitud-documento-download', kwargs={
            'solicitud_id': obj.solicitud_id, 'documento_id': obj.id,
        })
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path


class EvaluacionSolicitudSerializer(serializers.ModelSerializer):
    evaluador_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EvaluacionSolicitud
        fields = ['id', 'evaluador_nombre', 'observaciones', 'resultado_propuesto', 'fecha_evaluacion']

    def get_evaluador_nombre(self, obj):
        return f'{obj.evaluador.nombres} {obj.evaluador.apellidos}'.strip()


class SolicitudIncorporacionReviewListSerializer(serializers.ModelSerializer):
    codigo = serializers.SerializerMethodField()
    cantidad_documentos = serializers.SerializerMethodField()
    cantidad_evaluaciones = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudIncorporacion
        fields = [
            'id', 'codigo', 'nombres', 'apellidos', 'email', 'estado', 'fecha_envio',
            'cantidad_documentos', 'cantidad_evaluaciones',
        ]

    def get_codigo(self, obj):
        return f'ABO-SOL-{obj.id:06d}'

    def get_cantidad_documentos(self, obj):
        return len(obj.documentos.all())

    def get_cantidad_evaluaciones(self, obj):
        return len(obj.evaluaciones.all())


class DecisionIncorporacionSerializer(serializers.ModelSerializer):
    registrada_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DecisionIncorporacion
        fields = [
            'id',
            'resultado',
            'referencia_acta',
            'fecha_decision',
            'observaciones',
            'registrada_por_nombre',
        ]

    def get_registrada_por_nombre(self, obj):
        if not obj.registrada_por:
            return '—'
        return f'{obj.registrada_por.nombres} {obj.registrada_por.apellidos}'.strip() or obj.registrada_por.email


class SolicitudIncorporacionReviewDetailSerializer(serializers.ModelSerializer):
    codigo = serializers.SerializerMethodField()
    documentos = DocumentoSolicitudReviewSerializer(many=True, read_only=True)
    evaluaciones = EvaluacionSolicitudSerializer(many=True, read_only=True)
    decision = DecisionIncorporacionSerializer(source='decision_incorporacion', read_only=True)
    categoria_miembro_nombre = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudIncorporacion
        fields = [
            'id', 'codigo', 'nombres', 'apellidos', 'email', 'telefono',
            'antecedentes_academicos', 'estado', 'fecha_envio', 'documentos',
            'evaluaciones', 'decision', 'categoria_miembro_nombre',
        ]

    def get_codigo(self, obj):
        return f'ABO-SOL-{obj.id:06d}'

    def get_categoria_miembro_nombre(self, obj):
        from apps.academics.models import Miembro
        miembro = Miembro.objects.filter(solicitud_id=obj.id).select_related('categoria').first()
        return miembro.categoria.nombre if miembro and miembro.categoria else None


class DecisionIncorporacionCreateSerializer(serializers.Serializer):
    RESULTADOS = [
        ('aprobada', 'Aprobar incorporación'),
        ('rechazada', 'Rechazar solicitud'),
    ]
    resultado = serializers.ChoiceField(choices=RESULTADOS)
    referencia_acta = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    categoria_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_referencia_acta(self, value):
        return value.strip() if value else ''

    def validate_observaciones(self, value):
        return value.strip() if value else ''

    def validate(self, attrs):
        if attrs.get('resultado') == 'rechazada' and not attrs.get('observaciones'):
            raise serializers.ValidationError({
                'observaciones': 'Debe ingresar los fundamentos o consideraciones institucionales del rechazo.'
            })
        return attrs


class EvaluacionSolicitudCreateSerializer(serializers.ModelSerializer):
    RESULTADOS_PROPUESTOS = [
        ('favorable', 'Recomendación favorable'),
        ('desfavorable', 'Recomendación desfavorable'),
        ('requiere_documentacion', 'Solicitar documentación adicional'),
        ('continuar_revision', 'Continuar revisión'),
    ]
    resultado_propuesto = serializers.ChoiceField(choices=RESULTADOS_PROPUESTOS)
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = EvaluacionSolicitud
        fields = ['resultado_propuesto', 'observaciones']

    def validate_observaciones(self, value):
        return value.strip() if value else ''

    def validate(self, attrs):
        result = attrs['resultado_propuesto']
        observations = attrs.get('observaciones', '')
        if result in ('desfavorable', 'requiere_documentacion', 'continuar_revision') and not observations:
            raise serializers.ValidationError({
                'observaciones': 'Explica los motivos o detalla la información pendiente para este resultado.'
            })
        return attrs

    def create(self, validated_data):
        return EvaluacionSolicitud.objects.create(**validated_data)


class DocumentacionComplementariaSerializer(serializers.Serializer):
    archivos = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False),
        required=True,
        allow_empty=False,
        max_length=MAX_SUPPORTING_FILES,
    )

    def validate_archivos(self, uploads):
        for upload in uploads:
            validate_pdf(upload, 'archivos')
        if sum(upload.size for upload in uploads) > MAX_REQUEST_FILES_SIZE:
            raise serializers.ValidationError('El tamaño total de los adjuntos no puede superar 25 MB.')
        return uploads
