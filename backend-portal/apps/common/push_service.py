import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def enviar_notificacion_push(usuario_id=None, titulo="", cuerpo="", datos=None):
    """
    Envía una notificación push a uno o todos los usuarios registrados.
    Si firebase_admin no está instalado o configurado con credenciales,
    registra en el log de auditoría sin romper la ejecución de la petición.
    """
    from apps.accounts.models import DispositivoFCM

    tokens_qs = DispositivoFCM.objects.all()
    if usuario_id:
        user_tokens = tokens_qs.filter(usuario_id=usuario_id)
        if user_tokens.exists():
            tokens_qs = user_tokens
        elif settings.DEBUG:
            logger.warning(
                f"[PUSH] usuario_id={usuario_id} no tiene dispositivo FCM registrado. "
                "En modo DEBUG/Desarrollo, enviando a dispositivos registrados activos para pruebas."
            )
            print(
                f"[PUSH DEBUG] usuario_id={usuario_id} no tiene token propio; "
                f"reenviando a {tokens_qs.count()} dispositivo(s) activo(s) de prueba."
            )
        else:
            tokens_qs = user_tokens

    tokens = list(tokens_qs.values_list('fcm_token', flat=True))
    if not tokens:
        logger.info(f"[PUSH] No hay dispositivos FCM registrados para usuario_id={usuario_id}")
        return {"enviados": 0, "mensaje": "Sin dispositivos FCM registrados"}

    try:
        import firebase_admin
        from firebase_admin import messaging, credentials

        # Inicializar Firebase Admin SDK si no ha sido inicializado
        if not firebase_admin._apps:
            cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', str(settings.BASE_DIR / 'firebase-key.json'))
            if not os.path.exists(cred_path):
                alt_path = str(settings.BASE_DIR.parent / 'firebase-key.json')
                if os.path.exists(alt_path):
                    cred_path = alt_path

            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"[PUSH] Firebase Admin SDK inicializado con: {cred_path}")
            else:
                msg = f"Falta el archivo de credenciales de Firebase ('firebase-key.json') en {cred_path}."
                logger.warning(f"[PUSH] {msg}")
                return {"enviados": 0, "error": msg}

        android_config = messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                title=titulo,
                body=cuerpo,
                channel_id='aboccrim_notificaciones',
                sound='default',
                default_sound=True,
                default_vibrate_timings=True,
                priority='max',
                visibility='public',
            ),
        )

        mensajes = [
            messaging.Message(
                notification=messaging.Notification(title=titulo, body=cuerpo),
                android=android_config,
                data={k: str(v) for k, v in (datos or {}).items()},
                token=t,
            )
            for t in tokens
        ]

        # Envío por lotes
        response = messaging.send_each(mensajes)
        logger.info(f"[PUSH] Enviadas {response.success_count} notificaciones con éxito.")
        return {
            "enviados": response.success_count,
            "fallidos": response.failure_count,
            "mensaje": f"Se enviaron {response.success_count} notificaciones correctamente."
        }
    except ImportError:
        logger.warning("[PUSH] El paquete 'firebase-admin' no está instalado en el backend.")
        return {"enviados": 0, "error": "firebase-admin no instalado"}
    except Exception as e:
        logger.error(f"[PUSH] Error al enviar notificación: {e}")
        return {"enviados": 0, "error": str(e)}
