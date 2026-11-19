from pathlib import Path
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.publications.models import Publicacion, DocumentoDigital
from apps.ai_assistant.models import DocumentoIndexado, FragmentoDocumento
from apps.common.storage_service import storage_service
from .pdf_extractor import extract_pages_from_pdf, chunk_page_text
from .embedding_service import get_text_embedding


class DocumentIndexerService:
    """
    Servicio encargado de la extracción, chunking y vectorización de documentos
    digitales del repositorio institucional de ABOCCRIM.
    """

    @classmethod
    def index_document(cls, documento: DocumentoDigital, force: bool = False) -> DocumentoIndexado:
        """
        Indexa un DocumentoDigital específico si es un PDF válido.
        """
        registro, _ = DocumentoIndexado.objects.get_or_create(documento=documento)

        if not force and registro.estado == 'indexado' and registro.checksum_sha256 == documento.checksum_sha256:
            return registro

        # Verificar si la publicación asociada está aprobada/publicada
        if documento.publicacion.estado not in ('aprobada', 'aprobado', 'publicada', 'publicado'):
            registro.estado = 'pendiente'
            registro.mensaje_error = 'La publicación asociada aún no se encuentra aprobada en el repositorio.'
            registro.save(update_fields=['estado', 'mensaje_error'])
            return registro

        # Localizar el archivo en el almacenamiento (MinIO / S3 / local)
        if not storage_service.file_exists(documento.ruta_privada):
            registro.estado = 'error'
            registro.mensaje_error = f'Archivo no encontrado en el almacenamiento: {documento.ruta_privada}'
            registro.save(update_fields=['estado', 'mensaje_error'])
            return registro

        # Marcar como en proceso
        registro.estado = 'indexando'
        registro.mensaje_error = None
        registro.save(update_fields=['estado', 'mensaje_error'])

        try:
            pdf_bytes = storage_service.get_file_bytes(documento.ruta_privada)
            pages = extract_pages_from_pdf(pdf_bytes)
            if not pages:
                # Si el PDF no contenía texto extraíble (ej. documento escaneado como imagen pura)
                # Crear al menos un fragmento base con el resumen y título de la publicación
                pub = documento.publicacion
                fallback_text = f"Título: {pub.titulo}\nResumen: {pub.resumen or ''}\nDocumento: {documento.titulo}"
                pages = [{'numero_pagina': 1, 'texto': fallback_text}]

            all_fragments = []
            for page_info in pages:
                page_num = page_info['numero_pagina']
                chunks = chunk_page_text(page_info['texto'], page_number=page_num)

                for chunk in chunks:
                    emb = get_text_embedding(chunk['contenido'])
                    all_fragments.append(
                        FragmentoDocumento(
                            documento_indexado=registro,
                            publicacion=documento.publicacion,
                            numero_pagina=chunk['numero_pagina'],
                            orden_fragmento=chunk['orden_fragmento'],
                            contenido=chunk['contenido'],
                            embedding=emb,
                            tokens_aprox=chunk['tokens_aprox'],
                        )
                    )

            with transaction.atomic():
                # Limpiar fragmentos anteriores si existieran
                registro.fragmentos.all().delete()
                FragmentoDocumento.objects.bulk_create(all_fragments)

                registro.estado = 'indexado'
                registro.total_paginas = len(pages)
                registro.total_fragmentos = len(all_fragments)
                registro.checksum_sha256 = documento.checksum_sha256
                registro.fecha_indexacion = timezone.now()
                registro.mensaje_error = None
                registro.save()

            return registro

        except Exception as e:
            registro.estado = 'error'
            registro.mensaje_error = f'Error durante la indexación: {str(e)}'
            registro.save(update_fields=['estado', 'mensaje_error'])
            return registro

    @classmethod
    def index_all_approved_publications(cls, force: bool = False) -> dict:
        """
        Recorre todas las publicaciones aprobadas del repositorio e indexa
        sus documentos PDF para dejarlos listos para consultas con el asistente.
        """
        publicaciones = Publicacion.objects.filter(
            estado__in=['aprobada', 'aprobado', 'publicada', 'publicado']
        ).prefetch_related('documentos')

        stats = {
            'publicaciones_analizadas': publicaciones.count(),
            'documentos_procesados': 0,
            'indexados_exitosamente': 0,
            'con_errores': 0,
        }

        for pub in publicaciones:
            for doc in pub.documentos.all():
                stats['documentos_procesados'] += 1
                reg = cls.index_document(doc, force=force)
                if reg.estado == 'indexado':
                    stats['indexados_exitosamente'] += 1
                else:
                    stats['con_errores'] += 1

        return stats
