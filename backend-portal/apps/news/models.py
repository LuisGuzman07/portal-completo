from django.conf import settings
from django.db import models

from apps.multimedia.models import RecursoMultimedia


class Noticia(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('publicado', 'Publicado'),
        ('retirada', 'Retirada'),
    ]

    id = models.BigAutoField(primary_key=True)
    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='creada_por_id',
        related_name='noticias_creadas',
    )
    titulo = models.CharField(max_length=250)
    contenido = models.TextField()
    estado = models.CharField(max_length=30, default='borrador', choices=ESTADOS)
    fecha_publicacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'noticia'
        ordering = ['-fecha_publicacion', '-id']