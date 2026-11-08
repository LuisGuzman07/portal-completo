import React, { useEffect, useState } from 'react';
import { eventService } from '../../services/api';

function eventDate(value) {
  return new Date(value).toLocaleString('es-BO', { dateStyle: 'full', timeStyle: 'short' });
}

export default function EventosPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    eventService.publicList(search.trim() ? { search: search.trim() } : {})
      .then((response) => { if (active) setEvents(Array.isArray(response) ? response : response.results || []); })
      .catch((requestError) => { if (active) setError(requestError?.data?.detail || requestError?.message || 'No se pudieron cargar los eventos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search]);

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop"><div className="mx-auto max-w-[1200px] space-y-7">
      <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Agenda académica</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">Eventos ABOCCRIM</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">Actividades académicas publicadas por la institución.</p></header>
      <label className="block rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"><span className="sr-only">Buscar eventos</span><input className="w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Buscar por actividad, descripción o lugar…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {error && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
      {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando agenda…</p> : events.length === 0 ? <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay eventos publicados que coincidan con la búsqueda.</div> : (
        <div className="grid gap-4 md:grid-cols-2">{events.map((event) => <article key={event.id} className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-sm"><div className="flex items-start gap-3"><span className="material-symbols-outlined rounded-xl bg-primary/5 p-3 text-2xl text-primary">event</span><div className="min-w-0"><h2 className="text-lg font-bold text-primary">{event.titulo}</h2><p className="mt-1 text-xs text-on-surface-variant">{eventDate(event.fecha_inicio)}{event.fecha_fin ? ` · hasta ${eventDate(event.fecha_fin)}` : ''}</p></div></div>{event.descripcion && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-on-surface-variant">{event.descripcion}</p>}{event.lugar && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-on-surface"><span className="material-symbols-outlined text-lg text-secondary">location_on</span>{event.lugar}</p>}{event.recursos_multimedia?.length > 0 && <div className="mt-5 border-t border-outline-variant/25 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-outline">Material relacionado</p><div className="flex flex-wrap gap-x-4 gap-y-2">{event.recursos_multimedia.map((resource) => <a key={resource.id} href={resource.enlace_externo || resource.descarga_url} target={resource.enlace_externo ? '_blank' : undefined} rel={resource.enlace_externo ? 'noopener noreferrer' : undefined} className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-secondary hover:underline"><span className="material-symbols-outlined text-lg">{resource.enlace_externo ? 'open_in_new' : 'download'}</span><span className="break-words">{resource.titulo}</span></a>)}</div></div>}</article>)}</div>
      )}
    </div></section>
  );
}
