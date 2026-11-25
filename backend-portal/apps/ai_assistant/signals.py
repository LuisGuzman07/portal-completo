import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.publications.models import Publicacion, DocumentoDigital
from .services.indexer import DocumentIndexerService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=DocumentoDigital)
def on_documento_digital_saved(sender, instance, created, **kwargs):
    """
    Cuando se crea o actualiza un DocumentoDigital, si su publicación está aprobada,
    se dispara la indexación automática en segundo plano.
    """
    try:
        pub = instance.publicacion
        if pub and pub.estado in ('aprobada', 'aprobado', 'publicada', 'publicado'):
            DocumentIndexerService.trigger_async_index_document(instance.id)
    except Exception as e:
        logger.error(f"[SIGNAL] Error en señal post_save de DocumentoDigital #{instance.id}: {e}")


@receiver(post_save, sender=Publicacion)
def on_publicacion_saved(sender, instance, created, **kwargs):
    """
    Cuando una publicación pasa a estado 'aprobada', se dispara la indexación
    automática en segundo plano de todos los documentos que tenga asociados.
    """
    try:
        if instance.estado in ('aprobada', 'aprobado', 'publicada', 'publicado'):
            DocumentIndexerService.trigger_async_index_publication(instance.id)
    except Exception as e:
        logger.error(f"[SIGNAL] Error en señal post_save de Publicacion #{instance.id}: {e}")
