import React, { useEffect, useState } from 'react';
import { newsService } from '../../services/api';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('es-BO', { dateStyle: 'long' }) : '';
}

export default function NoticiasPage() {
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    newsService.publicList(search.trim() ? { search: search.trim() } : {})
      .then((response) => { if (active) setNews(Array.isArray(response) ? response : response.results || []); })
      .catch((requestError) => { if (active) setError(requestError?.data?.detail || requestError?.message || 'No se pudieron cargar las noticias.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search]);

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop"><div className="mx-auto max-w-[1000px] space-y-7">
      <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Información oficial</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">Noticias institucionales</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">Comunicados y novedades publicados por ABOCCRIM.</p></header>
      <label className="block rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"><span className="sr-only">Buscar noticias</span><input className="w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Buscar por título o contenido…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {error && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
      {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando noticias…</p> : news.length === 0 ? <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay noticias publicadas que coincidan con la búsqueda.</div> : (
        <div className="space-y-4">{news.map((item) => <article key={item.id} className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-sm md:p-8"><p className="text-xs font-semibold uppercase tracking-wide text-secondary">{formatDate(item.fecha_publicacion)}</p><h2 className="mt-2 text-xl font-bold text-primary">{item.titulo}</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-on-surface-variant">{item.contenido}</p>{item.material_url && <a href={item.material_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline"><span className="material-symbols-outlined text-lg">attach_file</span>Material complementario</a>}{item.recursos_multimedia?.length > 0 && <div className="mt-5 border-t border-outline-variant/25 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-outline">Contenido relacionado</p><div className="flex flex-wrap gap-x-4 gap-y-2">{item.recursos_multimedia.map((resource) => <a key={resource.id} href={resource.enlace_externo || resource.descarga_url} target={resource.enlace_externo ? '_blank' : undefined} rel={resource.enlace_externo ? 'noopener noreferrer' : undefined} className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-secondary hover:underline"><span className="material-symbols-outlined text-lg">{resource.enlace_externo ? 'open_in_new' : 'download'}</span><span className="break-words">{resource.titulo}</span></a>)}</div></div>}</article>)}</div>
      )}
    </div></section>
  );
}
