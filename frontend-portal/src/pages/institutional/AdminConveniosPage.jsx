import React, { useEffect, useState } from 'react';
import { agreementService } from '../../services/api';

const EMPTY_FORM = { institucion_id: '', objeto: '', fecha_inicio: '', fecha_fin: '', estado: 'borrador', documento_modo: 'ninguno', documento_url: '', archivo: null, confirmar_documento: false };
const EMPTY_INSTITUTION = { nombre: '', pais: '', sitio_web: '' };
const ESTADOS = [['borrador', 'Borrador'], ['vigente', 'Vigente'], ['finalizado', 'Finalizado'], ['suspendido', 'Suspendido']];
const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

function message(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

function itemsOf(result) { return Array.isArray(result) ? result : result?.results || []; }

function displayDate(value) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-BO', { dateStyle: 'medium' }) : 'Sin fecha final';
}

function agreementStateLabel(item) {
  if (item.estado === 'vigente') {
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (item.fecha_inicio > localToday || (item.fecha_fin && item.fecha_fin < localToday)) return 'Fuera de vigencia';
  }
  return ESTADOS.find(([value]) => value === item.estado)?.[1] || item.estado;
}

export default function AdminConveniosPage() {
  const [agreements, setAgreements] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [institutionForm, setInstitutionForm] = useState(EMPTY_INSTITUTION);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showInstitutionForm, setShowInstitutionForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAgreements = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      setAgreements(itemsOf(await agreementService.list(params)));
    } catch (loadError) { setError(message(loadError)); }
    finally { setLoading(false); }
  };

  const loadInstitutions = async () => {
    try { setInstitutions(itemsOf(await agreementService.institutions())); }
    catch (loadError) { setError(message(loadError)); }
  };

  useEffect(() => { loadInstitutions(); }, []);
  useEffect(() => { const timer = setTimeout(loadAgreements, 250); return () => clearTimeout(timer); }, [search, stateFilter]);

  const reset = () => { setEditing(null); setForm(EMPTY_FORM); };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      institucion_id: String(item.institucion_id), objeto: item.objeto || '',
      fecha_inicio: item.fecha_inicio || '', fecha_fin: item.fecha_fin || '', estado: item.estado,
      documento_modo: item.documento_externo ? 'enlace' : item.documento_es_archivo ? 'archivo' : 'ninguno',
      documento_url: item.documento_externo || '', archivo: null, confirmar_documento: false,
    });
    setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createInstitution = async (event) => {
    event.preventDefault(); setSavingInstitution(true); setError(''); setNotice('');
    try {
      const result = await agreementService.createInstitution({
        nombre: institutionForm.nombre.trim(), pais: institutionForm.pais.trim() || null,
        sitio_web: institutionForm.sitio_web.trim() || null,
      });
      await loadInstitutions();
      setForm((current) => ({ ...current, institucion_id: String(result.id) }));
      setInstitutionForm(EMPTY_INSTITUTION); setShowInstitutionForm(false);
      setNotice('La institución quedó registrada y seleccionada para el convenio.');
    } catch (saveError) { setError(message(saveError)); }
    finally { setSavingInstitution(false); }
  };

  const save = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const data = new FormData();
    data.append('institucion_id', form.institucion_id);
    data.append('objeto', form.objeto.trim());
    data.append('fecha_inicio', form.fecha_inicio);
    data.append('fecha_fin', form.fecha_fin);
    data.append('estado', form.estado);
    if (form.documento_modo === 'enlace' && form.documento_url.trim()) data.append('referencia_url', form.documento_url.trim());
    if (form.documento_modo === 'archivo' && form.archivo) data.append('archivo', form.archivo);
    if (editing && form.documento_modo === 'ninguno' && (editing.documento_externo || editing.documento_es_archivo)) data.append('quitar_documento', 'true');
    data.append('documento_publicable_confirmado', form.confirmar_documento ? 'true' : 'false');
    try {
      if (editing) await agreementService.update(editing.id, data);
      else await agreementService.create(data);
      setNotice(editing ? 'Los cambios del convenio se guardaron.' : 'El convenio se registró.');
      reset(); await loadAgreements();
    } catch (saveError) { setError(message(saveError)); }
    finally { setSaving(false); }
  };

  const hasDocument = form.documento_modo === 'enlace'
    ? Boolean(form.documento_url.trim() || editing?.documento_externo)
    : form.documento_modo === 'archivo'
      ? Boolean(form.archivo || (editing?.documento_es_archivo && !form.archivo))
      : false;

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">CU21 · gestión institucional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Convenios institucionales</h1><p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Registra acuerdos, su institución contraparte, vigencia y una referencia documental autorizada para difusión.</p></div>
        <a href="/convenios" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary"><span className="material-symbols-outlined">open_in_new</span> Ver portal público</a>
      </header>

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-primary">{editing ? 'Editar convenio' : 'Registrar convenio'}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline">Cancelar edición</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Institución contraparte <span className="text-error">*</span><select className={inputClass} required value={form.institucion_id} onChange={(e) => setForm({ ...form, institucion_id: e.target.value })}><option value="">Selecciona una institución</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.pais ? ` · ${item.pais}` : ''}</option>)}</select><button type="button" onClick={() => setShowInstitutionForm(!showInstitutionForm)} className="mt-2 text-left text-xs font-bold text-secondary hover:underline">{showInstitutionForm ? 'Cerrar registro de institución' : '＋ Registrar institución contraparte'}</button></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Estado del convenio<select className={inputClass} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value, confirmar_documento: false })}>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="block text-xs font-normal text-on-surface-variant">Solo acuerdos vigentes y dentro de sus fechas aparecen públicamente.</span></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Fecha de inicio <span className="text-error">*</span><input className={inputClass} type="date" required value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Fecha de finalización<input className={inputClass} type="date" min={form.fecha_inicio || undefined} value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} /><span className="block text-xs font-normal text-on-surface-variant">Déjala vacía si no tiene una fecha de finalización definida.</span></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Objeto y alcance <span className="text-error">*</span><textarea className={`${inputClass} min-h-32 resize-y`} required value={form.objeto} onChange={(e) => setForm({ ...form, objeto: e.target.value })} placeholder="Describe las partes, el propósito y el alcance institucional autorizado." /></label>
          <fieldset className="space-y-3 md:col-span-2"><legend className="text-sm font-semibold text-on-surface">Documento o referencia publicable</legend><div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><label className="inline-flex items-center gap-2"><input type="radio" name="documento_modo" checked={form.documento_modo === 'ninguno'} onChange={() => setForm({ ...form, documento_modo: 'ninguno', archivo: null, confirmar_documento: false })} /> Sin documento</label><label className="inline-flex items-center gap-2"><input type="radio" name="documento_modo" checked={form.documento_modo === 'enlace'} onChange={() => setForm({ ...form, documento_modo: 'enlace', archivo: null, confirmar_documento: false })} /> Enlace web</label><label className="inline-flex items-center gap-2"><input type="radio" name="documento_modo" checked={form.documento_modo === 'archivo'} onChange={() => setForm({ ...form, documento_modo: 'archivo', documento_url: '', confirmar_documento: false })} /> PDF institucional</label></div>
            {form.documento_modo === 'enlace' && <label className="block space-y-1.5 text-sm font-semibold text-on-surface">Enlace HTTP o HTTPS<input className={inputClass} type="url" maxLength={500} required={!editing || !editing.documento_externo} value={form.documento_url} onChange={(e) => setForm({ ...form, documento_url: e.target.value })} placeholder="https://..." /><span className="block text-xs font-normal text-on-surface-variant">Debe apuntar a una versión autorizada para difusión. La disponibilidad depende del sitio externo.</span></label>}
            {form.documento_modo === 'archivo' && <label className="block space-y-1.5 text-sm font-semibold text-on-surface">Seleccionar PDF{(!editing || !editing.documento_es_archivo) && <span className="text-error"> *</span>}<input className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary`} type="file" accept="application/pdf,.pdf" required={(!editing || !editing.documento_es_archivo) && !form.archivo} onChange={(e) => setForm({ ...form, archivo: e.target.files?.[0] || null })} /><span className="block text-xs font-normal text-on-surface-variant">PDF máximo 25 MB. Se almacena de forma privada y solo se descarga si el convenio es público o tienes permiso administrativo.</span>{editing?.documento_es_archivo && <span className="block text-xs font-normal text-on-surface-variant">Si no eliges un archivo nuevo, se conserva el documento actual.</span>}</label>}
            {form.estado === 'vigente' && hasDocument && <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><input className="mt-0.5" type="checkbox" required checked={form.confirmar_documento} onChange={(e) => setForm({ ...form, confirmar_documento: e.target.checked })} /><span>Confirmo que el documento o enlace es la versión autorizada para difusión pública y no contiene información restringida.</span></label>}
          </fieldset>
        </div>

        {showInstitutionForm && <div className="space-y-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"><div><h3 className="font-bold text-primary">Nueva institución contraparte</h3><p className="mt-1 text-xs text-on-surface-variant">La institución quedará disponible para asociarla a otros convenios.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-semibold">Nombre <span className="text-error">*</span><input className={inputClass} maxLength={250} required value={institutionForm.nombre} onChange={(e) => setInstitutionForm({ ...institutionForm, nombre: e.target.value })} /></label><label className="space-y-1 text-sm font-semibold">País<input className={inputClass} maxLength={100} value={institutionForm.pais} onChange={(e) => setInstitutionForm({ ...institutionForm, pais: e.target.value })} /></label><label className="space-y-1 text-sm font-semibold sm:col-span-2">Sitio web (opcional)<input className={inputClass} type="url" maxLength={300} placeholder="https://..." value={institutionForm.sitio_web} onChange={(e) => setInstitutionForm({ ...institutionForm, sitio_web: e.target.value })} /></label></div><button type="button" disabled={savingInstitution} onClick={createInstitution} className="rounded-lg border border-primary px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60">{savingInstitution ? 'Registrando…' : 'Registrar institución'}</button></div>}

        <div className="flex justify-end border-t border-outline-variant/30 pt-4"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"><span className="material-symbols-outlined">save</span>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar convenio'}</button></div>
      </form>

      <section className="space-y-4">
        <div className="grid gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]"><input className={inputClass} aria-label="Buscar convenios" placeholder="Buscar por institución, país u objeto…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={inputClass} aria-label="Filtrar por estado" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}><option value="">Todos los estados</option>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={loadAgreements} className="rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold text-primary">Actualizar</button></div>
        {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando convenios…</p> : agreements.length === 0 ? <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay convenios que coincidan con los filtros.</div> : <div className="grid gap-4 md:grid-cols-2">{agreements.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-secondary">{item.institucion_pais || 'Institución contraparte'}</p><h3 className="mt-1 break-words font-bold text-primary">{item.institucion_nombre}</h3></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.estado === 'vigente' && agreementStateLabel(item) === 'Vigente' ? 'bg-emerald-50 text-emerald-800' : item.estado === 'suspendido' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>{agreementStateLabel(item)}</span></div><p className="mt-4 whitespace-pre-line text-sm leading-6 text-on-surface-variant">{item.objeto}</p><p className="mt-3 text-xs text-on-surface-variant">Vigencia: {displayDate(item.fecha_inicio)} – {displayDate(item.fecha_fin)}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/25 pt-4"><span className="text-xs text-on-surface-variant">{item.documento_es_archivo ? 'PDF asociado' : item.documento_externo ? 'Enlace documental' : 'Sin documento'}</span><div className="flex items-center gap-2">{item.documento_es_archivo && <button type="button" onClick={() => agreementService.downloadDocument(item.id, `Convenio-${item.institucion_nombre}.pdf`).catch((downloadError) => setError(message(downloadError)))} className="rounded-md px-2 py-2 text-sm font-bold text-secondary hover:bg-surface-container-low">PDF</button>}{item.documento_externo && <a href={item.documento_externo} target="_blank" rel="noopener noreferrer" className="rounded-md px-2 py-2 text-sm font-bold text-secondary hover:bg-surface-container-low">Abrir enlace</a>}<button type="button" onClick={() => startEdit(item)} className="rounded-md px-3 py-2 text-sm font-bold text-primary hover:bg-surface-container-low"><span className="material-symbols-outlined mr-1 align-middle text-lg">edit</span>Editar</button></div></div></article>)}</div>}
      </section>
    </section>
  );
}
