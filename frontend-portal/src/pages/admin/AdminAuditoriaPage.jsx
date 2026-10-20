import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/api';

export default function AdminAuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [accionFilter, setAccionFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (accionFilter) params.accion = accionFilter;
      if (search.trim()) params.search = search.trim();

      const res = await auditService.list(params);
      const list = Array.isArray(res) ? res : (res.results || []);
      setLogs(list);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la bitácora de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [accionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  const getActionBadgeColor = (accion) => {
    if (accion.includes('FALLIDO')) return 'bg-error-container text-on-error-container';
    if (accion.includes('EXITOSO') || accion.includes('REGISTRO')) return 'bg-emerald-100 text-emerald-800';
    if (accion.includes('ROL') || accion.includes('PERMISOS')) return 'bg-primary/10 text-primary';
    return 'bg-surface-container text-on-surface';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary tracking-tight">Bitácora de Auditoría del Sistema</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Registro inmutable de trazabilidad y eventos de seguridad institucionales.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar en el detalle del registro..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={accionFilter}
            onChange={(e) => setAccionFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todas las Acciones</option>
            <option value="LOGIN_EXITOSO">Inicios de Sesión Exitosos</option>
            <option value="LOGIN_FALLIDO">Inicios de Sesión Fallidos</option>
            <option value="LOGOUT">Cierres de Sesión</option>
            <option value="REGISTRO_CUENTA">Registros Públicos</option>
            <option value="CREAR_USUARIO_ADMIN">Creación de Cuentas Administrativas</option>
            <option value="ACTUALIZAR_USUARIO">Actualización de Usuarios</option>
            <option value="ASIGNAR_ROLES_A_USUARIO">Cambios de Roles</option>
            <option value="ASIGNAR_PERMISOS_A_ROL">Cambios de Permisos</option>
          </select>

          <button
            onClick={loadLogs}
            title="Recargar bitácora"
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/20">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Entidad</th>
                <th className="py-3 px-4">IP Origen</th>
                <th className="py-3 px-4">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
                    <p className="mt-1">Cargando bitácora...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl text-outline mb-1">history</span>
                    <p>No se encontraron registros de auditoría.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-outline whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{log.usuario_nombre}</span>
                        <span className="text-[11px] text-outline font-mono">{log.usuario_email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${getActionBadgeColor(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface font-semibold">
                      {log.entidad} {log.registro_afectado_id && <span className="text-outline text-[11px]">#{log.registro_afectado_id}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-outline">
                      {log.ip_origen || '-'}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant leading-relaxed">
                      {log.detalle}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
