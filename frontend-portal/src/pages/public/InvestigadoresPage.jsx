import React, { useEffect, useState } from 'react';
import { investigatorService } from '../../services/api';

function getMessage(error) {
  return error?.data?.detail || error?.message || 'No se pudo cargar el directorio de investigadores.';
}

function ProfileCard({ investigator, onOpen }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
          {`${investigator.nombres?.[0] || ''}${investigator.apellidos?.[0] || ''}`.toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-primary">{investigator.nombres} {investigator.apellidos}</h2>
          <p className="mt-1 text-xs text-on-surface-variant">{investigator.grado_academico || 'Investigador'}{investigator.especialidad ? ` · ${investigator.especialidad}` : ''}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-on-surface-variant">{investigator.institucion || 'Institución no especificada'}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {investigator.areas?.length ? investigator.areas.map((area) => <span key={area.id} className="rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">{area.nombre}</span>) : <span className="text-xs text-outline">Áreas temáticas no especificadas</span>}
      </div>
      <button type="button" onClick={() => onOpen(investigator.id)} className="mt-auto inline-flex items-center gap-1 self-start pt-5 text-sm font-bold text-primary hover:underline">
        Ver perfil completo <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </article>
  );
}

export default function InvestigadoresPage() {
  const [investigators, setInvestigators] = useState([]);
  const [areas, setAreas] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    investigatorService.publicAreas()
      .then((response) => setAreas(Array.isArray(response) ? response : (response.results || [])))
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    investigatorService.publicList({ ...(search && { search }), ...(area && { area }), page })
      .then((response) => {
        if (!current) return;
        const rows = Array.isArray(response) ? response : (response.results || []);
        setInvestigators(rows);
        setCount(response.count ?? rows.length);
        setNext(response.next || null);
        setPrevious(response.previous || null);
      })
      .catch((requestError) => { if (current) setError(getMessage(requestError)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [search, area, page]);

  const openProfile = async (id) => {
    setSelected({ loading: true });
    setDetailLoading(true);
    try {
      setSelected(await investigatorService.publicDetail(id));
    } catch (requestError) {
      setSelected({ error: getMessage(requestError) });
    } finally {
      setDetailLoading(false);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop">
      <div className="mx-auto max-w-[1200px] space-y-7">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Directorio académico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">Investigadores ABOCCRIM</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">Consulta perfiles académicos que sus titulares y la institución han autorizado publicar en el directorio.</p>
        </header>

        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 md:p-5">
          <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[1fr_260px_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar investigadores</span>
              <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nombre, especialidad, institución o área…" className="w-full rounded-xl bg-surface-container-low py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </label>
            <label>
              <span className="sr-only">Filtrar por área temática</span>
              <select value={area} onChange={(event) => { setArea(event.target.value); setPage(1); }} className="w-full rounded-xl bg-surface-container-low px-3 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Todas las áreas</option>
                {areas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:opacity-90"><span className="material-symbols-outlined text-lg">search</span>Buscar</button>
          </form>
          <p className="mt-3 text-xs text-outline">{loading ? 'Buscando perfiles…' : `${count} perfil${count === 1 ? '' : 'es'} publicado${count === 1 ? '' : 's'}`}</p>
        </div>

        {error && <p role="alert" className="rounded-xl bg-error-container/50 px-4 py-3 text-sm text-error">{error}</p>}
        {loading ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-white p-12 text-center text-sm text-on-surface-variant">Cargando directorio…</div>
        ) : investigators.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investigators.map((investigator) => <ProfileCard key={investigator.id} investigator={investigator} onOpen={openProfile} />)}
          </div>
        ) : !error ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-14 text-center">
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-outline">person_search</span>
            <h2 className="mt-3 text-lg font-bold text-primary">No se encontraron perfiles</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Prueba con otro nombre o selecciona una área temática distinta.</p>
          </div>
        ) : null}

        {(next || previous) && <nav aria-label="Paginación de investigadores" className="flex items-center justify-center gap-3">
          <button type="button" disabled={!previous || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-outline-variant/30 bg-white px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40">Anterior</button>
          <span className="text-xs text-on-surface-variant">Página {page}</span>
          <button type="button" disabled={!next || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-outline-variant/30 bg-white px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40">Siguiente</button>
        </nav>}
      </div>

      {selected && <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-on-surface/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="public-investigator-name" className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-2xl md:p-8">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-widest text-secondary">Perfil de investigador</p><h2 id="public-investigator-name" className="mt-1 text-2xl font-bold text-primary">{selected.nombres} {selected.apellidos}</h2></div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar perfil" className="rounded-lg p-2 text-outline hover:bg-surface-container-low"><span className="material-symbols-outlined">close</span></button>
          </div>
          {detailLoading || selected.loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Cargando perfil…</p> : selected.error ? <p role="alert" className="rounded-lg bg-error-container/50 p-4 text-sm text-error">{selected.error}</p> : <>
            <div className="grid gap-4 rounded-xl bg-surface-container-low p-4 sm:grid-cols-2">
              <p><span className="block text-xs font-bold uppercase text-outline">Grado académico</span><span className="mt-1 block text-sm text-on-surface">{selected.grado_academico || 'No especificado'}</span></p>
              <p><span className="block text-xs font-bold uppercase text-outline">Institución</span><span className="mt-1 block text-sm text-on-surface">{selected.institucion || 'No especificada'}</span></p>
              <p><span className="block text-xs font-bold uppercase text-outline">Especialidad</span><span className="mt-1 block text-sm text-on-surface">{selected.especialidad || 'No especificada'}</span></p>
              <p><span className="block text-xs font-bold uppercase text-outline">ORCID</span>{selected.orcid ? <a className="mt-1 block text-sm font-semibold text-primary underline" href={`https://orcid.org/${selected.orcid}`} target="_blank" rel="noreferrer">{selected.orcid}</a> : <span className="mt-1 block text-sm text-on-surface">No proporcionado</span>}</p>
            </div>
            <section className="mt-5"><h3 className="text-sm font-bold text-primary">Áreas temáticas</h3><div className="mt-2 flex flex-wrap gap-2">{selected.areas?.length ? selected.areas.map((item) => <span key={item.id} className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">{item.nombre}</span>) : <span className="text-sm text-on-surface-variant">Sin áreas registradas.</span>}</div></section>
            <section className="mt-5"><h3 className="text-sm font-bold text-primary">Biografía académica</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{selected.biografia || 'No hay una biografía publicada.'}</p></section>
            <section className="mt-6 border-t border-outline-variant/20 pt-5"><h3 className="text-sm font-bold text-primary">Publicaciones relacionadas</h3>{selected.publicaciones?.length ? <ul className="mt-3 space-y-3">{selected.publicaciones.map((publication) => <li key={publication.id} className="rounded-xl border border-outline-variant/20 p-4"><p className="font-semibold text-on-surface">{publication.titulo}</p><p className="mt-1 text-xs text-on-surface-variant">{publication.anio || (publication.fecha_publicacion ? new Date(publication.fecha_publicacion).getFullYear() : '')}{publication.doi ? ` · DOI: ${publication.doi}` : ''}</p>{publication.resumen && <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">{publication.resumen}</p>}</li>)}</ul> : <p className="mt-2 text-sm text-on-surface-variant">Aún no hay publicaciones aprobadas y vinculadas a este perfil.</p>}</section>
          </>}
        </section>
      </div>}
    </section>
  );
}
