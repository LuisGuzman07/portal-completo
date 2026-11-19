from django.conf import settings
from django.db import models
from apps.publications.models import Publicacion, DocumentoDigital


class ConversacionIA(models.Model):
    """
    Representa una sesión de diálogo entre el investigador y el Asistente Académico ABOCCRIM.
    """
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='usuario_id',
        related_name='conversaciones_ia',
    )
    titulo = models.CharField(max_length=255, default='Nueva consulta académica')
    es_favorita = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversacion_ia'
        ordering = ['-fecha_actualizacion']

    def __str__(self):
        return f'{self.titulo} ({self.usuario.email})'


class MensajeIA(models.Model):
    """
    Cada mensaje dentro de una conversación, ya sea del usuario o generado por la IA.
    """
    ROLES = [
        ('user', 'Usuario'),
        ('assistant', 'Asistente IA'),
    ]
    VALORACIONES = [
        ('like', 'Me gusta'),
        ('dislike', 'No me gusta'),
    ]

    id = models.BigAutoField(primary_key=True)
    conversacion = models.ForeignKey(
        ConversacionIA,
        on_delete=models.CASCADE,
        db_column='conversacion_id',
        related_name='mensajes',
    )
    rol = models.CharField(max_length=20, choices=ROLES)
    contenido = models.TextField()
    valoracion = models.CharField(max_length=20, choices=VALORACIONES, null=True, blank=True)
    es_favorito = models.BooleanField(default=False)
    fecha_envio = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mensaje_ia'
        ordering = ['fecha_envio']

    def __str__(self):
        return f'[{self.rol}] {self.contenido[:50]}...'


class FuenteMensajeIA(models.Model):
    """
    Registra cada una de las fuentes documentales reales citadas en una respuesta del asistente.
    Garantiza trazabilidad y previene alucinaciones.
    """
    id = models.BigAutoField(primary_key=True)
    mensaje = models.ForeignKey(
        MensajeIA,
        on_delete=models.CASCADE,
        db_column='mensaje_id',
        related_name='fuentes',
    )
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.CASCADE,
        db_column='publicacion_id',
        related_name='citas_asistente',
    )
    documento = models.ForeignKey(
        DocumentoDigital,
        on_delete=models.SET_NULL,
        db_column='documento_id',
        null=True,
        blank=True,
        related_name='citas_asistente',
    )
    numero_pagina = models.IntegerField(null=True, blank=True)
    orden_cita = models.IntegerField(default=1)  # 1 para [1], 2 para [2], etc.
    texto_citado = models.TextField(null=True, blank=True)
    cita_bibliografica = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'fuente_mensaje_ia'
        ordering = ['orden_cita']

    def __str__(self):
        return f'[{self.orden_cita}] {self.publicacion.titulo} (pág. {self.numero_pagina})'


class DocumentoIndexado(models.Model):
    """
    Control de estado del procesamiento e indexación RAG para cada PDF del repositorio.
    """
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('indexando', 'Indexando'),
        ('indexado', 'Indexado'),
        ('error', 'Error'),
    ]

    id = models.BigAutoField(primary_key=True)
    documento = models.OneToOneField(
        DocumentoDigital,
        on_delete=models.CASCADE,
        db_column='documento_id',
        related_name='registro_indexado',
    )
    estado = models.CharField(max_length=30, choices=ESTADOS, default='pendiente')
    total_paginas = models.IntegerField(default=0)
    total_fragmentos = models.IntegerField(default=0)
    checksum_sha256 = models.CharField(max_length=64, null=True, blank=True)
    fecha_indexacion = models.DateTimeField(null=True, blank=True)
    mensaje_error = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'documento_indexado'
        ordering = ['-fecha_indexacion', '-id']

    def __str__(self):
        return f'{self.documento.nombre_original} [{self.estado}]'


class FragmentoDocumento(models.Model):
    """
    Fragmentos de texto (chunks) generados a partir de los documentos autorizados,
    con su número de página real y su vector de embeddings para búsqueda semántica.
    """
    id = models.BigAutoField(primary_key=True)
    documento_indexado = models.ForeignKey(
        DocumentoIndexado,
        on_delete=models.CASCADE,
        db_column='documento_indexado_id',
        related_name='fragmentos',
    )
    publicacion = models.ForeignKey(
        Publicacion,
        on_delete=models.CASCADE,
        db_column='publicacion_id',
        related_name='fragmentos_ia',
    )
    numero_pagina = models.IntegerField(default=1)
    orden_fragmento = models.IntegerField(default=1)
    contenido = models.TextField()
    embedding = models.JSONField(null=True, blank=True, help_text='Representación vectorial (768 dimensiones)')
    tokens_aprox = models.IntegerField(default=0)

    class Meta:
        db_table = 'fragmento_documento'
        ordering = ['numero_pagina', 'orden_fragmento']

    def __str__(self):
        return f'Frag {self.orden_fragmento} (Pág. {self.numero_pagina}) - Doc {self.documento_indexado_id}'
