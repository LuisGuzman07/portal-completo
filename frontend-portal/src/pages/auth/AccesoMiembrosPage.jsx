import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

export default function AccesoMiembrosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { login, register } = useAuth();

  const getInitialTab = () => {
    const tabParam = searchParams.get('tab') || searchParams.get('mode') || location.state?.tab;
    if (tabParam === 'register' || tabParam === 'registro') {
      return 'register';
    }
    return 'login';
  };

  const [authTab, setAuthTab] = useState(getInitialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Sync tab with URL parameters or navigation state
  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('mode') || location.state?.tab;
    if (tabParam === 'register' || tabParam === 'registro') {
      setAuthTab('register');
    } else if (tabParam === 'login' || tabParam === 'acceso') {
      setAuthTab('login');
    }
  }, [searchParams, location.state]);

  const switchTab = (tab) => {
    setAuthTab(tab);
    setSearchParams(tab === 'register' ? { tab: 'register' } : { tab: 'login' });
  };

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Register form state
  const [registerData, setRegisterData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
    password_confirm: ""
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  // Reenvío de confirmación
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const handleResendConfirmation = async (targetEmail) => {
    const emailToUse = (targetEmail || registeredEmail || loginData.email || '').trim();
    if (!emailToUse) {
      setResendStatus({
        type: 'error',
        message: 'Por favor ingresa un correo electrónico válido.'
      });
      return;
    }

    setResendingEmail(true);
    setResendStatus(null);
    try {
      const res = await authService.resendConfirmation(emailToUse);
      setResendStatus({
        type: 'success',
        message: res.message || 'Se ha enviado un nuevo enlace de activación a tu correo.'
      });
    } catch (err) {
      setResendStatus({
        type: 'error',
        message: err.data?.error || err.message || 'No fue posible reenviar el enlace. Intenta más tarde.'
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Quick fill helper for development
  const handleQuickFill = (email) => {
    switchTab("login");
    setLoginData({
      email,
      password: "Aboccrim2025!"
    });
    setLoginError(null);
    setResendStatus(null);
  };

  // Iniciar Sesión
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setResendStatus(null);
    setLoginLoading(true);

    try {
      await login(loginData.email, loginData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error en login:', err);
      setLoginError(
        err.data?.non_field_errors?.[0] ||
        err.data?.email?.[0] ||
        err.data?.password?.[0] ||
        err.data?.error ||
        err.message ||
        "Error al iniciar sesión. Verifique sus credenciales."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Registrar Cuenta
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    setResendStatus(null);

    if (registerData.password !== registerData.password_confirm) {
      setRegisterError("Las contraseñas no coinciden.");
      return;
    }

    if (registerData.password.length < 8) {
      setRegisterError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setRegisterLoading(true);

    try {
      const res = await register({
        nombres: registerData.nombres,
        apellidos: registerData.apellidos,
        email: registerData.email,
        password: registerData.password,
        password_confirm: registerData.password_confirm
      });
      setRegisteredEmail(registerData.email);
      setRegisterSuccess(res?.message || "¡Cuenta creada exitosamente! Por favor confirma tu correo electrónico.");
    } catch (err) {
      console.error('Error en registro:', err);
      let errMsg = "Error al crear la cuenta.";
      if (err.data) {
        if (err.data.email) errMsg = `Correo: ${Array.isArray(err.data.email) ? err.data.email.join(' ') : err.data.email}`;
        else if (err.data.password) errMsg = `Contraseña: ${Array.isArray(err.data.password) ? err.data.password.join(' ') : err.data.password}`;
        else if (err.data.non_field_errors) errMsg = Array.isArray(err.data.non_field_errors) ? err.data.non_field_errors.join(' ') : err.data.non_field_errors;
        else if (err.data.error) errMsg = err.data.error;
      } else if (err.message) {
        errMsg = err.message;
      }
      setRegisterError(errMsg);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="w-full px-margin-mobile md:px-margin-desktop py-space-xl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Main Card with Login / Register */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Header institution card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 md:p-8 flex flex-col sm:flex-row items-center gap-space-lg border border-outline-variant/20">
              <div className="w-20 h-20 flex-shrink-0 bg-surface-container-low rounded-xl flex items-center justify-center p-2 shadow-xs border border-outline-variant/20">
                <img
                  src="/ABOCCRIM.webp"
                  alt="Emblema ABOCCRIM"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col text-center sm:text-left">
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-secondary font-bold">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Sociedad Científica Acreditada • Bolivia
                </span>
                <h1 className="text-2xl font-bold text-primary tracking-tight mt-1">
                  Portal de Acceso
                </h1>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Sistema de autenticación y gestión para miembros y usuarios de ABOCCRIM.
                </p>
              </div>
            </div>

            {/* Clean Tab Box */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20">
              <div className="flex bg-surface-container-low p-1.5 gap-1.5 border-b border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    authTab === "login"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Iniciar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    authTab === "register"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Registrar Cuenta</span>
                </button>
              </div>

              {/* TAB 1: INICIAR SESIÓN */}
              {authTab === "login" && (
                <div className="p-6 md:p-8 flex flex-col gap-space-md">
                  {loginError && (
                    <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base shrink-0">error</span>
                        <span>{loginError}</span>
                      </div>
                      {(loginError.toLowerCase().includes('activada') ||
                        loginError.toLowerCase().includes('confirmar') ||
                        loginError.toLowerCase().includes('confirmada')) && (
                        <div className="pt-2 border-t border-error/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span className="text-[11px] text-on-surface-variant">¿No recibiste el correo o expiró?</span>
                          <button
                            type="button"
                            disabled={resendingEmail}
                            onClick={() => handleResendConfirmation(loginData.email)}
                            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">forward_to_inbox</span>
                            <span>{resendingEmail ? 'Reenviando...' : 'Reenviar enlace de activación'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {resendStatus && authTab === "login" && (
                    <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                      resendStatus.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-error-container/30 border border-error/30 text-error'
                    }`}>
                      <span className="material-symbols-outlined text-base shrink-0">
                        {resendStatus.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      <span>{resendStatus.message}</span>
                    </div>
                  )}

                  <form className="flex flex-col gap-space-md" onSubmit={handleLoginSubmit}>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-email" className="text-xs font-bold text-on-surface">Correo Electrónico</label>
                      <input
                        id="login-email"
                        name="email"
                        autoComplete="username"
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                        placeholder="usuario@correo.com"
                        required
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-password" className="text-xs font-bold text-on-surface">Contraseña</label>
                      <div className="relative flex items-center">
                        <input
                          id="login-password"
                          name="password"
                          autoComplete="current-password"
                          className="w-full px-4 pr-10 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="••••••••••••"
                          required
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-outline hover:text-on-surface p-1 focus:outline-none transition-colors"
                          title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        >
                          <span className="material-symbols-outlined text-base">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      disabled={loginLoading}
                      className="mt-2 py-3 px-space-lg rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-lg">login</span>
                      <span>{loginLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}</span>
                    </button>

                    <div className="text-center pt-2">
                      <p className="text-xs text-on-surface-variant">
                        ¿No tienes una cuenta aún?{' '}
                        <button
                          type="button"
                          onClick={() => switchTab("register")}
                          className="text-primary font-bold hover:underline"
                        >
                          Registrar Cuenta
                        </button>
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: REGISTRAR CUENTA */}
              {authTab === "register" && (
                <div className="p-6 md:p-8 flex flex-col gap-space-md">
                  {registeredEmail ? (
                    <div className="flex flex-col items-center text-center gap-space-md py-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-primary">¡Verifica tu Correo Electrónico!</h2>
                        <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                          Hemos enviado un mensaje de activación con un enlace seguro a:
                        </p>
                        <p className="text-sm font-semibold text-primary bg-primary/5 py-1 px-3 rounded-lg inline-block border border-primary/20 mt-1 font-mono">
                          {registeredEmail}
                        </p>
                      </div>

                      <div className="bg-surface-container-low rounded-xl p-4 text-left border border-outline-variant/30 text-xs text-on-surface-variant space-y-2 max-w-md w-full">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-base text-secondary shrink-0 mt-0.5">check_circle</span>
                          <span>Haz clic en el enlace incluido en el correo para activar tu cuenta.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-base text-outline shrink-0 mt-0.5">schedule</span>
                          <span>El enlace de seguridad es válido durante <strong>24 horas</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-base text-outline shrink-0 mt-0.5">drafts</span>
                          <span>Si no lo ves en tu bandeja de entrada, revisa tu carpeta de <strong>Correo no deseado o Spam</strong>.</span>
                        </div>
                      </div>

                      {resendStatus && (
                        <div className={`w-full max-w-md p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                          resendStatus.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                            : 'bg-error-container/30 border border-error/30 text-error'
                        }`}>
                          <span className="material-symbols-outlined text-base shrink-0">
                            {resendStatus.type === 'success' ? 'check_circle' : 'error'}
                          </span>
                          <span>{resendStatus.message}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                        <button
                          type="button"
                          disabled={resendingEmail}
                          onClick={() => handleResendConfirmation(registeredEmail)}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                          <span>{resendingEmail ? 'Reenviando...' : 'Reenviar enlace'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLoginData((prev) => ({ ...prev, email: registeredEmail }));
                            switchTab('login');
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-base">login</span>
                          <span>Ir a Iniciar Sesión</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRegisteredEmail(null);
                          setRegisterSuccess(null);
                          setResendStatus(null);
                          setRegisterData({
                            nombres: '',
                            apellidos: '',
                            email: '',
                            password: '',
                            password_confirm: ''
                          });
                        }}
                        className="text-xs text-on-surface-variant hover:text-primary underline pt-1"
                      >
                        Registrar otra cuenta
                      </button>
                    </div>
                  ) : (
                    <>
                      {registerError && (
                        <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
                          <span className="material-symbols-outlined text-base shrink-0">error</span>
                          <span>{registerError}</span>
                        </div>
                      )}

                      {registerSuccess && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                          <span>{registerSuccess}</span>
                        </div>
                      )}

                      <form className="flex flex-col gap-space-md" onSubmit={handleRegisterSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="register-nombres" className="text-xs font-bold text-on-surface">Nombres</label>
                            <input
                              id="register-nombres"
                              name="nombres"
                              autoComplete="given-name"
                              className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                              placeholder="Ej. Rodrigo"
                              required
                              type="text"
                              value={registerData.nombres}
                              onChange={(e) => setRegisterData({ ...registerData, nombres: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="register-apellidos" className="text-xs font-bold text-on-surface">Apellidos</label>
                            <input
                              id="register-apellidos"
                              name="apellidos"
                              autoComplete="family-name"
                              className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                              placeholder="Ej. Claros Flores"
                              required
                              type="text"
                              value={registerData.apellidos}
                              onChange={(e) => setRegisterData({ ...registerData, apellidos: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="register-email" className="text-xs font-bold text-on-surface">Correo Electrónico</label>
                          <input
                            id="register-email"
                            name="email"
                            autoComplete="email"
                            className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                            placeholder="ejemplo@correo.com"
                            required
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="register-password" className="text-xs font-bold text-on-surface">Contraseña</label>
                            <div className="relative flex items-center">
                              <input
                                id="register-password"
                                name="password"
                                autoComplete="new-password"
                                className="w-full px-4 pr-10 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                                placeholder="••••••••••••"
                                required
                                minLength={8}
                                type={showRegisterPassword ? "text" : "password"}
                                value={registerData.password}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                className="absolute right-3 text-outline hover:text-on-surface p-1 focus:outline-none transition-colors"
                                title={showRegisterPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                aria-label="Alternar visibilidad de contraseña"
                              >
                                <span className="material-symbols-outlined text-base">
                                  {showRegisterPassword ? "visibility_off" : "visibility"}
                                </span>
                              </button>
                            </div>
                            {((isPasswordFocused || registerData.password.length > 0) && registerData.password.length < 8) && (
                              <div className="flex items-center gap-1.5 text-xs text-sky-600 mt-1 transition-all">
                                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                                <span>La contraseña debe tener al menos 8 caracteres.</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="register-password-confirm" className="text-xs font-bold text-on-surface">Confirmar Contraseña</label>
                            <div className="relative flex items-center">
                              <input
                                id="register-password-confirm"
                                name="password_confirm"
                                autoComplete="new-password"
                                className="w-full px-4 pr-10 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                                placeholder="••••••••••••"
                                required
                                minLength={8}
                                type={showRegisterConfirmPassword ? "text" : "password"}
                                value={registerData.password_confirm}
                                onChange={(e) => setRegisterData({ ...registerData, password_confirm: e.target.value })}
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                                className="absolute right-3 text-outline hover:text-on-surface p-1 focus:outline-none transition-colors"
                                title={showRegisterConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                aria-label="Alternar visibilidad de contraseña"
                              >
                                <span className="material-symbols-outlined text-base">
                                  {showRegisterConfirmPassword ? "visibility_off" : "visibility"}
                                </span>
                              </button>
                            </div>
                            {registerData.password_confirm.length > 0 && registerData.password !== registerData.password_confirm && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-1 transition-all">
                                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                                <span>Las contraseñas no coinciden.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          disabled={registerLoading}
                          className="mt-2 py-3 px-space-lg rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          type="submit"
                        >
                          <span className="material-symbols-outlined text-lg">person_add</span>
                          <span>{registerLoading ? "Creando Cuenta..." : "Crear Cuenta"}</span>
                        </button>

                        <div className="text-center pt-2">
                          <p className="text-xs text-on-surface-variant">
                            ¿Ya tienes una cuenta registrada?{' '}
                            <button
                              type="button"
                              onClick={() => switchTab("login")}
                              className="text-primary font-bold hover:underline"
                            >
                              Iniciar Sesión
                            </button>
                          </p>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Demo Accounts Box */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Cuentas de Acceso por Rol
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Selecciona una cuenta para cargar automáticamente sus credenciales:
              </p>

              <div className="space-y-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickFill("superadmin@aboccrim.test")}
                  className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Superadministrador</span>
                    <span className="text-[11px] text-outline font-mono">superadmin@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                    Superadmin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("academico@aboccrim.test")}
                  className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Administrador Académico</span>
                    <span className="text-[11px] text-outline font-mono">academico@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[10px]">
                    Académico
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("investigador@aboccrim.test")}
                  className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Investigador</span>
                    <span className="text-[11px] text-outline font-mono">investigador@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold text-[10px]">
                    Investigador
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("usuario@aboccrim.test")}
                  className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Usuario Registrado</span>
                    <span className="text-[11px] text-outline font-mono">usuario@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-bold text-[10px]">
                    Usuario
                  </span>
                </button>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline">
                <span>Contraseña demo:</span>
                <span className="font-mono font-bold text-primary">Aboccrim2025!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
