import React, { useState, useEffect } from 'react';
import { userService, roleService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminUsuariosPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedActivo, setSelectedActivo] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [toggleActiveModalOpen, setToggleActiveModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    roles: ['usuario']
  });

  const [editForm, setEditForm] = useState({
    nombres: '',
    apellidos: '',
    activo: true
  });

  const [rolesForm, setRolesForm] = useState([]);

  // Fetch users & roles
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedRole) params.rol = selectedRole;
      if (selectedActivo) params.activo = selectedActivo;

      const [usersRes, rolesRes] = await Promise.all([
        userService.list(params),
        roleService.list()
      ]);

      // DRF might return paginated results object with .results or an array
      const userList = Array.isArray(usersRes) ? usersRes : (usersRes.results || []);
      setUsers(userList);
      setAvailableRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes.results || []));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar listado de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRole, selectedActivo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditForm({
      nombres: u.nombres,
      apellidos: u.apellidos,
      activo: u.activo
    });
    setEditModalOpen(true);
  };

  // Open Roles Modal
  const openRolesModal = (u) => {
    setSelectedUser(u);
    setRolesForm(u.roles_codigos || []);
    setRolesModalOpen(true);
  };

  // Open Toggle Active Modal
  const openToggleActiveModal = (u) => {
    setSelectedUser(u);
    setToggleActiveModalOpen(true);
  };

  // Create User Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await userService.create(createForm);
      setSuccessMsg(`Usuario ${createForm.email} creado exitosamente.`);
      setCreateModalOpen(false);
      setCreateForm({ nombres: '', apellidos: '', email: '', password: '', roles: ['usuario'] });
      loadData();
    } catch (err) {
      setError(err.data?.email?.[0] || err.message || 'Error al crear usuario.');
    }
  };

  // Edit User Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await userService.update(selectedUser.id, editForm);
      setSuccessMsg(`Usuario ${selectedUser.email} actualizado exitosamente.`);
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.data?.error || err.message || 'Error al actualizar usuario.');
    }
  };

  // Assign Roles Submit
  const handleRolesSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (rolesForm.length === 0) {
      setError('El usuario debe tener al menos un rol asignado.');
      return;
    }
    try {
      await userService.assignRoles(selectedUser.id, rolesForm);
      setSuccessMsg(`Roles actualizados para ${selectedUser.email}.`);
      setRolesModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.data?.error || err.message || 'Error al asignar roles.');
    }
  };

  // Toggle Active Submit (Safeguard check)
  const handleToggleActiveSubmit = async () => {
    if (!selectedUser) return;
    const nuevoEstado = !selectedUser.activo;
    setError(null);
    try {
      await userService.update(selectedUser.id, { activo: nuevoEstado });
      setSuccessMsg(`Usuario ${selectedUser.email} ${nuevoEstado ? 'activado' : 'desactivado'}.`);
      setToggleActiveModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.data?.error || err.message || 'No fue posible cambiar el estado del usuario.');
      setToggleActiveModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Administración de Usuarios (CU04)</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Gestión técnica y control de acceso RBAC. Operaciones protegidas y auditadas en tiempo real.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({ nombres: '', apellidos: '', email: '', password: '', roles: ['usuario'] });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-error hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-800 hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o correo..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todos los Roles</option>
            {availableRoles.map((r) => (
              <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
            ))}
          </select>

          <select
            value={selectedActivo}
            onChange={(e) => setSelectedActivo(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          <button
            onClick={loadData}
            title="Recargar tabla"
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/20">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Roles Asignados</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Registro</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
                    <p className="mt-1">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl text-outline mb-1">group_off</span>
                    <p>No se encontraron usuarios con los filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isSuper = u.roles_codigos?.includes('superadmin');

                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {u.nombres?.charAt(0)}{u.apellidos?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">
                              {u.nombres} {u.apellidos} {isCurrent && <span className="text-[10px] text-secondary font-mono">(Tú)</span>}
                            </span>
                            <span className="text-[11px] text-outline font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles_codigos && u.roles_codigos.length > 0 ? (
                            u.roles_codigos.map((rc) => (
                              <span
                                key={rc}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  rc === 'superadmin'
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-high text-primary'
                                }`}
                              >
                                {rc}
                              </span>
                            ))
                          ) : (
                            <span className="text-outline text-[11px]">Sin rol</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-outline text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-outline font-mono text-[11px]">
                        {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Assign roles button */}
                          <button
                            onClick={() => openRolesModal(u)}
                            title="Asignar o revocar roles (CU05)"
                            className="p-1.5 rounded hover:bg-surface-container text-secondary transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">shield_person</span>
                          </button>

                          {/* Edit user button */}
                          <button
                            onClick={() => openEditModal(u)}
                            title="Editar usuario"
                            className="p-1.5 rounded hover:bg-surface-container text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>

                          {/* Toggle Active button with safeguards */}
                          <button
                            onClick={() => openToggleActiveModal(u)}
                            title={u.activo ? "Desactivar cuenta" : "Activar cuenta"}
                            className={`p-1.5 rounded transition-colors ${
                              u.activo
                                ? 'hover:bg-error-container text-error'
                                : 'hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">
                              {u.activo ? 'person_off' : 'how_to_reg'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Crear Usuario */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="text-base font-bold text-primary">Crear Nuevo Usuario (Admin)</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Nombres</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    value={createForm.nombres}
                    onChange={(e) => setCreateForm({ ...createForm, nombres: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    value={createForm.apellidos}
                    onChange={(e) => setCreateForm({ ...createForm, apellidos: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Contraseña Inicial (min 8 car.)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Roles a Asignar</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-surface-container-low rounded-lg">
                  {availableRoles.map((r) => (
                    <label key={r.codigo} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.roles.includes(r.codigo)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setCreateForm({ ...createForm, roles: [...createForm.roles, r.codigo] });
                          } else {
                            setCreateForm({ ...createForm, roles: createForm.roles.filter(rc => rc !== r.codigo) });
                          }
                        }}
                        className="rounded text-primary accent-primary"
                      />
                      <span>{r.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Usuario */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="text-base font-bold text-primary">Editar Usuario</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <span className="text-xs text-outline font-mono block mb-1">Correo (no modificable): {selectedUser.email}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Nombres</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editForm.nombres}
                  onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Apellidos</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editForm.apellidos}
                  onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.activo}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                  <span className="text-xs font-semibold text-on-surface">Cuenta Activa</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Asignar Roles (CU04 / CU05) */}
      {rolesModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="text-base font-bold text-primary">Asignar Roles a Usuario</h3>
              <button onClick={() => setRolesModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Modificando roles para <strong>{selectedUser.nombres} {selectedUser.apellidos}</strong> ({selectedUser.email}).
            </p>

            <form onSubmit={handleRolesSubmit} className="space-y-3">
              <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-surface-container-low rounded-xl">
                {availableRoles.map((r) => {
                  const isChecked = rolesForm.includes(r.codigo);
                  return (
                    <label
                      key={r.codigo}
                      className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer ${
                        isChecked ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRolesForm([...rolesForm, r.codigo]);
                          } else {
                            setRolesForm(rolesForm.filter(rc => rc !== r.codigo));
                          }
                        }}
                        className="mt-0.5 rounded text-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">{r.nombre}</span>
                        <span className="text-[11px] text-on-surface-variant">{r.descripcion}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setRolesModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-fixed-dim text-on-secondary text-xs font-bold transition-colors"
                >
                  Actualizar Roles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmación Activar / Desactivar con Salvaguardas */}
      {toggleActiveModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedUser.activo ? 'bg-error-container text-error' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <span className="material-symbols-outlined text-xl">
                  {selectedUser.activo ? 'warning' : 'verified'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-primary">
                {selectedUser.activo ? 'Desactivar Cuenta de Usuario' : 'Activar Cuenta de Usuario'}
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {selectedUser.activo
                ? `¿Confirma la desactivación de ${selectedUser.email}? El usuario no podrá iniciar sesión en la plataforma.`
                : `¿Confirma la reactivación de ${selectedUser.email}? El usuario recuperará el acceso inmediato a la plataforma.`}
            </p>

            {/* Safeguard warning indicator */}
            {selectedUser.activo && selectedUser.roles_codigos?.includes('superadmin') && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight">
                <strong>Atención:</strong> Si este usuario es el único Superadministrador activo, el sistema bloqueará la operación para garantizar la gobernanza del portal.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setToggleActiveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleActiveSubmit}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${
                  selectedUser.activo ? 'bg-error hover:bg-error/90' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedUser.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
