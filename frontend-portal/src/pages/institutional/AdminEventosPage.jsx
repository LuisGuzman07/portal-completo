import React, { useEffect, useState } from 'react';
import { eventService } from '../../services/api';

const EMPTY_FORM = { titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', lugar: '', estado: 'borrador' };
const ESTADOS = [['borrador', 'Borrador'], ['publicado', 'Publicado'], ['cancelado', 'Cancelado']];
const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

function message(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function displayDate(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha final';
}

export default function AdminEventosPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      const response = await eventService.list(params);
      setEvents(Array.isArray(response) ? response : response.results || []);
    } catch (loadError) { setError(message(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, stateFilter]);

  const edit = (event) => {
    setEditing(event);
    setForm({ titulo: event.titulo || '', descripcion: event.descripcion || '', fecha_inicio: localDateTime(event.fecha_inicio), fecha_fin: localDateTime(event.fecha_fin), lugar: event.lugar || '', estado: event.estado });
    setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => { setEditing(null); setForm(EMPTY_FORM); };

  const save = async (submitEvent) => {
    submitEvent.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const payload = {
      ...form,
      fecha_inicio: form.fecha_inicio ? new Date(form.fecha_inicio).toISOString() : '',
      fecha_fin: form.fecha_fin ? new Date(form.fecha_fin).toISOString() : null,
      descripcion: form.descripcion.trim() || null,
      lugar: form.lugar.trim() || null,
    };
    try {
      if (editing) await eventService.update(editing.id, payload);
      else await eventService.create(payload);
      setNotice(editing ? 'Los cambios del evento se guardaron.' : 'El evento se registró.'); reset(); await load();
    } catch (saveError) { setError(message(saveError)); }
    finally { setSaving(false); }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">CU18 · administración institucional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Eventos académicos</h1><p className="mt-2 text-sm text-on-surface-variant">Registra actividades, actualiza sus fechas y decide cuándo aparecen en el portal público.</p></div>
        <a href="/eventos" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary"><span className="material-symbols-outlined">open_in_new</span> Ver portal público</a>
      </header>

      {(error || notice) && <div role="status" className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-primary">{editing ? 'Editar evento' : 'Registrar evento'}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline">Cancelar edición</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Título <span className="text-error">*</span><input className={inputClass} maxLength={250} required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Lugar<input className={inputClass} maxLength={250} value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} placeholder="Lugar o modalidad virtual" /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Fecha y hora de inicio <span className="text-error">*</span><input className={inputClass} type="datetime-local" required value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Fecha y hora de finalización<input className={inputClass} type="datetime-local" min={form.fecha_inicio || undefined} value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Descripción<textarea className={`${inputClass} min-h-28 resize-y`} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Información de la actividad académica" /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Estado de publicación<select className={inputClass} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className="flex justify-end border-t border-outline-variant/30 pt-4"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"><span className="material-symbols-outlined">save</span>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar evento'}</button></div>
      </form>

      <section className="space-y-4">
        <div className="grid gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:grid-cols-[1fr_220px_auto]"><input className={inputClass} aria-label="Buscar eventos" placeholder="Buscar por título, descripción o lugar…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={inputClass} aria-label="Filtrar por estado" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}><option value="">Todos los estados</option>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={load} className="rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold text-primary">Actualizar</button></div>
        {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando eventos…</p> : events.length === 0 ? <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay eventos que coincidan con los filtros.</div> : (
          <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-outline"><tr><th className="px-5 py-4">Evento</th><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Lugar</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-outline-variant/25">{events.map((event) => <tr key={event.id}><td className="px-5 py-4"><p className="font-bold text-primary">{event.titulo}</p><p className="mt-1 max-w-md line-clamp-2 text-xs text-on-surface-variant">{event.descripcion || 'Sin descripción'}</p></td><td className="px-5 py-4 text-xs text-on-surface-variant"><div>{displayDate(event.fecha_inicio)}</div><div className="mt-1">Hasta: {displayDate(event.fecha_fin)}</div></td><td className="px-5 py-4 text-on-surface-variant">{event.lugar || '—'}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.estado === 'publicado' ? 'bg-emerald-50 text-emerald-800' : event.estado === 'cancelado' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>{ESTADOS.find(([value]) => value === event.estado)?.[1] || event.estado}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => edit(event)} className="rounded-md px-3 py-2 font-bold text-primary hover:bg-surface-container-low"><span className="material-symbols-outlined align-middle text-lg">edit</span> Editar</button></td></tr>)}</tbody>
          </table></div></div>
        )}
      </section>
    </section>
  );
}
