import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

export default function ConfirmarCuentaPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [state, setState] = useState('verifying'); // verifying, success, already_active, expired, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  // Reenvío de enlace
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('No se proporcionó ningún token de confirmación en el enlace.');
      return;
    }

    let isMounted = true;
    authService.confirmEmail(token)
      .then((res) => {
        if (!isMounted) return;
        if (res.ya_activa) {
          setState('already_active');
          setMessage(res.message || 'Tu cuenta ya se encontraba confirmada y activa.');
        } else {
          setState('success');
          setMessage(res.message || '¡Tu cuenta ha sido confirmada exitosamente!');
        }
        if (res.email) setEmail(res.email);
      })
      .catch((err) => {
        if (!isMounted) return;
        const errCode = err?.data?.codigo_error;
        const errMsg = err?.data?.error || err.message || 'Error al validar el enlace de confirmación.';
        if (errCode === 'expired') {
          setState('expired');
        } else {
          setState('error');
        }
        setMessage(errMsg);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError('');
    setResendNotice('');
    const targetEmail = resendEmail.trim() || email;
    if (!targetEmail) {
      setResendError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setResending(true);
    try {
      const res = await authService.resendConfirmation(targetEmail);
      setResendNotice(res.message || 'Se ha enviado un nuevo enlace de activación a tu correo.');
    } catch (err) {
      setResendError(err?.data?.error || err.message || 'No se pudo enviar el correo de activación.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center py-12 px-margin-mobile md:px-margin-desktop bg-gradient-to-b from-surface-container-low to-background">
      <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center">

        {/* LOGO */}
        <div className="flex justify-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/ABOCCRIM.webp" alt="ABOCCRIM" className="h-12 w-auto object-contain rounded" />
            <div className="text-left">
              <span className="text-lg font-bold text-primary tracking-tight block leading-tight">ABOCCRIM</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Verificación de Cuenta</span>
            </div>
          </Link>
        </div>

        {/* ESTADO: VERIFICANDO */}
        {state === 'verifying' && (
          <div className="py-10 space-y-4">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">
              progress_activity
            </span>
            <h2 className="text-xl font-bold text-primary">Validando confirmación...</h2>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              Estamos verificando tu enlace con el servidor de ABOCCRIM. Un momento por favor.
            </p>
          </div>
        )}

        {/* ESTADO: ÉXITO */}
        {state === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">¡Cuenta confirmada!</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {message}
            </p>
            {email && (
              <p className="text-xs font-mono font-bold text-secondary bg-surface-container-low py-1.5 px-3 rounded-lg w-fit mx-auto">
                {email}
              </p>
            )}
            <div className="pt-4">
              <Link
                to="/acceso-miembros"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Iniciar Sesión Ahora</span>
              </Link>
            </div>
          </div>
        )}

        {/* ESTADO: YA ACTIVA */}
        {state === 'already_active' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">verified_user</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">Cuenta ya activada</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {message}
            </p>
            <div className="pt-4">
              <Link
                to="/acceso-miembros"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Ir al Acceso de Miembros</span>
              </Link>
            </div>
          </div>
        )}

        {/* ESTADO: EXPIRADO */}
        {state === 'expired' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">schedule</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">Enlace de activación expirado</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Por motivos de seguridad, los enlaces de confirmación tienen una vigencia máxima de 24 horas. Puedes solicitar uno nuevo a continuación.
            </p>

            {resendNotice && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                {resendNotice}
              </div>
            )}
            {resendError && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl text-xs font-semibold">
                {resendError}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3 pt-2">
              <input
                type="email"
                required
                placeholder="Ingresa tu correo institucional o personal"
                value={resendEmail || email}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>{resending ? 'Enviando...' : 'Reenviar Enlace de Activación'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ESTADO: ERROR / INVÁLIDO */}
        {state === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">Enlace no válido</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {message || 'El token de confirmación proporcionado no es válido o está corrupto.'}
            </p>

            {resendNotice && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                {resendNotice}
              </div>
            )}
            {resendError && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl text-xs font-semibold">
                {resendError}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
              <label className="block text-xs font-semibold text-on-surface-variant">
                ¿Deseas que te enviemos un nuevo enlace a tu correo?
              </label>
              <input
                type="email"
                required
                placeholder="Ingresa tu correo registrado"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">mark_email_read</span>
                <span>{resending ? 'Enviando nuevo enlace...' : 'Enviar Nuevo Enlace de Confirmación'}</span>
              </button>
            </form>

            <div className="pt-2">
              <Link to="/acceso-miembros" className="text-xs font-bold text-secondary hover:underline">
                Volver a la pantalla de acceso
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
