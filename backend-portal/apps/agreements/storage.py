import os
import uuid
from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from apps.common.storage_service import storage_service


MAX_AGREEMENT_PDF_SIZE = 25 * 1024 * 1024


def save_agreement_pdf(upload):
    if not upload or Path(upload.name or '').suffix.lower() != '.pdf':
        raise serializers.ValidationError({'archivo': 'Adjunta un documento PDF.'})
    if upload.size <= 0 or upload.size > MAX_AGREEMENT_PDF_SIZE:
        raise serializers.ValidationError({'archivo': 'El PDF debe tener contenido y no superar 25 MB.'})

    upload.seek(0)
    if b'%PDF-' not in upload.read(1024):
        raise serializers.ValidationError({'archivo': 'El archivo no contiene una cabecera PDF válida.'})

    filename = f'{uuid.uuid4().hex}.pdf'
    relative_path = f'convenios/{filename}'

    upload.seek(0)
    try:
        storage_service.upload_file(
            file_obj=upload,
            relative_path=relative_path,
            content_type='application/pdf'
        )
    except Exception as error:
        raise serializers.ValidationError({'archivo': 'No se pudo guardar el documento en el almacenamiento.'}) from error
    return relative_path


def remove_agreement_file(path):
    if not path or path.startswith(('http://', 'https://')):
        return
    try:
        storage_service.delete_file(path)
    except Exception:
        pass


def agreement_download_name(agreement):
    name = os.path.basename(f'Convenio-{agreement.institucion.nombre}.pdf')
    return name.replace('"', '').replace('\r', '').replace('\n', '')
