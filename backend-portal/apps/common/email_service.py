import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

TOKEN_SALT = 'aboccrim.account.email_confirmation.v1'
TOKEN_MAX_AGE_SECONDS = 86400  # 24 horas


def generate_email_confirmation_token(user):
    """
    Genera un token criptográfico firmado con timestamp que incluye el ID y email del usuario.
    Expira automáticamente después de TOKEN_MAX_AGE_SECONDS (24h).
    """
    signer = TimestampSigner(salt=TOKEN_SALT)
    payload = f"{user.id}:{user.email.strip().lower()}"
    return signer.sign(payload)


def verify_email_confirmation_token(token, max_age=TOKEN_MAX_AGE_SECONDS):
    """
    Verifica la validez y vigencia del token de confirmación de correo.
    Retorna (user, None) en caso de éxito, o (None, error_code) en caso de fallo.
    error_code puede ser 'expired', 'invalid' o 'not_found'.
    """
    if not token or not isinstance(token, str):
        return None, 'invalid'

    signer = TimestampSigner(salt=TOKEN_SALT)
    try:
        raw_payload = signer.unsign(token, max_age=max_age)
    except SignatureExpired:
        return None, 'expired'
    except (BadSignature, ValueError):
        return None, 'invalid'

    try:
        user_id_str, email = raw_payload.split(':', 1)
        user_id = int(user_id_str)
    except (ValueError, AttributeError):
        return None, 'invalid'

    from apps.accounts.models import Usuario
    try:
        user = Usuario.objects.get(id=user_id, email__iexact=email)
        return user, None
    except Usuario.DoesNotExist:
        return None, 'not_found'


def build_confirmation_html(user, confirmation_url):
    """Construye una plantilla de correo electrónico HTML institucional y elegante."""
    nombre_completo = f"{user.nombres} {user.apellidos}".strip() or user.email
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Confirmación de Cuenta — ABOCCRIM</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1a1c1e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8; padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); border:1px solid #e1e3e5;">
          
          <!-- Encabezado Institucional -->
          <tr>
            <td style="background:linear-gradient(135deg, #102a43 0%, #1e3a5f 100%); padding:32px 30px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700; letter-spacing:0.5px;">
                ABOCCRIM
              </h1>
              <p style="color:#c9d8eb; margin:6px 0 0 0; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">
                Academia Boliviana de Ciencias Criminológicas
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding:40px 35px 30px 35px;">
              <h2 style="color:#102a43; font-size:20px; font-weight:700; margin-top:0; margin-bottom:16px;">
                ¡Bienvenido/a a la Plataforma Institucional!
              </h2>
              <p style="font-size:15px; line-height:1.6; color:#40484f; margin-bottom:16px;">
                Estimado/a <strong>{nombre_completo}</strong>:
              </p>
              <p style="font-size:14px; line-height:1.6; color:#40484f; margin-bottom:24px;">
                Gracias por registrarte en el portal oficial de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM). Para garantizar la autenticidad y seguridad de tu cuenta, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:
              </p>

              <!-- Botón de Acción -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto;">
                <tr>
                  <td align="center" style="background-color:#0f52ba; border-radius:10px;">
                    <a href="{confirmation_url}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px; letter-spacing:0.3px;">
                      Confirmar mi Cuenta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Enlace Alternativo -->
              <p style="font-size:12px; line-height:1.5; color:#71787e; margin-top:24px; padding-top:20px; border-top:1px solid #edf0f2;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
                <a href="{confirmation_url}" style="color:#0f52ba; word-break:break-all; text-decoration:underline;">{confirmation_url}</a>
              </p>

              <!-- Vigencia -->
              <p style="font-size:12px; line-height:1.5; color:#8c9399; margin-top:16px;">
                ⏱ <em>Este enlace es válido durante <strong>24 horas</strong>. Si no solicitaste este registro en ABOCCRIM, puedes ignorar este mensaje de forma segura.</em>
              </p>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color:#f8f9fa; padding:20px 30px; text-align:center; border-top:1px solid #edf0f2;">
              <p style="margin:0; font-size:11px; color:#71787e; line-height:1.4;">
                Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)<br>
                Santa Cruz de la Sierra, Bolivia · Sistema Web de Gestión Académica e Institucional
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_confirmation_email(user, token):
    """
    Construye y envía el correo de confirmación de cuenta al usuario registrado vía SMTP.
    Retorna True si el envío fue exitoso, o False en caso de error.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    confirmation_url = f"{frontend_url}/confirmar-cuenta?token={token}"

    subject = "Confirma tu cuenta en ABOCCRIM"
    html_content = build_confirmation_html(user, confirmation_url)
    text_content = (
        f"Hola {user.nombres} {user.apellidos}:\n\n"
        f"Gracias por registrarte en ABOCCRIM.\n"
        f"Por favor confirma tu cuenta accediendo al siguiente enlace:\n"
        f"{confirmation_url}\n\n"
        f"Este enlace tiene una validez de 24 horas.\n\n"
        f"Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)"
    )

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'ABOCCRIM <soporte.aboccrim@gmail.com>')
    recipient = [user.email]

    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Correo de confirmación enviado exitosamente a {user.email}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar correo de confirmación a {user.email}: {e}")
        return False


def send_institutional_email(to_email, subject, message_text, message_html=None):
    """
    Función utilitaria general para futuras notificaciones institucionales
    (CU22 postulación a membresía, dictámenes de arbitraje CU11, etc.).
    """
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'ABOCCRIM <soporte.aboccrim@gmail.com>')
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=message_text,
            from_email=from_email,
            to=[to_email] if isinstance(to_email, str) else to_email,
        )
        if message_html:
            msg.attach_alternative(message_html, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Notificación institucional enviada a {to_email} - Asunto: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error enviando notificación institucional a {to_email}: {e}")
        return False
