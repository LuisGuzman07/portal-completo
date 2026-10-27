import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { publicationService } from '../../services/api';

const EMPTY_PUB_FORM = {
  titulo: '',
  tipo: '',
  anio: new Date().getFullYear(),
  doi: '',
  resumen: '',
  referencias: '',
  investigador_id: '',
  categoria_ids: [],
  palabras_clave: '',
  // Documento inicial opcional
  documento_titulo: '',
  documento_tipo_id: '',
  documento_nivel_acceso: 'publico',
  archivo: null,
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function StatusBadge({ status }) {
  const styles = {
    borrador: 'bg-slate-100 text-slate-700 border-slate-200',
    pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
    en_revision: 'bg-blue-50 text-blue-800 border-blue-200',
    observada: 'bg-amber-100 text-amber-900 border-amber-300',
    aprobada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rechazada: 'bg-rose-50 text-rose-800 border-rose-200',
    retirada: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels = {
    borrador: 'Borrador',
    pendiente: 'Pendiente de Revisión',
    en_revision: 'En Revisión',
    observada: 'Observada',
    aprobada: 'Aprobada / Publicada',
    rechazada: 'Rechazada',
    retirada: 'Retirada',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.pendiente}`}>
      {labels[status] || status}
    </span>
  );
}

export default function AdminPublicacionesPage() {
  const { user, isSuperAdmin, isAdminAcademico } = useAuth();

  const [publications, setPublications] = useState([]);
  const [types, setTypes] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [investigators, setInvestigators] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modales
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [pubForm, setPubForm] = useState(EMPTY_PUB_FORM);
  const [savingPub, setSavingPub] = useState(false);

  // Modal Documentos (CU14)
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedPub, setSelectedPub] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [newDocFile, setNewDocFile] = useState(null);
  const [newDocTitulo, setNewDocTitulo] = useState('');
  const [newDocTipoId, setNewDocTipoId] = useState('');
  const [newDocNivel, setNewDocNivel] = useState('publico');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Reemplazo de documento
  const [replaceDocId, setReplaceDocId] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replacingDoc, setReplacingDoc] = useState(false);

  // Carga inicial
  const loadCatalogs = async () => {
    try {
      const [tList, dtList, cList, invList] = await Promise.all([
        publicationService.listTypes(),
        publicationService.listDocTypes(),
        publicationService.listCategories(),
        publicationService.listAvailableInvestigators(),
      ]);
      setTypes(tList || []);
      setDocTypes(dtList || []);
      setCategories(cList || []);
      setInvestigators(invList || []);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  };

  const loadPublications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.estado = statusFilter;
      if (typeFilter) params.tipo_id = typeFilter;

      const res = await publicationService.list(params);
      setPublications(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      setError(err?.data?.detail || err.message || 'Error al cargar publicaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
    loadPublications();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPublications();
  };

  // Guardar nueva publicación (CU10, CU14, CU15)
  const handleSavePublication = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!pubForm.titulo.trim()) {
      setError('El título de la publicación es obligatorio.');
      return;
    }
    if (!pubForm.tipo) {
      setError('Seleccione un tipo de publicación.');
      return;
    }

    setSavingPub(true);
    try {
      const formData = new FormData();
      formData.append('titulo', pubForm.titulo.trim());
      formData.append('tipo', pubForm.tipo);
      if (pubForm.anio) formData.append('anio', pubForm.anio);
      if (pubForm.doi.trim()) formData.append('doi', pubForm.doi.trim());
      if (pubForm.resumen.trim()) formData.append('resumen', pubForm.resumen.trim());
      if (pubForm.referencias.trim()) formData.append('referencias', pubForm.referencias.trim());
      if (pubForm.investigador_id) formData.append('investigador_id', pubForm.investigador_id);

      // Categorías seleccionadas (CU15)
      pubForm.categoria_ids.forEach((cId) => formData.append('categoria_ids', cId));

      // Palabras clave
      if (pubForm.palabras_clave.trim()) {
        const terms = pubForm.palabras_clave.split(',').map((t) => t.trim()).filter(Boolean);
        terms.forEach((term) => formData.append('palabras_clave', term));
      }

      // Documento digital inicial (CU14)
      if (pubForm.archivo) {
        formData.append('archivo', pubForm.archivo);
        if (pubForm.documento_titulo.trim()) {
          formData.append('documento_titulo', pubForm.documento_titulo.trim());
        }
        if (pubForm.documento_tipo_id) {
          formData.append('documento_tipo_id', pubForm.documento_tipo_id);
        }
        formData.append('documento_nivel_acceso', pubForm.documento_nivel_acceso);
      }

      await publicationService.create(formData);
      setNotice('Publicación científica registrada exitosamente. Se encuentra en estado pendiente para evaluación académica.');
      setPubModalOpen(false);
      setPubForm(EMPTY_PUB_FORM);
      loadPublications();
    } catch (err) {
      const d = err?.data;
      let msg = err.message || 'Error al registrar la publicación.';
      if (d && typeof d === 'object') {
        msg = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ');
      }
      setError(msg);
    } finally {
      setSavingPub(false);
    }
  };

  // Abrir modal de documentos digitales (CU14)
  const openDocsModal = async (pub) => {
    setSelectedPub(pub);
    setDocsModalOpen(true);
    setDocsLoading(true);
    setNewDocFile(null);
    setNewDocTitulo('');
    setNewDocTipoId('');
    setReplaceDocId(null);
    setReplaceFile(null);
    try {
      const docs = await publicationService.listDocuments(pub.id);
      setDocuments(docs || []);
    } catch (err) {
      setError('Error al cargar documentos de la publicación.');
    } finally {
      setDocsLoading(false);
    }
  };

  // Subir nuevo documento (CU14)
  const handleUploadNewDoc = async (e) => {
    e.preventDefault();
    if (!newDocFile) {
      setError('Seleccione un archivo PDF válido.');
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('archivo', newDocFile);
      if (newDocTitulo.trim()) fd.append('titulo', newDocTitulo.trim());
      if (newDocTipoId) fd.append('tipo_id', newDocTipoId);
      fd.append('nivel_acceso', newDocNivel);

      await publicationService.uploadDocument(selectedPub.id, fd);
      setNotice('Documento digital adjuntado con éxito.');
      setNewDocFile(null);
      setNewDocTitulo('');

      // Recargar lista de documentos
      const updatedDocs = await publicationService.listDocuments(selectedPub.id);
      setDocuments(updatedDocs || []);
      loadPublications();
    } catch (err) {
      setError(err?.data?.error || err.message || 'Error al subir documento.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Reemplazar archivo de documento (CU14)
  const handleReplaceDoc = async (docId) => {
    if (!replaceFile) {
      setError('Seleccione el nuevo archivo PDF para el reemplazo.');
      return;
    }
    setReplacingDoc(true);
    try {
      const fd = new FormData();
      fd.append('archivo', replaceFile);
      await publicationService.replaceDocument(docId, fd);
      setNotice('Archivo del documento digital reemplazado exitosamente.');
      setReplaceDocId(null);
      setReplaceFile(null);

      // Recargar lista
      const updatedDocs = await publicationService.listDocuments(selectedPub.id);
      setDocuments(updatedDocs || []);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Error al reemplazar archivo.');
    } finally {
      setReplacingDoc(false);
    }
  };

  // Eliminar documento (CU14)
  const handleDeleteDoc = async (docId, titulo) => {
    if (!window.confirm(`¿Confirma que desea eliminar el documento "${titulo}"? El archivo será borrado de forma permanente.`)) {
      return;
    }
    try {
      await publicationService.deleteDocument(docId);
      setNotice('Documento digital eliminado correctamente.');
      const updatedDocs = await publicationService.listDocuments(selectedPub.id);
      setDocuments(updatedDocs || []);
      loadPublications();
    } catch (err) {
      setError(err?.data?.detail || err.message || 'Error al eliminar documento.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Gestión de Publicaciones</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Registro, clasificación temática y administración de documentos digitales académicos (PDF).
          </p>
        </div>

        <button
          onClick={() => {
            setPubForm(EMPTY_PUB_FORM);
            setPubModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Nueva Publicación</span>
        </button>
      </div>

      {/* Notificaciones */}
      {error && (
        <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-error hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-emerald-800 hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              type="text"
              placeholder="Buscar por título, autor, resumen o palabra clave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container text-primary font-bold text-xs transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todos los Tipos</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="pendiente">Pendiente de Revisión</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobada">Aprobada / Publicada</option>
            <option value="borrador">Borrador</option>
            <option value="rechazada">Rechazada</option>
          </select>

          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
            title="Limpiar filtros"
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Tabla de Publicaciones */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Cargando publicaciones científicas...</span>
          </div>
        ) : publications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-outline">menu_book</span>
            <p className="text-xs font-semibold text-primary">No se encontraron publicaciones</p>
            <p className="text-[11px] text-on-surface-variant">
              {search || statusFilter || typeFilter ? 'Intente ajustando los filtros de búsqueda.' : 'Aún no se han registrado publicaciones en la plataforma.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/20">
                  <th className="py-3 px-4">Publicación y Metadatos</th>
                  <th className="py-3 px-4">Autores</th>
                  <th className="py-3 px-4">Clasificación / Área</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Documentos</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-surface-container-low/40 transition-colors">
                    {/* Título & Año & DOI */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-primary text-sm leading-tight line-clamp-2">
                        {pub.titulo}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                        <span className="font-semibold text-secondary">{pub.tipo_nombre}</span>
                        {pub.anio && <span>• {pub.anio}</span>}
                        {pub.doi && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-outline">
                            DOI: {pub.doi}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Autores */}
                    <td className="py-3.5 px-4 text-on-surface max-w-[200px]">
                      {pub.autores_lista && pub.autores_lista.length > 0 ? (
                        <div className="space-y-0.5">
                          {pub.autores_lista.map((a, i) => (
                            <div key={i} className="truncate text-xs">
                              {a.nombre_completo}
                              {a.investigador_id && (
                                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-bold">INV</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-outline italic">Sin autor especificado</span>
                      )}
                    </td>

                    {/* Clasificación (CU15) */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      {pub.categorias_lista && pub.categorias_lista.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pub.categorias_lista.map((c) => (
                            <span key={c.id} className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[11px] font-medium">
                              {c.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-outline text-[11px]">General</span>
                      )}
                      {pub.palabras_clave_lista && pub.palabras_clave_lista.length > 0 && (
                        <div className="text-[10px] text-outline mt-1 truncate">
                          Tags: {pub.palabras_clave_lista.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={pub.estado} />
                    </td>

                    {/* Documentos Digitales (CU14) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => openDocsModal(pub)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-colors cursor-pointer"
                        title="Ver y administrar documentos digitales"
                      >
                        <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        <span>{pub.documentos_count || 0} {pub.documentos_count === 1 ? 'doc' : 'docs'}</span>
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openDocsModal(pub)}
                        className="p-1.5 rounded hover:bg-surface-container text-primary transition-colors cursor-pointer"
                        title="Administrar documentos digitales (PDF)"
                      >
                        <span className="material-symbols-outlined text-lg">attach_file</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL: NUEVA PUBLICACIÓN CIENTÍFICA (CU10, CU14, CU15)
      ====================================================================== */}
      {pubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">post_add</span>
                <h3 className="text-base font-bold text-primary">Registrar Publicación Científica</h3>
              </div>
              <button onClick={() => setPubModalOpen(false)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePublication} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1 pt-3">
              {/* Título */}
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Título de la Publicación <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Análisis Criminológico de la Reincidencia Delictiva..."
                  value={pubForm.titulo}
                  onChange={(e) => setPubForm({ ...pubForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Fila: Tipo, Año, DOI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Tipo de Publicación <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    value={pubForm.tipo}
                    onChange={(e) => setPubForm({ ...pubForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Seleccione tipo...</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Año de Publicación</label>
                  <input
                    type="number"
                    min="1800"
                    max="2200"
                    value={pubForm.anio}
                    onChange={(e) => setPubForm({ ...pubForm, anio: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">DOI (Opcional)</label>
                  <input
                    type="text"
                    placeholder="10.5920/aboccrim..."
                    value={pubForm.doi}
                    onChange={(e) => setPubForm({ ...pubForm, doi: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Investigador Autor */}
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Investigador Autor Principal
                </label>
                <select
                  value={pubForm.investigador_id}
                  onChange={(e) => setPubForm({ ...pubForm, investigador_id: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Usuario actual ({user?.nombres} {user?.apellidos})</option>
                  {investigators.map((inv) => (
                    <option key={inv.investigador_id} value={inv.investigador_id}>
                      {inv.nombre_completo} ({inv.institucion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clasificación Académica (CU15): Categorías */}
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Clasificación y Categorías Temáticas (CU15)
                </label>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 max-h-36 overflow-y-auto space-y-1.5">
                  {categories.length === 0 ? (
                    <span className="text-outline italic">No hay categorías configuradas.</span>
                  ) : (
                    categories.map((cat) => {
                      const isChecked = pubForm.categoria_ids.includes(cat.id);
                      return (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-high/50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = isChecked
                                ? pubForm.categoria_ids.filter((id) => id !== cat.id)
                                : [...pubForm.categoria_ids, cat.id];
                              setPubForm({ ...pubForm, categoria_ids: next });
                            }}
                            className="rounded border-outline-variant/40 text-primary focus:ring-primary"
                          />
                          <span className="text-on-surface">
                            <strong>{cat.area_nombre}</strong> — {cat.nombre}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Palabras clave */}
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Palabras Clave (Separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="ej: criminología, peritaje forense, balística"
                  value={pubForm.palabras_clave}
                  onChange={(e) => setPubForm({ ...pubForm, palabras_clave: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Resumen */}
              <div>
                <label className="font-bold text-on-surface block mb-1">Resumen / Abstract</label>
                <textarea
                  rows="3"
                  placeholder="Síntesis metodológica, evidencia analizada y principales hallazgos de la investigación..."
                  value={pubForm.resumen}
                  onChange={(e) => setPubForm({ ...pubForm, resumen: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                ></textarea>
              </div>

              {/* Referencias */}
              <div>
                <label className="font-bold text-on-surface block mb-1">Referencias Bibliográficas</label>
                <textarea
                  rows="2"
                  placeholder="Normas APA / fuentes jurídicas y científicas consultadas..."
                  value={pubForm.referencias}
                  onChange={(e) => setPubForm({ ...pubForm, referencias: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                ></textarea>
              </div>

              {/* CU14: Documento Digital PDF Opcional */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  <span>Adjuntar Documento Digital Inicial (PDF - CU14)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-medium text-on-surface block mb-1">Archivo PDF (Máx. 25 MB)</label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setPubForm({ ...pubForm, archivo: file || null });
                      }}
                      className="w-full text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-on-surface block mb-1">Nivel de Acceso</label>
                    <select
                      value={pubForm.documento_nivel_acceso}
                      onChange={(e) => setPubForm({ ...pubForm, documento_nivel_acceso: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-container rounded-lg text-on-surface text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="publico">Acceso Público</option>
                      <option value="miembros">Solo Miembros Colegiados</option>
                      <option value="restringido">Restringido / Confidencial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setPubModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPub}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{savingPub ? 'Registrando...' : 'Registrar Publicación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADMINISTRAR DOCUMENTOS DIGITALES (CU14)
      ====================================================================== */}
      {docsModalOpen && selectedPub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">folder_managed</span>
                <div>
                  <h3 className="text-base font-bold text-primary">Documentos Digitales</h3>
                  <p className="text-[11px] text-on-surface-variant truncate max-w-md">
                    {selectedPub.titulo}
                  </p>
                </div>
              </div>
              <button onClick={() => setDocsModalOpen(false)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">

            {/* Listado de Documentos Existentes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                Archivos Adjuntos ({documents.length})
              </span>

              {docsLoading ? (
                <div className="p-4 text-center text-xs text-on-surface-variant">Cargando documentos...</div>
              ) : documents.length === 0 ? (
                <div className="p-6 bg-surface-container-low rounded-xl text-center space-y-1">
                  <span className="material-symbols-outlined text-2xl text-outline">description</span>
                  <p className="text-xs text-on-surface-variant">Esta publicación no cuenta con documentos asociados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                          <span className="material-symbols-outlined text-base text-rose-700">picture_as_pdf</span>
                          <span className="truncate">{doc.titulo}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-on-surface-variant">
                          <span className="font-mono text-outline">{doc.nombre_original}</span>
                          <span>• {formatBytes(doc.tamano_bytes)}</span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container text-secondary font-semibold">
                            {doc.nivel_acceso}
                          </span>
                          {doc.checksum_sha256 && (
                            <span className="font-mono text-[9px] text-outline" title={`SHA256: ${doc.checksum_sha256}`}>
                              SHA: {doc.checksum_sha256.substring(0, 10)}...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones por documento */}
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setReplaceDocId(replaceDocId === doc.id ? null : doc.id);
                            setReplaceFile(null);
                          }}
                          className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container text-primary text-xs font-semibold transition-colors cursor-pointer"
                          title="Reemplazar archivo PDF"
                        >
                          Reemplazar
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.titulo)}
                          className="p-1 rounded text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                          title="Eliminar documento"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      {/* Formulario de Reemplazo Expandible */}
                      {replaceDocId === doc.id && (
                        <div className="w-full mt-2 pt-2 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-secondary file:text-on-secondary"
                          />
                          <button
                            onClick={() => handleReplaceDoc(doc.id)}
                            disabled={replacingDoc || !replaceFile}
                            className="px-3 py-1 bg-secondary hover:bg-secondary-container text-on-secondary text-xs font-bold rounded transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {replacingDoc ? 'Subiendo...' : 'Confirmar Reemplazo'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario: Subir Nuevo Documento (CU14) */}
            <form onSubmit={handleUploadNewDoc} className="pt-3 border-t border-outline-variant/20 space-y-3">
              <span className="text-xs font-bold text-primary block">Adjuntar Nuevo Documento PDF</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-on-surface block mb-1">Título del Documento</label>
                  <input
                    type="text"
                    placeholder="Ej: Anexo Estadístico / Dictamen..."
                    value={newDocTitulo}
                    onChange={(e) => setNewDocTitulo(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-on-surface block mb-1">Tipo de Documento</label>
                  <select
                    value={newDocTipoId}
                    onChange={(e) => setNewDocTipoId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="">Seleccione tipo...</option>
                    {docTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>{dt.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-on-surface block mb-1">Nivel de Acceso</label>
                  <select
                    value={newDocNivel}
                    onChange={(e) => setNewDocNivel(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="publico">Acceso Público</option>
                    <option value="miembros">Solo Miembros Colegiados</option>
                    <option value="restringido">Restringido / Confidencial</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-on-surface block mb-1">Archivo PDF <span className="text-error">*</span></label>
                  <input
                    type="file"
                    required
                    accept=".pdf,application/pdf"
                    onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>{uploadingDoc ? 'Subiendo...' : 'Subir Documento'}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
