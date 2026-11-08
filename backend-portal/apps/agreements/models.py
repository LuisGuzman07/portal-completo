from django.conf import settings
from django.db import models


class Institucion(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=250)
    pais = models.CharField(max_length=100, null=True, blank=True)
    sitio_web = models.CharField(max_length=300, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'institucion'
        ordering = ['nombre', 'id']

    def __str__(self):
        return self.nombre


class Convenio(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('vigente', 'Vigente'),
        ('finalizado', 'Finalizado'),
        ('suspendido', 'Suspendido'),
    ]

    id = models.BigAutoField(primary_key=True)
    institucion = models.ForeignKey(
        Institucion, on_delete=models.DO_NOTHING, db_column='institucion_id',
        related_name='convenios',
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.DO_NOTHING,
        db_column='registrado_por_id', related_name='convenios_registrados',
    )
    objeto = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=30, default='borrador', choices=ESTADOS)
    referencia_documental = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'convenio'
        ordering = ['-fecha_inicio', '-id']
