import React, { useEffect, useState } from 'react';
import { eventService } from '../../services/api';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  lugar: '',
  estado: 'borrador',
};
const ESTADOS = [
  ['borrador', 'Borrador'],
  ['publicado', 'Publicado'],
  ['cancelado', 'Cancelado'],
];
const inputClass =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';

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

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function displayDate(value) {
  return value
    ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Sin fecha final';
}

export default function AdminEventosPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
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

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      const response = await eventService.list(params);
      setEvents(Array.isArray(response) ? response : response.results || []);
    } catch (loadError) {
      setError(message(loadError));
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
    setError('');
    setNotice('');
    setViewMode('form');
  };

  const startEdit = (event) => {
    setEditing(event);
    setForm({
      titulo: event.titulo || '',
      descripcion: event.descripcion || '',
      fecha_inicio: localDateTime(event.fecha_inicio),
      fecha_fin: localDateTime(event.fecha_fin),
      lugar: event.lugar || '',
      estado: event.estado,
    });
    setImageFile(null);
    setImagePreview(event.imagen_url || '');
    setRemoveExistingImage(false);
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

  const save = async (submitEvent) => {
    submitEvent.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    const formData = new FormData();
    formData.append('titulo', form.titulo.trim());
    formData.append(
      'fecha_inicio',
      form.fecha_inicio ? new Date(form.fecha_inicio).toISOString() : ''
    );
    if (form.fecha_fin) {
      formData.append('fecha_fin', new Date(form.fecha_fin).toISOString());
    }
    if (form.descripcion.trim()) {
      formData.append('descripcion', form.descripcion.trim());
    }
    if (form.lugar.trim()) {
      formData.append('lugar', form.lugar.trim());
    }
    formData.append('estado', form.estado);

    if (imageFile) {
      formData.append('imagen', imageFile);
    } else if (removeExistingImage) {
      formData.append('eliminar_imagen', 'true');
    }

    try {
      if (editing) {
        await eventService.update(editing.id, formData);
      } else {
        await eventService.create(formData);
      }
      setNotice(
        editing
          ? 'Los cambios del evento se guardaron exitosamente.'
          : 'El evento académico se registró exitosamente con su fotografía.'
      );
      cancelEdit();
      await load();
    } catch (saveError) {
      setError(message(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el evento "${event.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(event.id);
    setError('');
    setNotice('');
    try {
      await eventService.delete(event.id);
      setNotice(`El evento "${event.titulo}" ha sido eliminado.`);
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
            Administración institucional · Eventos
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Eventos Académicos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Registra y gestiona conferencias, simposios y actividades académicas. Puedes adjuntar fotografías de portada y controlar su publicación en el portal.
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
              <span>Nuevo Evento</span>
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
            href="/eventos"
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
                {editing ? 'Edición de Evento' : 'Nueva Publicación'}
              </span>
              <h2 className="text-xl font-bold text-primary mt-0.5">
                {editing ? `Editar: ${editing.titulo}` : 'Registrar Nuevo Evento Académico'}
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
                Título del Evento <span className="text-error">*</span>
                <input
                  className={inputClass}
                  maxLength={250}
                  required
                  placeholder="Ej. Congreso Internacional de Criminología y Política Criminal 2026"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Lugar o Modalidad
                <input
                  className={inputClass}
                  maxLength={250}
                  value={form.lugar}
                  onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                  placeholder="Ej. Auditorio Principal UMSA / Plataforma Zoom"
                />
              </label>

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
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Fecha y hora de inicio <span className="text-error">*</span>
                <input
                  className={inputClass}
                  type="datetime-local"
                  required
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                Fecha y hora de finalización
                <input
                  className={inputClass}
                  type="datetime-local"
                  min={form.fecha_inicio || undefined}
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                />
              </label>

              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-on-surface md:col-span-2">
                Descripción detallada del evento
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Objetivos, expositores invitados, programa o temario de la actividad académica."
                />
              </label>

              {/* SECCIÓN DE FOTOGRAFÍA / IMAGEN DE PORTADA DEL EVENTO */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">add_photo_alternate</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Fotografía / Afiche del Evento
                  </span>
                </div>

                {imagePreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Vista previa del evento"
                      className="w-full sm:w-48 h-32 object-cover rounded-xl border border-outline-variant/40 shadow-xs"
                    />
                    <div className="space-y-2 text-left">
                      <span className="text-xs text-on-surface font-semibold block">
                        Fotografía seleccionada
                      </span>
                      <p className="text-[11px] text-outline">
                        Esta imagen se mostrará como afiche y portada del evento en el portal público.
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
                        Adjunta un afiche o fotografía (JPG, PNG, WEBP, máx. 50 MB):
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
                <span>{saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Registrar Evento'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VISTA DE LISTA DE EVENTOS */
        <section className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:grid-cols-[1fr_220px_auto]">
            <input
              className={inputClass}
              aria-label="Buscar eventos"
              placeholder="Buscar por título, descripción o lugar…"
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
              <span>Cargando eventos académicos…</span>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-16 text-center text-xs text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline">event_busy</span>
              <p>No hay eventos registrados que coincidan con los filtros.</p>
              <button
                type="button"
                onClick={openNew}
                className="mt-2 text-primary font-bold hover:underline"
              >
                + Crear el primer evento
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-outline">
                    <tr>
                      <th className="px-5 py-4">Evento / Afiche</th>
                      <th className="px-5 py-4">Fecha y Horario</th>
                      <th className="px-5 py-4">Lugar</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {event.imagen_url ? (
                              <img
                                src={event.imagen_url}
                                alt={event.titulo}
                                className="w-12 h-12 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl">event</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-primary truncate max-w-sm">
                                {event.titulo}
                              </p>
                              <p className="mt-0.5 max-w-md line-clamp-1 text-xs text-on-surface-variant">
                                {event.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant">
                          <div className="font-medium text-on-surface">
                            {displayDate(event.fecha_inicio)}
                          </div>
                          {event.fecha_fin && (
                            <div className="mt-0.5 text-outline">
                              Hasta: {displayDate(event.fecha_fin)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant">
                          {event.lugar || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              event.estado === 'publicado'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : event.estado === 'cancelado'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {ESTADOS.find(([value]) => value === event.estado)?.[1] || event.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(event)}
                              className="px-3 py-1.5 rounded-lg font-bold text-xs text-primary hover:bg-surface-container-high transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(event)}
                              disabled={deletingId === event.id}
                              className="px-2.5 py-1.5 rounded-lg font-bold text-xs text-error hover:bg-error-container/30 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Eliminar evento"
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
