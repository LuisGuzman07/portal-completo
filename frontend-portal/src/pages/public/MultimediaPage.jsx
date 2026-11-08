import React, { useEffect, useState } from 'react';
import { multimediaService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function message(error) { return error?.data?.detail || error?.message || 'No se pudo cargar el catálogo multimedia.'; }

export default function MultimediaPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    multimediaService.publicList(search.trim() ? { search: search.trim() } : {})
      .then((result) => { if (active) setItems(Array.isArray(result) ? result : result.results || []); })
      .catch((requestError) => { if (active) setError(message(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, isAuthenticated]);

  const download = async (item) => {
    setDownloadError('');
    try { await multimediaService.download(item.id, `${item.titulo || 'recurso'}.${item.tipo || 'bin'}`); }
    catch (downloadFailure) { setDownloadError(message(downloadFailure)); }
  };

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop">
      <div className="mx-auto max-w-[1200px] space-y-7">
        <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Biblioteca audiovisual</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">Contenido multimedia</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">Conferencias, entrevistas, podcasts y materiales publicados por ABOCCRIM. Algunos recursos requieren iniciar sesión como miembro acreditado.</p></header>
        <label className="block rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"><span className="sr-only">Buscar contenido multimedia</span><input className="w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Buscar por título, descripción, evento o noticia…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        {error && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
        {downloadError && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{downloadError}</div>}
        {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando recursos…</p> : items.length === 0 ? <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay recursos disponibles que coincidan con la búsqueda.</div> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-sm"><div className="flex items-start gap-3"><span className="material-symbols-outlined rounded-xl bg-primary/5 p-3 text-2xl text-primary">{item.tipo === 'enlace' ? 'open_in_new' : item.tipo?.startsWith('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(item.tipo) ? 'headphones' : item.tipo === 'pdf' ? 'picture_as_pdf' : 'play_circle'}</span><div className="min-w-0"><h2 className="break-words font-bold text-primary">{item.titulo}</h2><p className="mt-1 text-xs text-on-surface-variant">{item.nivel_acceso === 'miembros' ? 'Miembros acreditados' : item.nivel_acceso === 'restringido' ? 'Acceso restringido' : 'Acceso público'}</p></div></div><p className="mt-4 flex-1 whitespace-pre-line break-words text-sm leading-6 text-on-surface-variant">{item.descripcion || 'Recurso multimedia institucional.'}</p>{(item.evento_titulo || item.noticia_titulo) && <p className="mt-3 text-xs text-on-surface-variant">{item.evento_titulo ? `Evento: ${item.evento_titulo}` : `Noticia: ${item.noticia_titulo}`}</p>}<div className="mt-5 border-t border-outline-variant/25 pt-4">{item.enlace_externo ? <a href={item.enlace_externo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline">Abrir recurso externo<span className="material-symbols-outlined text-lg">open_in_new</span></a> : <button type="button" onClick={() => download(item)} className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline"><span className="material-symbols-outlined text-lg">download</span>Descargar archivo</button>}</div></article>)}</div>
        )}
      </div>
    </section>
  );
}
