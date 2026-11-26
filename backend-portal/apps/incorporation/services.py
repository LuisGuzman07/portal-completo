import json
import logging
import re
import threading
from pathlib import Path

from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone
from django.utils.html import strip_tags

from apps.academics.models import CategoriaMiembro, Miembro
from apps.accounts.models import Usuario
from apps.ai_assistant.services.llm_service import LLMService
from apps.ai_assistant.services.pdf_extractor import extract_pages_from_pdf
from apps.audit.models import registrar_auditoria
from apps.common.email_service import send_institutional_email
from apps.common.push_service import enviar_notificacion_push
from apps.common.storage_service import storage_service
from apps.roles.models import Rol, UsuarioRol
from .models import DecisionIncorporacion, DocumentoSolicitud, SolicitudIncorporacion

logger = logging.getLogger(__name__)


def build_incorporation_approved_email_html(application, score, categoria_nombre, sintesis, acta):
    """Construye un correo institucional elegante de aprobación de membresía."""
    nombre_completo = f"{application.nombres} {application.apellidos}".strip()
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    login_url = f"{frontend_url}/iniciar-sesion"

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Membresía Aprobada — ABOCCRIM</title>
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
              <div style="display:inline-block; background-color:#e8f5e9; color:#1b5e20; font-size:12px; font-weight:700; padding:6px 14px; border-radius:20px; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:16px;">
                ✓ Solicitud de Membresía Aprobada
              </div>

              <h2 style="color:#102a43; font-size:22px; font-weight:700; margin-top:0; margin-bottom:14px;">
                ¡Felicidades, le damos la bienvenida a ABOCCRIM!
              </h2>

              <p style="font-size:15px; line-height:1.6; color:#40484f; margin-bottom:16px;">
                Estimado/a <strong>{nombre_completo}</strong>:
              </p>

              <p style="font-size:14px; line-height:1.6; color:#40484f; margin-bottom:20px;">
                Nos complace informarle que, tras la evaluación exhaustiva y colegiada de su expediente curricular asistida por nuestro sistema de evaluación académica, su solicitud de incorporación a la <strong>Academia Boliviana de Ciencias Criminológicas</strong> ha sido dictaminada como <strong>APROBADA</strong>.
              </p>

              <!-- Ficha del Dictamen -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fa; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:22px;">
                <tr>
                  <td style="padding:6px 12px; font-size:13px; color:#64748b; font-weight:600;">Categoría Asignada:</td>
                  <td style="padding:6px 12px; font-size:14px; color:#0f172a; font-weight:700;">{categoria_nombre or 'Miembro Titular'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px; font-size:13px; color:#64748b; font-weight:600;">Puntaje Curricular:</td>
                  <td style="padding:6px 12px; font-size:14px; color:#16a34a; font-weight:700;">{score} / 100 puntos</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px; font-size:13px; color:#64748b; font-weight:600;">Resolución Directiva:</td>
                  <td style="padding:6px 12px; font-size:13px; color:#0f172a; font-weight:600;">{acta}</td>
                </tr>
              </table>

              <!-- Fundamentación del Dictamen -->
              <div style="background-color:#f0fdf4; border-left:4px solid #16a34a; padding:16px; border-radius:0 8px 8px 0; margin-bottom:24px;">
                <h4 style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; color:#166534; font-weight:700; letter-spacing:0.5px;">
                  Fundamentación Técnica y Académica:
                </h4>
                <p style="margin:0; font-size:13px; line-height:1.6; color:#14532d; white-space:pre-line;">
                  {sintesis}
                </p>
              </div>

              <p style="font-size:14px; line-height:1.6; color:#40484f; margin-bottom:24px;">
                A partir de este momento, cuenta con acceso formal a nuestra comunidad académica, publicaciones especializadas, eventos colegiados y a su credencial oficial de Miembro.
              </p>

              <!-- Botón de Ingreso -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px auto;">
                <tr>
                  <td align="center" style="background-color:#0f52ba; border-radius:10px;">
                    <a href="{login_url}" target="_blank" style="display:inline-block; padding:14px 34px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px; letter-spacing:0.3px;">
                      Ingresar a mi Cuenta en ABOCCRIM
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color:#f8f9fa; padding:20px 30px; text-align:center; border-top:1px solid #edf0f2;">
              <p style="margin:0; font-size:11px; color:#71787e; line-height:1.4;">
                Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)<br>
                Comité de Admisiones y Membresías · Santa Cruz de la Sierra, Bolivia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_incorporation_rejected_email_html(application, score, sintesis, acta):
    """Construye un correo institucional formal y explicativo cuando una postulación no califica."""
    nombre_completo = f"{application.nombres} {application.apellidos}".strip()

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resolución de Solicitud de Incorporación — ABOCCRIM</title>
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
              <div style="display:inline-block; background-color:#fee2e2; color:#991b1b; font-size:12px; font-weight:700; padding:6px 14px; border-radius:20px; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:16px;">
                Resolución de Solicitud de Membresía
              </div>

              <h2 style="color:#102a43; font-size:21px; font-weight:700; margin-top:0; margin-bottom:14px;">
                Comunicado Oficial del Comité de Admisiones
              </h2>

              <p style="font-size:15px; line-height:1.6; color:#40484f; margin-bottom:16px;">
                Estimado/a <strong>{nombre_completo}</strong>:
              </p>

              <p style="font-size:14px; line-height:1.6; color:#40484f; margin-bottom:20px;">
                Le agradecemos sinceramente su interés en pertenecer a la <strong>Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)</strong> y el tiempo dedicado a presentar su expediente curricular.
              </p>

              <p style="font-size:14px; line-height:1.6; color:#40484f; margin-bottom:20px;">
                Habiéndose completado el análisis curricular riguroso de acuerdo con los criterios estatutarios y reglamentarios de nuestra institución, le comunicamos que en esta ocasión su postulación ha sido catalogada como <strong>NO ADMITIDA</strong> (Puntaje obtenido: <strong>{score}/100</strong>).
              </p>

              <!-- Motivo detallado del dictamen -->
              <div style="background-color:#fff1f2; border-left:4px solid #e11d48; padding:18px; border-radius:0 8px 8px 0; margin-bottom:24px;">
                <h4 style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; color:#9f1239; font-weight:700; letter-spacing:0.5px;">
                  Fundamentos y Motivos de la Determinación:
                </h4>
                <p style="margin:0; font-size:13px; line-height:1.6; color:#881337; white-space:pre-line;">
                  {sintesis}
                </p>
              </div>

              <!-- Ficha de Referencia -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fa; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:22px;">
                <tr>
                  <td style="padding:4px 8px; font-size:12px; color:#64748b; font-weight:600;">Dictamen de Referencia:</td>
                  <td style="padding:4px 8px; font-size:13px; color:#0f172a; font-weight:600;">{acta}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-size:12px; color:#64748b; font-weight:600;">Fecha de Emisión:</td>
                  <td style="padding:4px 8px; font-size:13px; color:#0f172a;">{timezone.now().strftime('%d/%m/%Y')}</td>
                </tr>
              </table>

              <p style="font-size:13px; line-height:1.6; color:#64748b; margin-bottom:12px;">
                Le recordamos que esta resolución no es definitiva de cara al futuro. Podrá presentar una nueva postulación en convocatorias posteriores acreditando mayor producción académica, experiencia pericial o completando los recaudos señalados precedentemente.
              </p>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color:#f8f9fa; padding:20px 30px; text-align:center; border-top:1px solid #edf0f2;">
              <p style="margin:0; font-size:11px; color:#71787e; line-height:1.4;">
                Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)<br>
                Comité de Admisiones y Membresías · Santa Cruz de la Sierra, Bolivia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def clean_and_parse_json(raw_text):
    """
    Parsea de manera ultra-robusta la respuesta JSON del LLM,
    tolerando saltos de línea literales, bloques markdown y caracteres no escapados.
    """
    clean_text = raw_text.strip()
    clean_text = re.sub(r'^```(?:json)?\s*', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\s*```$', '', clean_text)
    match = re.search(r'\{.*\}', clean_text, re.DOTALL)
    if match:
        clean_text = match.group(0)

    # Intento 1: Parseo estándar con strict=False (permite caracteres de control)
    try:
        return json.loads(clean_text, strict=False)
    except Exception:
        pass

    # Intento 2: Reparar saltos de línea sin escapar dentro de valores de cadenas
    try:
        # Reemplazar saltos de línea crudos dentro de comillas por espacios
        in_string = False
        chars = []
        i = 0
        while i < len(clean_text):
            c = clean_text[i]
            if c == '\\' and i + 1 < len(clean_text):
                chars.append(c)
                chars.append(clean_text[i + 1])
                i += 2
                continue
            if c == '"':
                in_string = not in_string
            if in_string and c in ('\n', '\r'):
                chars.append(' ')
            else:
                chars.append(c)
            i += 1
        sanitized = "".join(chars)
        return json.loads(sanitized, strict=False)
    except Exception:
        pass

    # Intento 3: Extracción resiliente mediante expresiones regulares
    score_m = re.search(r'"score"\s*:\s*(\d+)', raw_text)
    apto_m = re.search(r'"esApto"\s*:\s*(true|false)', raw_text, re.I)
    recom_m = re.search(r'"recomendacion"\s*:\s*"([^"]+)"', raw_text)
    cat_m = re.search(r'"categoriaSugerida"\s*:\s*"([^"]+)"', raw_text)
    cat_id_m = re.search(r'"categoriaId"\s*:\s*(\d+)', raw_text)
    sint_m = re.search(r'"sintesis"\s*:\s*"((?:[^"\\]|\\.)*)"', raw_text, re.DOTALL)
    acta_m = re.search(r'"actaSugerida"\s*:\s*"([^"]+)"', raw_text)

    score = int(score_m.group(1)) if score_m else 70
    es_apto = (apto_m.group(1).lower() == 'true') if apto_m else (score >= 65)

    sintesis_val = ""
    if sint_m:
        sintesis_val = sint_m.group(1).replace('\\"', '"').replace('\\n', '\n')
    else:
        # Extraer texto legible si no hubo match exacto
        sintesis_val = "Evaluación curricular realizada conforme a los estatutos de admisión de ABOCCRIM."

    return {
        'score': score,
        'esApto': es_apto,
        'nivelAfinidad': 'Alta compatibilidad' if es_apto else 'No compatible',
        'recomendacion': recom_m.group(1) if recom_m else ('Aprobación de Incorporación' if es_apto else 'Rechazo de Solicitud'),
        'categoriaSugerida': cat_m.group(1) if cat_m else 'Académico Asociado',
        'categoriaId': int(cat_id_m.group(1)) if cat_id_m else None,
        'sintesis': sintesis_val,
        'actaSugerida': acta_m.group(1) if acta_m else "Resolución Directiva ABOCCRIM-2026-AUT",
        'observacionesSugeridas': "Dictamen de méritos asistido por IA.",
    }


def evaluate_and_decide_application(application_id):
    """
    Ejecuta el análisis curricular completo con IA (Google Gemini) sobre el expediente
    y formaliza la decisión institucional de forma 100% AUTOMÁTICA:
      - Si califica (score >= 65 y esApto=True): APRUEBA la solicitud, crea el miembro activo y envía correo de felicitación.
      - Si no califica (score < 65 o esApto=False): RECHAZA la solicitud e INMEDIATAMENTE envía correo formal con los motivos exactos (síntesis de Gemini).
    """
    application = (
        SolicitudIncorporacion.objects
        .prefetch_related('documentos')
        .filter(pk=application_id)
        .first()
    )

    if not application:
        logger.warning(f"[AUTO-EVAL] Solicitud #{application_id} no encontrada.")
        return None

    # Si ya cuenta con resolución formal, no re-procesar
    if hasattr(application, 'decision_incorporacion') and application.decision_incorporacion:
        logger.info(f"[AUTO-EVAL] Solicitud #{application_id} ya cuenta con decisión. Omitiendo.")
        return application.decision_incorporacion

    if application.estado in ['aprobada', 'rechazada']:
        logger.info(f"[AUTO-EVAL] Solicitud #{application_id} se encuentra en estado '{application.estado}'. Omitiendo.")
        return None

    # Marcar en revisión si estaba recibida
    if application.estado != 'en_revision':
        application.estado = 'en_revision'
        application.save(update_fields=['estado'])

    # 1. Extraer texto del CV y documentos adjuntos mediante PyMuPDF
    extracted_docs_text = []
    for doc in application.documentos.all():
        if storage_service.file_exists(doc.ruta_privada):
            try:
                pdf_bytes = storage_service.get_file_bytes(doc.ruta_privada)
                pages = extract_pages_from_pdf(pdf_bytes)
                if pages:
                    doc_text = "\n".join([f"[Página {p['numero_pagina']}]\n{p['texto']}" for p in pages[:15]])
                    extracted_docs_text.append(f"=== DOCUMENTO: {doc.nombre} ({doc.tipo or 'Adjunto'}) ===\n{doc_text}")
            except Exception as e:
                logger.warning(f"[AUTO-EVAL] No se pudo extraer texto del documento {doc.id} ({doc.nombre}): {e}")

    docs_summary = "\n\n".join(extracted_docs_text) if extracted_docs_text else "No se detectó texto extraíble en los documentos adjuntos."

    # 2. Cargar categorías estatutarias disponibles
    categorias = list(CategoriaMiembro.objects.values('id', 'nombre', 'descripcion'))
    categorias_desc = "\n".join([f"- ID {c['id']}: {c['nombre']} - {c['descripcion'] or 'Categoría estatutaria'}" for c in categorias])

    # 3. Instrucción del Comité para Google Gemini
    system_instruction = (
        "Eres el Comité de Admisiones y Evaluación Curricular de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM).\n"
        "Tu misión es dictaminar con rigor científico, jurídico y estatutario si el postulante reúne los méritos para ser admitido como Miembro de la Academia o si su solicitud debe ser desestimada.\n\n"
        "CRITERIOS DE EVALUACIÓN OBLIGATORIOS:\n"
        "1. Afinidad disciplinar: Título o ejercicio profesional en Derecho Penal, Criminología, Criminalística, Ciencias Forenses, Psicología Jurídica, Sociología del Crimen, Medicina Legal o disciplinas estrechamente afines.\n"
        "2. Trayectoria profesional y académica: Grados de licenciatura, diplomados, maestrías, doctorados, docencia universitaria, peritajes forenses o publicaciones científicas.\n"
        "3. Veracidad e identidad: El contenido del CV debe corresponder claramente al postulante indicado. Si el CV corresponde a otra persona o describe una disciplina completamente inconexa (por ejemplo, ingeniería de software, arquitectura o gastronomía sin vinculación forense), se debe otorgar un puntaje bajo (< 40) y calificar como NO apto.\n"
        "4. Umbral de aprobación: Para ser admitido (esApto: true), el postulante debe obtener al menos 65 puntos.\n\n"
        "DEBES RESPONDER EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO (sin bloques de código markdown, sin texto adicional) con esta estructura exacta:\n"
        "{\n"
        '  "score": (número entero entre 0 y 100 ponderando méritos globales),\n'
        '  "esApto": (true si score >= 65, false si score < 65),\n'
        '  "nivelAfinidad": "(Alta compatibilidad institucional (Nivel I) | Compatibilidad Media (Nivel II) | Compatibilidad Básica (Nivel III) | No compatible)",\n'
        '  "recomendacion": "(Aprobación de Incorporación | Rechazo de Solicitud)",\n'
        '  "categoriaSugerida": "(Nombre exacto de la categoría de las provistas más idónea)",\n'
        '  "categoriaId": (ID numérico de la categoría de las provistas),\n'
        '  "sintesis": "(Explicación rigurosa, clara y respetuosa de 2 o 3 párrafos. Si es aprobado, detalla sus méritos y títulos. Si es rechazado, expone con total claridad, cortesía y fundamento técnico por qué no cumple con los requisitos estatutarios de ABOCCRIM en este momento)",\n'
        '  "actaSugerida": "(ejemplo: Resolución Directiva ABOCCRIM-2026-AUT-XXXX)",\n'
        '  "observacionesSugeridas": "(Fundamentación técnica formal para el dictamen colegiado)"\n'
        "}"
    )

    prompt = f"""EXPEDIENTE DE POSTULACIÓN A EVALUAR:
Código Solicitud: ABO-SOL-{application.id:06d}
Nombre Completo: {application.nombres} {application.apellidos}
Correo Electrónico: {application.email}
Teléfono: {application.telefono or 'No registrado'}
Fecha de Envío: {application.fecha_envio}

ANTECEDENTES DECLARADOS POR EL POSTULANTE:
{application.antecedentes_academicos or 'Sin descripción manual adicional.'}

CONTENIDO EXTRAÍDO DEL CURRÍCULUM VITAE Y DOCUMENTOS ADJUNTOS:
{docs_summary[:12000]}

CATEGORÍAS ESTATUTARIAS DE MIEMBROS EN ABOCCRIM:
{categorias_desc}

Por favor, genera el dictamen técnico en el JSON solicitado:"""

    try:
        ai_response = LLMService.generate_content(prompt=prompt, system_instruction=system_instruction)
        result_data = clean_and_parse_json(ai_response)
    except Exception as e:
        logger.exception(f"[AUTO-EVAL ERROR] Error al invocar o parsear respuesta de Gemini para solicitud #{application.id}: {e}")
        return None

    # Procesar métricas resultantes
    score = int(result_data.get('score', 0))
    es_apto = bool(result_data.get('esApto', False))
    is_approved = (score >= 65 and es_apto)
    resultado = 'aprobada' if is_approved else 'rechazada'

    # Localizar un usuario evaluador institucional válido para registrar la decisión
    admin_user = (
        Usuario.objects.filter(roles__codigo__in=['superadmin', 'admin_academico']).order_by('id').first()
        or Usuario.objects.order_by('id').first()
    )

    acta = result_data.get('actaSugerida') or f"Resolución Directiva ABOCCRIM-AUTO-{application.id:06d}"
    sintesis = result_data.get('sintesis', '')
    observaciones_sug = result_data.get('observacionesSugeridas', '')

    observaciones_final = f"Dictamen de Admisión Automatizado con IA (Google Gemini):\n\n{sintesis}"
    if observaciones_sug and observaciones_sug.strip() != sintesis.strip():
        observaciones_final += f"\n\nObservaciones Técnicas:\n{observaciones_sug.strip()}"

    categoria_nombre_asignada = None

    with transaction.atomic():
        # 1. Crear el registro en decision_incorporacion
        decision = DecisionIncorporacion.objects.create(
            solicitud=application,
            registrada_por=admin_user,
            resultado=resultado,
            referencia_acta=acta,
            observaciones=observaciones_final,
        )

        # 2. Actualizar estado de la solicitud
        application.estado = resultado
        application.save(update_fields=['estado'])

        # 3. Si es aprobada, crear o activar el usuario y su registro de Miembro
        if is_approved:
            user = application.usuario
            if not user:
                user = Usuario.objects.filter(email__iexact=application.email).first()
                if not user:
                    user = Usuario.objects.create(
                        email=application.email.strip().lower(),
                        nombres=application.nombres,
                        apellidos=application.apellidos,
                        activo=True,
                    )
                    user.set_password(getattr(settings, 'DEMO_USER_PASSWORD', 'Aboccrim2025!'))
                    user.save()

                application.usuario = user
                application.save(update_fields=['usuario'])

            rol_miembro = Rol.objects.filter(codigo='miembro').first()
            if rol_miembro:
                UsuarioRol.objects.get_or_create(usuario=user, rol=rol_miembro)

            cat_id = result_data.get('categoriaId')
            categoria = CategoriaMiembro.objects.filter(pk=cat_id).first() if cat_id else None
            if not categoria and result_data.get('categoriaSugerida'):
                categoria = CategoriaMiembro.objects.filter(nombre__icontains=result_data['categoriaSugerida']).first()
            if not categoria:
                categoria = CategoriaMiembro.objects.first()

            if categoria:
                categoria_nombre_asignada = categoria.nombre
                Miembro.objects.update_or_create(
                    usuario=user,
                    defaults={
                        'categoria': categoria,
                        'solicitud_id': application.id,
                        'estado': 'activo',
                        'fecha_incorporacion': timezone.now().date(),
                    }
                )

    # 4. Registrar auditoría
    registrar_auditoria(
        usuario=admin_user,
        accion=f'AUTO_EVALUACION_IA_{resultado.upper()}',
        entidad='SolicitudIncorporacion',
        registro_afectado_id=str(application.id),
        detalle=(
            f"Auto-evaluación IA completada para solicitud #{application.id} ({application.nombres} {application.apellidos}). "
            f"Resultado: {resultado.upper()} (Score: {score}/100, Afinidad: {result_data.get('nivelAfinidad')})."
        ),
    )

    # 5. Notificación Push (si aplica)
    try:
        target_user = application.usuario or Usuario.objects.filter(email__iexact=application.email).first()
        if target_user:
            if is_approved:
                push_title = '🏛️ ¡Felicidades! Membresía ABOCCRIM Aprobada'
                push_body = f'Tu solicitud de incorporación ha sido APROBADA como {categoria_nombre_asignada or "Miembro"}.'
            else:
                push_title = '🏛️ Resolución de Solicitud ABOCCRIM'
                push_body = f'Tu solicitud fue evaluada y desestimada. Revisa los fundamentos en tu correo electrónico.'

            enviar_notificacion_push(
                usuario_id=target_user.id,
                titulo=push_title,
                cuerpo=push_body,
                datos={'tipo': 'incorporacion', 'solicitud_id': str(application.id), 'estado': resultado}
            )
    except Exception as push_err:
        logger.warning(f"[AUTO-EVAL PUSH] Error enviando push: {push_err}")

    # 6. Envío INMEDIATO del Correo Institucional al Postulante
    try:
        if is_approved:
            subject = "🏛️ ¡Felicidades! Tu membresía en ABOCCRIM ha sido APROBADA"
            html_body = build_incorporation_approved_email_html(
                application=application,
                score=score,
                categoria_nombre=categoria_nombre_asignada,
                sintesis=sintesis,
                acta=acta,
            )
        else:
            subject = "Resolución sobre tu Solicitud de Incorporación — ABOCCRIM"
            html_body = build_incorporation_rejected_email_html(
                application=application,
                score=score,
                sintesis=sintesis,
                acta=acta,
            )

        text_body = strip_tags(html_body)
        email_sent = send_institutional_email(
            to_email=application.email,
            subject=subject,
            message_text=text_body,
            message_html=html_body,
        )
        logger.info(f"[AUTO-EVAL EMAIL] Correo de resolución ({resultado}) enviado a {application.email}: {email_sent}")
    except Exception as email_err:
        logger.exception(f"[AUTO-EVAL EMAIL ERROR] No se pudo enviar correo a {application.email}: {email_err}")

    return decision


def trigger_async_auto_evaluation(application_id):
    """
    Despacha la evaluación y resolución automática con IA en un hilo en segundo plano (background thread),
    garantizando que la conexión a base de datos se maneje limpiamente.
    """
    def _worker():
        connection.close()
        try:
            logger.info(f"[ASYNC AUTO-EVAL] Iniciando evaluación automática en segundo plano para solicitud #{application_id}...")
            evaluate_and_decide_application(application_id)
        except Exception as exc:
            logger.exception(f"[ASYNC AUTO-EVAL ERROR] Error en auto-evaluación de solicitud #{application_id}: {exc}")
        finally:
            connection.close()

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    return thread
