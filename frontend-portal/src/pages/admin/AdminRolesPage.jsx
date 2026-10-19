import React, { useState, useEffect } from 'react';
import { roleService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminRolesPage() {
  const { isSuperAdmin } = useAuth();

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.list(),
        roleService.listPermissions()
      ]);

      const rList = Array.isArray(rolesRes) ? rolesRes : (rolesRes.results || []);
      const pList = Array.isArray(permsRes) ? permsRes : (permsRes.results || []);

      setRoles(rList);
      setAllPermissions(pList);

      if (rList.length > 0 && !selectedRole) {
        selectRole(rList[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar roles y permisos.');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = async (roleSummary) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const fullRole = await roleService.get(roleSummary.id);
      setSelectedRole(fullRole);
      setSelectedPerms(fullRole.permisos_codigos || []);
    } catch (err) {
      console.error(err);
      setSelectedRole(roleSummary);
      setSelectedPerms(roleSummary.permisos_codigos || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePerm = (permCode) => {
    if (selectedPerms.includes(permCode)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== permCode));
    } else {
      setSelectedPerms([...selectedPerms, permCode]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    // Safeguard
    if (selectedRole.codigo === 'superadmin' && selectedPerms.length === 0) {
      setError('No se pueden revocar todos los permisos del rol Superadministrador.');
      setSaving(false);
      return;
    }

    try {
      const res = await roleService.assignPermissions(selectedRole.id, selectedPerms);
      setSuccessMsg(res.message || 'Permisos actualizados correctamente.');
      // Refresh list
      loadData();
    } catch (err) {
      setError(err.data?.error || err.message || 'Error al guardar permisos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary tracking-tight">Administración de Roles y Permisos (CU05)</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Control de acceso basado en roles (RBAC). Los permisos efectivos se evalúan estrictamente en el backend.
        </p>
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

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles list */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase text-primary tracking-wider">Roles del Sistema</span>
            <span className="text-xs text-outline">{roles.length} roles</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
              <p className="mt-1">Cargando roles...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => selectRole(r)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-tight">{r.nombre}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-primary'
                        }`}
                      >
                        {r.codigo}
                      </span>
                    </div>
                    <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
                      {r.descripcion}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className={isSelected ? 'text-primary-fixed' : 'text-outline'}>
                        {r.permisos_codigos?.length || 0} permisos
                      </span>
                      <span className={isSelected ? 'text-primary-fixed' : 'text-outline'}>
                        {r.total_usuarios || 0} usuarios
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Role details, permissions editor, and members list */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {selectedRole ? (
            <>
              {/* Role Header Details */}
              <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-primary">{selectedRole.nombre}</h2>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs font-bold uppercase">
                        {selectedRole.codigo}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{selectedRole.descripcion}</p>
                  </div>

                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-on-tertiary-container hover:bg-tertiary-container text-on-tertiary font-bold text-xs shadow-xs transition-all disabled:opacity-50 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>{saving ? 'Guardando...' : 'Guardar Permisos (CU05)'}</span>
                  </button>
                </div>

                {/* Permissions Checkbox Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                    Permisos Asignados a este Rol
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {allPermissions.map((p) => {
                      const isChecked = selectedPerms.includes(p.codigo);
                      return (
                        <label
                          key={p.codigo}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-primary-fixed/30 border-primary/40'
                              : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePerm(p.codigo)}
                            className="mt-0.5 w-4 h-4 rounded text-primary accent-primary"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary font-mono">{p.codigo}</span>
                            <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                              {p.descripcion}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Members in this role */}
              <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 p-5 space-y-3">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Usuarios con Rol "{selectedRole.nombre}" ({selectedRole.usuarios?.length || 0})
                </span>

                {selectedRole.usuarios && selectedRole.usuarios.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRole.usuarios.map((u) => (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-xs border border-outline-variant/20"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{u.nombres} {u.apellidos}</span>
                          <span className="text-[11px] text-outline font-mono">{u.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.activo ? 'bg-emerald-50 text-emerald-800' : 'bg-surface-container text-outline'
                        }`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline italic">No hay usuarios asignados a este rol actualmente.</p>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/20 text-center text-xs text-on-surface-variant">
              Seleccione un rol de la columna izquierda para configurar sus permisos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
