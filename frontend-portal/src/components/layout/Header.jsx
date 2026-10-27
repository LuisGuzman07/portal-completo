import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const navLinkClass = (path) => {
    const isActive = currentPath === path;
    return isActive
      ? "px-space-md py-space-sm transition-colors text-primary font-bold bg-surface-container-high rounded-lg text-sm"
      : "px-space-md py-space-sm rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors";
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-margin-mobile md:px-margin-desktop max-w-[1320px] mx-auto flex items-center justify-between gap-space-md">
        {/* Brand */}
        <div className="flex items-center gap-space-md">
          <Link className="flex items-center gap-space-sm group" to="/">
            <img
              src="/ABOCCRIM.webp"
              alt="Logo ABOCCRIM"
              className="h-11 w-auto object-contain rounded-md shadow-xs group-hover:scale-102 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-primary leading-none">ABOCCRIM</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 hidden sm:inline">
                Academia Boliviana de Ciencias Criminológicas
              </span>
            </div>
          </Link>
        </div>

        {/* Clean Navigation */}
        <nav className="hidden md:flex items-center gap-space-sm">
          <Link to="/" className={navLinkClass("/")}>Inicio</Link>
          <Link to="/investigadores" className={navLinkClass("/investigadores")}>Investigadores</Link>
          <Link to="/repositorio" className={navLinkClass("/repositorio")}>Repositorio</Link>
          {!isAuthenticated && (
            <Link to="/acceso-miembros" className={navLinkClass("/acceso-miembros")}>Acceso a Miembros</Link>
          )}
          {isAuthenticated && (
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>Panel Privado</Link>
          )}
        </nav>

        {/* Right Action: Auth button or User Menu */}
        <div className="flex items-center gap-space-sm">
          {isAuthenticated ? (
            <div className="flex items-center gap-space-sm">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container text-primary font-semibold text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span className="hidden sm:inline">Panel de Control</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/40">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-xs font-bold text-primary leading-tight">
                    {user?.nombres} {user?.apellidos?.charAt(0)}.
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase">
                    {user?.roles_codigos?.[0] || 'Usuario'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/acceso-miembros"
              className="flex items-center gap-space-xs px-space-lg py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              <span>Acceso Miembros</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-primary hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-t border-outline-variant/20 px-4 py-3 flex flex-col gap-2">
          <Link onClick={() => setMobileMenuOpen(false)} to="/" className={navLinkClass("/")}>Inicio</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/investigadores" className={navLinkClass("/investigadores")}>Directorio de Investigadores</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/repositorio" className={navLinkClass("/repositorio")}>Repositorio Académico</Link>
          {!isAuthenticated ? (
            <Link onClick={() => setMobileMenuOpen(false)} to="/acceso-miembros" className={navLinkClass("/acceso-miembros")}>
              Acceso a Miembros
            </Link>
          ) : (
            <Link onClick={() => setMobileMenuOpen(false)} to="/dashboard" className="px-space-md py-space-sm rounded-lg text-sm font-bold bg-primary text-on-primary">
              Panel de Control
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
