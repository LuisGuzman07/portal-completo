import React, { useEffect, useState } from 'react';
import { newsService } from '../../services/api';

const EMPTY_FORM = { titulo: '', contenido: '', estado: 'borrador', material_url: '' };
const ESTADOS = [['borrador', 'Borrador'], ['publicado', 'Publicado'], ['retirada', 'Retirada']];
const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

function errorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : 'No publicada';
}

export default function AdminNoticiasPage() {
  const [news, setNews] = useState([]);
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
      const response = await newsService.list(params);
      setNews(Array.isArray(response) ? response : response.results || []);
    } catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, stateFilter]);

  const startEdit = (item) => {
    setEditing(item);
    setForm({ titulo: item.titulo || '', contenido: item.contenido || '', estado: item.estado, material_url: item.material_url || '' });
    setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => { setEditing(null); setForm(EMPTY_FORM); };

  const save = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const payload = { ...form, titulo: form.titulo.trim(), contenido: form.contenido.trim(), material_url: form.material_url.trim() };
    try {
      if (editing) await newsService.update(editing.id, payload);
      else await newsService.create(payload);
      setNotice(editing ? 'Los cambios de la noticia se guardaron.' : 'La noticia se registró.');
      reset(); await load();
    } catch (saveError) { setError(errorMessage(saveError)); }
    finally { setSaving(false); }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">CU19 · comunicación institucional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Noticias institucionales</h1><p className="mt-2 text-sm text-on-surface-variant">Redacta noticias oficiales y controla su publicación en el portal.</p></div>
        <a href="/noticias" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary"><span className="material-symbols-outlined">open_in_new</span> Ver portal público</a>
      </header>

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-primary">{editing ? 'Editar noticia' : 'Crear noticia'}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline">Cancelar edición</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Título <span className="text-error">*</span><input className={inputClass} maxLength={250} required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Contenido <span className="text-error">*</span><textarea className={`${inputClass} min-h-48 resize-y`} required value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="Redacta el contenido oficial de la noticia." /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Estado de publicación<select className={inputClass} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="block text-xs font-normal text-on-surface-variant">Solo las noticias publicadas son visibles en el portal.</span></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Enlace complementario (opcional)<input className={inputClass} type="url" maxLength={500} value={form.material_url} onChange={(e) => setForm({ ...form, material_url: e.target.value })} placeholder="https://…" /><span className="block text-xs font-normal text-on-surface-variant">Admite enlaces web HTTP o HTTPS. La carga de archivos se gestiona en CU20.</span></label>
        </div>
        <div className="flex justify-end border-t border-outline-variant/30 pt-4"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"><span className="material-symbols-outlined">save</span>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar noticia'}</button></div>
      </form>

      <section className="space-y-4">
        <div className="grid gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:grid-cols-[1fr_220px_auto]"><input className={inputClass} aria-label="Buscar noticias" placeholder="Buscar por título o contenido…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={inputClass} aria-label="Filtrar noticias por estado" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}><option value="">Todos los estados</option>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={load} className="rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold text-primary">Actualizar</button></div>
        {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando noticias…</p> : news.length === 0 ? <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay noticias que coincidan con los filtros.</div> : (
          <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-outline"><tr><th className="px-5 py-4">Noticia</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Fecha de publicación</th><th className="px-5 py-4">Material</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-outline-variant/25">{news.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-bold text-primary">{item.titulo}</p><p className="mt-1 max-w-xl line-clamp-2 text-xs text-on-surface-variant">{item.contenido}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.estado === 'publicado' ? 'bg-emerald-50 text-emerald-800' : item.estado === 'retirada' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>{ESTADOS.find(([value]) => value === item.estado)?.[1] || item.estado}</span></td><td className="px-5 py-4 text-xs text-on-surface-variant">{formatDate(item.fecha_publicacion)}</td><td className="px-5 py-4">{item.material_url ? <a href={item.material_url} target="_blank" rel="noreferrer" className="font-semibold text-secondary hover:underline">Abrir enlace</a> : '—'}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => startEdit(item)} className="rounded-md px-3 py-2 font-bold text-primary hover:bg-surface-container-low"><span className="material-symbols-outlined align-middle text-lg">edit</span> Editar</button></td></tr>)}</tbody></table></div></div>
        )}
      </section>
    </section>
  );
}
