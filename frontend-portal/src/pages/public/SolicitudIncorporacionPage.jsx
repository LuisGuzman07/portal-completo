import React, { useEffect, useState } from 'react';
import { incorporationService } from '../../services/api';

const EMPTY_FORM = { nombres: '', apellidos: '', email: '', telefono: '', antecedentes_academicos: '' };
const TRACKING_STORAGE_KEY = 'aboccrim_incorporation_tracking_token';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 8;
const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

function errorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

function validPdf(file) {
  return file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

const STATUS_LABELS = {
  recibida: 'Recibida',
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  observada: 'Requiere documentación',
  lista_decision: 'Lista para decisión',
  aprobada: 'Aprobada',
  rechazada: 'No aprobada',
  no_aprobada: 'No aprobada',
  cancelada: 'Cancelada',
};

function statusStyle(state) {
  if (state === 'observada') return 'bg-amber-50 text-amber-800';
  if (state === 'aprobada') return 'bg-emerald-50 text-emerald-800';
  if (['rechazada', 'no_aprobada', 'cancelada'].includes(state)) return 'bg-rose-50 text-rose-800';
  return 'bg-sky-50 text-sky-800';
}

export default function SolicitudIncorporacionPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [cv, setCv] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [trackingToken, setTrackingToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tracking, setTracking] = useState(null);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [followupFiles, setFollowupFiles] = useState([]);
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [followupNotice, setFollowupNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const loadTracking = async (token) => {
    const cleanToken = token.trim();
    if (!cleanToken) return;
    setTrackingBusy(true);
    setTrackingError('');
    setFollowupNotice('');
    try {
      const result = await incorporationService.tracking(cleanToken);
      localStorage.setItem(TRACKING_STORAGE_KEY, cleanToken);
      setTrackingToken(cleanToken);
      setTokenInput(cleanToken);
      setTracking(result);
    } catch (loadError) {
      setTracking(null);
      setTrackingError(errorMessage(loadError));
    } finally {
      setTrackingBusy(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (savedToken) {
      setTokenInput(savedToken);
      loadTracking(savedToken);
    }
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!cv || !validPdf(cv)) { setError('Adjunta tu currículum vitae en formato PDF.'); return; }
    if (!supportingFiles.length) { setError('Adjunta al menos un respaldo académico en PDF.'); return; }
    const files = [cv, ...supportingFiles];
    if (files.some((file) => !validPdf(file))) { setError('Todos los documentos deben estar en formato PDF.'); return; }
    if (files.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) { setError('Cada archivo debe tener contenido y pesar como máximo 10 MB.'); return; }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE) { setError('El tamaño total de los documentos no puede superar 25 MB.'); return; }
    if (supportingFiles.length > MAX_SUPPORTING_FILES) { setError('Puedes adjuntar hasta 8 respaldos académicos.'); return; }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value.trim()));
    data.append('archivo_cv', cv);
    supportingFiles.forEach((file) => data.append('respaldos', file));

    setSubmitting(true);
    try {
      const result = await incorporationService.submit(data);
      setConfirmation(result);
      localStorage.setItem(TRACKING_STORAGE_KEY, result.token_seguimiento);
      setTrackingToken(result.token_seguimiento);
      setTokenInput(result.token_seguimiento);
      setForm(EMPTY_FORM);
      setCv(null);
      setSupportingFiles([]);
      await loadTracking(result.token_seguimiento);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const submitFollowup = async (event) => {
    event.preventDefault();
    setTrackingError('');
    setFollowupNotice('');
    if (!followupFiles.length) { setTrackingError('Selecciona al menos un documento PDF solicitado.'); return; }
    if (followupFiles.length > MAX_SUPPORTING_FILES) { setTrackingError('Puedes adjuntar hasta 8 documentos por envío.'); return; }
    if (followupFiles.some((file) => !validPdf(file))) { setTrackingError('Todos los documentos deben estar en formato PDF.'); return; }
    if (followupFiles.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) { setTrackingError('Cada archivo debe tener contenido y pesar como máximo 10 MB.'); return; }
    if (followupFiles.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE) { setTrackingError('El tamaño total de los documentos no puede superar 25 MB.'); return; }

    const data = new FormData();
    data.append('token', trackingToken);
    followupFiles.forEach((file) => data.append('archivos', file));
    setSendingFollowup(true);
    try {
      const result = await incorporationService.submitSupportingDocuments(data);
      setTracking(result);
      setFollowupFiles([]);
      setFollowupNotice(result.mensaje);
    } catch (submitError) {
      setTrackingError(errorMessage(submitError));
    } finally {
      setSendingFollowup(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(trackingToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setTrackingError('No se pudo copiar automáticamente. Selecciona y copia la credencial.');
    }
  };

  const forgetTracking = () => {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
    setTrackingToken('');
    setTokenInput('');
    setTracking(null);
    setConfirmation(null);
    setTrackingError('');
    setFollowupNotice('');
  };

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Incorporación institucional</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">Solicitud de incorporación</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">Envía tus antecedentes y documentos. Podrás consultar el avance y responder a requerimientos del Comité Académico desde esta misma página.</p>
        </header>

        {confirmation && (
          <div role="status" className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <h2 className="font-bold">Solicitud recibida</h2>
            <p>{confirmation.mensaje} Código de constancia: <strong>{confirmation.codigo}</strong>.</p>
            <p>Guarda la credencial de seguimiento; funciona como llave privada para consultar tu expediente. No la compartas.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input aria-label="Credencial privada de seguimiento" readOnly value={trackingToken} className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-800" />
              <button type="button" onClick={copyToken} className="rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white">{copied ? 'Copiada' : 'Copiar credencial'}</button>
            </div>
          </div>
        )}

        <section aria-labelledby="tracking-title" className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">Seguimiento seguro</p>
            <h2 id="tracking-title" className="mt-1 text-xl font-bold text-primary">Consulta tu solicitud</h2>
            <p className="mt-1 text-sm text-on-surface-variant">En este navegador se recuerda la credencial privada. También puedes pegarla si estás usando otro dispositivo.</p>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); loadTracking(tokenInput); }} className="flex flex-col gap-2 sm:flex-row">
            <input className={`${inputClass} min-w-0 flex-1 font-mono text-xs`} aria-label="Credencial de seguimiento" placeholder="Pega aquí tu credencial privada" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} required />
            <button type="submit" disabled={trackingBusy} className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60">{trackingBusy ? 'Consultando…' : 'Consultar'}</button>
          </form>
          {trackingError && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{trackingError}</div>}
          {followupNotice && <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{followupNotice}</div>}

          {trackingBusy && <p className="text-sm text-on-surface-variant">Cargando estado…</p>}
          {!trackingBusy && tracking && (
            <article className="space-y-4 rounded-xl bg-surface-container-low p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><p className="text-xs font-bold uppercase tracking-wide text-outline">{tracking.codigo}</p><h3 className="mt-1 text-lg font-bold text-primary">{tracking.nombres} {tracking.apellidos}</h3><p className="text-xs text-on-surface-variant">Enviada {formatDate(tracking.fecha_envio)}</p></div>
                <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusStyle(tracking.estado)}`}>{STATUS_LABELS[tracking.estado] || tracking.estado}</span>
              </div>

              {tracking.estado === 'observada' && (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <div><h4 className="font-bold">El Comité solicita información adicional</h4><p className="mt-1 whitespace-pre-line leading-6">{tracking.requerimiento || 'Consulta las observaciones de tu expediente y adjunta la documentación solicitada.'}</p></div>
                  <form onSubmit={submitFollowup} className="space-y-3 border-t border-amber-200 pt-3">
                    <label className="block space-y-1.5 font-semibold">Documentos complementarios (PDF)<input className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary`} type="file" accept="application/pdf,.pdf" multiple required onChange={(event) => setFollowupFiles(Array.from(event.target.files || []))} /><span className="block text-xs font-normal">Hasta 8 PDFs por envío, 10 MB cada uno y 25 MB en total.</span></label>
                    {followupFiles.length > 0 && <ul className="space-y-1 text-xs">{followupFiles.map((file, index) => <li key={`${file.name}-${index}`} className="break-all">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</li>)}</ul>}
                    <button type="submit" disabled={sendingFollowup} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60">{sendingFollowup ? 'Enviando…' : 'Enviar documentos al comité'}</button>
                  </form>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-primary">Documentos en el expediente ({tracking.documentos.length})</h4>
                {tracking.documentos.length ? <ul className="mt-2 divide-y divide-outline-variant/30">{tracking.documentos.map((document) => <li key={document.id} className="flex flex-wrap justify-between gap-2 py-2 text-xs"><span className="break-all font-medium text-on-surface">{document.nombre}</span><span className="text-on-surface-variant">{document.tipo === 'cv' ? 'Currículum vitae' : document.tipo === 'documentacion_complementaria' ? 'Complementario' : 'Respaldo'} · {formatDate(document.fecha_carga)}</span></li>)}</ul> : <p className="mt-2 text-sm text-on-surface-variant">Aún no hay documentos registrados.</p>}
              </div>
              <button type="button" onClick={forgetTracking} className="text-xs font-semibold text-secondary underline underline-offset-2">Quitar credencial guardada de este navegador</button>
            </article>
          )}
        </section>

        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900"><strong>Requisitos iniciales:</strong> CV en PDF y al menos un respaldo académico en PDF. Se admiten hasta 8 respaldos, máximo 10 MB por archivo y 25 MB en total.</div>
        {error && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}

        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:p-8">
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-primary">Datos personales y académicos</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-semibold text-on-surface">Nombres <span className="text-error">*</span><input className={inputClass} maxLength={120} required autoComplete="given-name" value={form.nombres} onChange={(event) => setForm({ ...form, nombres: event.target.value })} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-on-surface">Apellidos <span className="text-error">*</span><input className={inputClass} maxLength={120} required autoComplete="family-name" value={form.apellidos} onChange={(event) => setForm({ ...form, apellidos: event.target.value })} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-on-surface">Correo electrónico <span className="text-error">*</span><input className={inputClass} type="email" maxLength={254} required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-on-surface">Teléfono<input className={inputClass} type="tel" maxLength={50} autoComplete="tel" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Antecedentes académicos <span className="text-error">*</span><textarea className={`${inputClass} min-h-32 resize-y`} required value={form.antecedentes_academicos} onChange={(event) => setForm({ ...form, antecedentes_academicos: event.target.value })} placeholder="Formación, institución, títulos obtenidos y experiencia relacionada." /></label>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-outline-variant/25 pt-5">
            <legend className="text-lg font-bold text-primary">Documentos requeridos</legend>
            <label className="block space-y-1.5 text-sm font-semibold text-on-surface">Currículum vitae (PDF) <span className="text-error">*</span><input className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary`} type="file" accept="application/pdf,.pdf" required onChange={(event) => setCv(event.target.files?.[0] || null)} /><span className="block text-xs font-normal text-on-surface-variant">{cv ? `${cv.name} · ${(cv.size / 1024 / 1024).toFixed(2)} MB` : 'Adjunta tu CV actualizado.'}</span></label>
            <label className="block space-y-1.5 text-sm font-semibold text-on-surface">Respaldos académicos (PDF) <span className="text-error">*</span><input className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary`} type="file" accept="application/pdf,.pdf" multiple required onChange={(event) => setSupportingFiles(Array.from(event.target.files || []))} /><span className="block text-xs font-normal text-on-surface-variant">Adjunta títulos, certificados u otros respaldos solicitados.</span>{supportingFiles.length > 0 && <ul className="space-y-1 text-xs font-normal text-on-surface-variant">{supportingFiles.map((file, index) => <li key={`${file.name}-${index}`} className="break-all">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</li>)}</ul>}</label>
          </fieldset>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-outline-variant/25 pt-5 sm:flex-row sm:items-center"><p className="max-w-xl text-xs leading-5 text-on-surface-variant">Una solicitud en curso con el mismo correo no puede duplicarse. Tras enviarla, usa la credencial para consultar el expediente y responder observaciones.</p><button type="submit" disabled={submitting} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"><span className="material-symbols-outlined">send</span>{submitting ? 'Enviando…' : 'Enviar solicitud'}</button></div>
        </form>
      </div>
    </section>
  );
}
