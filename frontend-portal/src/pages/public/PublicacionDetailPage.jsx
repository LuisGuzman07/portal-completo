import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { repositoryService, publicationService } from '../../services/api';
import CitationModal from '../../components/public/CitationModal';

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

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PublicacionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');

    repositoryService
      .get(id)
      .then((data) => {
        if (current) setPublication(data);
      })
      .catch((err) => {
        if (current) {
          setError(
            err?.data?.detail ||
              err?.message ||
              'No se pudo cargar la publicación o aún no se encuentra disponible en el repositorio.'
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

  const handleDownload = async (doc) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      setDownloadingDocId(doc.id);
      await publicationService.downloadDocumentBlob(doc.id, doc.nombre_original || `${publication.titulo}.pdf`);
    } catch (err) {
      alert(err.message || 'Error al descargar el archivo.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handlePreview = async (doc) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      await publicationService.previewDocumentBlob(doc.id);
    } catch (err) {
      alert(err.message || 'Error al abrir el documento.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: publication?.titulo,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-24 px-4">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">
          progress_activity
        </span>
        <p className="mt-3 text-sm font-semibold text-primary">
          Cargando publicación científica...
        </p>
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="max-w-3xl mx-auto w-full py-16 px-4">
        <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 text-center space-y-4 shadow-sm">
          <span className="material-symbols-outlined text-5xl text-outline">menu_book</span>
          <h2 className="text-xl font-bold text-primary">Publicación No Disponible</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">{error}</p>
          <div className="pt-2">
            <Link
              to="/repositorio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Regresar a la Biblioteca</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryDocument = publication.documentos?.[0];
  const hasDoi = Boolean(publication.doi && publication.doi.trim());
  const dateDisplay = formatDate(publication.fecha_publicacion) || (publication.anio ? `Año ${publication.anio}` : null);

  // Group author affiliations and build mapping
  const affiliations = [];
  const authorAffiliationMap = (publication.autores_lista || []).map((autor) => {
    let affIndex = null;
    if (autor.afiliacion && autor.afiliacion.trim()) {
      const existing = affiliations.indexOf(autor.afiliacion.trim());
      if (existing !== -1) {
        affIndex = existing + 1;
      } else {
        affiliations.push(autor.afiliacion.trim());
        affIndex = affiliations.length;
      }
    }
    return {
      ...autor,
      affIndex,
    };
  });

  return (
    <div className="flex flex-col w-full flex-1 bg-surface py-6 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1140px] mx-auto w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 truncate">
            <Link
              to="/repositorio"
              className="hover:text-primary transition-colors flex items-center gap-1 font-semibold shrink-0"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Biblioteca Académica</span>
            </Link>
            <span>/</span>
            <span className="text-primary font-medium truncate">{publication.titulo}</span>
          </div>

          <Link
            to="/repositorio"
            className="text-xs font-bold text-secondary hover:underline shrink-0 hidden sm:inline-flex items-center gap-1"
          >
            <span>Catálogo general</span>
            <span className="text-xs">↗</span>
          </Link>
        </div>

        {/* TOP METADATA & ACTIONS HEADER (Inspired by Energies & CrimRxiv headers) */}
        <header className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs space-y-6">
          {/* Top Row: Type, Date, Optional DOI, and Top Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
            {/* Left metadata tags */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                {publication.tipo_nombre || 'Artículo Científico'}
              </span>

              {dateDisplay && (
                <span className="text-on-surface-variant font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-outline">event</span>
                  <span>{dateDisplay}</span>
                </span>
              )}

              {/* CRITICAL USER REQUIREMENT: DOI IS OPTIONAL. If empty, DO NOT RENDER! */}
              {hasDoi && (
                <span className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-primary font-mono text-[11px] font-semibold flex items-center gap-1">
                  <span className="text-outline">DOI:</span>
                  <span>{publication.doi.trim()}</span>
                </span>
              )}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Citar button */}
              <button
                type="button"
                onClick={() => setIsCitationOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-primary/10 text-primary border border-outline-variant/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Generar citas académicas (APA, Harvard, Vancouver, BibTeX)"
              >
                <span className="material-symbols-outlined text-base">format_quote</span>
                <span>Citar</span>
              </button>

              {/* Compartir button */}
              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Compartir enlace"
              >
                <span className="material-symbols-outlined text-base">
                  {shareSuccess ? 'check' : 'share'}
                </span>
                <span>{shareSuccess ? '¡Copiado!' : 'Compartir'}</span>
              </button>

              {/* Consultar con IA */}
              <button
                type="button"
                onClick={() => navigate('/asistente-academico')}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-primary/10 text-primary border border-outline-variant/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Consultar al Asistente Académico IA sobre esta investigación"
              >
                <span className="material-symbols-outlined text-base">smart_toy</span>
                <span>Consultar IA</span>
              </button>

              {/* Descargar PDF Principal */}
              {primaryDocument && (
                <button
                  type="button"
                  onClick={() => handleDownload(primaryDocument)}
                  disabled={downloadingDocId === primaryDocument.id}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">
                    {!isAuthenticated ? 'lock' : downloadingDocId === primaryDocument.id ? 'downloading' : 'download'}
                  </span>
                  <span>Descargar PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Scientific Title */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary leading-tight">
              {publication.titulo}
            </h1>

            {/* Authors with Affiliation Superscripts */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm sm:text-base">
                {authorAffiliationMap.length > 0 ? (
                  authorAffiliationMap.map((author, idx) => (
                    <span key={author.id || idx} className="inline-flex items-center">
                      {author.investigador_id ? (
                        <Link
                          to={`/investigadores/${author.investigador_id}`}
                          className="font-bold text-primary hover:text-secondary hover:underline transition-colors"
                          title="Ver perfil del investigador"
                        >
                          {author.nombre_completo}
                        </Link>
                      ) : (
                        <span className="font-semibold text-on-surface">
                          {author.nombre_completo}
                        </span>
                      )}
                      {author.affIndex && (
                        <sup className="ml-0.5 text-xs font-bold text-secondary">
                          {author.affIndex}
                        </sup>
                      )}
                      {author.es_correspondencia && (
                        <span
                          className="ml-1 text-[11px] text-amber-700"
                          title="Autor de correspondencia"
                        >
                          *
                        </span>
                      )}
                      {idx < authorAffiliationMap.length - 1 && <span className="ml-2 text-outline">,</span>}
                    </span>
                  ))
                ) : (
                  <span className="font-semibold text-on-surface">
                    {publication.registrada_por_nombre || 'Academia Boliviana de Ciencias Criminológicas'}
                  </span>
                )}
              </div>

              {/* Numbered Affiliations List */}
              {affiliations.length > 0 && (
                <div className="pt-2 text-xs text-on-surface-variant space-y-1 leading-relaxed">
                  {affiliations.map((aff, aIdx) => (
                    <div key={aIdx} className="flex items-start gap-1.5">
                      <sup className="font-bold text-secondary mt-0.5">{aIdx + 1}</sup>
                      <span>{aff}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 2-COLUMN MAIN CONTENT (Inspired by Energies / CrimRxiv scientific layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ABSTRACT, KEYWORDS, DOCUMENTS, REFERENCES (8 cols) */}
          <main className="lg:col-span-8 space-y-6">
            {/* Abstract Section */}
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">notes</span>
                  <span>Resumen / Abstract</span>
                </h2>
                <span className="text-[11px] text-outline font-medium">Revisión Científica</span>
              </div>

              {publication.resumen ? (
                <p className="text-sm sm:text-base text-on-surface leading-relaxed text-justify font-normal">
                  {publication.resumen}
                </p>
              ) : (
                <p className="text-sm text-outline italic">
                  Esta publicación no cuenta con un resumen científico registrado.
                </p>
              )}

              {/* Keywords */}
              {publication.palabras_clave_lista?.length > 0 && (
                <div className="pt-4 border-t border-outline-variant/15 space-y-2">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                    Palabras Clave:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {publication.palabras_clave_lista.map((pal) => (
                      <span
                        key={pal}
                        className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs font-mono text-primary font-medium"
                      >
                        #{pal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Documentos Digitales Adjuntos */}
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">folder_open</span>
                  <span>Archivos Digitales y Documentación</span>
                </h2>
                <span className="text-xs font-bold text-primary">
                  {publication.documentos?.length || 0} archivo(s)
                </span>
              </div>

              {!publication.documentos || publication.documentos.length === 0 ? (
                <div className="p-6 rounded-2xl bg-surface-container-low text-center text-xs text-outline space-y-1">
                  <span className="material-symbols-outlined text-2xl">description</span>
                  <p>No hay documentos descargables adjuntos disponibles públicamente para este registro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {!isAuthenticated && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-amber-950">
                        <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">lock</span>
                        <span>
                          Para visualizar o descargar los documentos en PDF debes <strong>iniciar sesión</strong>. Los metadatos y el resumen son de acceso público.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shrink-0 self-start sm:self-center transition-all cursor-pointer"
                      >
                        Iniciar sesión
                      </button>
                    </div>
                  )}
                  {publication.documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-primary truncate">
                            {doc.titulo || doc.nombre_original}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant flex-wrap mt-0.5">
                            <span className="font-semibold text-secondary">
                              {doc.tipo_nombre || 'Documento Principal'}
                            </span>
                            <span>·</span>
                            <span className="text-outline font-mono">
                              {formatBytes(doc.tamano_bytes)}
                            </span>
                            <span>·</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                doc.nivel_acceso === 'publico'
                                  ? 'bg-emerald-500/10 text-emerald-800'
                                  : 'bg-amber-500/10 text-amber-800'
                              }`}
                            >
                              {doc.nivel_acceso === 'publico' ? 'Acceso Abierto' : 'Solo Miembros'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Document Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePreview(doc)}
                          className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-surface-container transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {!isAuthenticated ? 'lock' : 'visibility'}
                          </span>
                          <span>Visualizar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingDocId === doc.id}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {!isAuthenticated ? 'lock' : downloadingDocId === doc.id ? 'downloading' : 'download'}
                          </span>
                          <span>Descargar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Referencias Bibliográficas */}
            {publication.referencias && (
              <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">menu_book</span>
                    <span>Referencias Bibliográficas</span>
                  </h2>
                </div>
                <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                  {publication.referencias}
                </div>
              </section>
            )}
          </main>

          {/* RIGHT COLUMN: METRICS & EDITORIAL SIDEBAR (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Article Metrics Box (Matching Energies style) */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant/20 pb-2">
                Métricas del Artículo
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">visibility</span>
                    <span>Visualizaciones</span>
                  </span>
                  <span className="font-bold text-primary font-mono text-sm">
                    {publication.vistas_count || 1}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">download</span>
                    <span>Descargas</span>
                  </span>
                  <span className="font-bold text-primary font-mono text-sm">
                    {publication.descargas_count || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">attachment</span>
                    <span>Archivos adjuntos</span>
                  </span>
                  <span className="font-bold text-primary font-mono text-sm">
                    {publication.documentos?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Categorías y Áreas Temáticas */}
            {publication.categorias_lista?.length > 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary border-b border-outline-variant/20 pb-2">
                  Áreas del Conocimiento
                </h3>

                <div className="space-y-2">
                  {publication.categorias_lista.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                        {cat.area_nombre || 'Eje Criminológico'}
                      </span>
                      <p className="text-xs font-bold text-primary">{cat.nombre}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editorial Information Box */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-secondary border-b border-outline-variant/20 pb-2">
                Dictamen Editorial
              </h3>

              <div className="space-y-2 text-on-surface-variant">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Arbitrado y Aprobado</span>
                </div>

                <p className="text-outline text-[11px] leading-relaxed">
                  Esta publicación fue sometida a revisión del Comité Académico y cumple con los estándares institucionales de divulgación científica de ABOCCRIM.
                </p>

                {publication.fecha_registro && (
                  <div className="pt-2 border-t border-outline-variant/15 flex justify-between text-[11px]">
                    <span className="text-outline">Recepción:</span>
                    <span className="font-semibold text-on-surface">
                      {formatDate(publication.fecha_registro)}
                    </span>
                  </div>
                )}

                {publication.fecha_publicacion && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-outline">Publicación:</span>
                    <span className="font-semibold text-on-surface">
                      {formatDate(publication.fecha_publicacion)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Back link button */}
            <div>
              <Link
                to="/repositorio"
                className="w-full py-3 px-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-primary flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Explorar Otras Publicaciones</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal de Inicio de Sesión Requerido */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-primary">Inicio de Sesión Requerido</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Para previsualizar o descargar los documentos académicos en formato PDF debes iniciar sesión con tu cuenta de usuario en ABOCCRIM.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate(`/acceso-miembros?redirect=/repositorio/${id}`)}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Iniciar Sesión en el Portal</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/acceso-miembros?tab=register&redirect=/repositorio/${id}`)}
                className="w-full py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs sm:text-sm transition-all border border-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Registrarse como Usuario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-format Citation Modal (APA 7th, Harvard, Vancouver, BibTeX) */}
      <CitationModal
        publication={publication}
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
      />
    </div>
  );
}
