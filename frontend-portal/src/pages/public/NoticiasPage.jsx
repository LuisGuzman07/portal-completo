import React, { useEffect, useState } from 'react';
import { newsService } from '../../services/api';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('es-BO', { dateStyle: 'long' }) : '';
}

// Simple Markdown parser for rich text display in public articles
function renderSimpleMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const htmlLines = [];
  let inList = false;

  for (let line of lines) {
    let trimmed = line.trim();

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc list-inside space-y-1 my-3 text-on-surface">');
        inList = true;
      }
      let content = trimmed.substring(2);
      content = formatInline(content);
      htmlLines.push(`<li>${content}</li>`);
      continue;
    } else if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }

    if (trimmed.startsWith('### ')) {
      htmlLines.push(`<h4 class="text-base font-bold text-primary mt-5 mb-2">${formatInline(trimmed.substring(4))}</h4>`);
    } else if (trimmed.startsWith('## ')) {
      htmlLines.push(`<h3 class="text-xl font-bold text-primary mt-6 mb-3 border-b border-outline-variant/20 pb-1.5">${formatInline(trimmed.substring(3))}</h3>`);
    } else if (trimmed.startsWith('# ')) {
      htmlLines.push(`<h2 class="text-2xl font-bold text-primary mt-7 mb-3">${formatInline(trimmed.substring(2))}</h2>`);
    } else if (trimmed.startsWith('> ')) {
      htmlLines.push(`<blockquote class="border-l-4 border-secondary pl-4 py-2 italic my-4 text-on-surface-variant bg-surface-container-low rounded-r-xl">${formatInline(trimmed.substring(2))}</blockquote>`);
    } else if (trimmed === '') {
      htmlLines.push('<div class="h-3"></div>');
    } else {
      htmlLines.push(`<p class="leading-relaxed mb-3 text-on-surface">${formatInline(line)}</p>`);
    }
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('');
}

function formatInline(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-secondary underline font-semibold">$1</a>');
  return text;
}

export default function NoticiasPage() {
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null); // Ventana aparte para ver publicación completa
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    newsService
      .publicList(search.trim() ? { search: search.trim() } : {})
      .then((response) => {
        if (active) setNews(Array.isArray(response) ? response : response.results || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.data?.detail || requestError?.message || 'No se pudieron cargar las noticias.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search]);

  const handleShare = (article) => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: article.titulo,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  // CASO: VISTA DE PUBLICACIÓN COMPLETA (VENTANA APARTE DEDICADA)
  if (selectedArticle) {
    const relatedResources = selectedArticle.recursos_multimedia?.filter(
      (r) => !['imagen', 'jpg', 'jpeg', 'png', 'webp'].includes(r.tipo)
    ) || [];

    return (
      <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-4 sm:px-6 md:px-12 py-10">
        <div className="mx-auto max-w-[900px] space-y-6">
          {/* Barra de retorno */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Volver a todas las noticias</span>
            </button>

            <button
              type="button"
              onClick={() => handleShare(selectedArticle)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-surface-container transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">
                {shareSuccess ? 'check' : 'share'}
              </span>
              <span>{shareSuccess ? '¡Enlace copiado!' : 'Compartir'}</span>
            </button>
          </div>

          {/* Artículo de la noticia en pantalla completa */}
          <article className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-sm">
            {/* Fotografía de portada */}
            {selectedArticle.imagen_portada_url && (
              <div className="w-full max-h-[440px] bg-surface-container-low overflow-hidden">
                <img
                  src={selectedArticle.imagen_portada_url}
                  alt={selectedArticle.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-6">
              <div className="space-y-2 border-b border-outline-variant/20 pb-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>{formatDate(selectedArticle.fecha_publicacion)}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary leading-tight">
                  {selectedArticle.titulo}
                </h1>
              </div>

              {/* Contenido con formato enriquecido */}
              <div
                className="text-sm sm:text-base leading-relaxed text-on-surface"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(selectedArticle.contenido) }}
              />

              {/* Enlace complementario externo */}
              {selectedArticle.material_url && (
                <div className="pt-4 border-t border-outline-variant/20">
                  <a
                    href={selectedArticle.material_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    <span>Consultar Material Complementario</span>
                  </a>
                </div>
              )}

              {/* Contenido multimedia relacionado */}
              {relatedResources.length > 0 && (
                <div className="pt-4 border-t border-outline-variant/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-outline block mb-2">
                    Recursos Relacionados
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {relatedResources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.enlace_externo || resource.descarga_url}
                        target={resource.enlace_externo ? '_blank' : undefined}
                        rel={resource.enlace_externo ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-surface-container transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {resource.enlace_externo ? 'open_in_new' : 'download'}
                        </span>
                        <span>{resource.titulo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    );
  }

  // CASO: LISTA PRINCIPAL DE NOTICIAS
  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-4 sm:px-6 md:px-12 py-10">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-sm">newspaper</span>
            Información Oficial
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Noticias Institucionales ABOCCRIM
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
            Comunicados oficiales, novedades académicas, pronunciamientos y actividades de la Academia Boliviana de Ciencias Criminológicas.
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
              placeholder="Buscar por título o contenido de la noticia…"
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
            <span>Cargando noticias institucionales…</span>
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-16 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">newspaper</span>
            <p className="text-sm font-semibold text-primary">No hay noticias publicadas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedArticle(item)}
                className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden shadow-xs hover:shadow-md hover:border-primary/35 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Fotografía de portada */}
                  {item.imagen_portada_url ? (
                    <div className="w-full h-48 bg-surface-container-low overflow-hidden">
                      <img
                        src={item.imagen_portada_url}
                        alt={item.titulo}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-primary/5 flex items-center justify-center border-b border-outline-variant/15">
                      <span className="material-symbols-outlined text-3xl text-primary/40">feed</span>
                    </div>
                  )}

                  <div className="p-5 sm:p-6 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                      {formatDate(item.fecha_publicacion)}
                    </p>

                    <h2 className="text-base font-bold text-primary group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                      {item.titulo}
                    </h2>

                    <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                      {item.contenido.replace(/[#*>\-_`\[\]]/g, '')}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:px-6 pt-0 border-t border-outline-variant/10 flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Leer noticia completa</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
