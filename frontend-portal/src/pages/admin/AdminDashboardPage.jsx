import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user, isSuperAdmin, hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-primary-fixed">
            <span className="material-symbols-outlined text-sm">verified</span>
            Sesión Autenticada • ABOCCRIM
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bienvenido, {user?.nombres} {user?.apellidos}
          </h1>
          <p className="text-xs md:text-sm text-primary-fixed-dim leading-relaxed">
            Consola administrativa y académica del Sistema Web de Gestión Institucional. Sus módulos y operaciones habilitadas corresponden a los roles y permisos validados en el servidor.
          </p>
          <div className="pt-2 flex flex-wrap gap-1.5">
            {user?.roles_codigos?.map((r) => (
              <span key={r} className="px-2.5 py-1 rounded-md bg-white/20 text-xs font-mono font-bold uppercase tracking-wider">
                Rol: {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(isSuperAdmin || hasPermission('usuarios.listar')) && (
          <Link
            to="/dashboard/usuarios"
            className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                Administrar Usuarios (CU04)
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Listar, buscar, filtrar, crear, editar, activar/desactivar cuentas y asignar roles institucionales.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
              <span>Gestionar usuarios</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

        {(isSuperAdmin || hasPermission('roles.listar')) && (
          <Link
            to="/dashboard/roles"
            className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined text-2xl">shield_person</span>
              </div>
              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                Roles y Permisos (CU05)
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Configuración del modelo de control de acceso RBAC. Inspección y asignación de permisos por rol.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
              <span>Configurar roles</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

        {(isSuperAdmin || hasPermission('auditoria.listar')) && (
          <Link
            to="/dashboard/auditoria"
            className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-on-tertiary-container/10 text-on-tertiary-container flex items-center justify-center group-hover:bg-on-tertiary-container group-hover:text-on-tertiary transition-colors">
                <span className="material-symbols-outlined text-2xl">history_edu</span>
              </div>
              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                Bitácora de Auditoría
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Registro inmutable de eventos de seguridad: inicios de sesión, cambios de roles y creación de cuentas.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
              <span>Ver bitácora</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}
      </div>

      {/* Actor Specific Info */}
      <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">info</span>
          Alcance de esta Fase (CU01–CU05)
        </h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          En esta primera fase se encuentran plenamente operativas las funciones de registro de cuenta (CU01), inicio de sesión con tokens JWT (CU02), cierre seguro de sesión (CU03), administración de usuarios con salvaguardas críticas (CU04) y administración de roles y permisos RBAC (CU05). Los restantes casos de uso (CU06–CU27) se mantendrán en preparación sin módulos ficticios.
        </p>
      </div>
    </div>
  );
}
