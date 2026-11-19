import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { publicationService } from '../../services/api';

export const AREAS_TEMATICAS_TAXONOMIA = [
  {
    numero: 1,
    nombre: '1. Criminología',
    titulo: 'Criminología',
    icono: 'psychology',
    descripcion: 'Estudio interdisciplinario de las conductas antisociales, etiología del delito y control social.',
    subareas: ['Criminología Clínica', 'Criminología Crítica', 'Criminología Ambiental', 'Criminología Corporativa'],
  },
  {
    numero: 2,
    nombre: '2. Criminalística',
    titulo: 'Criminalística',
    icono: 'search_insights',
    descripcion: 'Aplicación de métodos y técnicas de investigación científica del hecho delictivo y sus indicios materiales.',
    subareas: ['Escena del Crimen', 'Balística Forense', 'Documentología', 'Huellas y Lofoscopia'],
  },
  {
    numero: 3,
    nombre: '3. Ciencias Forenses',
    titulo: 'Ciencias Forenses',
    icono: 'biotech',
    descripcion: 'Disciplinas biomédicas y científicas orientadas al auxilio pericial de la administración de justicia.',
    subareas: ['Medicina Legal', 'Psicología Forense', 'Antropología Forense', 'Genética Forense / ADN'],
  },
  {
    numero: 4,
    nombre: '4. Victimología',
    titulo: 'Victimología',
    icono: 'support_agent',
    descripcion: 'Atención integral, mitigación del daño y estudio científico de los procesos de victimización.',
    subareas: ['Atención a Víctimas', 'Reparación Integral', 'Victimización Secundaria', 'Restitución de Derechos'],
  },
  {
    numero: 5,
    nombre: '5. Sistema Penal',
    titulo: 'Sistema Penal',
    icono: 'balance',
    descripcion: 'Dogmática jurídica penal, garantías procesales y gestión de los regímenes de ejecución penitenciaria.',
    subareas: ['Política Criminal', 'Proceso Penal', 'Ejecución Penal', 'Justicia Restaurativa'],
  },
  {
    numero: 6,
    nombre: '6. Seguridad',
    titulo: 'Seguridad',
    icono: 'local_police',
    descripcion: 'Estrategias de prevención situacional, seguridad pública, penitenciaria y gobernanza institucional.',
    subareas: ['Seguridad Ciudadana', 'Seguridad Penitenciaria', 'Seguridad Institucional', 'Análisis Delictual'],
  },
  {
    numero: 7,
    nombre: '7. Violencia, Conflicto y Vulnerabilidad',
    titulo: 'Violencia, Conflicto y Vulnerabilidad',
    icono: 'group_remove',
    descripcion: 'Fenomenología de la violencia interpersonal, colectiva y estructural en grupos en situación de vulnerabilidad.',
    subareas: ['Violencia de Género', 'Violencia contra la Niñez', 'Trata y Tráfico Ilícito', 'Violencia Social e Interpersonal'],
  },
];

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
  const [areasList, setAreasList] = useState([]);

  // Estados para Categorías / Áreas y Personalizadas
  const [categorySearch, setCategorySearch] = useState('');
  const [activeAreaTab, setActiveAreaTab] = useState('todas');
  const [customCatName, setCustomCatName] = useState('');
  const [customCatAreaId, setCustomCatAreaId] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [customCatFeedback, setCustomCatFeedback] = useState('');

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

  // Modal Documentos Digitales
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

      // Extraer áreas únicas de las categorías
      const areasMap = new Map();
      (cList || []).forEach((c) => {
        if (c.area && c.area_nombre && !areasMap.has(c.area)) {
          areasMap.set(c.area, { id: c.area, nombre: c.area_nombre });
        }
      });
      const derivedAreas = Array.from(areasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setAreasList(derivedAreas);
      if (derivedAreas.length > 0) {
        setCustomCatAreaId(derivedAreas[0].id);
      }
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  };

  // Alternar selección de categoría con checkbox
  const handleToggleCategory = (catId) => {
    setPubForm((prev) => {
      const isChecked = prev.categoria_ids.includes(catId);
      const next = isChecked
        ? prev.categoria_ids.filter((id) => id !== catId)
        : [...prev.categoria_ids, catId];
      return { ...prev, categoria_ids: next };
    });
  };

  // Crear categoría manual / específica
  const handleCreateCustomCategory = async () => {
    const name = customCatName.trim();
    if (!name) return;

    // Verificar si ya existe en categorías cargadas
    const existing = categories.find((c) => c.nombre.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!pubForm.categoria_ids.includes(existing.id)) {
        handleToggleCategory(existing.id);
      }
      setCustomCatFeedback(`La categoría "${existing.nombre}" ya existe y ha sido marcada.`);
      setCustomCatName('');
      setTimeout(() => setCustomCatFeedback(''), 4500);
      return;
    }

    setCreatingCategory(true);
    setCustomCatFeedback('');
    try {
      const areaIdToUse = customCatAreaId || areasList[0]?.id || 2;
      const created = await publicationService.createCategory({
        area: areaIdToUse,
        nombre: name,
        descripcion: `Categoría institucional específica: ${name}`,
      });

      if (created && created.id) {
        setCategories((prev) => [...prev, created]);
        setPubForm((prev) => ({
          ...prev,
          categoria_ids: [...prev.categoria_ids, created.id],
          palabras_clave: prev.palabras_clave
            ? `${prev.palabras_clave}, ${name}`
            : name,
        }));
        setCustomCatFeedback(`Categoría "${created.nombre}" registrada y seleccionada exitosamente.`);
      }
    } catch (err) {
      console.warn('Registro API falló o restringido, indexando localmente:', err);
      // Fallback amigable: asociar a palabras clave para indexación
      setPubForm((prev) => ({
        ...prev,
        palabras_clave: prev.palabras_clave ? `${prev.palabras_clave}, ${name}` : name,
      }));
      setCustomCatFeedback(`Categoría "${name}" agregada a los descriptores de la publicación.`);
    } finally {
      setCreatingCategory(false);
      setCustomCatName('');
      setTimeout(() => setCustomCatFeedback(''), 4500);
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

  // Guardar nueva publicación
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

      // Categorías seleccionadas
      pubForm.categoria_ids.forEach((cId) => {
        if (typeof cId === 'string' && cId.startsWith('predef_')) {
          const subName = cId.replace('predef_', '').trim();
          const match = categories.find((c) => c.nombre.toLowerCase() === subName.toLowerCase());
          formData.append('categoria_ids', match ? match.id : cId);
        } else {
          formData.append('categoria_ids', cId);
        }
      });

      // Palabras clave
      if (pubForm.palabras_clave.trim()) {
        const terms = pubForm.palabras_clave.split(',').map((t) => t.trim()).filter(Boolean);
        terms.forEach((term) => formData.append('palabras_clave', term));
      }

      // Documento digital inicial
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
        const formatErrors = (val) => {
          if (Array.isArray(val)) return val.map(formatErrors).join(', ');
          if (val && typeof val === 'object') return Object.values(val).map(formatErrors).join(', ');
          return String(val);
        };
        msg = Object.entries(d).map(([k, v]) => `${k}: ${formatErrors(v)}`).join(' | ');
      }
      setError(msg);
    } finally {
      setSavingPub(false);
    }
  };

  // Abrir modal de documentos digitales
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

  // Subir nuevo documento
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

  // Reemplazar archivo de documento
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

  // Eliminar documento
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
            <table className="w-full min-w-[960px] text-left border-collapse">
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

                    {/* Clasificación */}
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

                    {/* Documentos Digitales */}
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
          MODAL: NUEVA PUBLICACIÓN CIENTÍFICA
      ====================================================================== */}
      {pubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl min-w-0 flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
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

              {/* Clasificación Académica: Siete Áreas Temáticas Permanentes */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Taxonomía de Conocimiento Institucional
                    </span>
                    <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">account_tree</span>
                      Siete Áreas Temáticas Permanentes de ABOCCRIM
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {pubForm.categoria_ids.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        {pubForm.categoria_ids.length} seleccionada{pubForm.categoria_ids.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {pubForm.categoria_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPubForm({ ...pubForm, categoria_ids: [] })}
                        className="text-[11px] text-error hover:underline cursor-pointer font-semibold"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro rápido y selector de pestañas de áreas */}
                <div className="space-y-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
                    <input
                      type="text"
                      placeholder="Filtrar subárea o especialidad (ej: balística, escena, genética, víctima, penal)..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>

                  {/* Pestañas de navegación rápida de áreas */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setActiveAreaTab('todas')}
                      className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer transition-all ${
                        activeAreaTab === 'todas'
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                      }`}
                    >
                      Todas las Áreas (7)
                    </button>
                    {AREAS_TEMATICAS_TAXONOMIA.map((area) => {
                      const countInArea = categories
                        .filter((c) => (c.area_nombre && c.area_nombre.includes(area.titulo)) || area.subareas.includes(c.nombre))
                        .filter((c) => pubForm.categoria_ids.includes(c.id)).length;
                      return (
                        <button
                          key={area.numero}
                          type="button"
                          onClick={() => setActiveAreaTab(area.numero.toString())}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
                            activeAreaTab === area.numero.toString()
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">{area.icono}</span>
                          <span>{area.titulo}</span>
                          {countInArea > 0 && (
                            <span className="ml-0.5 px-1 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                              {countInArea}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contenedor con scroll para las tarjetas de las 7 Áreas */}
                <div className="max-h-72 overflow-y-auto pr-1 space-y-3 border border-outline-variant/20 rounded-xl p-2.5 bg-surface-container-low/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AREAS_TEMATICAS_TAXONOMIA
                      .filter((area) => activeAreaTab === 'todas' || activeAreaTab === area.numero.toString())
                      .map((area) => {
                        // Obtener las categorías que pertenecen a esta área
                        const areaCategories = categories.filter((c) => {
                          const matchesArea = (c.area_nombre && (c.area_nombre.includes(area.titulo) || c.area_nombre.startsWith(`${area.numero}.`)));
                          const matchesSubarea = area.subareas.some((s) => s.toLowerCase() === c.nombre.toLowerCase());
                          return matchesArea || matchesSubarea;
                        });

                        // Para asegurar que todas las 4 subareas se muestren con su ID real de la BD
                        const itemsToRender = area.subareas.map((subName) => {
                          const found = areaCategories.find((c) => c.nombre.toLowerCase() === subName.toLowerCase());
                          return found || { id: `predef_${subName}`, nombre: subName, area_nombre: area.nombre };
                        });

                        // Filtrar por término de búsqueda si existe
                        const filteredItems = categorySearch.trim()
                          ? itemsToRender.filter((it) => it.nombre.toLowerCase().includes(categorySearch.toLowerCase()))
                          : itemsToRender;

                        if (categorySearch.trim() && filteredItems.length === 0) {
                          return null;
                        }

                        const selectedInCard = filteredItems.filter((it) => pubForm.categoria_ids.includes(it.id)).length;

                        return (
                          <div
                            key={area.numero}
                            className={`p-3 rounded-xl border transition-all ${
                              selectedInCard > 0
                                ? 'bg-surface-container-lowest border-primary/40 shadow-xs'
                                : 'bg-surface-container-lowest border-outline-variant/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                                <span className="material-symbols-outlined text-base text-secondary">{area.icono}</span>
                                <span>{area.nombre}</span>
                              </div>
                              {selectedInCard > 0 && (
                                <span className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                                  {selectedInCard} activa{selectedInCard > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-on-surface-variant leading-tight mb-2 line-clamp-2">
                              {area.descripcion}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {filteredItems.map((cat) => {
                                const isChecked = pubForm.categoria_ids.includes(cat.id);
                                return (
                                  <label
                                    key={cat.id}
                                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                      isChecked
                                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                        : 'bg-surface-container-low/60 border-outline-variant/20 text-on-surface hover:border-primary/40 hover:bg-surface-container-high/40'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleCategory(cat.id)}
                                      className="rounded border-outline-variant/40 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer shrink-0"
                                    />
                                    <span className="text-[11px] leading-tight truncate">
                                      {cat.nombre}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Otras categorías institucionales registradas */}
                  {(() => {
                    const allPredefNames = AREAS_TEMATICAS_TAXONOMIA.flatMap((a) => a.subareas.map((s) => s.toLowerCase()));
                    const extraCategories = categories.filter((c) => !allPredefNames.includes(c.nombre.toLowerCase()));
                    if (extraCategories.length === 0) return null;

                    const filteredExtras = categorySearch.trim()
                      ? extraCategories.filter((c) => c.nombre.toLowerCase().includes(categorySearch.toLowerCase()))
                      : extraCategories;

                    if (categorySearch.trim() && filteredExtras.length === 0) return null;

                    return (
                      <div className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
                        <div className="flex items-center gap-1.5 text-primary font-bold text-xs mb-1.5">
                          <span className="material-symbols-outlined text-base text-secondary">extension</span>
                          <span>Otras Categorías Institucionales Registradas</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {filteredExtras.map((cat) => {
                            const isChecked = pubForm.categoria_ids.includes(cat.id);
                            return (
                              <label
                                key={cat.id}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                  isChecked
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface-container-low/60 border-outline-variant/20 text-on-surface hover:border-primary/40 hover:bg-surface-container-high/40'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleCategory(cat.id)}
                                  className="rounded border-outline-variant/40 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer shrink-0"
                                />
                                <span className="text-[11px] leading-tight truncate">
                                  {cat.nombre}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Sección para Añadir Categoría Manual / Personalizada */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">add_circle</span>
                      ¿Desea añadir una categoría específica o manual que no está listada?
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      Se vinculará a la taxonomía y a la publicación
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva subárea o especialidad..."
                      value={customCatName}
                      onChange={(e) => setCustomCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomCategory();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-surface-container-lowest text-on-surface rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                    />

                    <select
                      value={customCatAreaId}
                      onChange={(e) => setCustomCatAreaId(e.target.value)}
                      className="px-3 py-1.5 bg-surface-container-lowest text-on-surface rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:border-primary cursor-pointer sm:w-56"
                    >
                      {areasList.length > 0 ? (
                        areasList.map((a) => (
                          <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))
                      ) : (
                        AREAS_TEMATICAS_TAXONOMIA.map((a) => (
                          <option key={a.numero} value={a.numero}>{a.nombre}</option>
                        ))
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={handleCreateCustomCategory}
                      disabled={creatingCategory || !customCatName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {creatingCategory ? (
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">add</span>
                      )}
                      <span>Añadir Categoría</span>
                    </button>
                  </div>

                  {customCatFeedback && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>{customCatFeedback}</span>
                    </div>
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

              {/* Documento Digital PDF Opcional */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  <span>Adjuntar Documento Digital Inicial (PDF)</span>
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
          MODAL: ADMINISTRAR DOCUMENTOS DIGITALES
      ====================================================================== */}
      {docsModalOpen && selectedPub && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl min-w-0 flex-col space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
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

            {/* Formulario: Subir Nuevo Documento */}
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
