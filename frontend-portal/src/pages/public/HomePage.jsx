import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { repositoryService, eventService, multimediaService } from '../../services/api';

function formatEventDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return {
    day: d.getDate(),
    month: d.toLocaleString('es-BO', { month: 'short' }).toUpperCase(),
    full: d.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }),
  };
}

function formatPubDate(dateStr, anio) {
  if (dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      // fallback
    }
  }
  return anio ? `Año ${anio}` : 'Reciente';
}

function isVideoType(tipo = '', url = '') {
  const t = (tipo || '').toLowerCase();
  const u = (url || '').toLowerCase();
  return ['mp4', 'webm', 'mov', 'video'].some((ext) => t.includes(ext) || u.includes(`.${ext}`));
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  const [publications, setPublications] = useState([]);
  const [latestEvent, setLatestEvent] = useState(null);
  const [latestMedia, setLatestMedia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      repositoryService.list(),
      eventService.publicList(),
      multimediaService.publicList(),
    ]).then(([pubsRes, eventsRes, mediaRes]) => {
      if (!active) return;

      // 1. Últimas 2 publicaciones científicas
      if (pubsRes.status === 'fulfilled') {
        const pubsData = Array.isArray(pubsRes.value)
          ? pubsRes.value
          : pubsRes.value?.results || [];
        setPublications(pubsData.slice(0, 2));
      }

      // 2. Último evento institucional
      if (eventsRes.status === 'fulfilled') {
        const eventsData = Array.isArray(eventsRes.value)
          ? eventsRes.value
          : eventsRes.value?.results || [];
        if (eventsData.length > 0) {
          setLatestEvent(eventsData[0]);
        }
      }

      // 3. Último video / recurso multimedia
      if (mediaRes.status === 'fulfilled') {
        const mediaData = Array.isArray(mediaRes.value)
          ? mediaRes.value
          : mediaRes.value?.results || [];
        // Priorizar video si existe, o el recurso más reciente
        const video = mediaData.find((m) => isVideoType(m.tipo, m.enlace_externo || m.descarga_url));
        setLatestMedia(video || mediaData[0] || null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col w-full flex-1 space-y-12 pb-16">
      {/* 1. HERO INSTITUCIONAL CON BANNER EN GRANDE */}
      <section className="w-full bg-gradient-to-b from-surface-container-low via-background to-background pt-6 sm:pt-8 pb-10 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Banner Panorámico Oficial */}
          <div className="w-full rounded-3xl overflow-hidden shadow-md border border-outline-variant/30 bg-surface-container-lowest group relative">
            <img
              src="/aboccrim-banner.webp"
              alt="Academia Boliviana de Ciencias Criminológicas - ABOCCRIM"
              className="w-full h-auto object-cover max-h-[380px] md:max-h-[440px] transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>

          {/* Bienvenida y Acciones Clave (Sin botones innecesarios) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Asociación Civil Científica • Bolivia</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary leading-tight">
                Investigación, Peritaje y Evidencia Criminológica
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Plataforma oficial para la difusión científica, articulación colegiada y publicaciones especializadas en ciencias penales, forenses y criminología.
              </p>
            </div>

            {/* Accesos Directos Principales Simplificados */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Mi Panel de Control ({user?.nombres?.split(' ')[0]})</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/acceso-miembros?tab=login"
                    className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">login</span>
                    <span>Acceso a Miembros</span>
                  </Link>
                  <Link
                    to="/acceso-miembros?tab=register"
                    className="px-5 py-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs sm:text-sm border border-outline-variant/30 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    <span>Registrarse</span>
                  </Link>
                </>
              )}

              <Link
                to="/repositorio"
                className="px-5 py-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-secondary font-bold text-xs sm:text-sm border border-secondary/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">menu_book</span>
                <span>Biblioteca Virtual</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ÚLTIMAS 2 PUBLICACIONES CIENTÍFICAS */}
      <section className="w-full px-4 sm:px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-outline-variant/20 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                Producción Científica
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-primary mt-0.5">
                Últimas Publicaciones en el Repositorio
              </h2>
            </div>
            <Link
              to="/repositorio"
              className="text-xs font-bold text-primary hover:text-secondary inline-flex items-center gap-1 group"
            >
              <span>Explorar todo el repositorio</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-2xl animate-spin text-primary">
                progress_activity
              </span>
              <span>Cargando publicaciones recientes…</span>
            </div>
          ) : publications.length === 0 ? (
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/25 text-center text-xs text-outline space-y-1">
              <span className="material-symbols-outlined text-3xl">menu_book</span>
              <p>No hay publicaciones registradas disponibles por el momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publications.map((pub) => {
                const authors = (pub.autores_lista || [])
                  .map((a) => (typeof a === 'string' ? a : `${a.nombres} ${a.apellidos}`))
                  .join(', ');

                return (
                  <article
                    key={pub.id}
                    className="p-6 sm:p-7 rounded-3xl border border-outline-variant/25 bg-surface-container-lowest hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {pub.tipo_nombre || 'Publicación Científica'}
                        </span>
                        <span className="text-[11px] text-outline font-medium">
                          {formatPubDate(pub.fecha_publicacion, pub.anio)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-primary group-hover:text-primary-container leading-snug line-clamp-2">
                        <Link to={`/repositorio/${pub.id}`}>{pub.titulo}</Link>
                      </h3>

                      {authors && (
                        <p className="text-xs font-semibold text-secondary truncate flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">person</span>
                          <span>{authors}</span>
                        </p>
                      )}

                      {pub.resumen && (
                        <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                          {pub.resumen}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between">
                      <span className="text-[11px] text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        <span>Ficha Técnica y PDF</span>
                      </span>
                      <Link
                        to={`/repositorio/${pub.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-bold text-xs transition-all flex items-center gap-1"
                      >
                        <span>Ver publicación</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. ACCESOS DIRECTOS: ÚLTIMO EVENTO Y VIDEO MULTIMEDIA */}
      <section className="w-full px-4 sm:px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="border-b border-outline-variant/20 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
              Actualidad y Material Audiovisual
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-primary mt-0.5">
              Destacados Institucionales
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CUADRO 1: ÚLTIMO EVENTO */}
            <article className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all">
              <div>
                {/* Cabecera de tarjeta */}
                <div className="p-5 sm:p-6 pb-4 border-b border-outline-variant/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">event</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Último Evento Programado
                    </span>
                  </div>
                  <Link
                    to="/eventos"
                    className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Ver agenda</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </Link>
                </div>

                {latestEvent ? (
                  <div>
                    {latestEvent.imagen_url && (
                      <div className="w-full h-44 sm:h-52 bg-surface-container-low overflow-hidden">
                        <img
                          src={latestEvent.imagen_url}
                          alt={latestEvent.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 space-y-3">
                      {latestEvent.fecha_inicio && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high text-primary font-bold text-xs">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          <span>{formatEventDate(latestEvent.fecha_inicio).full}</span>
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-primary leading-snug">
                        {latestEvent.titulo}
                      </h3>

                      {latestEvent.lugar && (
                        <p className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">
                            location_on
                          </span>
                          <span>{latestEvent.lugar}</span>
                        </p>
                      )}

                      {latestEvent.descripcion && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                          {latestEvent.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center text-xs text-outline space-y-1">
                    <span className="material-symbols-outlined text-3xl">event_busy</span>
                    <p>No hay eventos programados en este momento.</p>
                  </div>
                )}
              </div>

              {latestEvent && (
                <div className="p-5 sm:px-6 bg-surface-container-low/50 border-t border-outline-variant/15 flex justify-end">
                  <Link
                    to="/eventos"
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all inline-flex items-center gap-1"
                  >
                    <span>Consultar detalles del evento</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              )}
            </article>

            {/* CUADRO 2: VIDEO MULTIMEDIA */}
            <article className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all">
              <div>
                {/* Cabecera de tarjeta */}
                <div className="p-5 sm:p-6 pb-4 border-b border-outline-variant/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">play_circle</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Video y Contenido Multimedia
                    </span>
                  </div>
                  <Link
                    to="/multimedia"
                    className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Ver catálogo</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </Link>
                </div>

                {latestMedia ? (
                  <div>
                    {/* Reproductor HTML5 / Previsualizador */}
                    <div className="w-full h-44 sm:h-52 bg-black flex items-center justify-center overflow-hidden">
                      {isVideoType(latestMedia.tipo, latestMedia.enlace_externo || latestMedia.descarga_url) ? (
                        <video
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain bg-black"
                          src={latestMedia.enlace_externo || latestMedia.descarga_url}
                        >
                          Tu navegador no soporta video HTML5.
                        </video>
                      ) : (
                        <div className="p-6 text-center text-white/80 space-y-2">
                          <span className="material-symbols-outlined text-4xl text-primary-fixed">headphones</span>
                          <p className="text-xs font-semibold">{latestMedia.titulo}</p>
                          <audio
                            controls
                            className="w-full max-w-xs mt-2"
                            src={latestMedia.enlace_externo || latestMedia.descarga_url}
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                        {latestMedia.tipo ? `Formato: ${latestMedia.tipo.toUpperCase()}` : 'Audiovisual'}
                      </span>
                      <h3 className="text-lg font-bold text-primary leading-snug line-clamp-2">
                        {latestMedia.titulo}
                      </h3>
                      {latestMedia.descripcion && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                          {latestMedia.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center text-xs text-outline space-y-1">
                    <span className="material-symbols-outlined text-3xl">perm_media</span>
                    <p>No hay contenido multimedia disponible por el momento.</p>
                  </div>
                )}
              </div>

              {latestMedia && (
                <div className="p-5 sm:px-6 bg-surface-container-low/50 border-t border-outline-variant/15 flex justify-end">
                  <Link
                    to="/multimedia"
                    className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs transition-all inline-flex items-center gap-1"
                  >
                    <span>Abrir en biblioteca audiovisual</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                </div>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* 4. PILARES ACADÉMICOS E INSTITUCIONALES */}
      <section className="w-full py-10 px-4 sm:px-6 md:px-12 bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Fundamentos Estatutarios
            </span>
            <h2 className="text-2xl font-bold text-primary">Pilares Académicos e Institucionales</h2>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
              Líneas de trabajo técnico, deontológico y científico impulsadas por ABOCCRIM en Bolivia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </div>
              <h3 className="text-base font-bold text-primary">Ciencias Penales y Forenses</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Investigación empírica en criminología clínica, psicología jurídica, victimología y dictámenes periciales especializados.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl">shield_person</span>
              </div>
              <h3 className="text-base font-bold text-primary">Comunidad Colegiada</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Acreditación y articulación de investigadores, miembros titulares y comités académicos bajo altos estándares deontológicos.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-on-tertiary-container text-on-tertiary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl">policy</span>
              </div>
              <h3 className="text-base font-bold text-primary">Política Criminal y Seguridad</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Análisis criminológico orientado a la prevención del delito, criminología ambiental y políticas públicas basadas en evidencia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
