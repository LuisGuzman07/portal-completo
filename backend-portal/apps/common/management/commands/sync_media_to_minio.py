import os
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.common.storage_service import storage_service


class Command(BaseCommand):
    help = 'Sincroniza todos los archivos locales de MEDIA_ROOT hacia el bucket de MinIO.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Fuerza la subida de archivos incluso si ya existen en el bucket de MinIO.'
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        media_root = Path(settings.MEDIA_ROOT).resolve()

        if not media_root.exists() or not media_root.is_dir():
            self.stdout.write(self.style.WARNING(f'El directorio {media_root} no existe. Nada que sincronizar.'))
            return

        self.stdout.write(self.style.SUCCESS('==================================================='))
        self.stdout.write(self.style.SUCCESS('Sincronización de Archivos Locales a MinIO'))
        self.stdout.write(self.style.SUCCESS(f'Bucket destino: {storage_service.bucket_name}'))
        self.stdout.write(self.style.SUCCESS(f'Endpoint MinIO: {storage_service.endpoint}'))
        self.stdout.write(self.style.SUCCESS('==================================================='))

        # Asegurar que el bucket exista
        if not storage_service.ensure_bucket_exists():
            self.stderr.write(self.style.ERROR('No se pudo conectar con MinIO o verificar/crear el bucket. Abortando.'))
            return

        total_files = 0
        uploaded_files = 0
        skipped_files = 0
        error_files = 0
        total_bytes = 0

        for root, dirs, files in os.walk(media_root):
            for filename in files:
                full_path = Path(root) / filename
                if not full_path.is_file():
                    continue

                try:
                    rel_path = full_path.relative_to(media_root).as_posix()
                except ValueError:
                    continue

                total_files += 1

                # Comprobar si ya existe en MinIO (si no es force)
                if not force and storage_service.s3_client:
                    try:
                        storage_service.s3_client.head_object(
                            Bucket=storage_service.bucket_name,
                            Key=rel_path
                        )
                        self.stdout.write(f' [OMITIDO] {rel_path} ya existe en MinIO.')
                        skipped_files += 1
                        continue
                    except Exception:
                        pass

                # Subir archivo
                try:
                    with open(full_path, 'rb') as f:
                        file_data = f.read()

                    file_size = len(file_data)
                    storage_service.upload_file(file_data, rel_path)
                    uploaded_files += 1
                    total_bytes += file_size
                    self.stdout.write(self.style.SUCCESS(f' [SUBIDO] {rel_path} ({file_size / 1024:.1f} KB)'))
                except Exception as err:
                    error_files += 1
                    self.stderr.write(self.style.ERROR(f' [ERROR] {rel_path}: {err}'))

        self.stdout.write(self.style.SUCCESS('\n--- Resumen de Sincronización ---'))
        self.stdout.write(f'Total de archivos escaneados: {total_files}')
        self.stdout.write(self.style.SUCCESS(f'Archivos subidos exitosamente: {uploaded_files}'))
        self.stdout.write(f'Archivos omitidos (ya existían): {skipped_files}')
        if error_files > 0:
            self.stdout.write(self.style.ERROR(f'Archivos con error: {error_files}'))
        self.stdout.write(f'Datos transferidos: {total_bytes / (1024 * 1024):.2f} MB')
        self.stdout.write(self.style.SUCCESS('Sincronización finalizada.'))
