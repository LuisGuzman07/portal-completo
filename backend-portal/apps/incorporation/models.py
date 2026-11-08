from django.conf import settings
from django.db import models


class SolicitudIncorporacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        db_column='usuario_id', related_name='solicitudes_incorporacion',
        null=True, blank=True,
    )
    nombres = models.CharField(max_length=120)
    apellidos = models.CharField(max_length=120)
    email = models.EmailField(max_length=254)
    telefono = models.CharField(max_length=50, null=True, blank=True)
    antecedentes_academicos = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=40, default='recibida')
    fecha_envio = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'solicitud_incorporacion'
        ordering = ['-fecha_envio', '-id']


class DocumentoSolicitud(models.Model):
    id = models.BigAutoField(primary_key=True)
    solicitud = models.ForeignKey(
        SolicitudIncorporacion, on_delete=models.DO_NOTHING,
        db_column='solicitud_id', related_name='documentos',
    )
    nombre = models.CharField(max_length=200)
    ruta_privada = models.CharField(max_length=500)
    tipo = models.CharField(max_length=60, null=True, blank=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'documento_solicitud'
        ordering = ['id']


class EvaluacionSolicitud(models.Model):
    id = models.BigAutoField(primary_key=True)
    solicitud = models.ForeignKey(
        SolicitudIncorporacion, on_delete=models.DO_NOTHING,
        db_column='solicitud_id', related_name='evaluaciones',
    )
    evaluador = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.DO_NOTHING,
        db_column='evaluador_id', related_name='evaluaciones_incorporacion',
    )
    observaciones = models.TextField(null=True, blank=True)
    resultado_propuesto = models.CharField(max_length=40, null=True, blank=True)
    fecha_evaluacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'evaluacion_solicitud'
        ordering = ['-fecha_evaluacion', '-id']


class DecisionIncorporacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    solicitud = models.OneToOneField(
        SolicitudIncorporacion, on_delete=models.DO_NOTHING,
        db_column='solicitud_id', related_name='decision_incorporacion',
    )
    registrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.DO_NOTHING,
        db_column='registrada_por_id', related_name='decisiones_incorporacion_registradas',
    )
    resultado = models.CharField(max_length=30)
    referencia_acta = models.CharField(max_length=150, null=True, blank=True)
    fecha_decision = models.DateTimeField(auto_now_add=True)
    observaciones = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'decision_incorporacion'
        ordering = ['-fecha_decision']
