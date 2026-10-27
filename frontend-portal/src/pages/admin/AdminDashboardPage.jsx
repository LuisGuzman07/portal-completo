import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user, isSuperAdmin, isAdminAcademico, hasPermission } = useAuth();

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Mi Perfil Académico */}
        <Link
          to="/dashboard/perfil-academico"
          className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
              Mi Perfil Académico
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Gestionar grado académico, filiación institucional, especialidad, biografía científica y registro ORCID.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
            <span>Ver mi perfil</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        </Link>

        {/* Gestión de Publicaciones */}
        <Link
          to="/dashboard/publicaciones"
          className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
            <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
              Gestión de Publicaciones
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Registro científico, clasificación temática y administración de documentos digitales en formato PDF.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
            <span>Ver publicaciones</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        </Link>

        {/* Revisión de Publicaciones (CU11) */}
        {(isSuperAdmin || isAdminAcademico || user?.roles_codigos?.includes('comite_academico')) && (
          <Link
            to="/dashboard/revisiones"
            className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">rate_review</span>
              </div>
              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                Revisión Editorial y Pares
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Dictamen técnico, evaluación por pares, aprobación, observaciones y rechazo formal de investigaciones.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
              <span>Evaluar cola editorial</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

        {/* Gestión de Investigadores (CU07) */}
        {(isSuperAdmin || isAdminAcademico) && (
          <Link
            to="/dashboard/investigadores"
            className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined text-2xl">manage_search</span>
              </div>
              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                Gestión de Investigadores
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Aprobación, revisión, vinculación de áreas temáticas y publicación en el directorio institucional.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
              <span>Administrar investigadores</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

        {/* Miembros ABOCCRIM */}
        {(isSuperAdmin || isAdminAcademico) && (
          <Link
            to="/dashboard/miembros"
            className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-on-tertiary-container/10 text-on-tertiary-container flex items-center justify-center group-hover:bg-on-tertiary-container group-hover:text-on-tertiary transition-colors">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                Miembros ABOCCRIM
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Gestión del padrón institucional de miembros colegiados, categorías y estados de membresía.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
              <span>Administrar miembros</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

        {/* Administrar Usuarios (CU04) */}
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
                Administración de Usuarios
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

        {/* Roles y Permisos (CU05) */}
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
                Roles y Permisos
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

        {/* Bitácora de Auditoría */}
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
          Alcance de la Plataforma Institucional
        </h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Se encuentran plenamente operativas las funciones de autenticación JWT y cierre de sesión seguro, gestión técnica de usuarios, control de acceso basado en roles y permisos (RBAC), gestión de perfil académico propio, administración colegiada de investigadores y miembros ABOCCRIM, y directorio público de investigadores.
        </p>
      </div>
    </div>
  );
}
