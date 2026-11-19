import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { incorporationService } from '../../services/api';

const TRACKING_STORAGE_KEY = 'aboccrim_incorporation_tracking_token';

function errorMessage(error) {
  const data = error?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ');
  return error?.message || 'No se pudo consultar el expediente.';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

const STATUS_LABELS = {
  recibida: 'Recibida',
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  observada: 'Requiere documentación',
  lista_decision: 'Lista para decisión',
  aprobada: 'Aprobada',
  rechazada: 'No aprobada',
  no_aprobada: 'No aprobada',
  cancelada: 'Cancelada',
};

function statusStyle(state) {
  if (state === 'observada') return 'bg-amber-100 text-amber-900 border border-amber-300';
  if (state === 'aprobada') return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
  if (['rechazada', 'no_aprobada', 'cancelada'].includes(state)) return 'bg-rose-100 text-rose-900 border border-rose-300';
  return 'bg-sky-100 text-sky-900 border border-sky-300';
}

export default function SolicitudIncorporacionPage() {
  const { isAuthenticated } = useAuth();

  // Estados para consulta manual de credenciales externas
  const [tokenInput, setTokenInput] = useState('');
  const [tracking, setTracking] = useState(null);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Limpiar cualquier credencial residual de localStorage para evitar que quede "tildada"
  useEffect(() => {
    try {
      localStorage.removeItem(TRACKING_STORAGE_KEY);
      localStorage.removeItem('aboccrim_solicitud_token');
    } catch (e) {
      // Ignorar errores en navegadores con storage restringido
    }
  }, []);

  // Si el usuario ya está autenticado, redirigir de inmediato a su Panel de Control
  if (isAuthenticated) {
    return <Navigate to="/dashboard/solicitud-membresia" replace />;
  }

  const handleManualSearch = async (e) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) return;

    setTrackingBusy(true);
    setTrackingError('');
    try {
      const result = await incorporationService.tracking(cleanToken);
      setTracking(result);
    } catch (err) {
      setTracking(null);
      setTrackingError(errorMessage(err));
    } finally {
      setTrackingBusy(false);
    }
  };

  return (
    <section className="w-full flex-1 bg-gradient-to-b from-surface-container-low to-background px-4 sm:px-6 md:px-12 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Encabezado Institucional */}
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            Convocatoria Institucional
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Postulación a Membresía ABOCCRIM
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
            La incorporación formal a la Academia Boliviana de Ciencias Criminológicas se gestiona desde el Panel de Control institucional para postulantes e investigadores registrados.
          </p>
        </header>

        {/* Tarjeta de Orientación y Acceso */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary/5 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-primary">
                ¿Deseas postular a la membresía de la Academia?
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Para garantizar la seguridad, trazabilidad institucional y vinculación directa de tu expediente, debes acceder a tu cuenta de usuario o crear una nueva para presentar tu Currículum Vitae y respaldos académicos.
              </p>
            </div>
          </div>

          {/* Pasos explicativos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="font-mono font-bold text-primary block text-[10px] uppercase">Paso 01</span>
              <span className="font-bold text-on-surface block">Crea tu cuenta</span>
              <p className="text-on-surface-variant text-[11px]">
                Regístrate con tu correo y confirma tu cuenta para acceder a la plataforma.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="font-mono font-bold text-primary block text-[10px] uppercase">Paso 02</span>
              <span className="font-bold text-on-surface block">Envía tu postulación</span>
              <p className="text-on-surface-variant text-[11px]">
                En tu Panel de Control, completa tus antecedentes y adjunta tu CV en PDF.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="font-mono font-bold text-primary block text-[10px] uppercase">Paso 03</span>
              <span className="font-bold text-on-surface block">Seguimiento en línea</span>
              <p className="text-on-surface-variant text-[11px]">
                Sigue la evaluación del Comité Académico y atiende observaciones en tiempo real.
              </p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-outline-variant/20">
            <Link
              to="/acceso-miembros"
              className="flex-1 px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm text-center transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Iniciar Sesión en el Portal</span>
            </Link>

            <Link
              to="/acceso-miembros?tab=register"
              className="flex-1 px-5 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs sm:text-sm text-center transition-all border border-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Registrarse como Postulante</span>
            </Link>
          </div>
        </div>

        {/* Búsqueda manual opcional por código/token previo (sin almacenar en navegador) */}
        <section className="space-y-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-secondary block">
              Consulta de trámites externos
            </span>
            <h3 className="text-base font-bold text-primary mt-0.5">
              ¿Ya posees una credencial de seguimiento externa?
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Si enviaste previamente una postulación con código de seguimiento, puedes verificar su estado ingresándolo a continuación:
            </p>
          </div>

          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="min-w-0 flex-1 rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-2.5 font-mono text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              placeholder="Ingresa la credencial o token de seguimiento"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={trackingBusy}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition-all disabled:opacity-60 shrink-0 inline-flex items-center justify-center gap-1.5"
            >
              {trackingBusy ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>Consultando…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">search</span>
                  <span>Consultar</span>
                </>
              )}
            </button>
          </form>

          {trackingError && (
            <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{trackingError}</span>
            </div>
          )}

          {tracking && (
            <article className="space-y-4 rounded-xl bg-surface-container-low p-4 sm:p-5 border border-outline-variant/20 mt-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                    {tracking.codigo}
                  </span>
                  <h4 className="mt-0.5 text-base font-bold text-primary">
                    {tracking.nombres} {tracking.apellidos}
                  </h4>
                  <span className="text-xs text-on-surface-variant block">
                    Enviada: {formatDate(tracking.fecha_envio)}
                  </span>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle(tracking.estado)}`}>
                  {STATUS_LABELS[tracking.estado] || tracking.estado}
                </span>
              </div>

              <div className="text-xs border-t border-outline-variant/20 pt-3">
                <span className="font-bold text-primary block mb-1">
                  Documentos registrados ({tracking.documentos?.length || 0}):
                </span>
                <ul className="divide-y divide-outline-variant/20">
                  {tracking.documentos?.map((doc) => (
                    <li key={doc.id} className="py-1.5 flex justify-between gap-2">
                      <span className="truncate font-medium">{doc.nombre}</span>
                      <span className="text-outline uppercase text-[10px] shrink-0 font-mono">
                        {doc.tipo === 'cv' ? 'CV' : 'Respaldo'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )}
        </section>
      </div>
    </section>
  );
}
