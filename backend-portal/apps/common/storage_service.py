import io
import logging
import mimetypes
import os
from pathlib import Path
from typing import BinaryIO, Optional, Tuple, Union

try:
    import boto3
    import botocore
    from botocore.config import Config
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    boto3 = None
    botocore = None
    Config = None
    ClientError = Exception
    BOTO3_AVAILABLE = False

from django.conf import settings
from django.http import FileResponse, Http404

logger = logging.getLogger(__name__)


class MinioStorageService:
    """
    Servicio desacoplado de almacenamiento S3 compatible (MinIO local, AWS S3, GCP Cloud Storage).
    Proporciona operaciones de subida, descarga, streaming, eliminación y generación de URLs firmadas.
    Incluye fallback transparente al sistema de archivos local para desarrollo y pruebas.
    """

    _instance = None
    _bucket_verified = False

    def __init__(self):
        self.enabled = getattr(settings, 'MINIO_ENABLED', True) and BOTO3_AVAILABLE
        self.endpoint = getattr(settings, 'MINIO_ENDPOINT', 'http://minio:9000')
        self.public_endpoint = getattr(settings, 'MINIO_PUBLIC_ENDPOINT', 'http://localhost:9000')
        self.access_key = getattr(settings, 'MINIO_ACCESS_KEY', 'minioadmin')
        self.secret_key = getattr(settings, 'MINIO_SECRET_KEY', 'minioadmin123')
        self.bucket_name = getattr(settings, 'MINIO_BUCKET_NAME', 'aboccrim-media')
        self.secure = getattr(settings, 'MINIO_SECURE', False)
        self.media_root = Path(settings.MEDIA_ROOT).resolve()

        self._s3_client = None
        self._s3_public_client = None

    @classmethod
    def get_instance(cls) -> 'MinioStorageService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def s3_client(self):
        if self._s3_client is None:
            try:
                self._s3_client = boto3.client(
                    's3',
                    endpoint_url=self.endpoint,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}),
                    region_name='us-east-1',
                    use_ssl=self.secure,
                )
            except Exception as e:
                logger.error(f'No se pudo inicializar el cliente S3/MinIO: {e}')
                return None
        return self._s3_client

    @property
    def s3_public_client(self):
        if self._s3_public_client is None:
            try:
                self._s3_public_client = boto3.client(
                    's3',
                    endpoint_url=self.public_endpoint,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}),
                    region_name='us-east-1',
                    use_ssl=self.secure,
                )
            except Exception as e:
                logger.error(f'No se pudo inicializar el cliente S3 público: {e}')
                return None
        return self._s3_public_client

    def ensure_bucket_exists(self) -> bool:
        """Verifica que el bucket exista en MinIO; si no existe, lo crea automáticamente."""
        if not self.enabled or self.s3_client is None:
            return False

        if MinioStorageService._bucket_verified:
            return True

        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            MinioStorageService._bucket_verified = True
            return True
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code in ('404', 'NoSuchBucket', 'NotFound'):
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f'Bucket MinIO "{self.bucket_name}" creado exitosamente.')
                    MinioStorageService._bucket_verified = True
                    return True
                except Exception as create_err:
                    logger.error(f'Error al crear bucket "{self.bucket_name}": {create_err}')
                    return False
            logger.warning(f'Error al verificar bucket MinIO: {e}')
            return False
        except Exception as ex:
            logger.warning(f'No se pudo contactar a MinIO para verificar bucket: {ex}')
            return False

    def normalize_path(self, relative_path: str) -> str:
        """Limpia la ruta relativa para MinIO y local."""
        clean = (relative_path or '').replace('\\', '/').lstrip('/')
        return clean

    def upload_file(
        self,
        file_obj: Union[BinaryIO, bytes, io.BytesIO],
        relative_path: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Sube un archivo a MinIO y opcionalmente a disco local como respaldo.
        Retorna la ruta relativa normalizada.
        """
        path = self.normalize_path(relative_path)
        if not path:
            raise ValueError('La ruta de destino no puede estar vacía.')

        if not content_type:
            content_type, _ = mimetypes.guess_type(path)
            content_type = content_type or 'application/octet-stream'

        # Preparar bytes / stream
        if isinstance(file_obj, (bytes, bytearray)):
            stream = io.BytesIO(file_obj)
            data_bytes = bytes(file_obj)
        else:
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            if hasattr(file_obj, 'read'):
                data_bytes = file_obj.read()
                if hasattr(file_obj, 'seek'):
                    file_obj.seek(0)
                stream = io.BytesIO(data_bytes)
            else:
                raise TypeError('El objeto file_obj debe ser bytes o soportar read().')

        # Intentar subir a MinIO
        uploaded_to_minio = False
        if self.enabled and self.ensure_bucket_exists():
            try:
                stream.seek(0)
                extra_args = {'ContentType': content_type}
                self.s3_client.upload_fileobj(
                    Fileobj=stream,
                    Bucket=self.bucket_name,
                    Key=path,
                    ExtraArgs=extra_args
                )
                uploaded_to_minio = True
                logger.info(f'Archivo subido a MinIO: {self.bucket_name}/{path}')
            except Exception as e:
                logger.error(f'Error subiendo archivo a MinIO ({path}): {e}')

        # Guardar también en disco local para respaldo / compatibilidad local
        try:
            local_target = (self.media_root / path).resolve()
            local_target.parent.mkdir(parents=True, exist_ok=True)
            with open(local_target, 'wb') as dst:
                dst.write(data_bytes)
        except Exception as e:
            logger.warning(f'No se pudo escribir copia local en {path}: {e}')
            if not uploaded_to_minio:
                raise IOError(f'Fallo al guardar el archivo tanto en MinIO como en local: {e}')

        return path

    def file_exists(self, relative_path: str) -> bool:
        """Verifica si el archivo existe en MinIO o en el sistema local."""
        path = self.normalize_path(relative_path)
        if not path:
            return False

        if self.enabled and self.s3_client:
            try:
                self.s3_client.head_object(Bucket=self.bucket_name, Key=path)
                return True
            except ClientError:
                pass
            except Exception as e:
                logger.warning(f'Error al verificar existencia en MinIO ({path}): {e}')

        # Verificar local
        local_path = (self.media_root / path).resolve()
        return local_path.is_file()

    def get_file_bytes(self, relative_path: str) -> bytes:
        """
        Obtiene el contenido binario del archivo desde MinIO o disco local.
        Ideal para PyMuPDF y el indexador de IA.
        """
        path = self.normalize_path(relative_path)
        if not path:
            raise FileNotFoundError('Ruta de archivo no especificada.')

        # 1. Intentar desde MinIO
        if self.enabled and self.s3_client:
            try:
                response = self.s3_client.get_object(Bucket=self.bucket_name, Key=path)
                return response['Body'].read()
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code')
                if error_code not in ('404', 'NoSuchKey'):
                    logger.warning(f'Error al leer archivo desde MinIO ({path}): {e}')
            except Exception as e:
                logger.warning(f'Error de conexión con MinIO ({path}): {e}')

        # 2. Fallback a disco local
        local_path = (self.media_root / path).resolve()
        if local_path.is_file():
            with open(local_path, 'rb') as f:
                data = f.read()
            # Migración perezosa a MinIO
            if self.enabled and self.s3_client:
                try:
                    self.upload_file(data, path)
                except Exception:
                    pass
            return data

        raise FileNotFoundError(f'El archivo "{path}" no existe ni en MinIO ni en almacenamiento local.')

    def get_file_stream(self, relative_path: str) -> Tuple[BinaryIO, str, int]:
        """
        Retorna (stream, content_type, content_length) para streaming eficiente.
        """
        path = self.normalize_path(relative_path)
        if not path:
            raise FileNotFoundError('Ruta no especificada.')

        content_type, _ = mimetypes.guess_type(path)
        content_type = content_type or 'application/octet-stream'

        # 1. Intentar desde MinIO
        if self.enabled and self.s3_client:
            try:
                response = self.s3_client.get_object(Bucket=self.bucket_name, Key=path)
                stream = response['Body']
                size = response.get('ContentLength', 0)
                c_type = response.get('ContentType', content_type)
                return stream, c_type, size
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code')
                if error_code not in ('404', 'NoSuchKey'):
                    logger.warning(f'Error obteniendo stream de MinIO ({path}): {e}')
            except Exception as e:
                logger.warning(f'Error de conexión con MinIO ({path}): {e}')

        # 2. Fallback a local
        local_path = (self.media_root / path).resolve()
        if local_path.is_file():
            size = local_path.stat().st_size
            stream = open(local_path, 'rb')
            return stream, content_type, size

        raise FileNotFoundError(f'Archivo "{path}" no encontrado.')

    def delete_file(self, relative_path: str) -> bool:
        """Elimina el archivo de MinIO y de almacenamiento local."""
        path = self.normalize_path(relative_path)
        if not path:
            return False

        deleted = False
        if self.enabled and self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=path)
                deleted = True
                logger.info(f'Archivo eliminado de MinIO: {self.bucket_name}/{path}')
            except Exception as e:
                logger.warning(f'Error al eliminar archivo en MinIO ({path}): {e}')

        # Eliminar también de local si existe
        try:
            local_path = (self.media_root / path).resolve()
            if self.media_root in local_path.parents and local_path.is_file():
                local_path.unlink()
                deleted = True
        except Exception as e:
            logger.warning(f'Error al eliminar archivo local ({path}): {e}')

        return deleted

    def get_presigned_url(self, relative_path: str, expiration: int = 3600) -> Optional[str]:
        """Genera una URL firmada accesible para el cliente."""
        path = self.normalize_path(relative_path)
        if not path or not self.enabled:
            return None

        client = self.s3_public_client or self.s3_client
        if client is None:
            return None

        try:
            url = client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': path},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.error(f'Error generando presigned URL para {path}: {e}')
            return None

    def stream_file_response(
        self,
        relative_path: str,
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
        inline: bool = True
    ) -> FileResponse:
        """
        Retorna un FileResponse de Django configurado con streaming directo desde MinIO o disco.
        """
        try:
            stream, auto_type, size = self.get_file_stream(relative_path)
        except FileNotFoundError:
            raise Http404('El archivo solicitado no se encuentra en el almacenamiento.')

        mime = content_type or auto_type or 'application/octet-stream'
        response = FileResponse(stream, content_type=mime)

        if size:
            response['Content-Length'] = str(size)

        if not filename:
            filename = os.path.basename(relative_path)

        clean_filename = filename.replace('"', '').replace('\r', '').replace('\n', '')
        disposition = 'inline' if inline else 'attachment'
        response['Content-Disposition'] = f'{disposition}; filename="{clean_filename}"'

        return response


# Instancia por defecto lista para importar
storage_service = MinioStorageService.get_instance()
