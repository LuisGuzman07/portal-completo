import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { incorporationService } from '../../services/api';

function stateStyle(state) {
  if (state === 'aprobada') return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
  if (state === 'rechazada') return 'bg-rose-100 text-rose-900 border border-rose-300';
  if (state === 'lista_decision') return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  if (state === 'observada') return 'bg-amber-50 text-amber-800 border border-amber-300';
  if (state === 'en_revision') return 'bg-sky-50 text-sky-800 border border-sky-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

function stateLabel(state) {
  const map = {
    recibida: 'Recibida',
    pendiente: 'Pendiente',
    en_revision: 'En revisión colegiada',
    observada: 'Documentación requerida (Observada)',
    lista_decision: 'Lista para resolución formal',
    aprobada: 'Aprobada e Incorporada',
    rechazada: 'Solicitud no admitida',
  };
  return map[state] || state;
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

const inputClass = 'w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';

export default function MiSolicitudMembresiaPage() {
  const { user } = useAuth();
  const isAlreadyMember = user?.roles_codigos?.includes('miembro');

  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState(null);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Formulario de nueva solicitud
  const [formData, setFormData] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    telefono: '',
    antecedentes_academicos: '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Formulario de documentación complementaria (si está observada)
  const [complementaryFiles, setComplementaryFiles] = useState([]);
  const [submittingComplementary, setSubmittingComplementary] = useState(false);
  const [complementaryError, setComplementaryError] = useState('');

  const loadMyApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await incorporationService.getMyApplication();
      if (res?.tiene_solicitud && res.solicitud) {
        setApplicationData(res.solicitud);
      } else {
        setApplicationData(null);
      }
    } catch (err) {
      console.error('Error al cargar solicitud:', err);
      setError(err.data?.detail || err.message || 'No se pudo consultar el estado de la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyApplication();
    // Limpiar cualquier token viejo huérfano de localStorage para evitar interferencias
    localStorage.removeItem('aboccrim_solicitud_token');
  }, []);

  // Enviar nueva postulación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!cvFile) {
      setError('Debes adjuntar obligatoriamente tu Currículum Vitae en formato PDF.');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('nombres', formData.nombres.trim());
      body.append('apellidos', formData.apellidos.trim());
      body.append('email', user.email.trim());
      body.append('telefono', formData.telefono.trim());
      body.append('antecedentes_academicos', formData.antecedentes_academicos.trim());
      body.append('archivo_cv', cvFile);

      for (let i = 0; i < supportingFiles.length; i++) {
        body.append('respaldos', supportingFiles[i]);
      }

      const res = await incorporationService.submitMyApplication(body);
      setSuccessNotice(res.mensaje || '¡Solicitud de membresía enviada exitosamente!');
      if (res.solicitud) {
        setApplicationData(res.solicitud);
      } else {
        await loadMyApplication();
      }
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      const data = err.data;
      let msg = 'No fue posible registrar la solicitud.';
      if (data?.detail) msg = data.detail;
      else if (data && typeof data === 'object') {
        const formatErrors = (val) => {
          if (Array.isArray(val)) return val.map(formatErrors).join(', ');
          if (val && typeof val === 'object') return Object.values(val).map(formatErrors).join(', ');
          return String(val);
        };
        msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${formatErrors(v)}`)
          .join(' | ');
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar documentación complementaria para solicitudes observadas
  const handleComplementarySubmit = async (e) => {
    e.preventDefault();
    setComplementaryError('');
    if (complementaryFiles.length === 0) {
      setComplementaryError('Debes seleccionar al menos un archivo PDF complementario.');
      return;
    }

    setSubmittingComplementary(true);
    try {
      const body = new FormData();
      for (let i = 0; i < complementaryFiles.length; i++) {
        body.append('archivos', complementaryFiles[i]);
      }

      const res = await incorporationService.submitMySupportingDocuments(body);
      setSuccessNotice(res.mensaje || 'Documentación recibida. Tu solicitud volvió a revisión.');
      setComplementaryFiles([]);
      if (res.solicitud) {
        setApplicationData(res.solicitud);
      } else {
        await loadMyApplication();
      }
    } catch (err) {
      console.error('Error al subir subsanación:', err);
      setComplementaryError(err.data?.detail || err.message || 'Error al subir documentación.');
    } finally {
      setSubmittingComplementary(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await incorporationService.downloadMyDocument(doc.id, `${doc.nombre}.pdf`);
    } catch (err) {
      alert(err.message || 'No se pudo descargar el archivo.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        <p className="text-xs text-on-surface-variant">Consultando estado institucional de membresía…</p>
      </div>
    );
  }

  // CASO 1: EL USUARIO YA ES MIEMBRO OFICIAL
  if (isAlreadyMember || applicationData?.estado === 'aprobada') {
    return (
      <section className="space-y-6 max-w-4xl mx-auto">
        <header>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">Acreditación Académica</span>
          <h1 className="text-2xl font-bold text-primary mt-1">Membresía Institucional ABOCCRIM</h1>
        </header>

        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-surface-container-lowest via-primary/5 to-surface-container-low p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Miembro Oficial Acreditado
              </span>
              <h2 className="text-2xl font-bold text-primary">
                {user?.nombres} {user?.apellidos}
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">
                Formas parte activa de la Academia Boliviana de Ciencias Criminológicas. Tu categoría académica te faculta para participar de los comités consultivos, publicar investigaciones y representar a la institución.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-outline-variant/20 text-xs">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
              <span className="text-outline uppercase font-semibold block text-[10px]">Categoría Estatutaria</span>
              <span className="font-bold text-primary text-sm mt-1 block">
                {applicationData?.categoria_miembro || 'Miembro Titular de la Academia'}
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
              <span className="text-outline uppercase font-semibold block text-[10px]">Expediente de Admisión</span>
              <span className="font-mono font-bold text-on-surface text-sm mt-1 block">
                {applicationData?.codigo || 'ABO-MEM-REGISTRADO'}
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
              <span className="text-outline uppercase font-semibold block text-[10px]">Fecha de Incorporación</span>
              <span className="font-medium text-on-surface text-sm mt-1 block">
                {dateTime(applicationData?.decision?.fecha_decision || applicationData?.fecha_envio || user?.fecha_registro)}
              </span>
            </div>
          </div>

          {applicationData?.decision?.referencia_acta && (
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs space-y-1">
              <span className="text-outline uppercase font-semibold block text-[10px]">Acta / Resolución de Incorporación:</span>
              <p className="font-mono font-bold text-primary">{applicationData.decision.referencia_acta}</p>
              {applicationData.decision.observaciones && (
                <p className="text-on-surface-variant text-xs mt-1 pt-1 border-t border-outline-variant/20">
                  {applicationData.decision.observaciones}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/dashboard/perfil-academico"
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">school</span>
              <span>Actualizar Mi Perfil Académico</span>
            </Link>

            <Link
              to="/dashboard/publicaciones"
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-primary font-bold text-xs hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>Gestionar Publicaciones</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // CASO 2: EL USUARIO YA TIENE UNA SOLICITUD EN PROCESO
  if (applicationData) {
    const estado = applicationData.estado;
    const isObservada = estado === 'observada';

    // Cálculo del avance del stepper
    const steps = [
      { id: 'envio', label: '1. Solicitud enviada', complete: true },
      { id: 'revision', label: '2. En evaluación colegiada', complete: ['en_revision', 'observada', 'lista_decision', 'aprobada', 'rechazada'].includes(estado) },
      { id: 'decision', label: '3. Resolución institucional', complete: ['lista_decision', 'aprobada', 'rechazada'].includes(estado) },
      { id: 'incorporacion', label: '4. Membresía activa', complete: estado === 'aprobada' },
    ];

    return (
      <section className="space-y-6 max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Trámite Institucional</span>
            <h1 className="text-2xl font-bold text-primary mt-1">Mi Solicitud de Membresía</h1>
          </div>
          <span className={`w-fit px-3 py-1.5 rounded-full text-xs font-bold ${stateStyle(estado)}`}>
            {stateLabel(estado)}
          </span>
        </header>

        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
            <span>{successNotice}</span>
          </div>
        )}

        {/* STEPPER DE PROGRESO */}
        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-xs space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-outline block">
            Línea de tiempo del trámite
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                  step.complete
                    ? 'border-primary/40 bg-primary/5 text-primary'
                    : 'border-outline-variant/30 bg-surface-container-low text-outline'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold">FASE 0{idx + 1}</span>
                  <span className="material-symbols-outlined text-base">
                    {step.complete ? 'check_circle' : 'hourglass_empty'}
                  </span>
                </div>
                <span className="font-semibold text-xs mt-1">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTA DE OBSERVACIÓN Y SUBSANACIÓN (SI APLICA) */}
        {isObservada && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-950">
                  Requerimiento del Comité Académico
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  El Comité Académico ha revisado tu expediente y solicita que adjuntes la siguiente documentación para continuar con la evaluación:
                </p>
                {applicationData.requerimiento && (
                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200 mt-2 text-xs font-medium text-amber-950 whitespace-pre-line">
                    {applicationData.requerimiento}
                  </div>
                )}
              </div>
            </div>

            {complementaryError && (
              <div className="p-3 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs">
                {complementaryError}
              </div>
            )}

            <form onSubmit={handleComplementarySubmit} className="space-y-3 pt-2 border-t border-amber-200">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wide">
                Adjuntar archivos complementarios requeridos (PDF, máx. 25 MB total):
              </label>
              <input
                type="file"
                multiple
                accept="application/pdf"
                className="w-full text-xs text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                onChange={(e) => setComplementaryFiles(Array.from(e.target.files || []))}
              />

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submittingComplementary || complementaryFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>{submittingComplementary ? 'Enviando documentos…' : 'Enviar documentación complementaria'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETALLE DEL EXPEDIENTE */}
        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">Código Correlativo</span>
              <span className="text-base font-bold font-mono text-primary">{applicationData.codigo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">Fecha de Envío</span>
              <span className="text-xs text-on-surface">{dateTime(applicationData.fecha_envio)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-outline uppercase font-semibold block text-[10px]">Postulante</span>
              <span className="font-bold text-on-surface text-sm mt-0.5 block">
                {applicationData.nombres} {applicationData.apellidos}
              </span>
              <span className="text-on-surface-variant font-mono text-xs">{applicationData.email}</span>
            </div>

            <div>
              <span className="text-outline uppercase font-semibold block text-[10px]">Teléfono de Contacto</span>
              <span className="text-on-surface text-sm mt-0.5 block">
                {applicationData.telefono || 'No registrado'}
              </span>
            </div>
          </div>

          {applicationData.antecedentes_academicos && (
            <div className="pt-2 border-t border-outline-variant/20 text-xs">
              <span className="text-outline uppercase font-semibold block text-[10px]">Antecedentes Académicos Declarados:</span>
              <p className="mt-1 text-on-surface-variant leading-relaxed whitespace-pre-line bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                {applicationData.antecedentes_academicos}
              </p>
            </div>
          )}

          {/* DOCUMENTACIÓN ADJUNTA */}
          <div className="pt-2 border-t border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-wide text-primary block mb-2">
              Documentos entregados en el expediente ({applicationData.documentos?.length || 0}):
            </span>
            <ul className="divide-y divide-outline-variant/20 text-xs">
              {applicationData.documentos?.map((doc) => (
                <li key={doc.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-base text-secondary shrink-0">
                      {doc.tipo === 'cv' ? 'badge' : 'description'}
                    </span>
                    <span className="truncate font-medium text-on-surface">{doc.nombre}</span>
                    <span className="text-[10px] text-outline uppercase font-mono shrink-0">
                      ({doc.tipo === 'cv' ? 'CV' : 'Respaldo'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Descargar</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  // CASO 3: EL USUARIO AÚN NO HA POSTULADO (FORMULARIO OFICIAL DE POSTULACIÓN)
  return (
    <section className="space-y-6 max-w-4xl mx-auto">
      <header>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">Convocatoria Institucional</span>
        <h1 className="text-2xl font-bold text-primary mt-1">Postular a Membresía ABOCCRIM</h1>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
          Como usuario registrado o investigador de la plataforma, puedes solicitar tu incorporación oficial como Miembro de la Academia Boliviana de Ciencias Criminológicas. Tu expediente será evaluado por el Comité Académico.
        </p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
          <span>{successNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-xl">person_pin</span>
          <h2 className="text-base font-bold text-primary">Datos del Postulante</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Nombres *</label>
            <input
              type="text"
              required
              className={inputClass}
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Apellidos *</label>
            <input
              type="text"
              required
              className={inputClass}
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Correo Electrónico (Cuenta Activa)</label>
            <input
              type="email"
              disabled
              className={`${inputClass} opacity-75 cursor-not-allowed font-mono`}
              value={user.email}
            />
            <span className="text-[11px] text-outline mt-1 block">Tu expediente quedará vinculado a tu cuenta verificada.</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Teléfono / WhatsApp *</label>
            <input
              type="tel"
              required
              placeholder="Ej. +591 71234567"
              className={inputClass}
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">
            Antecedentes Académicos y Trayectoria Criminológica *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe tus títulos de grado y posgrado, universidad de egreso, áreas de especialidad, docencia e investigaciones publicadas."
            className={`${inputClass} resize-y`}
            value={formData.antecedentes_academicos}
            onChange={(e) => setFormData({ ...formData, antecedentes_academicos: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
          <h2 className="text-base font-bold text-primary">Documentación de Respaldo</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
              Currículum Vitae (Obligatorio - PDF, máx. 10 MB) *
            </label>
            <input
              type="file"
              required
              accept="application/pdf"
              className="w-full text-xs text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            />
            <span className="text-[11px] text-outline block">
              Debe incluir tu historial académico, publicaciones y experiencia profesional documentada.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
              Respaldos Académicos Adicionales (Opcional - hasta 8 archivos PDF, máx. 25 MB total)
            </label>
            <input
              type="file"
              multiple
              accept="application/pdf"
              className="w-full text-xs text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-surface-container-high file:text-primary hover:file:bg-surface-container-highest cursor-pointer"
              onChange={(e) => setSupportingFiles(Array.from(e.target.files || []))}
            />
            <span className="text-[11px] text-outline block">
              Diplomas de grado/posgrado, certificaciones de docencia o constancias de artículos científicos.
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            <span>{submitting ? 'Enviando postulación…' : 'Enviar Solicitud de Membresía'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
