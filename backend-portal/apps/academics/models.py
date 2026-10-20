from django.conf import settings
from django.db import models


class PerfilAcademico(models.Model):
    """Mapea la tabla perfil_academico creada por el DDL oficial."""

    id = models.BigAutoField(primary_key=True)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='usuario_id',
        related_name='perfil_academico',
    )
    grado_academico = models.CharField(max_length=100, null=True, blank=True)
    institucion = models.CharField(max_length=200, null=True, blank=True)
    especialidad = models.CharField(max_length=200, null=True, blank=True)
    biografia = models.TextField(null=True, blank=True)
    orcid = models.CharField(max_length=30, null=True, blank=True)
    fecha_actualizacion = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'perfil_academico'
        ordering = ['id']

    def __str__(self):
        return f'Perfil académico de {self.usuario.email}'


class AreaTematica(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'area_tematica'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Investigador(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('observado', 'Observado'),
        ('activo', 'Activo'),
        ('rechazado', 'Rechazado'),
        ('inactivo', 'Inactivo'),
    ]

    id = models.BigAutoField(primary_key=True)
    perfil_academico = models.OneToOneField(
        PerfilAcademico,
        on_delete=models.DO_NOTHING,
        db_column='perfil_academico_id',
        related_name='registro_investigador',
    )
    estado = models.CharField(max_length=30, default='pendiente')
    fecha_alta = models.DateField(null=True, blank=True)
    visible_directorio = models.BooleanField(default=False)
    areas = models.ManyToManyField(
        AreaTematica,
        through='InvestigadorArea',
        related_name='investigadores',
        blank=True,
    )

    class Meta:
        managed = False
        db_table = 'investigador'
        ordering = ['perfil_academico__usuario__apellidos', 'perfil_academico__usuario__nombres']

    def __str__(self):
        return f'Investigador: {self.perfil_academico.usuario.get_full_name()}'


class InvestigadorArea(models.Model):
    id = models.BigAutoField(primary_key=True)
    investigador = models.ForeignKey(
        Investigador,
        on_delete=models.DO_NOTHING,
        db_column='investigador_id',
        related_name='areas_relacionadas',
    )
    area = models.ForeignKey(
        AreaTematica,
        on_delete=models.DO_NOTHING,
        db_column='area_id',
        related_name='investigador_area_relaciones',
    )

    class Meta:
        managed = False
        db_table = 'investigador_area'
        unique_together = (('investigador', 'area'),)


class CategoriaMiembro(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'categoria_miembro'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Miembro(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
    ]

    id = models.BigAutoField(primary_key=True)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='usuario_id',
        related_name='membresia',
    )
    categoria = models.ForeignKey(
        CategoriaMiembro,
        on_delete=models.DO_NOTHING,
        db_column='categoria_id',
        related_name='miembros',
    )
    solicitud_id = models.BigIntegerField(null=True, blank=True, unique=True)
    estado = models.CharField(max_length=30, default='pendiente')
    fecha_incorporacion = models.DateField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'miembro'
        ordering = ['usuario__apellidos', 'usuario__nombres']
