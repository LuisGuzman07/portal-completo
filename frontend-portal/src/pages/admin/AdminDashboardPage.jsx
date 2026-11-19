import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { incorporationService } from '../../services/api';

export default function AdminDashboardPage() {
  const { user, isSuperAdmin, isAdminAcademico, hasPermission } = useAuth();
  const [myApp, setMyApp] = useState(null);

  useEffect(() => {
    incorporationService.getMyApplication()
      .then((res) => {
        if (res?.tiene_solicitud && res.solicitud) {
          setMyApp(res.solicitud);
        }
      })
      .catch((err) => console.warn('No se pudo consultar el estado de membresía:', err));
  }, []);

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
            Consola administrativa y académica del Sistema Web de Gestión Institucional. Los módulos y operaciones disponibles se adaptan a su nivel de acceso institucional.
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
        {/* Solicitud de Membresía (Para usuarios o investigadores no miembros) */}
        {!user?.roles_codigos?.includes('miembro') && (
          <Link
            to="/dashboard/solicitud-membresia"
            className={`p-6 rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
              myApp?.estado === 'observada'
                ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500'
                : myApp
                ? 'bg-surface-container-lowest border-primary/30 hover:border-primary'
                : 'bg-gradient-to-br from-primary/5 via-surface-container-lowest to-surface-container-low border-2 border-primary/25 hover:border-primary'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  myApp?.estado === 'observada'
                    ? 'bg-amber-500 text-white'
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {myApp ? 'how_to_reg' : 'card_membership'}
                  </span>
                </div>
                {myApp && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    myApp.estado === 'observada'
                      ? 'bg-amber-200 text-amber-900 animate-pulse'
                      : 'bg-primary/10 text-primary font-mono'
                  }`}>
                    {myApp.estado === 'observada' ? 'Requiere Atención' : myApp.estado}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-primary group-hover:text-primary-container">
                {myApp ? 'Mi Solicitud de Membresía' : 'Postular a Membresía ABOCCRIM'}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {myApp
                  ? `Expediente ${myApp.codigo}: ${
                      myApp.estado === 'observada'
                        ? 'El Comité Académico requiere documentación complementaria.'
                        : myApp.estado === 'aprobada'
                        ? '¡Tu membresía ha sido aprobada e incorporada!'
                        : 'Tu postulación se encuentra en evaluación colegiada.'
                    }`
                  : 'Presenta tus antecedentes académicos y Currículum Vitae para incorporarte formalmente como Miembro de la Academia.'}
              </p>
            </div>

            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              <span>{myApp ? 'Ver estado del trámite' : 'Iniciar postulación'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

        {/* Mi Membresía Institucional (Para miembros oficiales) */}
        {user?.roles_codigos?.includes('miembro') && (
          <Link
            to="/dashboard/solicitud-membresia"
            className="p-6 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-surface-container-lowest to-surface-container-lowest shadow-xs hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center transition-colors shadow-xs">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Acreditado
                </span>
              </div>

              <h3 className="text-base font-bold text-emerald-950 group-hover:text-primary">
                Mi Membresía Institucional
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Acreditación oficial, categoría estatutaria asignada y resolución del Comité Académico.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
              <span>Consultar acreditación y credencial</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Link>
        )}

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
              Gestionar grado académico, filiación institucional, especialidad y biografía científica.
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

        {/* Revisión de Publicaciones */}
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

        {/* Gestión de Investigadores */}
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

        {/* Administrar Usuarios */}
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

        {/* Roles y Permisos */}
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
          Se encuentran plenamente operativas las funciones de autenticación institucional, administración de usuarios, control de accesos y permisos, gestión del perfil académico, administración colegiada de investigadores y miembros ABOCCRIM, y directorio público institucional.
        </p>
      </div>
    </div>
  );
}
