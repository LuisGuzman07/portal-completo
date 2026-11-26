import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { incorporationService, memberService } from '../../services/api';

const STATES = [
  ['', 'Todas las solicitudes abiertas'],
  ['recibida', 'Recibida'],
  ['en_revision', 'En revisión'],
  ['observada', 'Observada'],
  ['lista_decision', 'Lista para decisión'],
  ['aprobada', 'Aprobada'],
  ['rechazada', 'Rechazada'],
  ['todas', 'Todas (incluidas resueltas)'],
];

const RESULTS = [
  ['favorable', 'Recomendación favorable'],
  ['desfavorable', 'Recomendación desfavorable'],
  ['requiere_documentacion', 'Solicitar documentación adicional'],
  ['continuar_revision', 'Continuar revisión'],
];

const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const stateLabels = Object.fromEntries(STATES.filter(([value]) => value).map(([value, label]) => [value, label]));
const resultLabels = Object.fromEntries(RESULTS);

function errorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

function stateStyle(state) {
  if (state === 'aprobada') return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
  if (state === 'rechazada') return 'bg-rose-100 text-rose-900 border border-rose-300';
  if (state === 'lista_decision') return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  if (state === 'observada') return 'bg-amber-50 text-amber-800 border border-amber-200';
  if (state === 'en_revision') return 'bg-sky-50 text-sky-800 border border-sky-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

export default function EvaluarSolicitudesPage() {
  const { user, isSuperAdmin } = useAuth();
  const authorized = isSuperAdmin || user?.roles_codigos?.includes('comite_academico');

  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [categories, setCategories] = useState([]);

  // Formulario de evaluación preliminar (Comité Académico)
  const [form, setForm] = useState({ resultado_propuesto: 'favorable', observaciones: '' });
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Formulario de decisión institucional formal
  const [decisionForm, setDecisionForm] = useState({
    resultado: 'aprobada',
    referencia_acta: '',
    observaciones: '',
    categoria_id: '',
  });
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  // Evaluación curricular con IA (Google Gemini)
  const [aiRunning, setAiRunning] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiResult, setAiResult] = useState(null);

  // Cargar categorías de miembros estatutarias
  useEffect(() => {
    memberService.listCategories()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        setCategories(list);
        if (list.length > 0) {
          setDecisionForm((prev) => ({ ...prev, categoria_id: prev.categoria_id || list[0].id }));
        }
      })
      .catch((err) => console.warn('No se pudieron cargar las categorías de miembros:', err));
  }, []);

  const loadList = async () => {
    if (!authorized) return;
    setLoadingList(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      const result = await incorporationService.reviewList(params);
      const list = Array.isArray(result) ? result : result.results || [];
      setApplications(list);
      if (selectedId && !list.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadList, 200);
    return () => clearTimeout(timer);
  }, [authorized, search, stateFilter]);

  const selectApplication = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setLoadingDetail(true);
    setError('');
    setNotice('');
    setDecisionError('');
    setAiResult(null);
    setAiRunning(false);

    try {
      const result = await incorporationService.reviewDetail(id);
      setDetail(result);
      setForm({ resultado_propuesto: 'favorable', observaciones: '' });
      setDecisionForm({
        resultado: 'aprobada',
        referencia_acta: '',
        observaciones: '',
        categoria_id: categories.length > 0 ? categories[0].id : '',
      });
      window.setTimeout(() => {
        document.getElementById('application-review-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Guardar evaluación colegiada
  const evaluate = async (event) => {
    event.preventDefault();
    if (!detail) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await incorporationService.evaluate(detail.id, {
        resultado_propuesto: form.resultado_propuesto,
        observaciones: form.observaciones.trim(),
      });
      setDetail(result.solicitud);
      setNotice(result.mensaje);
      setForm({ resultado_propuesto: form.resultado_propuesto, observaciones: '' });
      await loadList();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  // Guardar decisión institucional
  const handleRegisterDecision = async (event) => {
    if (event) event.preventDefault();
    if (!detail) return;
    setSavingDecision(true);
    setDecisionError('');
    setError('');
    setNotice('');

    try {
      const payload = {
        resultado: decisionForm.resultado,
        referencia_acta: decisionForm.referencia_acta.trim(),
        observaciones: decisionForm.observaciones.trim(),
        categoria_id: decisionForm.resultado === 'aprobada' ? decisionForm.categoria_id : null,
      };
      const result = await incorporationService.registerDecision(detail.id, payload);
      setDetail(result.solicitud);
      setNotice(result.mensaje || 'Decisión institucional registrada exitosamente.');
      await loadList();
    } catch (err) {
      setDecisionError(errorMessage(err));
    } finally {
      setSavingDecision(false);
    }
  };

  // Evaluación Curricular Asistida con IA (Google Gemini)
  const handleStartAiAnalysis = async () => {
    if (!detail || aiRunning) return;
    setAiRunning(true);
    setAiStep(1);
    setAiResult(null);
    setDecisionError('');

    // Animación de etapas mientras Gemini procesa los documentos y antecedentes
    const t1 = setTimeout(() => setAiStep(2), 1200);
    const t2 = setTimeout(() => setAiStep(3), 2600);

    try {
      const generatedResult = await incorporationService.analyzeApplicationWithAi(detail.id);
      setAiStep(4);
      setAiResult(generatedResult);

      const esAprobada = (generatedResult.score >= 60) && (generatedResult.esApto !== false);
      const categoriaId = generatedResult.categoriaId || categories[0]?.id || '';

      // Precargar los datos reales analizados por la IA en el formulario de decisión formal
      setDecisionForm({
        resultado: esAprobada ? 'aprobada' : 'rechazada',
        referencia_acta: generatedResult.actaSugerida || `Resolución Directiva ABOCCRIM-${new Date().getFullYear()}-${String(detail.id).padStart(4, '0')}`,
        observaciones: generatedResult.observacionesSugeridas || generatedResult.sintesis || '',
        categoria_id: categoriaId,
      });
    } catch (err) {
      console.error('Error al realizar análisis curricular con IA:', err);
      setDecisionError(errorMessage(err));
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setAiRunning(false);
    }
  };

  // Resolución y Dictamen 100% Automático con IA
  const handleAutoEvaluateWithAi = async () => {
    if (!detail || aiRunning) return;
    setAiRunning(true);
    setDecisionError('');
    setNotice('');
    try {
      const res = await incorporationService.autoEvaluateApplication(detail.id);
      setNotice(res.mensaje || 'Solicitud resuelta y notificada automáticamente con IA.');
      await selectApplication(detail.id);
      await loadList();
    } catch (err) {
      console.error('Error al auto-evaluar con IA:', err);
      setDecisionError(errorMessage(err));
    } finally {
      setAiRunning(false);
    }
  };

  const download = async (documentItem) => {
    setError('');
    try {
      await incorporationService.downloadSupportingDocument(detail.id, documentItem.id, `${documentItem.nombre}.pdf`);
    } catch (downloadError) {
      setError(errorMessage(downloadError));
    }
  };

  if (!authorized) {
    return (
      <section className="rounded-xl border border-error/20 bg-surface-container-lowest p-6">
        <h1 className="text-xl font-bold text-primary">Acceso reservado</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Esta sección requiere el rol de Comité Académico autorizado.</p>
      </section>
    );
  }

  const observationsRequired = form.resultado_propuesto !== 'favorable';
  const hasDecision = Boolean(detail?.decision || detail?.estado === 'aprobada' || detail?.estado === 'rechazada');

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Comité Académico · Incorporaciones</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Evaluar y resolver solicitudes</h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Revisa los expedientes, realiza la evaluación curricular colegiada y formaliza la decisión institucional de incorporación.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-low px-3 py-2 text-xs font-semibold text-primary">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Evaluador institucional autorizado
        </span>
      </header>

      {(error || notice) && (
        <div role={error ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${error ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          <span className="material-symbols-outlined text-lg shrink-0">{error ? 'error' : 'check_circle'}</span>
          <span>{error || notice}</span>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
        {/* LISTADO DE SOLICITUDES */}
        <aside className="min-w-0 space-y-3">
          <div className="grid gap-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <input
              className={inputClass}
              aria-label="Buscar solicitudes"
              placeholder="Buscar por postulante o correo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={inputClass}
              aria-label="Filtrar por estado de solicitud"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              {STATES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-on-surface-variant">
              {applications.length} solicitud(es) registradas con el criterio actual.
            </p>
          </div>

          {loadingList ? (
            <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
              Cargando solicitudes…
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
              No hay solicitudes para revisar con estos filtros.
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectApplication(item.id)}
                  className={`w-full min-w-0 rounded-xl border p-4 text-left transition-colors ${
                    selectedId === item.id
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-outline-variant/35 bg-surface-container-lowest hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-primary">{item.apellidos}, {item.nombres}</p>
                      <p className="mt-1 break-all text-xs text-on-surface-variant">{item.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${stateStyle(item.estado)}`}>
                      {stateLabels[item.estado] || item.estado}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-on-surface-variant">
                    <span className="font-mono font-medium">{item.codigo}</span>
                    <span>{item.cantidad_documentos} doc. · {item.cantidad_evaluaciones} evaluac.</span>
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">Enviada {dateTime(item.fecha_envio)}</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* DETALLE Y ACCIONES DE LA SOLICITUD SELECCIONADA */}
        <div id="application-review-detail" className="min-w-0 scroll-mt-24">
          {loadingDetail && (
            <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
              Cargando expediente…
            </div>
          )}

          {!loadingDetail && !detail && (
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
              Selecciona una solicitud para revisar sus antecedentes, documentos entregados y formalizar la decisión institucional.
            </div>
          )}

          {!loadingDetail && detail && (
            <div className="space-y-5">
              {/* FICHA GENERAL DEL EXPEDIENTE */}
              <article className="space-y-5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-secondary font-mono">Expediente {detail.codigo}</p>
                    <h2 className="mt-1 text-2xl font-bold text-primary">{detail.nombres} {detail.apellidos}</h2>
                    <p className="mt-1 break-all text-sm text-on-surface-variant">
                      {detail.email}{detail.telefono ? ` · Tel. ${detail.telefono}` : ''}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${stateStyle(detail.estado)}`}>
                    {stateLabels[detail.estado] || detail.estado}
                  </span>
                </div>

                <div className="grid gap-4 border-t border-outline-variant/25 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-outline">Fecha de postulación</p>
                    <p className="mt-1 text-sm text-on-surface">{dateTime(detail.fecha_envio)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-outline">Antecedentes académicos informados</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                      {detail.antecedentes_academicos || 'No se registraron antecedentes adicionales.'}
                    </p>
                  </div>
                </div>

                {/* DOCUMENTOS ADJUNTOS */}
                <div className="border-t border-outline-variant/25 pt-4">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">folder_shared</span>
                    Documentación entregada ({detail.documentos.length})
                  </h3>
                  {detail.documentos.length === 0 ? (
                    <p className="mt-2 text-sm text-amber-800">
                      No se encontraron adjuntos asociados al expediente.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-outline-variant/20">
                      {detail.documentos.map((documentItem) => (
                        <li key={documentItem.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base text-secondary">
                                {documentItem.tipo === 'cv' ? 'badge' : 'description'}
                              </span>
                              {documentItem.nombre}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {documentItem.tipo === 'cv' ? 'Currículum vitae' : documentItem.tipo === 'documentacion_complementaria' ? 'Documentación complementaria' : 'Respaldo académico'} · {dateTime(documentItem.fecha_carga)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => download(documentItem)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                            Descargar PDF
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>

              {/* RESOLUCIÓN INSTITUCIONAL YA REGISTRADA */}
              {hasDecision && detail.decision && (() => {
                const isAprobada = detail.decision.resultado === 'aprobada';
                return (
                  <section className={`rounded-2xl border-2 p-6 space-y-4 shadow-sm ${
                    isAprobada ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-rose-500/30 bg-rose-50/50'
                  }`}>
                    <div className={`flex items-center justify-between flex-wrap gap-3 pb-3 border-b ${
                      isAprobada ? 'border-emerald-200' : 'border-rose-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs ${
                          isAprobada ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}>
                          <span className="material-symbols-outlined text-2xl">
                            {isAprobada ? 'verified' : 'cancel'}
                          </span>
                        </div>
                        <div>
                          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                            isAprobada ? 'text-emerald-800' : 'text-rose-800'
                          }`}>
                            Resolución Oficial de Incorporación
                          </span>
                          <h3 className={`text-lg font-bold ${
                            isAprobada ? 'text-emerald-950' : 'text-rose-950'
                          }`}>
                            Decisión Institucional Registrada
                          </h3>
                        </div>
                      </div>

                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white ${
                        isAprobada ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {isAprobada ? 'Incorporación Aprobada' : 'Solicitud No Admitida / Rechazada'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className={`font-semibold block uppercase tracking-wide ${isAprobada ? 'text-emerald-900/70' : 'text-rose-900/70'}`}>
                          Referencia de Acta / Resolución:
                        </span>
                        <span className={`font-bold text-sm mt-0.5 block ${isAprobada ? 'text-emerald-950' : 'text-rose-950'}`}>
                          {detail.decision.referencia_acta || 'Sin referencia registrada'}
                        </span>
                      </div>

                      <div>
                        <span className={`font-semibold block uppercase tracking-wide ${isAprobada ? 'text-emerald-900/70' : 'text-rose-900/70'}`}>
                          Fecha de Resolución:
                        </span>
                        <span className={`font-medium text-sm mt-0.5 block ${isAprobada ? 'text-emerald-950' : 'text-rose-950'}`}>
                          {dateTime(detail.decision.fecha_decision)}
                        </span>
                      </div>

                      <div>
                        <span className={`font-semibold block uppercase tracking-wide ${isAprobada ? 'text-emerald-900/70' : 'text-rose-900/70'}`}>
                          Registrada por:
                        </span>
                        <span className={`font-medium mt-0.5 block ${isAprobada ? 'text-emerald-950' : 'text-rose-950'}`}>
                          {detail.decision.registrada_por_nombre}
                        </span>
                      </div>

                      {detail.categoria_miembro_nombre && (
                        <div>
                          <span className={`font-semibold block uppercase tracking-wide ${isAprobada ? 'text-emerald-900/70' : 'text-rose-900/70'}`}>
                            Categoría Asignada:
                          </span>
                          <span className={`font-bold text-sm mt-0.5 block ${isAprobada ? 'text-emerald-950' : 'text-rose-950'}`}>
                            {detail.categoria_miembro_nombre}
                          </span>
                        </div>
                      )}
                    </div>

                    {detail.decision.observaciones && (
                      <div className={`pt-2 border-t ${isAprobada ? 'border-emerald-200' : 'border-rose-200'}`}>
                        <span className={`text-xs font-semibold block uppercase tracking-wide ${
                          isAprobada ? 'text-emerald-900/70' : 'text-rose-900/70'
                        }`}>
                          Fundamentos institucionales / Dictamen técnico:
                        </span>
                        <p className={`mt-1 text-xs leading-relaxed whitespace-pre-line bg-white/80 p-3.5 rounded-xl border ${
                          isAprobada ? 'text-emerald-950 border-emerald-200/60' : 'text-rose-950 border-rose-200/60'
                        }`}>
                          {detail.decision.observaciones}
                        </p>
                      </div>
                    )}

                    {isAprobada && (
                      <div className="pt-2 flex justify-end">
                        <Link
                          to="/dashboard/miembros"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">groups</span>
                          Ver en Directorio de Miembros Acreditados →
                        </Link>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* HISTORIAL DE EVALUACIONES PRELIMINARES */}
              <section className="space-y-4 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-6 shadow-xs">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">history_edu</span>
                    Historial de evaluaciones del Comité Académico
                  </h3>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Dictámenes y observaciones colegiadas emitidas durante la revisión de antecedentes.
                  </p>
                </div>

                {detail.evaluaciones.length === 0 ? (
                  <p className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    Aún no hay evaluaciones registradas para este expediente.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {detail.evaluaciones.map((evaluation) => (
                      <li key={evaluation.id} className="rounded-lg bg-surface-container-low p-4 border border-outline-variant/20">
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="font-semibold text-primary">
                            {resultLabels[evaluation.resultado_propuesto] || evaluation.resultado_propuesto}
                          </p>
                          <time className="text-xs text-on-surface-variant">{dateTime(evaluation.fecha_evaluacion)}</time>
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">Evaluador: {evaluation.evaluador_nombre}</p>
                        {evaluation.observaciones && (
                          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/20">
                            {evaluation.observaciones}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {/* FORMULARIO DE EVALUACIÓN PRELIMINAR (SOLO SI AÚN NO TIENE DECISIÓN) */}
                {!hasDecision && (
                  <form onSubmit={evaluate} className="space-y-4 border-t border-outline-variant/25 pt-5">
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wide">
                      Agregar nueva evaluación colegiada
                    </h4>

                    <label className="block space-y-1.5 text-sm font-semibold text-on-surface">
                      Recomendación del evaluador <span className="text-error">*</span>
                      <select
                        className={inputClass}
                        value={form.resultado_propuesto}
                        onChange={(e) => setForm({ ...form, resultado_propuesto: e.target.value })}
                      >
                        {RESULTS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <span className="block text-xs font-normal text-on-surface-variant">
                        Esta recomendación prepara el expediente para la resolución final de incorporación.
                      </span>
                    </label>

                    <label className="block space-y-1.5 text-sm font-semibold text-on-surface">
                      {form.resultado_propuesto === 'requiere_documentacion'
                        ? 'Requerimiento visible para la persona postulante'
                        : 'Observaciones internas del comité'}
                      {observationsRequired && <span className="text-error"> *</span>}
                      <textarea
                        className={`${inputClass} min-h-24 resize-y`}
                        required={observationsRequired}
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                        placeholder={
                          form.resultado_propuesto === 'requiere_documentacion'
                            ? 'Indica con claridad qué documento debe adjuntar y cómo subsanar la observación.'
                            : 'Registra los fundamentos técnicos y aspectos relevantes del análisis de antecedentes.'
                        }
                      />
                    </label>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-base">fact_check</span>
                        {saving ? 'Registrando…' : 'Guardar evaluación preliminar'}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* SECCIÓN CU24 — REGISTRAR DECISIÓN INSTITUCIONAL */}
              {!hasDecision && (
                <section className="space-y-5 rounded-2xl border-2 border-primary/25 bg-surface-container-lowest p-6 shadow-sm">
                  {/* CABECERA CON BOTÓN DE ASISTENCIA CON IA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/25">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                        <h3 className="text-xl font-bold text-primary">Registrar decisión de incorporación</h3>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant max-w-xl leading-relaxed">
                        Deja constancia oficial de la determinación de ABOCCRIM sobre la solicitud evaluada, asignando la categoría institucional correspondiente en caso de aprobación.
                      </p>
                    </div>

                    {/* BOTONES DE ASISTENCIA Y RESOLUCIÓN AUTOMÁTICA CON IA */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoEvaluateWithAi}
                        disabled={aiRunning || savingDecision}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary px-4 py-2.5 text-xs font-bold shadow-sm hover:shadow transition-all hover:opacity-95 disabled:opacity-50 shrink-0 cursor-pointer"
                        title="Analiza con IA, resuelve automáticamente la solicitud (aprueba o rechaza) y notifica al postulante por correo de forma inmediata"
                      >
                        <span className={`material-symbols-outlined text-base ${aiRunning ? 'animate-spin' : ''}`}>
                          {aiRunning ? 'progress_activity' : 'smart_toy'}
                        </span>
                        <span>{aiRunning ? 'Procesando auto-resolución...' : 'Auto-Resolver con IA'}</span>
                        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider">
                          100% Automático
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartAiAnalysis}
                        disabled={aiRunning || savingDecision}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        title="Analiza el currículum con IA y precarga los campos para revisión manual antes de formalizar"
                      >
                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                        <span>Inspeccionar IA</span>
                      </button>
                    </div>
                  </div>

                  {/* PROCESO DE EVALUACIÓN CURRICULAR CON IA */}
                  {aiRunning && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-3 animate-pulse">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-primary animate-spin">
                          psychology
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            Motor de Evaluación Curricular Asistida con IA (Google Gemini)
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {aiStep === 1 && 'Etapa 1/4: Extrayendo texto del Currículum Vitae y antecedentes...'}
                            {aiStep === 2 && 'Etapa 2/4: Evaluando trayectoria docente, grados académicos y especialidades con Gemini...'}
                            {aiStep === 3 && 'Etapa 3/4: Verificando afinidad con estatutos y líneas criminológicas...'}
                            {aiStep === 4 && 'Etapa 4/4: Generando dictamen técnico de incorporación...'}
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 transition-all duration-500 rounded-full"
                          style={{ width: `${aiStep * 25}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* RESULTADO DE LA EVALUACIÓN ASISTIDA POR IA */}
                  {aiResult && !aiRunning && (() => {
                    const isFavorable = (aiResult.score >= 60) && (aiResult.esApto !== false);
                    return (
                      <div className={`rounded-xl p-5 space-y-3 border ${
                        isFavorable ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg text-white flex items-center justify-center shrink-0 ${
                              isFavorable ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}>
                              <span className="material-symbols-outlined text-xl">psychology_alt</span>
                            </div>
                            <div>
                              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                isFavorable ? 'text-emerald-800' : 'text-amber-800'
                              }`}>
                                Dictamen Técnico Asistido por IA (Google Gemini)
                              </span>
                              <h4 className={`text-sm font-bold ${
                                isFavorable ? 'text-emerald-950' : 'text-amber-950'
                              }`}>
                                Recomendación: {aiResult.recomendacion}
                                {aiResult.categoriaSugerida && ` (${aiResult.categoriaSugerida})`}
                              </h4>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full text-white px-2.5 py-0.5 text-xs font-bold ${
                              isFavorable ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}>
                              <span className="material-symbols-outlined text-xs">grade</span>
                              {aiResult.score} / 100
                            </span>
                            <span className={`block text-[10px] mt-0.5 ${
                              isFavorable ? 'text-emerald-800' : 'text-amber-800'
                            }`}>
                              {aiResult.nivelAfinidad}
                            </span>
                          </div>
                        </div>

                        <p className={`text-xs leading-relaxed bg-white/70 p-3 rounded-lg border ${
                          isFavorable ? 'text-emerald-950/90 border-emerald-200' : 'text-amber-950/90 border-amber-200'
                        }`}>
                          {aiResult.sintesis}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          <span className={isFavorable ? 'text-emerald-900 font-semibold' : 'text-amber-900 font-semibold'}>
                            ✓ Parámetros y fundamentación aplicados automáticamente al formulario inferior.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRegisterDecision()}
                            disabled={savingDecision}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-bold transition-all shadow-xs cursor-pointer ${
                              isFavorable ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">how_to_reg</span>
                            <span>{isFavorable ? 'Confirmar e incorporar directamente' : 'Aplicar resolución'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {decisionError && (
                    <div className="rounded-xl p-3.5 bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      <span>{decisionError}</span>
                    </div>
                  )}

                  {/* FORMULARIO OFICIAL DE DECISIÓN INSTITUCIONAL */}
                  <form onSubmit={handleRegisterDecision} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* SELECTOR DE RESULTADO */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
                          Determinación Institucional <span className="text-error">*</span>
                        </label>
                        <select
                          className={inputClass}
                          value={decisionForm.resultado}
                          onChange={(e) => setDecisionForm({ ...decisionForm, resultado: e.target.value })}
                        >
                          <option value="aprobada">Aprobar incorporación</option>
                          <option value="rechazada">Rechazar solicitud</option>
                        </select>
                      </div>

                      {/* CATEGORÍA ESTATUTARIA (SI ES APROBADA) */}
                      {decisionForm.resultado === 'aprobada' && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
                            Categoría Estatutaria Asignada <span className="text-error">*</span>
                          </label>
                          <select
                            className={inputClass}
                            value={decisionForm.categoria_id}
                            onChange={(e) => setDecisionForm({ ...decisionForm, categoria_id: e.target.value })}
                            required
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* REFERENCIA DE ACTA / RESOLUCIÓN */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
                        Referencia del Acta o Resolución Formal <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        className={inputClass}
                        required
                        placeholder="Ej. Resolución de Directorio N° 05/2025 o Acta de Consejo ABO-2025-08"
                        value={decisionForm.referencia_acta}
                        onChange={(e) => setDecisionForm({ ...decisionForm, referencia_acta: e.target.value })}
                      />
                      <span className="block text-[11px] text-on-surface-variant mt-1">
                        Identificador oficial del acto administrativo emitido por la instancia competente de ABOCCRIM.
                      </span>
                    </div>

                    {/* OBSERVACIONES / FUNDAMENTOS */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
                        Fundamentos y Observaciones Institucionales
                        {decisionForm.resultado === 'rechazada' && <span className="text-error"> *</span>}
                      </label>
                      <textarea
                        className={`${inputClass} min-h-24 resize-y`}
                        required={decisionForm.resultado === 'rechazada'}
                        placeholder="Registra los fundamentos, alcances estatutarios o consideraciones de la decisión adoptada."
                        value={decisionForm.observaciones}
                        onChange={(e) => setDecisionForm({ ...decisionForm, observaciones: e.target.value })}
                      />
                    </div>

                    {/* BOTÓN DE ACCIÓN FINAL */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingDecision}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60 ${
                          decisionForm.resultado === 'aprobada'
                            ? 'bg-primary hover:bg-primary-container hover:text-on-primary'
                            : 'bg-rose-700 hover:bg-rose-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {decisionForm.resultado === 'aprobada' ? 'how_to_reg' : 'person_remove'}
                        </span>
                        <span>
                          {savingDecision
                            ? 'Registrando decisión...'
                            : decisionForm.resultado === 'aprobada'
                            ? 'Registrar Aprobación e Incorporar Miembro'
                            : 'Registrar Rechazo de Solicitud'}
                        </span>
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
