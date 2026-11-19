import React, { useEffect, useState } from 'react';
import { eventService, multimediaService, newsService } from '../../services/api';

const EMPTY = {
  titulo: '',
  descripcion: '',
  nivel_acceso: 'publico',
  parent: '',
  enlace: '',
  archivo: null,
  modo: 'archivo',
};
const inputClass =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';
const accessLabels = {
  publico: 'Público',
  miembros: 'Miembros acreditados',
  restringido: 'Restringido (administración y comité)',
};

function message(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    return Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .join(' ');
  }
  return error?.message || 'No se pudo completar la operación.';
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

export default function AdminMultimediaPage() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'

  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (accessFilter) params.nivel_acceso = accessFilter;
      const result = await multimediaService.list(params);
      setItems(Array.isArray(result) ? result : result.results || []);
    } catch (loadError) {
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([eventService.list(), newsService.list()])
      .then(([eventResult, newsResult]) => {
        setEvents(Array.isArray(eventResult) ? eventResult : eventResult.results || []);
        setNews(Array.isArray(newsResult) ? newsResult : newsResult.results || []);
      })
      .catch((loadError) => setError(message(loadError)));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, accessFilter]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setNotice('');
    setViewMode('form');
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      nivel_acceso: item.nivel_acceso || 'publico',
      parent: item.evento_id
        ? `evento:${item.evento_id}`
        : item.noticia_id
        ? `noticia:${item.noticia_id}`
        : '',
      enlace: item.enlace_externo || '',
      archivo: null,
      modo: item.es_archivo ? 'archivo' : 'enlace',
    });
    setError('');
    setNotice('');
    setViewMode('form');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(EMPTY);
    setViewMode('list');
  };

  const save = async (submitEvent) => {
    submitEvent.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    const [parentType, parentId] = form.parent ? form.parent.split(':') : ['', ''];
    const data = new FormData();
    data.append('titulo', form.titulo.trim());
    data.append('descripcion', form.descripcion.trim());
    data.append('nivel_acceso', form.nivel_acceso);
    data.append('evento_id', parentType === 'evento' ? parentId : '');
    data.append('noticia_id', parentType === 'noticia' ? parentId : '');

    if (form.modo === 'archivo') {
      if (form.archivo) {
        data.append('archivo', form.archivo);
      }
    } else if (form.modo === 'enlace' && form.enlace.trim()) {
      data.append('enlace', form.enlace.trim());
    }

    try {
      if (editing) {
        await multimediaService.update(editing.id, data);
      } else {
        await multimediaService.create(data);
      }
      setNotice(
        editing
          ? 'Los cambios del recurso se guardaron exitosamente.'
          : 'El recurso multimedia se registró exitosamente.'
      );
      cancelEdit();
      await load();
    } catch (saveError) {
      setError(message(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente el recurso "${item.titulo}"? Esta acción borrará el archivo asociado del servidor.`)) {
      return;
    }
    setDeletingId(item.id);
    setError('');
    setNotice('');
    try {
      await multimediaService.delete(item.id);
      setNotice(`Recurso multimedia "${item.titulo}" eliminado exitosamente.`);
      await load();
    } catch (delError) {
      setError(message(delError));
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
            Gestión institucional · Multimedia
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Contenido Multimedia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Administra videos, podcasts, audios y fotografías institucionales. Con reproductor HTML5 integrado y vinculación a eventos o noticias.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'list' ? (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Subir Recurso</span>
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
            href="/multimedia"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2.5 text-xs font-bold text-primary hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            <span className="hidden sm:inline">Ver catálogo</span>
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
                {editing ? 'Edición de Recurso' : 'Carga Multimedia'}
              </span>
              <h2 className="text-xl font-bold text-primary mt-0.5">
                {editing ? `Editar: ${editing.titulo}` : 'Registrar Nuevo Recurso Multimedia'}
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
                Título del Recurso <span className="text-error">*</span>
                <input
                  className={inputClass}
                  maxLength={250}
                  required
                  placeholder="Ej. Conferencia Magistral: Nuevas Tendencias en Criminología"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface md:col-span-2">
                Descripción o Resumen
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Contexto del video/audio, ponentes, duración o temas tratados."
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Asociar a Evento o Noticia (Opcional)
                <select
                  className={inputClass}
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value })}
                >
                  <option value="">Sin asociación (recurso independiente)</option>
                  <optgroup label="Eventos Académicos">
                    {events.map((item) => (
                      <option key={`e${item.id}`} value={`evento:${item.id}`}>
                        {item.titulo}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Noticias Institucionales">
                    {news.map((item) => (
                      <option key={`n${item.id}`} value={`noticia:${item.id}`}>
                        {item.titulo}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="block text-[11px] font-normal text-on-surface-variant">
                  Si se asocia, el recurso será visible cuando el evento o noticia esté publicado.
                </span>
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Nivel de Acceso
                <select
                  className={inputClass}
                  value={form.nivel_acceso}
                  onChange={(e) => setForm({ ...form, nivel_acceso: e.target.value })}
                >
                  <option value="publico">Público (visible para toda la comunidad)</option>
                  <option value="miembros">Miembros Acreditados</option>
                  <option value="restringido">Restringido (administración y comité)</option>
                </select>
              </label>

              {/* SELECCIÓN ARCHIVO O ENLACE */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                  Tipo de Fuente Multimedia <span className="text-error">*</span>
                </span>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                    <input
                      type="radio"
                      name="modo"
                      value="archivo"
                      checked={form.modo === 'archivo'}
                      onChange={() => setForm({ ...form, modo: 'archivo' })}
                    />
                    <span>Subir archivo (Video / Audio / Imagen / PDF)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                    <input
                      type="radio"
                      name="modo"
                      value="enlace"
                      checked={form.modo === 'enlace'}
                      onChange={() => setForm({ ...form, modo: 'enlace' })}
                    />
                    <span>Enlace Web Externo (YouTube / Vimeo / Web)</span>
                  </label>
                </div>

                {form.modo === 'archivo' ? (
                  <div className="space-y-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs text-on-surface-variant block">
                        Seleccionar archivo audiovisual (MP4, WEBM, MOV, MP3, WAV, JPG, PNG, PDF - hasta 50 MB):
                      </span>
                      <input
                        type="file"
                        accept=".mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a,.jpg,.jpeg,.png,.webp,.pdf"
                        required={!editing || (!editing.es_archivo && !form.archivo)}
                        onChange={(e) => setForm({ ...form, archivo: e.target.files?.[0] || null })}
                        className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary cursor-pointer`}
                      />
                    </label>
                    {editing?.es_archivo && (
                      <p className="text-[11px] text-outline">
                        Archivo actual: <span className="font-mono">{editing.tipo}</span>. Si no seleccionas otro archivo, se conserva el existente.
                      </p>
                    )}
                  </div>
                ) : (
                  <label className="block space-y-1.5">
                    <span className="text-xs text-on-surface-variant block">
                      Enlace HTTPS directo:
                    </span>
                    <input
                      className={inputClass}
                      type="url"
                      maxLength={500}
                      required={form.modo === 'enlace'}
                      value={form.enlace}
                      onChange={(e) => setForm({ ...form, enlace: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... o https://..."
                    />
                  </label>
                )}
              </div>
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
                <span>{saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Registrar Recurso'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VISTA DE LISTA DE RECURSOS */
        <section className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              className={inputClass}
              aria-label="Buscar recursos multimedia"
              placeholder="Buscar por título, descripción, evento o noticia…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={inputClass}
              aria-label="Filtrar por nivel de acceso"
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
            >
              <option value="">Todos los accesos</option>
              {Object.entries(accessLabels).map(([value, label]) => (
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
              <span>Cargando recursos multimedia…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-16 text-center text-xs text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline">perm_media</span>
              <p>No hay recursos multimedia que coincidan con los filtros.</p>
              <button
                type="button"
                onClick={openNew}
                className="mt-2 text-primary font-bold hover:underline"
              >
                + Subir el primer archivo
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const isVideo = isVideoType(item.tipo, item.descarga_url || item.enlace_externo);
                const isAudio = isAudioType(item.tipo, item.descarga_url || item.enlace_externo);
                const isImage = isImageType(item.tipo, item.descarga_url || item.enlace_externo);
                const streamUrl = item.enlace_externo || item.descarga_url;

                return (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs hover:shadow-md transition-all justify-between"
                  >
                    <div>
                      {/* Previsualizador Integrado */}
                      {streamUrl && (
                        <div className="bg-black/90 flex items-center justify-center overflow-hidden">
                          {isVideo ? (
                            <video
                              controls
                              preload="metadata"
                              className="w-full max-h-48 object-contain bg-black"
                              src={streamUrl}
                            />
                          ) : isImage ? (
                            <img
                              src={streamUrl}
                              alt={item.titulo}
                              className="w-full h-44 object-cover"
                            />
                          ) : isAudio ? (
                            <div className="w-full p-4 bg-surface-container-low flex flex-col items-center gap-2">
                              <span className="material-symbols-outlined text-3xl text-primary">headphones</span>
                              <audio controls className="w-full" src={streamUrl} />
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                            {item.es_archivo ? `Archivo ${item.tipo}` : 'Enlace Web'}
                          </span>
                          <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-outline uppercase">
                            {accessLabels[item.nivel_acceso] || item.nivel_acceso}
                          </span>
                        </div>

                        <h3 className="font-bold text-primary leading-snug break-words">
                          {item.titulo}
                        </h3>

                        {item.descripcion && (
                          <p className="line-clamp-2 text-xs text-on-surface-variant leading-relaxed">
                            {item.descripcion}
                          </p>
                        )}

                        <p className="text-[11px] text-outline font-medium">
                          {item.evento_titulo
                            ? `Evento: ${item.evento_titulo}`
                            : item.noticia_titulo
                            ? `Noticia: ${item.noticia_titulo}`
                            : 'Recurso independiente'}
                        </p>
                      </div>
                    </div>

                    {/* Acciones: Editar y Botón de Eliminación Directa */}
                    <div className="p-4 bg-surface-container-low/50 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-outline truncate max-w-[120px]">
                        Por: {item.cargado_por_nombre || 'Admin'}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
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
                          title="Eliminar recurso multimedia"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
