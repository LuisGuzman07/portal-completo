import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { investigatorService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = {
  perfil_academico: '',
  estado: 'pendiente',
  fecha_alta: '',
  visible_directorio: false,
  areas: [],
  observacion_revision: '',
};

function getErrorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]);
    if (messages.length) return messages.join(' ');
  }
  return error?.message || 'Ocurrió un error al comunicarse con el servidor.';
}

function StatusBadge({ status }) {
  const styles = {
    activo: 'bg-emerald-50 text-emerald-800',
    pendiente: 'bg-amber-50 text-amber-800',
    observado: 'bg-orange-50 text-orange-800',
    rechazado: 'bg-rose-50 text-rose-800',
    inactivo: 'bg-slate-100 text-slate-600',
  };
  const labels = { activo: 'Activo', pendiente: 'Pendiente', observado: 'Observado', rechazado: 'Rechazado', inactivo: 'Inactivo' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status] || styles.pendiente}`}>
      {labels[status] || status}
    </span>
  );
}

export default function AdminInvestigadoresPage() {
  const { isSuperAdmin, isAdminAcademico } = useAuth();
  const [investigators, setInvestigators] = useState([]);
  const [areas, setAreas] = useState([]);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaForm, setAreaForm] = useState({ nombre: '', descripcion: '' });
  const [savingArea, setSavingArea] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.estado = statusFilter;
      const [investigatorResponse, areaResponse, profileResponse] = await Promise.all([
        investigatorService.list(params),
        investigatorService.listAreas(),
        investigatorService.availableProfiles(),
      ]);
      setInvestigators(Array.isArray(investigatorResponse) ? investigatorResponse : (investigatorResponse.results || []));
      setAreas(Array.isArray(areaResponse) ? areaResponse : (areaResponse.results || []));
      setAvailableProfiles(Array.isArray(profileResponse) ? profileResponse : (profileResponse.results || []));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = async (investigator) => {
    setError('');
    try {
    const detail = await investigatorService.get(investigator.id);
    setEditing(detail);
    setForm({
      perfil_academico: String(detail.perfil_academico_id),
      estado: detail.estado,
      fecha_alta: detail.fecha_alta || '',
      visible_directorio: detail.visible_directorio,
      areas: detail.areas.map((area) => area.id),
      observacion_revision: '',
    });
    setModalOpen(true);
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    }
  };

  const toggleArea = (areaId) => {
    setForm((current) => ({
      ...current,
      areas: current.areas.includes(areaId)
        ? current.areas.filter((id) => id !== areaId)
        : [...current.areas, areaId],
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      perfil_academico: Number(form.perfil_academico),
      estado: form.estado,
      fecha_alta: form.fecha_alta || null,
      visible_directorio: form.estado === 'activo' && form.visible_directorio,
      areas: form.areas,
      observacion_revision: form.observacion_revision,
    };
    try {
      if (editing) await investigatorService.update(editing.id, payload);
      else await investigatorService.create(payload);
      setModalOpen(false);
      setNotice(editing ? 'Se actualizaron los datos del investigador.' : 'Se registró el investigador correctamente.');
      await loadData();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (investigator) => {
    const disabling = investigator.estado !== 'inactivo';
    const confirmation = disabling
      ? `¿Desactivar a ${investigator.nombres} ${investigator.apellidos}? Dejará de estar visible en el directorio.`
      : `¿Activar a ${investigator.nombres} ${investigator.apellidos}?`;
    if (!window.confirm(confirmation)) return;

    setError('');
    setNotice('');
    try {
      await investigatorService.update(investigator.id, {
        estado: disabling ? 'inactivo' : 'activo',
        visible_directorio: disabling ? false : investigator.visible_directorio,
      });
      setNotice(disabling ? 'Investigador desactivado.' : 'Investigador activado.');
      await loadData();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const handleCreateArea = async (event) => {
    event.preventDefault();
    setSavingArea(true);
    setError('');
    try {
      if (editingArea) await investigatorService.updateArea(editingArea.id, areaForm);
      else await investigatorService.createArea(areaForm);
      setEditingArea(null);
      setAreaForm({ nombre: '', descripcion: '' });
      const response = await investigatorService.listAreas();
      setAreas(Array.isArray(response) ? response : (response.results || []));
      setNotice(editingArea ? 'Área temática actualizada; sus asignaciones se conservaron.' : 'Área temática creada y disponible para asignar.');
    } catch (areaError) {
      setError(getErrorMessage(areaError));
    } finally {
      setSavingArea(false);
    }
  };

  if (!isSuperAdmin && !isAdminAcademico) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
        <h1 className="text-xl font-bold text-primary">Acceso restringido</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Esta sección es para administración académica.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">CU07 · Directorio académico</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">Administración de Investigadores</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Revisa solicitudes, asigna áreas y administra el estado y la publicación de cada perfil.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditingArea(null); setAreaForm({ nombre: '', descripcion: '' }); setAreaModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-primary hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-lg">category</span> Administrar áreas
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:opacity-90">
            <span className="material-symbols-outlined text-lg">person_add</span> Vincular perfil existente
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-error-container/50 px-4 py-3 text-sm text-error">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      <section aria-label="Proceso de revisión de investigadores" className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-sky-950">Proceso de revisión</h2>
            <p className="mt-0.5 text-xs text-sky-900">Abre cada solicitud para revisar el perfil completo, registrar una decisión y consultar el historial.</p>
          </div>
          {areas.length === 0 && <button onClick={() => { setEditingArea(null); setAreaForm({ nombre: '', descripcion: '' }); setAreaModalOpen(true); }} className="shrink-0 rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-bold text-sky-950 hover:bg-sky-100">Crear primera área</button>}
        </div>
        <ol className="grid gap-2 text-xs sm:grid-cols-4">
          <li className="rounded-lg bg-white/80 p-3"><span className="font-bold text-primary">1 · Pendiente</span><span className="mt-1 block text-on-surface-variant">Revisar grado, institución, especialidad, biografía y ORCID.</span></li>
          <li className="rounded-lg bg-white/80 p-3"><span className="font-bold text-orange-800">2 · Observado</span><span className="mt-1 block text-on-surface-variant">Pedir correcciones concretas; la persona puede actualizar y reenviar.</span></li>
          <li className="rounded-lg bg-white/80 p-3"><span className="font-bold text-emerald-800">3 · Aprobar</span><span className="mt-1 block text-on-surface-variant">Asignar al menos un área y decidir si se publica en el directorio.</span></li>
          <li className="rounded-lg bg-white/80 p-3"><span className="font-bold text-rose-800">4 · Rechazar</span><span className="mt-1 block text-on-surface-variant">Cerrar la solicitud con un motivo visible para quien la envió.</span></li>
        </ol>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 md:flex-row">
        <form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }} className="flex flex-1 gap-2">
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nombre, correo, especialidad o área…" className="min-w-0 flex-1 rounded-lg bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <button className="rounded-lg bg-primary px-4 text-sm font-bold text-on-primary">Buscar</button>
        </form>
        <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg bg-surface-container-low px-3.5 py-2.5 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="observado">Observado</option>
          <option value="activo">Activo</option>
          <option value="rechazado">Rechazado</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button onClick={loadData} aria-label="Actualizar listado" className="rounded-lg bg-surface-container-low px-3 py-2 text-primary hover:bg-surface-container">
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {availableProfiles.length === 0 && investigators.length === 0 && !loading && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          Todavía no hay solicitudes para revisar. Cada investigador completa su perfil en CU06 y luego solicita aparecer en el directorio. También puedes vincular perfiles existentes autorizados por ABOCCRIM.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-outline">
              <tr>
                <th className="px-5 py-3 font-bold">Investigador</th>
                <th className="px-5 py-3 font-bold">Perfil académico</th>
                <th className="px-5 py-3 font-bold">Áreas temáticas</th>
                <th className="px-5 py-3 font-bold">Estado</th>
                <th className="px-5 py-3 font-bold">Directorio</th>
                <th className="px-5 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-on-surface-variant">Cargando investigadores…</td></tr>
              ) : investigators.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-on-surface-variant">No hay investigadores que coincidan con la búsqueda.</td></tr>
              ) : investigators.map((investigator) => (
                <tr key={investigator.id} className="hover:bg-surface-container-low/60">
                  <td className="px-5 py-4">
                    <p className="font-bold text-primary">{investigator.nombres} {investigator.apellidos}</p>
                    <p className="mt-0.5 font-mono text-xs text-outline">{investigator.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-on-surface">{investigator.grado_academico || 'Grado no especificado'}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{investigator.institucion || investigator.especialidad || 'Sin institución registrada'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {investigator.areas.length ? investigator.areas.map((area) => <span key={area.id} className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{area.nombre}</span>) : <span className="text-xs text-outline">Sin áreas asignadas</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={investigator.estado} /></td>
                  <td className="px-5 py-4 text-xs font-semibold text-on-surface-variant">{investigator.visible_directorio ? 'Visible' : 'Oculto'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(investigator)} title="Revisar perfil e historial" className="inline-flex items-center gap-1 rounded-lg bg-primary/5 px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary/10"><span className="material-symbols-outlined text-lg">fact_check</span>Revisar</button>
                      <button onClick={() => handleToggleStatus(investigator)} title={investigator.estado === 'inactivo' ? 'Activar investigador' : 'Desactivar investigador'} className={`rounded-lg p-2 hover:bg-surface-container ${investigator.estado === 'inactivo' ? 'text-emerald-700' : 'text-error'}`}><span className="material-symbols-outlined text-xl">{investigator.estado === 'inactivo' ? 'person_check' : 'person_off'}</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-outline">Áreas temáticas registradas: {areas.length}. La desactivación conserva el registro y lo oculta del directorio.</p>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-on-surface/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="investigator-modal-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="investigator-modal-title" className="text-xl font-bold text-primary">{editing ? 'Revisar investigador' : 'Vincular perfil existente'}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Verifica los datos, asigna áreas y resuelve la solicitud. Los cambios quedan auditados.</p>
              </div>
              <button onClick={() => setModalOpen(false)} aria-label="Cerrar" className="rounded-lg p-1 text-outline hover:bg-surface-container"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              {editing && (
                <section className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                  <h3 className="text-sm font-bold text-primary">Revisión del perfil</h3>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p><span className="font-semibold">Grado:</span> {editing.grado_academico || 'No registrado'}</p>
                    <p><span className="font-semibold">Institución:</span> {editing.institucion || 'No registrada'}</p>
                    <p><span className="font-semibold">Especialidad:</span> {editing.especialidad || 'No registrada'}</p>
                    <p><span className="font-semibold">ORCID:</span> {editing.orcid || 'No proporcionado'}</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-3"><p className="mb-1 text-xs font-bold uppercase text-outline">Biografía académica</p><p className="whitespace-pre-wrap text-sm text-on-surface">{editing.biografia || 'No registrada'}</p></div>
                  {!!editing.historial_revision?.length && <div><p className="mb-2 text-xs font-bold uppercase text-outline">Historial de solicitudes y decisiones</p><ol className="max-h-40 space-y-2 overflow-y-auto">{editing.historial_revision.map((entry, index) => <li key={`${entry.fecha}-${index}`} className="rounded-lg bg-surface-container-lowest p-3 text-xs"><p className="font-semibold text-primary">{entry.accion.replaceAll('_', ' ')} · {entry.usuario} · {new Date(entry.fecha).toLocaleString('es-BO')}</p><p className="mt-1 whitespace-pre-wrap text-on-surface-variant">{entry.detalle}</p></li>)}</ol></div>}
                </section>
              )}
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Perfil académico</span>
                {editing ? (
                  <div className="rounded-lg bg-surface-container-low px-3.5 py-3 text-sm text-primary">{editing.nombres} {editing.apellidos} · {editing.email}</div>
                ) : (
                  <select required value={form.perfil_academico} onChange={(event) => setForm((current) => ({ ...current, perfil_academico: event.target.value }))} className="w-full rounded-lg border border-outline-variant/50 bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary">
                    <option value="">Selecciona un perfil disponible</option>
                    {availableProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.nombres} {profile.apellidos} · {profile.email}</option>)}
                  </select>
                )}
                {!editing && availableProfiles.length === 0 && <p className="text-xs text-amber-800">No hay perfiles disponibles. Deben registrarse desde CU06 antes de crear el investigador.</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">Estado</span>
                  <select value={form.estado} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value, visible_directorio: event.target.value === 'activo' && current.visible_directorio }))} className="w-full rounded-lg border border-outline-variant/50 bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary">
                    <option value="pendiente">Pendiente</option><option value="observado">Observar y solicitar correcciones</option><option value="activo">Aprobar</option><option value="rechazado">Rechazar solicitud</option><option value="inactivo">Inactivo</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">Fecha de alta</span>
                  <input type="date" value={form.fecha_alta} onChange={(event) => setForm((current) => ({ ...current, fecha_alta: event.target.value }))} className="w-full rounded-lg border border-outline-variant/50 bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
                </label>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-on-surface">Áreas temáticas</legend>
                {areas.length ? (
                  <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg bg-surface-container-low p-3 sm:grid-cols-2">
                    {areas.map((area) => <label key={area.id} className="flex items-center gap-2 rounded-md p-2 text-sm text-on-surface hover:bg-surface-container"><input type="checkbox" checked={form.areas.includes(area.id)} onChange={() => toggleArea(area.id)} className="h-4 w-4 accent-primary" />{area.nombre}</label>)}
                  </div>
                ) : <p className="rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">Aún no hay áreas. Crea una con el botón “Nueva área”.</p>}
              </fieldset>

              <label className={`flex items-start gap-3 rounded-lg border border-outline-variant/30 p-3 ${form.estado !== 'activo' ? 'opacity-60' : ''}`}>
                <input type="checkbox" checked={form.visible_directorio} disabled={form.estado !== 'activo'} onChange={(event) => setForm((current) => ({ ...current, visible_directorio: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-primary" />
                <span><span className="block text-sm font-semibold text-on-surface">Visible en el directorio público</span><span className="mt-0.5 block text-xs text-on-surface-variant">Solo se puede publicar un registro activo.</span></span>
              </label>

              {(form.estado === 'observado' || form.estado === 'rechazado') && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">{form.estado === 'observado' ? 'Correcciones solicitadas' : 'Motivo del rechazo'}</span>
                  <textarea required maxLength={1000} rows={3} value={form.observacion_revision} onChange={(event) => setForm((current) => ({ ...current, observacion_revision: event.target.value }))} placeholder={form.estado === 'observado' ? 'Indica qué dato debe corregir o completar.' : 'Explica por qué no corresponde aceptar esta solicitud.'} className="w-full rounded-lg border border-outline-variant/50 bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
                  <span className="text-xs text-outline">La persona verá esta decisión en su perfil; el historial conservará la revisión.</span>
                </label>
              )}

              {error && <p role="alert" className="rounded-lg bg-error-container/50 px-4 py-3 text-sm text-error">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">Cancelar</button>
                <button type="submit" disabled={saving || (!editing && availableProfiles.length === 0)} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar investigador'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {areaModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-on-surface/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAreaModalOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="area-catalog-title" className="my-auto w-full max-w-4xl rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><h2 id="area-catalog-title" className="text-xl font-bold text-primary">Catálogo de áreas temáticas</h2><p className="mt-1 text-sm text-on-surface-variant">Las áreas se asignan a los investigadores durante la revisión y ayudan a organizar el directorio.</p></div>
              <button type="button" onClick={() => setAreaModalOpen(false)} aria-label="Cerrar" className="rounded-lg p-1 text-outline hover:bg-surface-container"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section>
                <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-on-surface">Áreas registradas ({areas.length})</h3><button type="button" onClick={() => { setEditingArea(null); setAreaForm({ nombre: '', descripcion: '' }); setError(''); }} className="text-xs font-bold text-primary hover:underline">Nueva área</button></div>
                <div className="max-h-[55vh] space-y-2 overflow-y-auto">
                  {areas.length === 0 ? <p className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">Aún no hay áreas. Crea la primera para poder clasificar las solicitudes.</p> : areas.map((area) => (
                    <article key={area.id} className="flex items-start justify-between gap-3 rounded-xl border border-outline-variant/25 p-3">
                      <div><h4 className="text-sm font-bold text-primary">{area.nombre}</h4><p className="mt-1 text-xs text-on-surface-variant">{area.descripcion || 'Sin descripción'}</p><p className="mt-2 text-[11px] font-semibold text-outline">Asignada a {area.investigadores_count ?? 0} investigador(es)</p></div>
                      <button type="button" onClick={() => { setEditingArea(area); setAreaForm({ nombre: area.nombre, descripcion: area.descripcion || '' }); setError(''); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary/5"><span className="material-symbols-outlined text-base">edit</span>Editar</button>
                    </article>
                  ))}
                </div>
                <p className="mt-3 text-xs text-outline">Las áreas no se eliminan desde aquí para conservar las asignaciones históricas. Puedes actualizar su nombre o descripción.</p>
              </section>
              <form onSubmit={handleCreateArea} className="space-y-4 rounded-xl bg-surface-container-low p-4">
                <div><h3 className="text-sm font-bold text-primary">{editingArea ? 'Editar área temática' : 'Registrar nueva área'}</h3><p className="mt-1 text-xs text-on-surface-variant">Los cambios se guardan en el catálogo institucional.</p></div>
                <label className="block space-y-1.5"><span className="text-sm font-semibold text-on-surface">Nombre</span><input required maxLength={150} value={areaForm.nombre} onChange={(event) => setAreaForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Ej. Ciencias forenses" className="w-full rounded-lg border border-outline-variant/50 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary" /></label>
                <label className="block space-y-1.5"><span className="text-sm font-semibold text-on-surface">Descripción</span><textarea rows={4} value={areaForm.descripcion} onChange={(event) => setAreaForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Describe brevemente qué temas incluye esta área." className="w-full rounded-lg border border-outline-variant/50 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary" /></label>
                {error && <p role="alert" className="rounded-lg bg-error-container/50 px-3 py-2 text-sm text-error">{error}</p>}
                <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-4">
                  {editingArea && <button type="button" onClick={() => { setEditingArea(null); setAreaForm({ nombre: '', descripcion: '' }); setError(''); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant">Cancelar edición</button>}
                  <button type="submit" disabled={savingArea} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60">{savingArea ? 'Guardando…' : editingArea ? 'Guardar cambios' : 'Crear área'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
