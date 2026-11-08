import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { incorporationService } from '../../services/api';

const STATES = [
  ['', 'Todas las solicitudes abiertas'],
  ['recibida', 'Recibida'],
  ['en_revision', 'En revisión'],
  ['observada', 'Observada'],
  ['lista_decision', 'Lista para decisión'],
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
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

function stateStyle(state) {
  if (state === 'lista_decision') return 'bg-emerald-50 text-emerald-800';
  if (state === 'observada') return 'bg-amber-50 text-amber-800';
  if (state === 'en_revision') return 'bg-sky-50 text-sky-800';
  return 'bg-slate-100 text-slate-700';
}

export default function EvaluarSolicitudesPage() {
  const { user, isSuperAdmin } = useAuth();
  const authorized = isSuperAdmin || user?.roles_codigos?.includes('comite_academico');
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ resultado_propuesto: 'favorable', observaciones: '' });
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadList = async () => {
    if (!authorized) return;
    setLoadingList(true); setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      const result = await incorporationService.reviewList(params);
      const list = Array.isArray(result) ? result : result.results || [];
      setApplications(list);
      if (selectedId && !list.some((item) => item.id === selectedId)) {
        setSelectedId(null); setDetail(null);
      }
    } catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoadingList(false); }
  };

  useEffect(() => { const timer = setTimeout(loadList, 200); return () => clearTimeout(timer); }, [authorized, search, stateFilter]);

  const selectApplication = async (id) => {
    setSelectedId(id); setDetail(null); setLoadingDetail(true); setError(''); setNotice('');
    try {
      const result = await incorporationService.reviewDetail(id);
      setDetail(result);
      setForm({ resultado_propuesto: 'favorable', observaciones: '' });
      window.setTimeout(() => document.getElementById('application-review-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoadingDetail(false); }
  };

  const evaluate = async (event) => {
    event.preventDefault();
    if (!detail) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await incorporationService.evaluate(detail.id, {
        resultado_propuesto: form.resultado_propuesto,
        observaciones: form.observaciones.trim(),
      });
      setDetail(result.solicitud);
      setNotice(result.mensaje);
      setForm({ resultado_propuesto: form.resultado_propuesto, observaciones: '' });
      await loadList();
    } catch (saveError) { setError(errorMessage(saveError)); }
    finally { setSaving(false); }
  };

  const download = async (documentItem) => {
    setError('');
    try { await incorporationService.downloadSupportingDocument(detail.id, documentItem.id, `${documentItem.nombre}.pdf`); }
    catch (downloadError) { setError(errorMessage(downloadError)); }
  };

  if (!authorized) {
    return <section className="rounded-xl border border-error/20 bg-surface-container-lowest p-6"><h1 className="text-xl font-bold text-primary">Acceso reservado</h1><p className="mt-2 text-sm text-on-surface-variant">Esta sección requiere el rol de Comité Académico autorizado.</p></section>;
  }

  const observationsRequired = form.resultado_propuesto !== 'favorable';

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">CU23 · Comité Académico</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Evaluar solicitudes</h1><p className="mt-2 max-w-3xl text-sm text-on-surface-variant">Revisa los antecedentes y documentos, deja constancia de tu evaluación y deriva la solicitud al siguiente paso del procedimiento.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-low px-3 py-2 text-xs font-semibold text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" />Evaluador autorizado</span></header>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950"><strong>Alcance de esta evaluación:</strong> las recomendaciones favorables o desfavorables dejan la solicitud lista para decisión. No incorporan ni rechazan a la persona; la decisión formal corresponde al CU24.</div>
      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
        <aside className="min-w-0 space-y-3">
          <div className="grid gap-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4"><input className={inputClass} aria-label="Buscar solicitudes" placeholder="Buscar por postulante o correo…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={inputClass} aria-label="Filtrar por estado de solicitud" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>{STATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="text-xs text-on-surface-variant">{applications.length} solicitud(es) abiertas o pendientes de decisión.</p></div>
          {loadingList ? <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">Cargando solicitudes…</div> : applications.length === 0 ? <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">No hay solicitudes para revisar con estos filtros.</div> : <div className="space-y-2">{applications.map((item) => <button key={item.id} type="button" onClick={() => selectApplication(item.id)} className={`w-full min-w-0 rounded-xl border p-4 text-left transition-colors ${selectedId === item.id ? 'border-primary bg-primary/5' : 'border-outline-variant/35 bg-surface-container-lowest hover:border-primary/40'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold text-primary">{item.apellidos}, {item.nombres}</p><p className="mt-1 break-all text-xs text-on-surface-variant">{item.email}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${stateStyle(item.estado)}`}>{stateLabels[item.estado] || item.estado}</span></div><div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-on-surface-variant"><span>{item.codigo}</span><span>{item.cantidad_documentos} documento(s) · {item.cantidad_evaluaciones} evaluación(es)</span></div><p className="mt-1 text-[11px] text-on-surface-variant">Enviada {dateTime(item.fecha_envio)}</p></button>)}</div>}
        </aside>

        <div id="application-review-detail" className="min-w-0 scroll-mt-24">
          {loadingDetail && <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">Cargando expediente…</div>}
          {!loadingDetail && !detail && <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">Selecciona una solicitud para revisar sus datos, antecedentes y documentos.</div>}
          {!loadingDetail && detail && <div className="space-y-5">
            <article className="space-y-5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-wide text-secondary">Expediente {detail.codigo}</p><h2 className="mt-1 text-2xl font-bold text-primary">{detail.nombres} {detail.apellidos}</h2><p className="mt-1 break-all text-sm text-on-surface-variant">{detail.email}{detail.telefono ? ` · ${detail.telefono}` : ''}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${stateStyle(detail.estado)}`}>{stateLabels[detail.estado] || detail.estado}</span></div>
              <div className="grid gap-4 border-t border-outline-variant/25 pt-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-outline">Fecha de envío</p><p className="mt-1 text-sm text-on-surface">{dateTime(detail.fecha_envio)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-outline">Antecedentes académicos</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-on-surface-variant">{detail.antecedentes_academicos || 'No se registraron antecedentes.'}</p></div></div>
              <div className="border-t border-outline-variant/25 pt-4"><h3 className="font-bold text-primary">Documentación entregada ({detail.documentos.length})</h3>{detail.documentos.length === 0 ? <p className="mt-2 text-sm text-amber-800">No se encontraron adjuntos; registra esta insuficiencia en las observaciones.</p> : <ul className="mt-3 divide-y divide-outline-variant/20">{detail.documentos.map((documentItem) => <li key={documentItem.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words text-sm font-semibold text-on-surface">{documentItem.nombre}</p><p className="text-xs text-on-surface-variant">{documentItem.tipo === 'cv' ? 'Currículum vitae' : documentItem.tipo === 'documentacion_complementaria' ? 'Documentación complementaria' : 'Respaldo académico'} · {dateTime(documentItem.fecha_carga)}</p></div><button type="button" onClick={() => download(documentItem)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-surface-container-low px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-high"><span className="material-symbols-outlined text-base">download</span>Descargar</button></li>)}</ul>}</div>
            </article>

            <section className="space-y-4 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-6"><div><h3 className="text-lg font-bold text-primary">Historial de evaluaciones</h3><p className="mt-1 text-xs text-on-surface-variant">Cada envío agrega un registro; no sobrescribe evaluaciones anteriores.</p></div>{detail.evaluaciones.length === 0 ? <p className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">Aún no hay evaluaciones registradas.</p> : <ol className="space-y-3">{detail.evaluaciones.map((evaluation) => <li key={evaluation.id} className="rounded-lg bg-surface-container-low p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-primary">{resultLabels[evaluation.resultado_propuesto] || evaluation.resultado_propuesto}</p><time className="text-xs text-on-surface-variant">{dateTime(evaluation.fecha_evaluacion)}</time></div><p className="mt-1 text-xs text-on-surface-variant">Evaluador: {evaluation.evaluador_nombre}</p>{evaluation.observaciones && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-on-surface-variant">{evaluation.observaciones}</p>}</li>)}</ol>}

              <form onSubmit={evaluate} className="space-y-4 border-t border-outline-variant/25 pt-5"><h3 className="font-bold text-primary">Registrar evaluación</h3><label className="block space-y-1.5 text-sm font-semibold text-on-surface">Resultado propuesto <span className="text-error">*</span><select className={inputClass} value={form.resultado_propuesto} onChange={(e) => setForm({ ...form, resultado_propuesto: e.target.value })}>{RESULTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="block text-xs font-normal text-on-surface-variant">La recomendación no sustituye la decisión formal de incorporación.</span></label><label className="block space-y-1.5 text-sm font-semibold text-on-surface">{form.resultado_propuesto === 'requiere_documentacion' ? 'Requerimiento visible para la persona postulante' : 'Observaciones internas'}{observationsRequired && <span className="text-error"> *</span>}<textarea className={`${inputClass} min-h-28 resize-y`} required={observationsRequired} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder={form.resultado_propuesto === 'requiere_documentacion' ? 'Indica con claridad qué documento debe adjuntar y cómo subsanar la observación.' : 'Registra fundamentos y aspectos relevantes de la evaluación.'} />{form.resultado_propuesto === 'requiere_documentacion' && <span className="block text-xs font-normal text-amber-800">Este texto se mostrará a la persona postulante. No incluyas comentarios internos del comité.</span>}</label><div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"><span className="material-symbols-outlined">fact_check</span>{saving ? 'Registrando…' : 'Guardar evaluación'}</button></div></form>
            </section>
          </div>}
        </div>
      </div>
    </section>
  );
}
