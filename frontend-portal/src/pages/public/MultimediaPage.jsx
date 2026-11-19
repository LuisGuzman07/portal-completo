import React, { useEffect, useState } from 'react';
import { multimediaService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function message(error) {
  return error?.data?.detail || error?.message || 'No se pudo cargar el catálogo multimedia.';
}

function isVideoType(tipo, url = '') {
  const t = (tipo || '').toLowerCase();
  const u = (url || '').toLowerCase();
  return ['mp4', 'webm', 'mov', 'video'].some((ext) => t.includes(ext) || u.includes(`.${ext}`));
}

function isAudioType(tipo, url = '') {
  const t = (tipo || '').toLowerCase();
  const u = (url || '').toLowerCase();
  return ['mp3', 'wav', 'ogg', 'm4a', 'audio'].some((ext) => t.includes(ext) || u.includes(`.${ext}`));
}

function isImageType(tipo, url = '') {
  const t = (tipo || '').toLowerCase();
  const u = (url || '').toLowerCase();
  return ['imagen', 'jpg', 'jpeg', 'png', 'webp', 'image'].some((ext) => t.includes(ext) || u.includes(`.${ext}`));
}

function getYouTubeEmbedUrl(url = '') {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function MultimediaPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null); // Ventana aparte para ver la publicación multimedia completa

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    multimediaService
      .publicList(search.trim() ? { search: search.trim() } : {})
      .then((result) => {
        if (active) setItems(Array.isArray(result) ? result : result.results || []);
      })
      .catch((requestError) => {
        if (active) setError(message(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, isAuthenticated]);

  const download = async (item) => {
    setDownloadError('');
    try {
      await multimediaService.download(item.id, `${item.titulo || 'recurso'}.${item.tipo || 'bin'}`);
    } catch (downloadFailure) {
      setDownloadError(message(downloadFailure));
    }
  };

  // CASO: VISTA DE PUBLICACIÓN MULTIMEDIA COMPLETA (VENTANA APARTE DEDICADA)
  if (selectedMedia) {
    const streamUrl = selectedMedia.enlace_externo || selectedMedia.descarga_url;
    const isVideo = isVideoType(selectedMedia.tipo, streamUrl);
    const isAudio = isAudioType(selectedMedia.tipo, streamUrl);
    const isImage = isImageType(selectedMedia.tipo, streamUrl);
    const ytEmbed = getYouTubeEmbedUrl(selectedMedia.enlace_externo);

    return (
      <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-4 sm:px-6 md:px-12 py-10">
        <div className="mx-auto max-w-[1000px] space-y-6">
          {/* Barra de retorno */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Volver a todo el contenido multimedia</span>
            </button>

            {streamUrl && (
              <button
                type="button"
                onClick={() => download(selectedMedia)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-surface-container transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Descargar archivo</span>
              </button>
            )}
          </div>

          {/* Reproductor en Ventana Aparte / Pantalla Completa */}
          <article className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-sm">
            {/* Pantalla del Reproductor */}
            <div className="w-full bg-black/95 flex items-center justify-center min-h-[360px] sm:min-h-[460px]">
              {ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={selectedMedia.titulo}
                  className="w-full aspect-video min-h-[360px] sm:min-h-[460px] border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isVideo && streamUrl ? (
                <video
                  controls
                  autoPlay
                  preload="metadata"
                  className="w-full max-h-[560px] object-contain bg-black"
                  src={streamUrl}
                >
                  Tu navegador no soporta la reproducción de video HTML5.
                </video>
              ) : isAudio && streamUrl ? (
                <div className="w-full max-w-xl p-8 flex flex-col items-center gap-4 text-white">
                  <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-5xl text-primary-fixed">headphones</span>
                  </div>
                  <audio controls autoPlay className="w-full mt-2" src={streamUrl} />
                </div>
              ) : isImage && streamUrl ? (
                <img
                  src={streamUrl}
                  alt={selectedMedia.titulo}
                  className="max-h-[560px] w-auto object-contain"
                />
              ) : (
                <div className="p-12 text-center text-white/80 space-y-3">
                  <span className="material-symbols-outlined text-5xl">open_in_new</span>
                  <p className="text-sm font-semibold">Este recurso se aloja en una plataforma externa.</p>
                  {selectedMedia.enlace_externo && (
                    <a
                      href={selectedMedia.enlace_externo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
                    >
                      <span>Abrir en ventana externa</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Ficha técnica y descripción */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  {selectedMedia.tipo ? `Formato: ${selectedMedia.tipo.toUpperCase()}` : 'Recurso Multimedia'}
                </span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-outline uppercase">
                  {selectedMedia.nivel_acceso === 'miembros'
                    ? 'Miembros Acreditados'
                    : selectedMedia.nivel_acceso === 'restringido'
                    ? 'Acceso Restringido'
                    : 'Acceso Público'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                {selectedMedia.titulo}
              </h1>

              {selectedMedia.descripcion && (
                <p className="text-sm sm:text-base leading-relaxed text-on-surface whitespace-pre-line bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20">
                  {selectedMedia.descripcion}
                </p>
              )}

              {(selectedMedia.evento_titulo || selectedMedia.noticia_titulo) && (
                <div className="text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">link</span>
                  <span>
                    Contenido vinculado a:{' '}
                    <strong>{selectedMedia.evento_titulo ? `Evento: ${selectedMedia.evento_titulo}` : `Noticia: ${selectedMedia.noticia_titulo}`}</strong>
                  </span>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    );
  }

  // CASO: CATÁLOGO PRINCIPAL MULTIMEDIA CON REPRODUCTOR EMBEBIDO
  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-4 sm:px-6 md:px-12 py-10">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-sm">perm_media</span>
            Catálogo Audiovisual
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Contenido Multimedia ABOCCRIM
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
            Conferencias magistrales, entrevistas científicas, podcasts criminológicos y registros audiovisuales con reproductor integrado.
          </p>
        </header>

        {/* Buscador */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4 shadow-xs">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
              search
            </span>
            <input
              className="w-full rounded-xl bg-surface-container-low pl-11 pr-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
              placeholder="Buscar videos, audios o conferencias por título o contenido…"
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

        {downloadError && (
          <div role="alert" className="rounded-2xl bg-error-container/30 border border-error/30 p-4 text-xs font-medium text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{downloadError}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <span>Cargando catálogo audiovisual…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-16 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">perm_media</span>
            <p className="text-sm font-semibold text-primary">No hay recursos multimedia disponibles que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const streamUrl = item.enlace_externo || item.descarga_url;
              const isVideo = isVideoType(item.tipo, streamUrl);
              const isAudio = isAudioType(item.tipo, streamUrl);
              const isImage = isImageType(item.tipo, streamUrl);
              const ytEmbed = getYouTubeEmbedUrl(item.enlace_externo);

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* REPRODUCTOR INTEGRADO HTML5 EMBEBIDO */}
                    <div className="w-full bg-black/90 flex items-center justify-center overflow-hidden h-52">
                      {ytEmbed ? (
                        <iframe
                          src={ytEmbed}
                          title={item.titulo}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : isVideo && streamUrl ? (
                        <video
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain bg-black"
                          src={streamUrl}
                        >
                          Tu navegador no soporta la reproducción de video HTML5.
                        </video>
                      ) : isImage && streamUrl ? (
                        <img
                          src={streamUrl}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : isAudio && streamUrl ? (
                        <div className="w-full p-4 flex flex-col items-center justify-center gap-2 text-white">
                          <span className="material-symbols-outlined text-3xl text-primary-fixed">headphones</span>
                          <audio controls className="w-full" src={streamUrl} />
                        </div>
                      ) : (
                        <div className="p-4 text-center text-white/70 space-y-1">
                          <span className="material-symbols-outlined text-3xl">play_circle</span>
                          <p className="text-xs">Recurso externo o documento</p>
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                          {item.tipo ? item.tipo.toUpperCase() : 'MULTIMEDIA'}
                        </span>
                        <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[10px] font-bold text-outline uppercase">
                          {item.nivel_acceso === 'miembros'
                            ? 'Solo Miembros'
                            : item.nivel_acceso === 'restringido'
                            ? 'Restringido'
                            : 'Público'}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-primary line-clamp-2 leading-snug">
                        {item.titulo}
                      </h2>

                      {item.descripcion && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                          {item.descripcion}
                        </p>
                      )}

                      {(item.evento_titulo || item.noticia_titulo) && (
                        <p className="text-[11px] text-outline font-medium truncate">
                          {item.evento_titulo ? `Evento: ${item.evento_titulo}` : `Noticia: ${item.noticia_titulo}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones: Ver en ventana aparte y Descargar */}
                  <div className="p-5 sm:px-6 pt-0 border-t border-outline-variant/10 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedMedia(item)}
                      className="font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">fullscreen</span>
                      <span>Ver publicación</span>
                    </button>

                    {item.enlace_externo ? (
                      <a
                        href={item.enlace_externo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-secondary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Abrir enlace</span>
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => download(item)}
                        className="font-bold text-secondary hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Descargar</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
