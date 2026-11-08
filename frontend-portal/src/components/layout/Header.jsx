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
      ? "px-2 xl:px-3 py-space-sm transition-colors text-primary font-bold bg-surface-container-high rounded-lg text-xs xl:text-sm whitespace-nowrap"
      : "px-2 xl:px-3 py-space-sm rounded-lg text-xs xl:text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors whitespace-nowrap";
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-3 sm:px-margin-mobile md:px-margin-desktop max-w-[1320px] mx-auto flex items-center justify-between gap-2 sm:gap-space-md">
        {/* Brand */}
        <div className="flex items-center gap-space-md">
          <Link className="flex min-w-0 items-center gap-space-sm group" to="/">
            <img
              src="/ABOCCRIM.webp"
              alt="Logo ABOCCRIM"
              className="h-9 sm:h-11 w-auto max-w-[4rem] sm:max-w-none object-contain rounded-md shadow-xs group-hover:scale-102 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-primary leading-none">ABOCCRIM</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 hidden sm:inline">
                Academia Boliviana de Ciencias Criminológicas
              </span>
            </div>
          </Link>
        </div>

        {/* Clean Navigation */}
        <nav className="hidden 2xl:flex min-w-0 items-center gap-1">
          <Link to="/" className={navLinkClass("/")}>Inicio</Link>
          <Link to="/investigadores" className={navLinkClass("/investigadores")}>Investigadores</Link>
          <Link to="/eventos" className={navLinkClass("/eventos")}>Eventos</Link>
          <Link to="/noticias" className={navLinkClass("/noticias")}>Noticias</Link>
          <Link to="/multimedia" className={navLinkClass("/multimedia")}>Multimedia</Link>
          <Link to="/convenios" className={navLinkClass("/convenios")}>Convenios</Link>
          <Link to="/solicitud-incorporacion" className={navLinkClass("/solicitud-incorporacion")}>Postular</Link>
          <Link to="/repositorio" className={navLinkClass("/repositorio")}>Repositorio</Link>
        </nav>

        {/* Right Action: Auth button or User Menu */}
        <div className="flex items-center gap-space-sm">
          {isAuthenticated ? (
            <div className="flex items-center gap-space-sm">
              <Link
                to="/dashboard"
                aria-label="Abrir panel de control"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container text-primary font-semibold text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span className="hidden lg:inline">Panel de Control</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/40">
                <div className="hidden xl:flex flex-col text-right max-w-40">
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
              aria-label="Acceso a miembros"
              className="flex shrink-0 items-center gap-space-xs px-2 sm:px-space-lg py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              <span className="hidden sm:inline">Acceso Miembros</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="2xl:hidden shrink-0 p-2 rounded-lg text-primary hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav aria-label="Navegación móvil" className="2xl:hidden max-h-[calc(100dvh-5rem)] overflow-y-auto bg-surface-container-lowest border-t border-outline-variant/20 px-3 sm:px-4 py-3 flex flex-col gap-1">
          <Link onClick={() => setMobileMenuOpen(false)} to="/" className={navLinkClass("/")}>Inicio</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/investigadores" className={navLinkClass("/investigadores")}>Directorio de Investigadores</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/eventos" className={navLinkClass("/eventos")}>Eventos Académicos</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/noticias" className={navLinkClass("/noticias")}>Noticias Institucionales</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/multimedia" className={navLinkClass("/multimedia")}>Contenido Multimedia</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/convenios" className={navLinkClass("/convenios")}>Convenios Institucionales</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/solicitud-incorporacion" className={navLinkClass("/solicitud-incorporacion")}>Solicitar incorporación</Link>
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
        </nav>
      )}
    </header>
  );
}
