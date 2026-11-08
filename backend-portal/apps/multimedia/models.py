from django.conf import settings
from django.db import models


class RecursoMultimedia(models.Model):
    NIVELES_ACCESO = [
        ('publico', 'Público'),
        ('miembros', 'Solo miembros acreditados'),
        ('restringido', 'Restringido'),
    ]

    id = models.BigAutoField(primary_key=True)
    cargado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='cargado_por_id',
        related_name='recursos_multimedia_cargados',
    )
    evento = models.ForeignKey(
        'events.Evento',
        on_delete=models.DO_NOTHING,
        db_column='evento_id',
        related_name='recursos_multimedia',
        null=True,
        blank=True,
    )
    noticia = models.ForeignKey(
        'news.Noticia',
        on_delete=models.DO_NOTHING,
        db_column='noticia_id',
        related_name='recursos_multimedia',
        null=True,
        blank=True,
    )
    titulo = models.CharField(max_length=250)
    tipo = models.CharField(max_length=50)
    ruta_o_url = models.CharField(max_length=500)
    descripcion = models.TextField(null=True, blank=True)
    nivel_acceso = models.CharField(max_length=30, default='publico', choices=NIVELES_ACCESO)

    class Meta:
        managed = False
        db_table = 'recurso_multimedia'
        ordering = ['-id']
