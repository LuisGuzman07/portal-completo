from django.conf import settings
from django.db import models


class TipoPublicacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        managed = False
        db_table = 'tipo_publicacion'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Publicacion(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('pendiente', 'Pendiente de Revisión'),
        ('en_revision', 'En Revisión'),
        ('aprobada', 'Aprobada / Publicada'),
        ('rechazada', 'Rechazada'),
        ('retirada', 'Retirada'),
    ]

    id = models.BigAutoField(primary_key=True)
    tipo = models.ForeignKey(
        TipoPublicacion,
        on_delete=models.DO_NOTHING,
        db_column='tipo_id',
        related_name='publicaciones'
    )
    registrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='registrada_por_id',
        related_name='publicaciones_registradas'
    )
    titulo = models.CharField(max_length=350)
    resumen = models.TextField(null=True, blank=True)
    anio = models.IntegerField(null=True, blank=True)
    doi = models.CharField(max_length=150, unique=True, null=True, blank=True)
    referencias = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=40, default='pendiente')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_publicacion = models.DateField(null=True, blank=True)

    autores = models.ManyToManyField(
        'Autor',
        through='PublicacionAutor',
        related_name='publicaciones',
        blank=True
    )
    categorias = models.ManyToManyField(
        'Categoria',
        through='PublicacionCategoria',
        related_name='publicaciones',
        blank=True
    )
    palabras_clave = models.ManyToManyField(
        'PalabraClave',
        through='PublicacionPalabra',
        related_name='publicaciones',
        blank=True
    )

    class Meta:
        managed = False
        db_table = 'publicacion'
        ordering = ['-fecha_registro']

    def __str__(self):
        return self.titulo


class Autor(models.Model):
    id = models.BigAutoField(primary_key=True)
    investigador = models.OneToOneField(
        'academics.Investigador',
        on_delete=models.DO_NOTHING,
        db_column='investigador_id',
        null=True,
        blank=True,
        related_name='autor_perfil'
    )
    nombres = models.CharField(max_length=120)
    apellidos = models.CharField(max_length=120)
    afiliacion = models.CharField(max_length=200, null=True, blank=True)
    orcid = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'autor'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.apellidos}, {self.nombres}'

    @property
    def nombre_completo(self):
        return f'{self.nombres} {self.apellidos}'.strip()


class PublicacionAutor(models.Model):
    id = models.BigAutoField(primary_key=True)
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.DO_NOTHING,
        db_column='publicacion_id',
        related_name='autores_relacion'
    )
    autor = models.ForeignKey(
        Autor,
        on_delete=models.DO_NOTHING,
        db_column='autor_id',
        related_name='publicaciones_relacion'
    )
    orden = models.IntegerField()
    es_correspondencia = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'publicacion_autor'
        unique_together = (('publicacion', 'autor'), ('publicacion', 'orden'))
        ordering = ['orden']


class Categoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    area = models.ForeignKey(
        'academics.AreaTematica',
        on_delete=models.DO_NOTHING,
        db_column='area_id',
        related_name='categorias'
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'categoria'
        unique_together = (('area', 'nombre'),)
        ordering = ['area__nombre', 'nombre']

    def __str__(self):
        return f'{self.area.nombre} / {self.nombre}'


class PublicacionCategoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.DO_NOTHING,
        db_column='publicacion_id',
        related_name='categorias_relacion'
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.DO_NOTHING,
        db_column='categoria_id',
        related_name='publicaciones_relacion'
    )

    class Meta:
        managed = False
        db_table = 'publicacion_categoria'
        unique_together = (('publicacion', 'categoria'),)


class PalabraClave(models.Model):
    id = models.BigAutoField(primary_key=True)
    termino = models.CharField(max_length=120, unique=True)

    class Meta:
        managed = False
        db_table = 'palabra_clave'
        ordering = ['termino']

    def __str__(self):
        return self.termino


class PublicacionPalabra(models.Model):
    id = models.BigAutoField(primary_key=True)
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.DO_NOTHING,
        db_column='publicacion_id',
        related_name='palabras_relacion'
    )
    palabra = models.ForeignKey(
        PalabraClave,
        on_delete=models.DO_NOTHING,
        db_column='palabra_id',
        related_name='publicaciones_relacion'
    )

    class Meta:
        managed = False
        db_table = 'publicacion_palabra'
        unique_together = (('publicacion', 'palabra'),)


class RevisionPublicacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.DO_NOTHING,
        db_column='publicacion_id',
        related_name='revisiones'
    )
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='revisor_id',
        related_name='revisiones_realizadas'
    )
    tipo_revision = models.CharField(max_length=30, null=True, blank=True)
    observaciones = models.TextField(null=True, blank=True)
    resultado_propuesto = models.CharField(max_length=40, null=True, blank=True)
    fecha_revision = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'revision_publicacion'
        ordering = ['-fecha_revision']


class TipoDocumento(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        managed = False
        db_table = 'tipo_documento'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class DocumentoDigital(models.Model):
    NIVELES_ACCESO = [
        ('publico', 'Público'),
        ('miembros', 'Solo Miembros Acreditados'),
        ('restringido', 'Restringido / Confidencial'),
    ]

    id = models.BigAutoField(primary_key=True)
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.DO_NOTHING,
        db_column='publicacion_id',
        related_name='documentos'
    )
    tipo = models.ForeignKey(
        TipoDocumento,
        on_delete=models.DO_NOTHING,
        db_column='tipo_id',
        related_name='documentos'
    )
    cargado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='cargado_por_id',
        related_name='documentos_cargados'
    )
    titulo = models.CharField(max_length=300)
    ruta_privada = models.CharField(max_length=500)
    nombre_original = models.CharField(max_length=255)
    mime = models.CharField(max_length=100, null=True, blank=True)
    tamano_bytes = models.BigIntegerField(null=True, blank=True)
    checksum_sha256 = models.CharField(max_length=64, null=True, blank=True)
    nivel_acceso = models.CharField(max_length=30, default='restringido')
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'documento_digital'
        ordering = ['-fecha_carga']

    def __str__(self):
        return f'{self.titulo} ({self.nombre_original})'


class DescargaDocumento(models.Model):
    id = models.BigAutoField(primary_key=True)
    documento = models.ForeignKey(
        DocumentoDigital,
        on_delete=models.DO_NOTHING,
        db_column='documento_id',
        related_name='descargas'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='usuario_id',
        null=True,
        blank=True,
        related_name='descargas_documentos'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'descarga_documento'
        ordering = ['-fecha']


class VisualizacionContenido(models.Model):
    id = models.BigAutoField(primary_key=True)
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.DO_NOTHING,
        db_column='publicacion_id',
        related_name='visualizaciones'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='usuario_id',
        null=True,
        blank=True,
        related_name='visualizaciones_publicaciones'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'visualizacion_contenido'
        ordering = ['-fecha']
