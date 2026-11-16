import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { investigatorService } from '../../services/api';

function getMessage(error) {
  return error?.data?.detail || error?.message || 'No se pudo cargar el directorio de investigadores.';
}

function ProfileCard({ investigator }) {
  const initials = `${investigator.nombres?.[0] || ''}${investigator.apellidos?.[0] || ''}`.toUpperCase();

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 group">
      <div>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-primary group-hover:text-primary-hover leading-snug">
              <Link to={`/investigadores/${investigator.id}`} className="hover:underline">
                {investigator.nombres} {investigator.apellidos}
              </Link>
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              {investigator.grado_academico || 'Investigador'}
              {investigator.especialidad ? ` · ${investigator.especialidad}` : ''}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold text-secondary flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">corporate_fare</span>
          <span>{investigator.institucion || 'Institución no especificada'}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {investigator.areas?.length ? (
            investigator.areas.map((area) => (
              <span
                key={area.id}
                className="rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary"
              >
                {area.nombre}
              </span>
            ))
          ) : (
            <span className="text-xs text-outline">Áreas temáticas no especificadas</span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-outline-variant/15">
        <Link
          to={`/investigadores/${investigator.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <span>Ver perfil y publicaciones</span>
          <span aria-hidden="true" className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </Link>
      </div>
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

  useEffect(() => {
    investigatorService
      .publicAreas()
      .then((response) => setAreas(Array.isArray(response) ? response : (response.results || [])))
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    investigatorService
      .publicList({ ...(search && { search }), ...(area && { area }), page })
      .then((response) => {
        if (!current) return;
        const rows = Array.isArray(response) ? response : (response.results || []);
        setInvestigators(rows);
        setCount(response.count ?? rows.length);
        setNext(response.next || null);
        setPrevious(response.previous || null);
      })
      .catch((requestError) => {
        if (current) setError(getMessage(requestError));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [search, area, page]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-margin-mobile py-space-xl md:px-margin-desktop">
      <div className="mx-auto max-w-[1200px] space-y-7">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Directorio académico
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Investigadores ABOCCRIM
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
            Consulta los perfiles académicos de los investigadores y miembros acreditados por la Academia Boliviana de Ciencias Criminológicas.
          </p>
        </header>

        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 md:p-5 shadow-xs">
          <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[1fr_260px_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar investigadores</span>
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre, especialidad o institución…"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low py-2.5 pl-10 pr-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="sr-only">Filtrar por área</span>
              <select
                value={area}
                onChange={(event) => {
                  setArea(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas las áreas temáticas</option>
                {areas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-all shadow-xs"
              >
                Buscar
              </button>
              {(search || area) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setArea('');
                    setPage(1);
                  }}
                  className="rounded-xl border border-outline-variant/30 px-3 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-error/20 bg-error-container/40 p-4 text-sm text-error"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-20 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary">
              progress_activity
            </span>
            <span>Cargando directorio de investigadores…</span>
          </div>
        ) : investigators.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investigators.map((investigator) => (
              <ProfileCard key={investigator.id} investigator={investigator} />
            ))}
          </div>
        ) : !error ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-14 text-center">
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-outline">
              person_search
            </span>
            <h2 className="mt-3 text-lg font-bold text-primary">No se encontraron perfiles</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Prueba con otro nombre o selecciona un área temática distinta.
            </p>
          </div>
        ) : null}

        {(next || previous) && (
          <nav
            aria-label="Paginación de investigadores"
            className="flex items-center justify-center gap-3 pt-4"
          >
            <button
              type="button"
              disabled={!previous || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs text-on-surface-variant">Página {page}</span>
            <button
              type="button"
              disabled={!next || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Siguiente
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
