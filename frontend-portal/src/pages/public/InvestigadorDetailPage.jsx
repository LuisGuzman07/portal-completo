import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { investigatorService } from '../../services/api';

function getInitials(nombres = '', apellidos = '') {
  const n = nombres.trim() ? nombres.trim()[0] : '';
  const a = apellidos.trim() ? apellidos.trim()[0] : '';
  return `${n}${a}`.toUpperCase() || 'AB';
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Genera un gradiente o diseño temático para la miniatura según el id
const CARD_THEMES = [
  { bg: 'from-slate-900 to-slate-800', accent: 'text-amber-400', icon: 'shield' },
  { bg: 'from-amber-700 to-orange-600', accent: 'text-amber-100', icon: 'menu_book' },
  { bg: 'from-indigo-950 to-blue-900', accent: 'text-blue-300', icon: 'biotech' },
  { bg: 'from-emerald-900 to-teal-800', accent: 'text-emerald-200', icon: 'balance' },
  { bg: 'from-neutral-900 to-stone-800', accent: 'text-stone-300', icon: 'psychology' },
];

export default function InvestigadorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [investigator, setInvestigator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pubs'); // 'pubs' | 'areas'

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');

    investigatorService
      .publicDetail(id)
      .then((data) => {
        if (current) setInvestigator(data);
      })
      .catch((err) => {
        if (current) {
          setError(
            err?.data?.detail ||
              err?.message ||
              'No se pudo cargar el perfil del investigador o no está disponible en el directorio.'
          );
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-20 px-4">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">
          progress_activity
        </span>
        <p className="mt-3 text-sm font-semibold text-primary">
          Cargando perfil académico del investigador...
        </p>
      </div>
    );
  }

  if (error || !investigator) {
    return (
      <div className="max-w-3xl mx-auto w-full py-16 px-4">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center space-y-4 shadow-sm">
          <span className="material-symbols-outlined text-5xl text-outline">person_off</span>
          <h2 className="text-xl font-bold text-primary">Perfil No Disponible</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">{error}</p>
          <div className="pt-2">
            <Link
              to="/investigadores"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Regresar al Directorio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${investigator.nombres || ''} ${investigator.apellidos || ''}`.trim();
  const initials = getInitials(investigator.nombres, investigator.apellidos);
  const publications = investigator.publicaciones || [];

  return (
    <div className="flex flex-col w-full flex-1 bg-surface py-8 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1000px] mx-auto w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Link
            to="/investigadores"
            className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Directorio de Investigadores</span>
          </Link>
          <span>/</span>
          <span className="text-primary font-medium truncate">{fullName}</span>
        </div>

        {/* HERO PROFILE SECTION (Inspired by Max Knabe layout) */}
        <header className="bg-surface-container-lowest border border-outline-variant/25 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs">
          <div className="flex flex-col-reverse md:flex-row items-start justify-between gap-6 md:gap-8">
            {/* Left text column */}
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                {/* Category Badge & Degree */}
                <div className="flex items-center gap-2 flex-wrap">
                  {investigator.categoria_miembro && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      {investigator.categoria_miembro}
                    </span>
                  )}
                  {investigator.grado_academico && (
                    <span className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-on-surface text-xs font-semibold">
                      {investigator.grado_academico}
                    </span>
                  )}
                  {investigator.especialidad && (
                    <span className="px-2.5 py-0.5 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                      {investigator.especialidad}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary">
                  {fullName}
                </h1>

                {investigator.institucion && (
                  <p className="text-sm font-semibold text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">corporate_fare</span>
                    <span>{investigator.institucion}</span>
                  </p>
                )}
              </div>

              {/* Bio summary */}
              {investigator.biografia ? (
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed font-normal">
                  {investigator.biografia}
                </p>
              ) : (
                <p className="text-sm text-outline italic">
                  Investigador acreditado por la Academia Boliviana de Ciencias Criminológicas.
                </p>
              )}

              {/* Areas badges */}
              {investigator.areas?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider mr-1">
                    Líneas:
                  </span>
                  {investigator.areas.map((area) => (
                    <span
                      key={area.id}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-primary text-xs font-medium"
                    >
                      {area.nombre}
                    </span>
                  ))}
                </div>
              )}

              {/* Institution affiliation & link badges (NO ORCID as strictly instructed) */}
              <div className="pt-2 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                {investigator.fecha_alta && (
                  <div className="flex items-center gap-1 text-outline">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span>Adscrito desde: {formatDate(investigator.fecha_alta)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>Perfil Acreditado ABOCCRIM</span>
                </div>
              </div>
            </div>

            {/* Right Avatar column: Large Circle with initials (Max Knabe style) */}
            <div className="shrink-0 self-center md:self-start">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-md border-4 border-surface">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* TABS NAVIGATION BAR */}
        <div className="border-b border-outline-variant/30 flex items-center gap-6 text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pubs')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pubs'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span>Todos los pubs</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-semibold">
              {publications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('areas')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'areas'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span>Áreas temáticas</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-semibold">
              {investigator.areas?.length || 0}
            </span>
          </button>
        </div>

        {/* TAB CONTENT: PUBLICATIONS */}
        {activeTab === 'pubs' && (
          <div className="space-y-4">
            {publications.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-10 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-outline">description</span>
                <p className="text-sm font-semibold text-primary">
                  No hay publicaciones indexadas actualmente para este investigador.
                </p>
                <p className="text-xs text-outline">
                  Los trabajos aprobados por el comité editorial se listarán automáticamente en este perfil.
                </p>
              </div>
            ) : (
              publications.map((pub, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                const dateDisplay = formatDate(pub.fecha_publicacion);

                return (
                  <article
                    key={pub.id}
                    className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row group"
                  >
                    {/* Left Graphic Thumbnail (Knabe style: dark/gradient with emblem/icon) */}
                    <div
                      className={`sm:w-48 md:w-56 shrink-0 bg-gradient-to-br ${theme.bg} p-6 flex flex-col items-center justify-center text-center relative overflow-hidden`}
                    >
                      <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-xs">
                        <span className={`material-symbols-outlined text-3xl ${theme.accent}`}>
                          {theme.icon}
                        </span>
                      </div>
                      <span className="mt-3 text-[10px] uppercase font-mono font-bold tracking-widest text-white/70">
                        {pub.tipo_nombre || 'ABOCCRIM'}
                      </span>
                    </div>

                    {/* Right Details */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        {/* Title linking to repository detail */}
                        <h2 className="text-base sm:text-lg font-bold text-primary group-hover:text-primary-hover leading-snug">
                          <Link to={`/repositorio/${pub.id}`} className="hover:underline">
                            {pub.titulo}
                          </Link>
                        </h2>

                        {/* Authors line */}
                        <div className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                          <span className="text-outline italic">por</span>
                          {pub.autores && pub.autores.length > 0 ? (
                            <span className="font-semibold text-on-surface">
                              {pub.autores.map((a) => a.nombre_completo).join(', ')}
                            </span>
                          ) : (
                            <span className="font-semibold text-on-surface">{fullName}</span>
                          )}
                        </div>

                        {/* Coauthors avatar bubbles (similar to visual prompt) */}
                        {pub.autores && pub.autores.length > 0 && (
                          <div className="flex items-center gap-1 pt-1">
                            {pub.autores.slice(0, 5).map((a, aIdx) => {
                              const inits = a.nombre_completo
                                .split(' ')
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')
                                .toUpperCase();
                              return (
                                <div
                                  key={aIdx}
                                  title={a.nombre_completo}
                                  className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white"
                                >
                                  {inits}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Abstract snippet */}
                        {pub.resumen && (
                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed pt-1">
                            {pub.resumen}
                          </p>
                        )}
                      </div>

                      {/* Bottom row: publication date & link to /repositorio/:id */}
                      <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs">
                        <div className="text-outline text-[11px]">
                          {dateDisplay ? (
                            <span>Publicado: {dateDisplay}</span>
                          ) : pub.anio ? (
                            <span>Año: {pub.anio}</span>
                          ) : null}
                        </div>

                        <Link
                          to={`/repositorio/${pub.id}`}
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                        >
                          <span>Ver publicación completa</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB CONTENT: THEMATIC AREAS */}
        {activeTab === 'areas' && (
          <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-primary">Líneas y Áreas de Especialización</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              El investigador está adscrito a las siguientes líneas temáticas dentro de la estructura científica de ABOCCRIM:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {investigator.areas?.map((area) => (
                <div
                  key={area.id}
                  className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1"
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-base">science</span>
                    <span>{area.nombre}</span>
                  </div>
                  {area.descripcion && (
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {area.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
