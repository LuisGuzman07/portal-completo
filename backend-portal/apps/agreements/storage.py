import os
import uuid
from pathlib import Path

from django.conf import settings
from rest_framework import serializers


MAX_AGREEMENT_PDF_SIZE = 25 * 1024 * 1024


def save_agreement_pdf(upload):
    if not upload or Path(upload.name or '').suffix.lower() != '.pdf':
        raise serializers.ValidationError({'archivo': 'Adjunta un documento PDF.'})
    if upload.size <= 0 or upload.size > MAX_AGREEMENT_PDF_SIZE:
        raise serializers.ValidationError({'archivo': 'El PDF debe tener contenido y no superar 25 MB.'})

    upload.seek(0)
    if b'%PDF-' not in upload.read(1024):
        raise serializers.ValidationError({'archivo': 'El archivo no contiene una cabecera PDF válida.'})

    media_root = Path(settings.MEDIA_ROOT).resolve()
    directory = media_root / 'convenios'
    directory.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid.uuid4().hex}.pdf'
    relative_path = f'convenios/{filename}'
    destination_path = (media_root / relative_path).resolve()
    if media_root not in destination_path.parents:
        raise serializers.ValidationError({'archivo': 'No se pudo guardar el documento.'})

    upload.seek(0)
    try:
        with open(destination_path, 'wb') as destination:
            for chunk in upload.chunks():
                destination.write(chunk)
    except OSError as error:
        raise serializers.ValidationError({'archivo': 'No se pudo guardar el documento en el almacenamiento.'}) from error
    return relative_path


def remove_agreement_file(path):
    if not path or path.startswith(('http://', 'https://')):
        return
    media_root = Path(settings.MEDIA_ROOT).resolve()
    agreements_root = (media_root / 'convenios').resolve()
    target = (media_root / path).resolve()
    if agreements_root in target.parents and target.is_file():
        try:
            target.unlink()
        except OSError:
            pass


def agreement_download_name(agreement):
    name = os.path.basename(f'Convenio-{agreement.institucion.nombre}.pdf')
    return name.replace('"', '').replace('\r', '').replace('\n', '')
