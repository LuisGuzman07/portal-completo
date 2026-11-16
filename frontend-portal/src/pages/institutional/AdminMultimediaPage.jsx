import React, { useEffect, useState } from 'react';
import { eventService, multimediaService, newsService } from '../../services/api';

const EMPTY = { titulo: '', descripcion: '', nivel_acceso: 'publico', parent: '', enlace: '', archivo: null, modo: 'enlace' };
const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const accessLabels = { publico: 'Público', miembros: 'Miembros acreditados', restringido: 'Restringido' };

function message(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

export default function AdminMultimediaPage() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (accessFilter) params.nivel_acceso = accessFilter;
      const result = await multimediaService.list(params);
      setItems(Array.isArray(result) ? result : result.results || []);
    } catch (loadError) { setError(message(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    Promise.all([eventService.list(), newsService.list()]).then(([eventResult, newsResult]) => {
      setEvents(Array.isArray(eventResult) ? eventResult : eventResult.results || []);
      setNews(Array.isArray(newsResult) ? newsResult : newsResult.results || []);
    }).catch((loadError) => setError(message(loadError)));
  }, []);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [search, accessFilter]);

  const reset = () => { setEditing(null); setForm(EMPTY); };
  const startEdit = (item) => {
    setEditing(item);
    setForm({
      titulo: item.titulo || '', descripcion: item.descripcion || '', nivel_acceso: item.nivel_acceso || 'publico',
      parent: item.evento_id ? `evento:${item.evento_id}` : item.noticia_id ? `noticia:${item.noticia_id}` : '',
      enlace: item.enlace_externo || '', archivo: null, modo: item.es_archivo ? 'archivo' : 'enlace',
    });
    setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (submitEvent) => {
    submitEvent.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const [parentType, parentId] = form.parent ? form.parent.split(':') : ['', ''];
    const data = new FormData();
    data.append('titulo', form.titulo.trim());
    data.append('descripcion', form.descripcion.trim());
    data.append('nivel_acceso', form.nivel_acceso);
    data.append('evento_id', parentType === 'evento' ? parentId : '');
    data.append('noticia_id', parentType === 'noticia' ? parentId : '');
    if (form.archivo) data.append('archivo', form.archivo);
    if (form.modo === 'enlace' && form.enlace.trim()) data.append('enlace', form.enlace.trim());
    try {
      if (editing) await multimediaService.update(editing.id, data);
      else await multimediaService.create(data);
      setNotice(editing ? 'Los cambios del recurso se guardaron.' : 'El recurso multimedia se registró.');
      reset(); await load();
    } catch (saveError) { setError(message(saveError)); }
    finally { setSaving(false); }
  };

  const deleteBlocked = (item) => item.tipo === 'enlace_noticia';

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Gestión institucional · Multimedia</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Contenido multimedia</h1><p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Administra conferencias, entrevistas, podcasts y material audiovisual. Puedes asociarlo a un evento o noticia.</p></div>
        <a href="/multimedia" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary"><span className="material-symbols-outlined">open_in_new</span> Ver catálogo público</a>
      </header>

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-primary">{editing ? 'Editar recurso' : 'Registrar recurso'}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline">Cancelar edición</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Título <span className="text-error">*</span><input className={inputClass} maxLength={250} required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface md:col-span-2">Descripción<textarea className={`${inputClass} min-h-24 resize-y`} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Contexto del recurso, participantes o tema tratado." /></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Asociar a evento o noticia<select className={inputClass} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}><option value="">Sin asociación</option><optgroup label="Eventos">{events.map((item) => <option key={`e${item.id}`} value={`evento:${item.id}`}>{item.titulo}</option>)}</optgroup><optgroup label="Noticias">{news.map((item) => <option key={`n${item.id}`} value={`noticia:${item.id}`}>{item.titulo}</option>)}</optgroup></select><span className="block text-xs font-normal text-on-surface-variant">Si se asocia, el recurso solo será visible cuando el contenido relacionado esté publicado.</span></label>
          <label className="space-y-1.5 text-sm font-semibold text-on-surface">Acceso<select className={inputClass} value={form.nivel_acceso} onChange={(e) => setForm({ ...form, nivel_acceso: e.target.value })}><option value="publico">Público</option><option value="miembros">Miembros acreditados</option><option value="restringido">Restringido (administración y comité)</option></select></label>
          <fieldset className="space-y-3 md:col-span-2"><legend className="text-sm font-semibold text-on-surface">Origen del contenido <span className="text-error">*</span></legend><div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><label className="inline-flex items-center gap-2"><input type="radio" name="modo" value="enlace" checked={form.modo === 'enlace'} onChange={() => setForm({ ...form, modo: 'enlace' })} /> Enlace web</label><label className="inline-flex items-center gap-2"><input type="radio" name="modo" value="archivo" checked={form.modo === 'archivo'} onChange={() => setForm({ ...form, modo: 'archivo' })} /> Subir archivo</label></div>
            {form.modo === 'enlace' ? <label className="block space-y-1.5 text-sm font-semibold text-on-surface">Enlace HTTPS o HTTP{(!editing || editing.es_archivo || !editing.enlace_externo) && <span className="text-error"> *</span>}<input className={inputClass} type="url" maxLength={500} required={!editing || editing.es_archivo || !editing.enlace_externo} value={form.enlace} onChange={(e) => setForm({ ...form, enlace: e.target.value })} placeholder="https://..." /><span className="block text-xs font-normal text-on-surface-variant">El portal valida el formato del enlace. La disponibilidad depende del servicio externo.</span></label> : <label className="block space-y-1.5 text-sm font-semibold text-on-surface">Archivo audiovisual o documento{(!editing || !editing.es_archivo) && <span className="text-error"> *</span>}<input className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary`} type="file" accept=".jpg,.jpeg,.png,.webp,.mp3,.wav,.ogg,.m4a,.mp4,.mov,.webm,.pdf" required={(!editing || !editing.es_archivo) && !form.archivo} onChange={(e) => setForm({ ...form, archivo: e.target.files?.[0] || null })} /><span className="block text-xs font-normal text-on-surface-variant">Hasta 50 MB. Formatos permitidos: imagen, audio, video y PDF.</span>{editing?.es_archivo && <span className="block text-xs font-normal text-on-surface-variant">Si no seleccionas otro archivo, se conserva el actual.</span>}</label>}
          </fieldset>
        </div>
        <div className="flex justify-end border-t border-outline-variant/30 pt-4"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"><span className="material-symbols-outlined">save</span>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar recurso'}</button></div>
      </form>

      <section className="space-y-4">
        <div className="grid gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]"><input className={inputClass} aria-label="Buscar recursos multimedia" placeholder="Buscar por título, descripción, evento o noticia…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={inputClass} aria-label="Filtrar por nivel de acceso" value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)}><option value="">Todos los accesos</option>{Object.entries(accessLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={load} className="rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold text-primary">Actualizar</button></div>
        {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando recursos…</p> : items.length === 0 ? <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay recursos multimedia que coincidan con los filtros.</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-secondary">{item.es_archivo ? `Archivo ${item.tipo}` : 'Enlace externo'}</p><h3 className="mt-1 break-words font-bold text-primary">{item.titulo}</h3></div><span className="shrink-0 rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-semibold">{accessLabels[item.nivel_acceso] || item.nivel_acceso}</span></div><p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-on-surface-variant">{item.descripcion || 'Sin descripción.'}</p><p className="mt-3 text-xs text-on-surface-variant">{item.evento_titulo ? `Evento: ${item.evento_titulo}` : item.noticia_titulo ? `Noticia: ${item.noticia_titulo}` : 'Sin asociación'}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/25 pt-4"><span className="text-xs text-on-surface-variant">{item.tipo === 'enlace_noticia' ? 'Gestionado desde Noticias' : `Cargado por ${item.cargado_por_nombre || 'administración'}`}</span>{deleteBlocked(item) ? <span className="text-xs font-semibold text-outline">Editar en Noticias</span> : <button type="button" onClick={() => startEdit(item)} className="rounded-md px-3 py-2 text-sm font-bold text-primary hover:bg-surface-container-low"><span className="material-symbols-outlined mr-1 align-middle text-lg">edit</span>Editar</button>}</div></article>)}</div>}
      </section>
    </section>
  );
}
