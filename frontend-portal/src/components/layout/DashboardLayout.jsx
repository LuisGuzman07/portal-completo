import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardLayout() {
  const { user, isSuperAdmin, isAdminAcademico, hasPermission, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItemClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
      isActive
        ? 'bg-primary text-on-primary shadow-xs'
        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
    }`;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand header */}
          <div className="h-20 px-6 border-b border-outline-variant/20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/ABOCCRIM.webp"
                alt="ABOCCRIM"
                className="h-10 w-auto object-contain rounded"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-primary tracking-tight leading-none">ABOCCRIM</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">Consola Privada</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* User profile capsule in sidebar */}
          <div className="p-4 mx-4 my-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shadow-xs">
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-primary truncate">
                  {user?.nombres} {user?.apellidos}
                </span>
                <span className="text-[11px] text-on-surface-variant truncate font-mono">
                  {user?.email}
                </span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex flex-wrap gap-1">
              {user?.roles_codigos?.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
              Navegación General
            </div>

            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard')}>
              <span className="material-symbols-outlined text-xl">grid_view</span>
              <span>Panel de Control</span>
            </Link>

            <Link to="/dashboard/perfil-academico" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/perfil-academico')}>
              <span className="material-symbols-outlined text-xl">school</span>
              <span>Mi Perfil Académico</span>
            </Link>

            <Link to="/dashboard/publicaciones" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/publicaciones')}>
              <span className="material-symbols-outlined text-xl">menu_book</span>
              <span>Gestión de Publicaciones</span>
            </Link>

            {(isSuperAdmin || isAdminAcademico || user?.roles_codigos?.includes('comite_academico')) && (
              <Link to="/dashboard/revisiones" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/revisiones')}>
                <span className="material-symbols-outlined text-xl">rate_review</span>
                <span>Revisión de Publicaciones</span>
              </Link>
            )}

            {(isSuperAdmin || isAdminAcademico) && (
              <Link to="/dashboard/investigadores" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/investigadores')}>
                <span className="material-symbols-outlined text-xl">manage_search</span>
                <span>Gestión de Investigadores</span>
              </Link>
            )}

            {(isSuperAdmin || isAdminAcademico) && (
              <Link to="/dashboard/miembros" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/miembros')}>
                <span className="material-symbols-outlined text-xl">groups</span>
                <span>Miembros ABOCCRIM</span>
              </Link>
            )}

            {/* Administrar Usuarios */}
            {(isSuperAdmin || hasPermission('usuarios.listar')) && (
              <Link to="/dashboard/usuarios" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/usuarios')}>
                <span className="material-symbols-outlined text-xl">group</span>
                <span>Gestión de Usuarios</span>
              </Link>
            )}

            {/* Administrar Roles y Permisos */}
            {(isSuperAdmin || hasPermission('roles.listar')) && (
              <Link to="/dashboard/roles" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/roles')}>
                <span className="material-symbols-outlined text-xl">shield_person</span>
                <span>Roles y Permisos</span>
              </Link>
            )}

            {/* Auditoría */}
            {(isSuperAdmin || hasPermission('auditoria.listar')) && (
              <Link to="/dashboard/auditoria" onClick={() => setSidebarOpen(false)} className={navItemClass('/dashboard/auditoria')}>
                <span className="material-symbols-outlined text-xl">history_edu</span>
                <span>Bitácora de Auditoría</span>
              </Link>
            )}

            <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
              Enlaces Externos
            </div>

            <Link to="/repositorio" className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-xl">local_library</span>
              <span>Repositorio Académico</span>
            </Link>

            <Link to="/" className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-xl">public</span>
              <span>Portal Académico Público</span>
            </Link>
          </nav>

          {/* Footer logout */}
          <div className="p-4 border-t border-outline-variant/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-surface-container-lowest border-b border-outline-variant/30 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-primary hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="text-outline">ABOCCRIM</span>
              <span>/</span>
              <span className="font-bold text-primary capitalize">
                {location.pathname.replace('/dashboard', 'Consola') || 'Inicio'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-primary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sesión Segura RBAC</span>
            </div>

            <Link
              to="/"
              className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Ver Portal</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </Link>
          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
