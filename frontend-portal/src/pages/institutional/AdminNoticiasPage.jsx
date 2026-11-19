import React, { useEffect, useState, useRef } from 'react';
import { newsService } from '../../services/api';

const EMPTY_FORM = {
  titulo: '',
  contenido: '',
  estado: 'borrador',
  material_url: '',
};
const ESTADOS = [
  ['borrador', 'Borrador'],
  ['publicado', 'Publicado'],
  ['retirada', 'Retirada'],
];
const inputClass =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';

function errorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    return Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .join(' ');
  }
  return error?.message || 'No se pudo completar la operación.';
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
    : 'No publicada';
}

// Simple Markdown parser for live preview
function renderSimpleMarkdown(text) {
  if (!text) return '<p class="text-outline italic">Sin contenido redactado aún.</p>';

  const lines = text.split('\n');
  const htmlLines = [];
  let inList = false;

  for (let line of lines) {
    let trimmed = line.trim();

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
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
      htmlLines.push(`<h4 class="text-base font-bold text-primary mt-4 mb-1">${formatInline(trimmed.substring(4))}</h4>`);
    } else if (trimmed.startsWith('## ')) {
      htmlLines.push(`<h3 class="text-lg font-bold text-primary mt-5 mb-2 border-b border-outline-variant/20 pb-1">${formatInline(trimmed.substring(3))}</h3>`);
    } else if (trimmed.startsWith('# ')) {
      htmlLines.push(`<h2 class="text-xl font-bold text-primary mt-6 mb-2">${formatInline(trimmed.substring(2))}</h2>`);
    } else if (trimmed.startsWith('> ')) {
      htmlLines.push(`<blockquote class="border-l-4 border-secondary pl-3.5 py-1 italic my-3 text-on-surface-variant bg-surface-container-low rounded-r-lg">${formatInline(trimmed.substring(2))}</blockquote>`);
    } else if (trimmed === '') {
      htmlLines.push('<div class="h-2"></div>');
    } else {
      htmlLines.push(`<p class="leading-relaxed mb-2">${formatInline(line)}</p>`);
    }
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('');
}

function formatInline(text) {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Link [text](url)
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-secondary underline font-semibold">$1</a>');
  return text;
}

export default function AdminNoticiasPage() {
  const [news, setNews] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [tabMode, setTabMode] = useState('write'); // 'write' | 'preview'

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const textareaRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      const response = await newsService.list(params);
      setNews(Array.isArray(response) ? response : response.results || []);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, stateFilter]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(false);
    setTabMode('write');
    setError('');
    setNotice('');
    setViewMode('form');
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      titulo: item.titulo || '',
      contenido: item.contenido || '',
      estado: item.estado,
      material_url: item.material_url || '',
    });
    setImageFile(null);
    setImagePreview(item.imagen_portada_url || '');
    setRemoveExistingImage(false);
    setTabMode('write');
    setError('');
    setNotice('');
    setViewMode('form');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(false);
    setViewMode('list');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveExistingImage(false);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(true);
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = form.contenido;
    const selectedText = currentText.substring(start, end);

    const replacement = prefix + (selectedText || 'texto') + suffix;
    const newContent =
      currentText.substring(0, start) + replacement + currentText.substring(end);

    setForm({ ...form, contenido: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 5)
      );
    }, 0);
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    const formData = new FormData();
    formData.append('titulo', form.titulo.trim());
    formData.append('contenido', form.contenido.trim());
    formData.append('estado', form.estado);
    formData.append('material_url', form.material_url.trim());

    if (imageFile) {
      formData.append('imagen_portada', imageFile);
    } else if (removeExistingImage) {
      formData.append('eliminar_imagen', 'true');
    }

    try {
      if (editing) {
        await newsService.update(editing.id, formData);
      } else {
        await newsService.create(formData);
      }
      setNotice(
        editing
          ? 'Los cambios de la noticia se guardaron exitosamente.'
          : 'La noticia institucional se registró y publicó exitosamente con su portada.'
      );
      cancelEdit();
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la noticia "${item.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(item.id);
    setError('');
    setNotice('');
    try {
      await newsService.delete(item.id);
      setNotice(`La noticia "${item.titulo}" ha sido eliminada.`);
      await load();
    } catch (delError) {
      setError(errorMessage(delError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            Comunicación institucional · Noticias
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Noticias Institucionales
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Redacta comunicados oficiales con editor de texto enriquecido, fotografías de portada y enlaces a materiales complementarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'list' ? (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Nueva Noticia</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Volver a la lista</span>
            </button>
          )}
          <a
            href="/noticias"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2.5 text-xs font-bold text-primary hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            <span className="hidden sm:inline">Ver portal</span>
          </a>
        </div>
      </header>

      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`rounded-2xl p-4 text-xs font-medium flex items-center gap-2.5 ${
            error
              ? 'bg-error-container/30 border border-error/30 text-error'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg shrink-0">
            {error ? 'error' : 'check_circle'}
          </span>
          <span>{error || notice}</span>
        </div>
      )}

      {/* VISTA DEDICADA DE FORMULARIO (VENTANA APARTE) */}
      {viewMode === 'form' ? (
        <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                {editing ? 'Edición de Noticia' : 'Redacción Institucional'}
              </span>
              <h2 className="text-xl font-bold text-primary mt-0.5">
                {editing ? `Editar: ${editing.titulo}` : 'Crear y Publicar Noticia Oficial'}
              </h2>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs font-bold text-outline hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
              <span>Cerrar</span>
            </button>
          </div>

          <form onSubmit={save} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface md:col-span-2">
                Titular de la Noticia <span className="text-error">*</span>
                <input
                  className={inputClass}
                  maxLength={250}
                  required
                  placeholder="Ej. ABOCCRIM celebra convenio con universidades internacionales"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>

              {/* SECCIÓN DE FOTOGRAFÍA / PORTADA DE LA NOTICIA */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">image</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Fotografía de Portada de la Noticia
                  </span>
                </div>

                {imagePreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Vista previa de portada"
                      className="w-full sm:w-56 h-36 object-cover rounded-xl border border-outline-variant/40 shadow-xs"
                    />
                    <div className="space-y-2 text-left">
                      <span className="text-xs text-on-surface font-semibold block">
                        Imagen de portada cargada
                      </span>
                      <p className="text-[11px] text-outline">
                        Esta imagen encabezará la noticia tanto en la lista principal como en el artículo completo.
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 rounded-lg bg-error-container/40 text-error hover:bg-error-container font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Quitar imagen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block space-y-1.5">
                      <span className="text-xs text-on-surface-variant block">
                        Cargar imagen de portada directamente (JPG, PNG, WEBP, máx. 50 MB):
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary cursor-pointer`}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* EDITOR DE TEXTO ENRIQUECIDO / MARKDOWN */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Cuerpo y Contenido de la Noticia <span className="text-error">*</span>
                  </label>
                  {/* Selector Redactar / Vista Previa */}
                  <div className="flex rounded-xl bg-surface-container p-1 border border-outline-variant/20 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTabMode('write')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tabMode === 'write'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Redactar
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabMode('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tabMode === 'preview'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Vista Previa
                    </button>
                  </div>
                </div>

                {tabMode === 'write' ? (
                  <div className="space-y-2">
                    {/* Barra de herramientas enriquecida */}
                    <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface font-bold cursor-pointer"
                        title="Negrita (**texto**)"
                      >
                        <span className="material-symbols-outlined text-base">format_bold</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface italic cursor-pointer"
                        title="Cursiva (*texto*)"
                      >
                        <span className="material-symbols-outlined text-base">format_italic</span>
                      </button>
                      <span className="h-4 w-px bg-outline-variant/40 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('## ')}
                        className="px-2 py-1 rounded-lg hover:bg-surface-container-high text-on-surface font-bold text-xs cursor-pointer"
                        title="Título secundario (H2)"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('### ')}
                        className="px-2 py-1 rounded-lg hover:bg-surface-container-high text-on-surface font-bold text-xs cursor-pointer"
                        title="Subtítulo (H3)"
                      >
                        H3
                      </button>
                      <span className="h-4 w-px bg-outline-variant/40 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- ')}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface cursor-pointer"
                        title="Lista con viñetas"
                      >
                        <span className="material-symbols-outlined text-base">format_list_bulleted</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('1. ')}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface cursor-pointer"
                        title="Lista numerada"
                      >
                        <span className="material-symbols-outlined text-base">format_list_numbered</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('> ')}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface cursor-pointer"
                        title="Cita textual"
                      >
                        <span className="material-symbols-outlined text-base">format_quote</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('[', '](https://...)')}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface cursor-pointer"
                        title="Enlace web"
                      >
                        <span className="material-symbols-outlined text-base">link</span>
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      className={`${inputClass} min-h-64 font-sans text-sm resize-y leading-relaxed`}
                      required
                      value={form.contenido}
                      onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                      placeholder="Redacta el texto oficial. Utiliza los botones de la barra de herramientas para títulos secundarios, negritas o listas."
                    />
                  </div>
                ) : (
                  <div className="min-h-64 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface">
                    <div
                      className="prose prose-sm max-w-none text-on-surface"
                      dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(form.contenido) }}
                    />
                  </div>
                )}
              </div>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Estado de publicación
                <select
                  className={inputClass}
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  {ESTADOS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] font-normal text-on-surface-variant">
                  Solo las noticias en estado "Publicado" serán visibles para el público.
                </span>
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Enlace complementario externo (opcional)
                <input
                  className={inputClass}
                  type="url"
                  maxLength={500}
                  value={form.material_url}
                  onChange={(e) => setForm({ ...form, material_url: e.target.value })}
                  placeholder="https://ejemplo.org/comunicado.pdf"
                />
                <span className="block text-[11px] font-normal text-on-surface-variant">
                  Enlace de prensa, documento oficial externo o sitio web relacionado.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Publicar Noticia'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VISTA DE LISTA DE NOTICIAS */
        <section className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:grid-cols-[1fr_220px_auto]">
            <input
              className={inputClass}
              aria-label="Buscar noticias"
              placeholder="Buscar por título o contenido…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={inputClass}
              aria-label="Filtrar por estado"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-surface-container-low hover:bg-surface-container-high px-4 py-2.5 text-xs font-bold text-primary transition-all cursor-pointer"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">
                progress_activity
              </span>
              <span>Cargando noticias institucionales…</span>
            </div>
          ) : news.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-16 text-center text-xs text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline">newspaper</span>
              <p>No hay noticias registradas que coincidan con los filtros.</p>
              <button
                type="button"
                onClick={openNew}
                className="mt-2 text-primary font-bold hover:underline"
              >
                + Redactar la primera noticia
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-outline">
                    <tr>
                      <th className="px-5 py-4">Noticia / Portada</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Fecha de Publicación</th>
                      <th className="px-5 py-4">Material</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {news.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {item.imagen_portada_url ? (
                              <img
                                src={item.imagen_portada_url}
                                alt={item.titulo}
                                className="w-12 h-12 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl">feed</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-primary truncate max-w-sm">
                                {item.titulo}
                              </p>
                              <p className="mt-0.5 max-w-md line-clamp-1 text-xs text-on-surface-variant">
                                {item.contenido}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              item.estado === 'publicado'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : item.estado === 'retirada'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {ESTADOS.find(([value]) => value === item.estado)?.[1] || item.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant">
                          {formatDate(item.fecha_publicacion)}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {item.material_url ? (
                            <a
                              href={item.material_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <span>Enlace</span>
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                          ) : (
                            <span className="text-outline">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="px-3 py-1.5 rounded-lg font-bold text-xs text-primary hover:bg-surface-container-high transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="px-2.5 py-1.5 rounded-lg font-bold text-xs text-error hover:bg-error-container/30 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Eliminar noticia"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
