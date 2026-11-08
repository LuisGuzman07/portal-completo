import React, { useEffect, useState } from 'react';
import { agreementService } from '../../services/api';

function message(error) { return error?.data?.detail || error?.message || 'No se pudieron cargar los convenios.'; }
function listOf(result) { return Array.isArray(result) ? result : result?.results || []; }
function formatDate(value) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-BO', { dateStyle: 'long' }) : 'Sin fecha final'; }

export default function ConveniosPage() {
  const [agreements, setAgreements] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    agreementService.publicList(search.trim() ? { search: search.trim() } : {})
      .then((result) => { if (active) setAgreements(listOf(result)); })
      .catch((requestError) => { if (active) setError(message(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search]);

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop">
      <div className="mx-auto max-w-[1100px] space-y-7">
        <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Cooperación institucional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">Convenios ABOCCRIM</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">Acuerdos institucionales vigentes cuya información ha sido autorizada para difusión pública.</p></header>
        <label className="block rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"><span className="sr-only">Buscar convenios</span><input className="w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Buscar por institución, país u objeto…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        {error && <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
        {loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando convenios…</p> : agreements.length === 0 ? <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-12 text-center text-sm text-on-surface-variant">No hay convenios públicos vigentes que coincidan con la búsqueda.</div> : <div className="grid gap-4 md:grid-cols-2">{agreements.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="material-symbols-outlined rounded-xl bg-primary/5 p-3 text-2xl text-primary">handshake</span><div className="min-w-0"><h2 className="break-words text-lg font-bold text-primary">{item.institucion.nombre}</h2><p className="mt-1 text-xs text-on-surface-variant">{item.institucion.pais || 'Institución colaboradora'}</p></div></div><p className="mt-4 flex-1 whitespace-pre-line break-words text-sm leading-6 text-on-surface-variant">{item.objeto}</p><p className="mt-4 text-xs text-on-surface-variant">Vigencia: {formatDate(item.fecha_inicio)} – {formatDate(item.fecha_fin)}</p>{item.institucion.sitio_web && <a href={item.institucion.sitio_web} target="_blank" rel="noopener noreferrer" className="mt-3 w-fit text-sm font-semibold text-secondary hover:underline">Sitio de la institución contraparte</a>}{(item.documento_url || item.documento_externo) && <a href={item.documento_url || item.documento_externo} target={item.documento_externo ? '_blank' : undefined} rel={item.documento_externo ? 'noopener noreferrer' : undefined} className="mt-4 inline-flex w-fit items-center gap-2 border-t border-outline-variant/25 pt-4 text-sm font-bold text-secondary hover:underline"><span className="material-symbols-outlined text-lg">{item.documento_externo ? 'open_in_new' : 'download'}</span>{item.documento_externo ? 'Consultar referencia documental' : 'Descargar documento autorizado'}</a>}</article>)}</div>}
      </div>
    </section>
  );
}
