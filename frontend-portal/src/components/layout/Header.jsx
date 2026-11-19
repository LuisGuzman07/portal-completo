import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Configuración centralizada de navegación del portal público ABOCCRIM
export const NAV_CONFIG = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/',
    type: 'link',
  },
  {
    id: 'institucional',
    label: 'Institucional',
    type: 'dropdown',
    items: [
      { label: '¿Quiénes somos?', path: '/institucional?seccion=quienes-somos', available: true, icon: 'corporate_fare' },
      { label: 'Historia', path: '/institucional?seccion=historia', available: true, icon: 'history_edu' },
      { label: 'Principios rectores', path: '/institucional?seccion=principios', available: true, icon: 'verified_user' },
      { label: 'Autoridades', path: '/institucional?seccion=autoridades', available: true, icon: 'account_tree' },
      { label: 'Normativa', path: '/institucional?seccion=normativa', available: true, icon: 'gavel' },
      { label: 'Convenios', path: '/convenios', available: true, icon: 'handshake' },
    ],
  },
  {
    id: 'investigacion',
    label: 'Investigación',
    type: 'dropdown',
    items: [
      { label: 'Investigadores', path: '/investigadores', available: true, icon: 'groups' },
      { label: 'Líneas de investigación', path: '/institucional?seccion=investigacion', available: true, icon: 'science' },
      { label: 'Asistente Académico IA', path: '/asistente-academico', available: true, icon: 'smart_toy' },
    ],
  },
  {
    id: 'actualidad',
    label: 'Actualidad',
    type: 'dropdown',
    items: [
      { label: 'Noticias', path: '/noticias', available: true, icon: 'feed' },
      { label: 'Eventos y actividades', path: '/eventos', available: true, icon: 'event' },
      { label: 'Multimedia', path: '/multimedia', available: true, icon: 'perm_media' },
    ],
  },
  {
    id: 'convocatorias',
    label: 'Convocatorias',
    type: 'dropdown',
    items: [
      { label: 'Convocatorias vigentes', path: '/convocatorias', available: false },
      { label: 'Postular a membresía', path: '/solicitud-incorporacion', available: true, icon: 'person_add' },
      { label: 'Premios y reconocimientos', path: '/premios', available: false },
    ],
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    fullLabel: 'Biblioteca Académica',
    path: '/repositorio',
    type: 'highlight',
    icon: 'menu_book',
  },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({});

  const navRef = useRef(null);

  // Cerrar submenús con clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar submenús con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const toggleMobileAccordion = (id) => {
    setMobileExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Determinar si algún hijo de un dropdown está activo
  const isDropdownActive = (dropdown) => {
    if (!dropdown.items) return false;
    const currentFull = location.pathname + location.search;
    return dropdown.items.some((item) => {
      if (!item.available) return false;

      // Si el enlace tiene parámetros de búsqueda (ej. /institucional?seccion=...)
      if (item.path.includes('?')) {
        if (currentFull === item.path) return true;

        // Si estamos en /institucional sin query params, por defecto se muestra 'quienes-somos'
        if (location.pathname === '/institucional' && (!location.search || location.search === '')) {
          return dropdown.id === 'institucional' && item.path === '/institucional?seccion=quienes-somos';
        }

        return false;
      }

      // Si no tiene query params, comparar pathname
      return location.pathname === item.path;
    });
  };

  const resolveSubItem = (sub) => {
    if (sub.path === '/solicitud-incorporacion') {
      if (isAuthenticated) {
        const isMember = user?.roles_codigos?.includes('miembro');
        return {
          ...sub,
          path: '/dashboard/solicitud-membresia',
          label: isMember ? 'Mi Membresía Institucional' : 'Postular a membresía',
          icon: isMember ? 'verified' : 'person_add',
        };
      }
      return {
        ...sub,
        path: '/solicitud-incorporacion',
      };
    }
    return sub;
  };

  const isSubActive = (subPath) => {
    const currentFull = location.pathname + location.search;
    if (subPath.includes('?')) {
      if (location.pathname === '/institucional' && (!location.search || location.search === '')) {
        return subPath === '/institucional?seccion=quienes-somos';
      }
      return currentFull === subPath;
    }
    return location.pathname === subPath;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-3 sm:px-4 md:px-6 max-w-[1400px] mx-auto flex items-center justify-between gap-2 lg:gap-3 xl:gap-4">
        {/* Brand */}
        <div className="flex items-center shrink-0">
          <Link className="flex items-center gap-2 sm:gap-2.5 group" to="/">
            <img
              src="/ABOCCRIM.webp"
              alt="Logo ABOCCRIM"
              className="h-9 sm:h-11 w-auto max-w-[3.2rem] sm:max-w-none object-contain rounded-md shadow-xs group-hover:scale-102 transition-transform shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm sm:text-base font-bold tracking-tight text-primary leading-tight">
                ABOCCRIM
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-on-surface-variant leading-tight whitespace-normal">
                Academia Boliviana de<br />Ciencias Criminológicas
              </span>
            </div>
          </Link>
        </div>

        {/* Clean Dropdown Navigation (Desktop: visible desde lg con ancho protegido) */}
        <nav
          ref={navRef}
          aria-label="Navegación principal"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0"
        >
          {NAV_CONFIG.map((item) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            if (item.type === 'dropdown') {
              const isOpen = activeDropdown === item.id;
              const hasActiveChild = isDropdownActive(item);
              const isLastDropdown = item.id === 'convocatorias';

              return (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.id)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    className={`inline-flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      isOpen || hasActiveChild
                        ? 'bg-surface-container-high text-primary font-bold shadow-xs'
                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown panel */}
                  {isOpen && (
                    <div
                      role="menu"
                      aria-label={`Submenú ${item.label}`}
                      className={`absolute top-full mt-2 w-64 xl:w-72 rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 p-3 z-50 animate-fadeIn ${
                        isLastDropdown ? 'right-0' : 'left-0'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20 px-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-primary">
                          {item.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
                          aria-label="Cerrar submenú"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        {item.items.map((rawSub) => {
                          const sub = resolveSubItem(rawSub);
                          return sub.available ? (
                            <Link
                              key={rawSub.label}
                              to={sub.path}
                              role="menuitem"
                              onClick={() => setActiveDropdown(null)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors group ${
                                isSubActive(sub.path)
                                  ? 'bg-surface-container-high text-primary font-bold'
                                  : 'text-on-surface hover:text-primary hover:bg-surface-container-low'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-outline group-hover:text-primary font-bold">›</span>
                                <span>{sub.label}</span>
                              </div>
                              {sub.icon && (
                                <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary">
                                  {sub.icon}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <div
                              key={rawSub.label}
                              role="menuitem"
                              aria-disabled="true"
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-outline/60 cursor-not-allowed select-none"
                              title="Sección en preparación institucional"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-outline/40">›</span>
                                <span>{rawSub.label}</span>
                              </div>
                              <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-surface-container text-outline/70">
                                Próximamente
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (item.type === 'highlight') {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-bold border transition-all whitespace-nowrap shadow-xs ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-low hover:bg-surface-container-high text-primary border-outline-variant/40 hover:border-primary/40'
                  }`}
                  title={`${item.fullLabel || item.label} - Repositorio de Publicaciones`}
                >
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                </Link>
              );
            }

            return null;
          })}
        </nav>

        {/* Right Action: Auth button or User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/dashboard"
                aria-label="Abrir panel de control"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-primary font-bold text-xs transition-colors whitespace-nowrap shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span className="hidden md:inline 2xl:hidden">Panel</span>
                <span className="hidden 2xl:inline">Panel de Control</span>
              </Link>

              <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-outline-variant/40">
                <div className="hidden xl:flex flex-col text-right max-w-28 2xl:max-w-40">
                  <span className="text-xs font-bold text-primary leading-tight truncate">
                    {user?.nombres?.split(' ')[0]} {user?.apellidos?.charAt(0)}.
                  </span>
                  <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">
                    {user?.roles_codigos?.[0] || 'Usuario'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/acceso-miembros"
              aria-label="Acceso a miembros"
              className="flex shrink-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="hidden sm:inline">Acceso Miembros</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden shrink-0 p-2 rounded-xl text-primary hover:bg-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Accordion) */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navegación móvil"
          className="lg:hidden max-h-[calc(100dvh-5rem)] overflow-y-auto bg-surface-container-lowest border-t border-outline-variant/20 px-4 py-4 flex flex-col gap-2 shadow-xl"
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              location.pathname === '/'
                ? 'bg-surface-container-high text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>Inicio</span>
          </Link>

          {/* Accordion categories */}
          {NAV_CONFIG.filter((c) => c.type === 'dropdown').map((cat) => {
            const isExpanded = !!mobileExpanded[cat.id];
            const hasActiveChild = isDropdownActive(cat);

            return (
              <div
                key={cat.id}
                className="rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest"
              >
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion(cat.id)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
                    hasActiveChild || isExpanded
                      ? 'bg-surface-container-low text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`material-symbols-outlined text-lg transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-2 space-y-1 bg-surface-container-lowest border-t border-outline-variant/15">
                    {cat.items.map((rawSub) => {
                      const sub = resolveSubItem(rawSub);
                      return sub.available ? (
                        <Link
                          key={rawSub.label}
                          to={sub.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            isSubActive(sub.path)
                              ? 'bg-surface-container-high text-primary font-bold'
                              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-outline font-bold">›</span>
                            <span>{sub.label}</span>
                          </div>
                          {sub.icon && (
                            <span className="material-symbols-outlined text-base text-outline">
                              {sub.icon}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <div
                          key={rawSub.label}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-outline/50 cursor-not-allowed select-none"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-outline/40">›</span>
                            <span>{rawSub.label}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-outline/70">
                            Próximamente
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Highlighted Biblioteca Académica */}
          <Link
            to="/repositorio"
            onClick={() => setMobileMenuOpen(false)}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between border shadow-xs transition-all ${
              location.pathname === '/repositorio'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container-low text-primary border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">menu_book</span>
              <span>Biblioteca Académica</span>
            </div>
            <span className="text-xs">›</span>
          </Link>

          {/* Auth section */}
          <div className="pt-2 mt-2 border-t border-outline-variant/20">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  <span>Panel de Control ({user?.nombres})</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 px-4 rounded-xl text-error hover:bg-error-container/20 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <Link
                to="/acceso-miembros"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <span>Acceso Miembros</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
