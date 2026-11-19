import React, { useEffect, useState } from 'react';
import { eventService } from '../../services/api';

function eventDate(value) {
  return new Date(value).toLocaleString('es-BO', { dateStyle: 'full', timeStyle: 'short' });
}

function shortDate(value) {
  const d = new Date(value);
  return {
    day: d.getDate(),
    month: d.toLocaleString('es-BO', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function EventosPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    eventService
      .publicList(search.trim() ? { search: search.trim() } : {})
      .then((response) => {
        if (active) setEvents(Array.isArray(response) ? response : response.results || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.data?.detail || requestError?.message || 'No se pudieron cargar los eventos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search]);

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-4 sm:px-6 md:px-12 py-10">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-sm">event</span>
            Agenda Institucional
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Eventos Académicos ABOCCRIM
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
            Conferencias magistrales, simposios internacionales, jornadas de debate y seminarios organizados por la Academia Boliviana de Ciencias Criminológicas.
          </p>
        </header>

        {/* Búsqueda */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4 shadow-xs">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
              search
            </span>
            <input
              className="w-full rounded-xl bg-surface-container-low pl-11 pr-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
              placeholder="Buscar por título de actividad, lugar o contenido del evento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl bg-error-container/30 border border-error/30 p-4 text-xs font-medium text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <span>Cargando agenda académica…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-16 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">event_busy</span>
            <p className="text-sm font-semibold text-primary">No hay eventos publicados actualmente que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => {
              const d = shortDate(event.fecha_inicio);
              const otherResources = event.recursos_multimedia?.filter(
                (r) => !['imagen', 'jpg', 'jpeg', 'png', 'webp'].includes(r.tipo)
              ) || [];

              return (
                <article
                  key={event.id}
                  className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Imagen de Portada / Fotografía del Evento */}
                    {event.imagen_url && (
                      <div className="relative w-full h-56 bg-surface-container-low overflow-hidden group">
                        <img
                          src={event.imagen_url}
                          alt={event.titulo}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(event.imagen_url)}
                          className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          title="Ampliar fotografía"
                        >
                          <span className="material-symbols-outlined text-base">zoom_in</span>
                        </button>
                      </div>
                    )}

                    <div className="p-6 sm:p-7 space-y-4">
                      {/* Header con insignia de fecha */}
                      <div className="flex items-start gap-3.5">
                        <div className="rounded-2xl bg-primary/10 text-primary p-2.5 min-w-14 text-center shrink-0 border border-primary/20">
                          <span className="text-xl font-bold leading-none block">{d.day}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5">{d.month}</span>
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold text-primary leading-snug">
                            {event.titulo}
                          </h2>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {eventDate(event.fecha_inicio)}
                            {event.fecha_fin ? ` · hasta ${eventDate(event.fecha_fin)}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Descripción */}
                      {event.descripcion && (
                        <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-on-surface-variant">
                          {event.descripcion}
                        </p>
                      )}

                      {/* Lugar / Modalidad */}
                      {event.lugar && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/20">
                          <span className="material-symbols-outlined text-base text-secondary shrink-0">
                            location_on
                          </span>
                          <span className="truncate">{event.lugar}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Material relacionado adicional */}
                  {otherResources.length > 0 && (
                    <div className="p-5 sm:px-7 bg-surface-container-low border-t border-outline-variant/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-2">
                        Material de Respaldo y Recursos
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {otherResources.map((resource) => (
                          <a
                            key={resource.id}
                            href={resource.enlace_externo || resource.descarga_url}
                            target={resource.enlace_externo ? '_blank' : undefined}
                            rel={resource.enlace_externo ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-surface-container hover:border-primary/40 transition-all shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {resource.enlace_externo ? 'open_in_new' : 'download'}
                            </span>
                            <span className="truncate max-w-[200px]">{resource.titulo}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal visor de foto ampliada */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Fotografía ampliada"
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
