from django.conf import settings
from django.db import models


class Evento(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('publicado', 'Publicado'),
        ('cancelado', 'Cancelado'),
    ]

    id = models.BigAutoField(primary_key=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='creado_por_id',
        related_name='eventos_creados',
    )
    titulo = models.CharField(max_length=250)
    descripcion = models.TextField(null=True, blank=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField(null=True, blank=True)
    lugar = models.CharField(max_length=250, null=True, blank=True)
    estado = models.CharField(max_length=30, default='borrador', choices=ESTADOS)

    class Meta:
        managed = False
        db_table = 'evento'
        ordering = ['fecha_inicio', 'id']
