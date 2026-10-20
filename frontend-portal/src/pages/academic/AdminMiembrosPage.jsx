import React, { useEffect, useMemo, useState } from 'react';
import { memberService } from '../../services/api';

const EMPTY_MEMBER = { usuario_id: '', categoria_id: '', estado: 'pendiente', fecha_incorporacion: '' };
const EMPTY_CATEGORY = { nombre: '', descripcion: '' };
const STATES = [
  ['pendiente', 'Pendiente'], ['activo', 'Activo'], ['inactivo', 'Inactivo'], ['suspendido', 'Suspendido'],
];

function errorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((item) => Array.isArray(item) ? item : [item]).join(' ');
  return error?.message || 'No se pudo completar la operación.';
}

const badgeClass = {
  activo: 'bg-emerald-50 text-emerald-800',
  pendiente: 'bg-amber-50 text-amber-800',
  inactivo: 'bg-slate-100 text-slate-700',
  suspendido: 'bg-rose-50 text-rose-800',
};

export default function AdminMiembrosPage() {
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [memberModal, setMemberModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.estado = stateFilter;
      if (categoryFilter) params.categoria = categoryFilter;
      const [memberResponse, categoryResponse] = await Promise.all([
        memberService.list(params), memberService.listCategories(),
      ]);
      setMembers(Array.isArray(memberResponse) ? memberResponse : memberResponse.results || []);
      setCategories(Array.isArray(categoryResponse) ? categoryResponse : categoryResponse.results || []);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, stateFilter, categoryFilter]);

  const activeCount = useMemo(() => members.filter((member) => member.estado === 'activo').length, [members]);

  const openNewMember = async () => {
    setError(''); setNotice(''); setEditing(null); setForm(EMPTY_MEMBER);
    try {
      const response = await memberService.availableUsers();
      setUsers(Array.isArray(response) ? response : response.results || []);
      setMemberModal(true);
    } catch (loadError) { setError(errorMessage(loadError)); }
  };

  const openEdit = (member) => {
    setError(''); setNotice(''); setEditing(member);
    setForm({ usuario_id: String(member.usuario_id_display), categoria_id: String(member.categoria.id), estado: member.estado, fecha_incorporacion: member.fecha_incorporacion || '' });
    setMemberModal(true);
  };

  const saveMember = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { categoria_id: Number(form.categoria_id), estado: form.estado, fecha_incorporacion: form.fecha_incorporacion || null };
    if (!editing) payload.usuario_id = Number(form.usuario_id);
    try {
      if (editing) await memberService.update(editing.id, payload); else await memberService.create(payload);
      setMemberModal(false); setNotice(editing ? 'Se actualizaron los datos de membresía.' : 'Se registró el miembro.');
      await load();
    } catch (saveError) { setError(errorMessage(saveError)); }
    finally { setSaving(false); }
  };

  const saveCategory = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      if (editingCategory) await memberService.updateCategory(editingCategory.id, categoryForm);
      else await memberService.createCategory(categoryForm);
      setCategoryForm(EMPTY_CATEGORY); setEditingCategory(null); setNotice(editingCategory ? 'Se actualizó la categoría.' : 'Se creó la categoría.'); await load();
    } catch (saveError) { setError(errorMessage(saveError)); }
    finally { setSaving(false); }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`¿Eliminar la categoría «${category.nombre}»?`)) return;
    setError(''); setNotice('');
    try { await memberService.deleteCategory(category.id); setNotice('Se eliminó la categoría.'); await load(); }
    catch (removeError) { setError(errorMessage(removeError)); }
  };

  const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">CU09 · membresía institucional</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Administración de Miembros ABOCCRIM</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Mantén el padrón institucional, sus categorías y el estado de cada membresía.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setError(''); setCategoryForm(EMPTY_CATEGORY); setEditingCategory(null); setCategoryModal(true); }} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary">Administrar categorías</button>
          <button onClick={openNewMember} className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary">＋ Registrar miembro</button>
        </div>
      </div>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        Este padrón administra membresías ya reconocidas por la institución. La recepción y evaluación de solicitudes de incorporación se implementará en CU22–CU24. El estado de membresía tampoco cambia los permisos de acceso de la cuenta.
      </section>

      {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"><p className="text-xs font-semibold uppercase text-outline">Miembros encontrados</p><p className="mt-2 text-2xl font-bold text-primary">{members.length}</p></div>
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"><p className="text-xs font-semibold uppercase text-outline">Activos en resultados</p><p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p></div>
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"><p className="text-xs font-semibold uppercase text-outline">Categorías registradas</p><p className="mt-2 text-2xl font-bold text-primary">{categories.length}</p></div>
      </section>

      <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_200px_220px_auto]">
          <input aria-label="Buscar miembro" className={inputClass} placeholder="Buscar por nombre, correo o categoría…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filtrar por estado" className={inputClass} value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="">Todos los estados</option>{STATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select aria-label="Filtrar por categoría" className={inputClass} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas las categorías</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select>
          <button onClick={load} className="rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold text-primary" aria-label="Actualizar">↻ Actualizar</button>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-outline"><tr><th className="px-5 py-4">Miembro</th><th className="px-5 py-4">Categoría</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Incorporación</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-outline-variant/30">
            {loading ? <tr><td colSpan="5" className="px-5 py-12 text-center text-on-surface-variant">Cargando padrón…</td></tr>
              : members.length === 0 ? <tr><td colSpan="5" className="px-5 py-12 text-center text-on-surface-variant">No hay miembros que coincidan con los filtros.</td></tr>
                : members.map((member) => <tr key={member.id} className="hover:bg-surface-container-low/60">
                  <td className="px-5 py-4"><p className="font-bold text-primary">{member.nombres} {member.apellidos}</p><p className="mt-1 text-xs text-on-surface-variant">{member.email}</p></td>
                  <td className="px-5 py-4"><span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{member.categoria.nombre}</span></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass[member.estado] || badgeClass.pendiente}`}>{STATES.find(([value]) => value === member.estado)?.[1] || member.estado}</span></td>
                  <td className="px-5 py-4 text-on-surface-variant">{member.fecha_incorporacion ? new Date(`${member.fecha_incorporacion}T00:00:00`).toLocaleDateString() : 'Sin fecha registrada'}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => openEdit(member)} className="rounded-lg px-3 py-2 font-bold text-primary hover:bg-surface-container-low">Editar</button></td>
                </tr>)}
          </tbody>
        </table></div>
      </div>

      {memberModal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setMemberModal(false); }}>
        <form onSubmit={saveMember} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-secondary">Padrón institucional</p><h2 className="mt-1 text-xl font-bold text-primary">{editing ? 'Editar membresía' : 'Registrar miembro'}</h2></div><button type="button" onClick={() => setMemberModal(false)} className="text-2xl text-outline" aria-label="Cerrar">×</button></div>
          <div className="mt-6 space-y-4">
            {!editing && <label className="block text-sm font-semibold text-on-surface">Cuenta de usuario<select required className={`${inputClass} mt-2`} value={form.usuario_id} onChange={(event) => setForm({ ...form, usuario_id: event.target.value })}><option value="">Selecciona una cuenta disponible</option>{users.map((user) => <option key={user.id} value={user.id}>{user.nombres} {user.apellidos} · {user.email}</option>)}</select><span className="mt-1 block text-xs font-normal text-on-surface-variant">Solo aparecen cuentas que todavía no tienen una membresía.</span></label>}
            <label className="block text-sm font-semibold text-on-surface">Categoría<select required className={`${inputClass} mt-2`} value={form.categoria_id} onChange={(event) => setForm({ ...form, categoria_id: event.target.value })}><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select>{categories.length === 0 && <span className="mt-1 block text-xs font-normal text-amber-700">Primero crea una categoría institucional.</span>}</label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-on-surface">Estado<select className={`${inputClass} mt-2`} value={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.value })}>{STATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-semibold text-on-surface">Fecha de incorporación<input type="date" className={`${inputClass} mt-2`} value={form.fecha_incorporacion} onChange={(event) => setForm({ ...form, fecha_incorporacion: event.target.value })} /></label></div>
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-outline-variant/30 pt-5"><button type="button" onClick={() => setMemberModal(false)} className="rounded-lg px-4 py-2.5 text-sm font-bold text-on-surface-variant">Cancelar</button><button disabled={saving || categories.length === 0} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar membresía'}</button></div>
        </form>
      </div>}

      {categoryModal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryModal(false); }}>
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-secondary">Catálogo</p><h2 className="mt-1 text-xl font-bold text-primary">Categorías de membresía</h2><p className="mt-1 text-sm text-on-surface-variant">Las categorías describen la afiliación institucional; no conceden permisos de acceso.</p></div><button type="button" onClick={() => setCategoryModal(false)} className="text-2xl text-outline" aria-label="Cerrar">×</button></div>
          <form onSubmit={saveCategory} className="mt-5 grid gap-3 rounded-xl bg-surface-container-low p-4 sm:grid-cols-[1fr_1.3fr_auto]"><input required maxLength="100" className={inputClass} placeholder="Nombre de categoría" value={categoryForm.nombre} onChange={(event) => setCategoryForm({ ...categoryForm, nombre: event.target.value })} /><input className={inputClass} placeholder="Descripción (opcional)" value={categoryForm.descripcion} onChange={(event) => setCategoryForm({ ...categoryForm, descripcion: event.target.value })} /><button disabled={saving} className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary">{editingCategory ? 'Guardar cambios' : 'Añadir'}</button></form>
          <div className="mt-4 divide-y divide-outline-variant/30">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-bold text-primary">{category.nombre}</p><p className="text-xs text-on-surface-variant">{category.descripcion || 'Sin descripción'} · {category.miembros_count || 0} miembro(s)</p></div><div className="flex gap-1"><button onClick={() => { setError(''); setEditingCategory(category); setCategoryForm({ nombre: category.nombre, descripcion: category.descripcion || '' }); }} className="rounded-md px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-low">Editar</button><button onClick={() => removeCategory(category)} className="rounded-md px-3 py-2 text-xs font-bold text-error hover:bg-error-container">Eliminar</button></div></div>)}{categories.length === 0 && <p className="py-6 text-center text-sm text-on-surface-variant">Aún no se registraron categorías.</p>}</div>
          <div className="mt-4 flex justify-end border-t border-outline-variant/30 pt-4"><button onClick={() => setCategoryModal(false)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary">Listo</button></div>
        </div>
      </div>}
    </div>
  );
}
