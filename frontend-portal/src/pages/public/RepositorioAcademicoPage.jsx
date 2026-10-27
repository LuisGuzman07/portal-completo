import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { publicationService, repositoryService } from '../../services/api';

export default function RepositorioAcademicoPage() {
  const { user, isAuthenticated, isSuperAdmin, isAdminAcademico } = useAuth();
  const hasStaffPrivileges = isSuperAdmin || isAdminAcademico || user?.roles_codigos?.includes('comite_academico');

  const [publications, setPublications] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [investigators, setInvestigators] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State (CU16)
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedInvestigator, setSelectedInvestigator] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Publication Detail Modal State (CU12, CU13)
  const [selectedPub, setSelectedPub] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  // Load Catalogs on Mount
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [typesRes, catsRes, invRes] = await Promise.all([
          publicationService.listTypes().catch(() => []),
          publicationService.listCategories().catch(() => []),
          publicationService.listAvailableInvestigators().catch(() => []),
        ]);
        setTypes(Array.isArray(typesRes) ? typesRes : (typesRes.results || []));
        setCategories(Array.isArray(catsRes) ? catsRes : (catsRes.results || []));
        setInvestigators(Array.isArray(invRes) ? invRes : (invRes.results || []));
      } catch (e) {
        console.error('Error al cargar catálogos:', e);
      }
    };
    loadCatalogs();
  }, []);

  // Fetch Publications with applied filters
  const fetchRepository = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedType) params.tipo_id = selectedType;
      if (selectedCategory) params.categoria_id = selectedCategory;
      if (selectedInvestigator) params.investigador_id = selectedInvestigator;
      if (selectedYear) params.anio = selectedYear;

      const res = await repositoryService.list(params);
      setPublications(Array.isArray(res) ? res : (res.results || []));
    } catch (err) {
      setError(err?.data?.detail || err?.message || 'Error al consultar el repositorio académico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepository();
  }, [selectedType, selectedCategory, selectedInvestigator, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRepository();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedInvestigator('');
    setSelectedYear('');
    // Trigger immediate reload
    setTimeout(() => {
      fetchRepository();
    }, 0);
  };

  const openPublicationDetail = async (pubId) => {
    setDetailLoading(true);
    setModalOpen(true);
    try {
      const detail = await repositoryService.get(pubId);
      setSelectedPub(detail);
    } catch (err) {
      setError(err?.data?.detail || 'No se pudo obtener el detalle de la investigación seleccionada.');
      setModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingDocId(doc.id);
    setError('');
    setSuccessMsg('');
    try {
      await publicationService.downloadDocumentBlob(doc.id, doc.nombre_original);
      setSuccessMsg(`Descarga iniciada: ${doc.nombre_original}`);
    } catch (err) {
      setError(err.message || 'Error al descargar el archivo autorizado.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handlePreview = async (docId) => {
    setError('');
    try {
      await publicationService.previewDocumentBlob(docId);
    } catch (err) {
      setError(err.message || 'No tiene permisos para previsualizar este documento.');
    }
  };

  // Generate Year options (current down to 1980)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 45 }, (_, i) => currentYear - i);

  return (
    <div className="w-full flex-1 bg-background">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-surface-container-low to-background border-b border-outline-variant/30 py-10 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1240px] mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-secondary">
            <span className="material-symbols-outlined text-sm">local_library</span>
            <span>Repositorio Académico Institucional</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
            Producción Científica y Criminológica
          </h1>

          <p className="text-sm md:text-base text-on-surface-variant max-w-3xl leading-relaxed">
            Consulte investigaciones arbitradas, dictámenes técnicos, monografías y artículos especializados avalados por la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM).
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1240px] mx-auto px-margin-mobile md:px-margin-desktop py-8 space-y-6">
        {/* Global Notifications */}
        {error && (
          <div className="p-4 bg-error-container/30 border border-error/30 rounded-2xl text-error text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-error hover:opacity-75">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-green-800 hover:opacity-75">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {/* SEARCH AND COMBINED FILTERS SECTION (CU16) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Primary Search Input */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-xl">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por título, autor, palabras clave o resumen científico..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm rounded-2xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">search</span>
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 border border-outline-variant/40 hover:bg-surface-container rounded-2xl text-xs font-semibold text-on-surface-variant transition-all shrink-0"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Structured Multi-criteria Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-outline-variant/20">
              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                  Tipo de Publicación
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Todos los tipos</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                  Categoría Académica
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.area_nombre ? `${c.area_nombre} - ${c.nombre}` : c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Investigator Filter */}
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                  Investigador / Autor
                </label>
                <select
                  value={selectedInvestigator}
                  onChange={(e) => setSelectedInvestigator(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Todos los investigadores</option>
                  {investigators.map((inv) => (
                    <option key={inv.investigador_id} value={inv.investigador_id}>
                      {inv.nombre_completo} ({inv.institucion || 'ABOCCRIM'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                  Año de Publicación
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Todos los años</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Results Counter Indicator */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <span className="font-semibold">
              Mostrando <strong className="text-primary">{publications.length}</strong> publicaciones científicas en el repositorio
            </span>
            {(selectedType || selectedCategory || selectedInvestigator || selectedYear || search) && (
              <span className="text-secondary font-mono text-[11px]">
                * Filtros activos combinados
              </span>
            )}
          </div>
        </div>

        {/* PUBLICATIONS LIST / REPOSITORY CATALOG (CU12) */}
        {loading ? (
          <div className="p-16 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <p className="font-semibold text-primary">Consultando repositorio académico...</p>
          </div>
        ) : publications.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center text-on-surface-variant space-y-3">
            <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
            <h3 className="text-lg font-bold text-primary">No se encontraron publicaciones con los criterios seleccionados</h3>
            <p className="text-xs text-outline max-w-md mx-auto">
              Pruebe ajustando los términos de búsqueda o limpiando los filtros para explorar el catálogo general.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-bold hover:bg-primary transition-all"
            >
              Restablecer Catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {publications.map((pub) => {
              const mainAuthor = pub.autores_lista?.[0];
              return (
                <article
                  key={pub.id}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold text-[11px]">
                          {pub.tipo_nombre || 'Artículo Científico'}
                        </span>
                        {pub.anio && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-mono text-[11px] font-semibold">
                            {pub.anio}
                          </span>
                        )}
                      </div>

                      {hasStaffPrivileges && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          pub.estado === 'aprobada' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'
                        }`}>
                          {pub.estado}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-primary group-hover:text-primary-hover leading-snug line-clamp-2">
                      {pub.titulo}
                    </h2>

                    {/* Authors & Affiliation */}
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-outline">person</span>
                      <span className="font-semibold text-on-surface">
                        {mainAuthor ? mainAuthor.nombre_completo : pub.registrada_por_nombre || 'ABOCCRIM'}
                      </span>
                      {mainAuthor?.afiliacion && (
                        <span className="text-outline text-[11px]">· {mainAuthor.afiliacion}</span>
                      )}
                    </div>

                    {/* Categories and keywords */}
                    <div className="flex flex-wrap gap-1.5 items-center pt-1">
                      {pub.categorias_lista?.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-[10px] font-medium"
                        >
                          {cat.nombre}
                        </span>
                      ))}
                      {pub.palabras_clave_lista?.slice(0, 3).map((pal) => (
                        <span key={pal} className="text-[10px] font-mono text-outline">
                          #{pal}
                        </span>
                      ))}
                    </div>

                    {/* Abstract snippet */}
                    {pub.resumen && (
                      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed pt-1">
                        {pub.resumen}
                      </p>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-outline font-mono">
                      <span className="material-symbols-outlined text-sm">attachment</span>
                      <span>{pub.documentos_count || 0} archivo(s)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPublicationDetail(pub.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-bold text-xs transition-all"
                    >
                      <span>Ver Documentos</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* PUBLICATION DETAILS & DOCUMENT DOWNLOAD MODAL (CU12, CU13) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {detailLoading || !selectedPub ? (
              <div className="p-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
                <span>Cargando publicación y documentos oficiales...</span>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-outline-variant/20 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold text-[10px] uppercase">
                        {selectedPub.tipo_nombre || 'Publicación Científica'}
                      </span>
                      {selectedPub.anio && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-mono text-[10px] font-bold">
                          {selectedPub.anio}
                        </span>
                      )}
                      {selectedPub.fecha_publicacion && (
                        <span className="text-[11px] text-outline font-mono">
                          Publicado: {selectedPub.fecha_publicacion}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-primary mt-1 leading-snug">
                      {selectedPub.titulo}
                    </h2>
                  </div>

                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1 rounded-lg text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* Metadata details */}
                <div className="space-y-4 text-xs">
                  {/* Authors Section */}
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                    <span className="font-bold text-outline uppercase tracking-wider text-[11px] block">
                      Autores e Investigadores:
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {selectedPub.autores_lista?.map((aut) => (
                        <div key={aut.id} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                            {aut.nombres?.charAt(0)}{aut.apellidos?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{aut.nombre_completo}</div>
                            <div className="text-[10px] text-outline">{aut.afiliacion || 'ABOCCRIM'} {aut.orcid ? `· ORCID: ${aut.orcid}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumen */}
                  {selectedPub.resumen && (
                    <div>
                      <span className="font-bold text-outline uppercase tracking-wider text-[11px] block mb-1">
                        Resumen Científico / Abstract:
                      </span>
                      <p className="text-on-surface leading-relaxed p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
                        {selectedPub.resumen}
                      </p>
                    </div>
                  )}

                  {/* Categories & Keywords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                      <span className="font-bold text-outline uppercase tracking-wider text-[10px] block mb-1">
                        Áreas y Categorías:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPub.categorias_lista?.map((c) => (
                          <span key={c.id} className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold text-[10px]">
                            {c.nombre}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                      <span className="font-bold text-outline uppercase tracking-wider text-[10px] block mb-1">
                        Palabras Clave:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPub.palabras_clave_lista?.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
                            #{p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Referencias bibliográficas */}
                  {selectedPub.referencias && (
                    <div>
                      <span className="font-bold text-outline uppercase tracking-wider text-[11px] block mb-1">
                        Referencias Bibliográficas:
                      </span>
                      <p className="text-on-surface-variant font-mono text-[11px] leading-relaxed p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 whitespace-pre-line">
                        {selectedPub.referencias}
                      </p>
                    </div>
                  )}

                  {/* CU13: DOCUMENTOS DIGITALES ASOCIADOS Y DESCARGA AUTORIZADA */}
                  <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-red-600">picture_as_pdf</span>
                        Documentos Digitales Acreditados ({selectedPub.documentos?.length || 0})
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        Almacenamiento Local Seguro ABOCCRIM
                      </span>
                    </div>

                    {selectedPub.documentos?.length === 0 ? (
                      <p className="p-4 text-center text-outline text-xs bg-surface-container-low rounded-xl">
                        No hay archivos PDF disponibles para descarga en esta publicación.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPub.documentos?.map((doc) => {
                          const isRestricted = doc.nivel_acceso === 'restringido';
                          const isMembersOnly = doc.nivel_acceso === 'miembros';
                          const canDownloadMembers = isAuthenticated;
                          const canDownloadRestricted = hasStaffPrivileges || (user && selectedPub.registrada_por_email === user.email);

                          return (
                            <div
                              key={doc.id}
                              className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-600 text-3xl shrink-0">
                                  picture_as_pdf
                                </span>
                                <div>
                                  <div className="font-bold text-primary text-xs">{doc.titulo}</div>
                                  <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                                    {doc.nombre_original} · {(doc.tamano_bytes / 1024).toFixed(1)} KB
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                      doc.nivel_acceso === 'publico'
                                        ? 'bg-green-500/10 text-green-700'
                                        : doc.nivel_acceso === 'miembros'
                                        ? 'bg-secondary/10 text-secondary'
                                        : 'bg-error/10 text-error'
                                    }`}>
                                      Nivel: {doc.nivel_acceso}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {doc.nivel_acceso === 'publico' || (isMembersOnly && canDownloadMembers) || (isRestricted && canDownloadRestricted) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handlePreview(doc.id)}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-primary font-bold text-xs"
                                    >
                                      <span className="material-symbols-outlined text-sm">visibility</span>
                                      Previsualizar
                                    </button>
                                    <button
                                      type="button"
                                      disabled={downloadingDocId === doc.id}
                                      onClick={() => handleDownload(doc)}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-xs"
                                    >
                                      <span className={`material-symbols-outlined text-sm ${downloadingDocId === doc.id ? 'animate-spin' : ''}`}>
                                        {downloadingDocId === doc.id ? 'progress_activity' : 'download'}
                                      </span>
                                      Descargar PDF
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-outline italic">Requiere inicio de sesión</span>
                                    <Link
                                      to="/acceso-miembros"
                                      className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold"
                                    >
                                      Acceder
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
