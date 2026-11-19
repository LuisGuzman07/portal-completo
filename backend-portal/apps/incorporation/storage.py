import os
import uuid
from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from apps.common.storage_service import storage_service


MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_REQUEST_FILES_SIZE = 25 * 1024 * 1024
MAX_SUPPORTING_FILES = 8


def validate_pdf(upload, field_name):
    filename = os.path.basename((upload.name or '').replace('\\', '/'))
    if Path(filename).suffix.lower() != '.pdf':
        raise serializers.ValidationError({field_name: 'Solo se aceptan archivos PDF.'})
    if upload.size <= 0 or upload.size > MAX_FILE_SIZE:
        raise serializers.ValidationError({field_name: 'Cada archivo debe tener contenido y no superar 10 MB.'})
    upload.seek(0)
    if b'%PDF-' not in upload.read(1024):
        raise serializers.ValidationError({field_name: 'El archivo no tiene una cabecera PDF válida.'})
    upload.seek(0)
    return filename[:200] or 'documento.pdf'


def save_application_file(upload, application_id):
    filename = f'{uuid.uuid4().hex}.pdf'
    relative_path = f'solicitudes_incorporacion/{application_id}/{filename}'

    upload.seek(0)
    try:
        storage_service.upload_file(
            file_obj=upload,
            relative_path=relative_path,
            content_type='application/pdf'
        )
    except Exception as error:
        raise serializers.ValidationError('No se pudo guardar el documento en el almacenamiento.') from error
    return relative_path


def remove_application_file(relative_path):
    if not relative_path:
        return
    try:
        storage_service.delete_file(relative_path)
    except Exception:
        pass
