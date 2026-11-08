import os
import uuid
from pathlib import Path

from django.conf import settings
from rest_framework import serializers


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
    media_root = Path(settings.MEDIA_ROOT).resolve()
    folder = media_root / 'solicitudes_incorporacion' / str(application_id)
    folder.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid.uuid4().hex}.pdf'
    relative_path = f'solicitudes_incorporacion/{application_id}/{filename}'
    target = (media_root / relative_path).resolve()
    if (media_root / 'solicitudes_incorporacion').resolve() not in target.parents:
        raise serializers.ValidationError('No se pudo almacenar el documento de la solicitud.')

    upload.seek(0)
    try:
        with open(target, 'wb') as destination:
            for chunk in upload.chunks():
                destination.write(chunk)
    except OSError as error:
        raise serializers.ValidationError('No se pudo guardar el documento en el almacenamiento.') from error
    return relative_path


def remove_application_file(relative_path):
    if not relative_path:
        return
    media_root = Path(settings.MEDIA_ROOT).resolve()
    applications_root = (media_root / 'solicitudes_incorporacion').resolve()
    target = (media_root / relative_path).resolve()
    if applications_root in target.parents and target.is_file():
        try:
            target.unlink()
        except OSError:
            pass
