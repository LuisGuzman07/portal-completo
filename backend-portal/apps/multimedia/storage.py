import os
import uuid
from pathlib import Path

from django.conf import settings
from rest_framework import serializers


MAX_MULTIMEDIA_SIZE = 50 * 1024 * 1024

ALLOWED_SIGNATURES = {
    '.jpg': lambda data: data.startswith(b'\xff\xd8\xff'),
    '.jpeg': lambda data: data.startswith(b'\xff\xd8\xff'),
    '.png': lambda data: data.startswith(b'\x89PNG\r\n\x1a\n'),
    '.webp': lambda data: len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WEBP',
    '.mp3': lambda data: data.startswith(b'ID3') or (len(data) >= 2 and data[0] == 0xff and data[1] & 0xe0 == 0xe0),
    '.wav': lambda data: len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WAVE',
    '.ogg': lambda data: data.startswith(b'OggS'),
    '.m4a': lambda data: len(data) >= 8 and data[4:8] == b'ftyp',
    '.mp4': lambda data: len(data) >= 8 and data[4:8] == b'ftyp',
    '.mov': lambda data: len(data) >= 8 and data[4:8] == b'ftyp',
    '.webm': lambda data: data.startswith(b'\x1a\x45\xdf\xa3'),
    '.pdf': lambda data: data.startswith(b'%PDF-'),
}

CONTENT_TYPES = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.pdf': 'application/pdf',
}


def save_multimedia_file(upload):
    extension = Path(upload.name or '').suffix.lower()
    signature_check = ALLOWED_SIGNATURES.get(extension)
    if not signature_check:
        raise serializers.ValidationError({'archivo': 'Formato no permitido. Usa audio, video, imagen o PDF compatible.'})
    if upload.size <= 0 or upload.size > MAX_MULTIMEDIA_SIZE:
        raise serializers.ValidationError({'archivo': 'El archivo debe tener contenido y no superar 50 MB.'})

    upload.seek(0)
    header = upload.read(32)
    upload.seek(0)
    if not signature_check(header):
        raise serializers.ValidationError({'archivo': 'El contenido del archivo no coincide con su extensión.'})

    media_root = Path(settings.MEDIA_ROOT)
    directory = media_root / 'multimedia'
    directory.mkdir(parents=True, exist_ok=True)
    safe_name = f'{uuid.uuid4().hex}{extension}'
    relative_path = f'multimedia/{safe_name}'
    full_path = (media_root / relative_path).resolve()
    if media_root.resolve() not in full_path.parents:
        raise serializers.ValidationError({'archivo': 'No se pudo almacenar el archivo.'})

    upload.seek(0)
    try:
        with open(full_path, 'wb') as destination:
            for chunk in upload.chunks():
                destination.write(chunk)
    except OSError as error:
        raise serializers.ValidationError({'archivo': 'No se pudo guardar el archivo en el almacenamiento.'}) from error

    return relative_path, extension.lstrip('.')


def remove_multimedia_file(relative_path):
    if not relative_path or relative_path.startswith(('http://', 'https://')):
        return
    media_root = Path(settings.MEDIA_ROOT).resolve()
    file_path = (media_root / relative_path).resolve()
    if media_root in file_path.parents and file_path.is_file():
        try:
            file_path.unlink()
        except OSError:
            pass


def multimedia_content_type(resource):
    extension = Path(resource.ruta_o_url).suffix.lower()
    return CONTENT_TYPES.get(extension, 'application/octet-stream')


def multimedia_download_name(resource):
    extension = Path(resource.ruta_o_url).suffix.lower()
    title = os.path.basename(resource.titulo).replace('"', '').replace('\r', '').replace('\n', '').strip()
    return f'{title or "recurso"}{extension}'
