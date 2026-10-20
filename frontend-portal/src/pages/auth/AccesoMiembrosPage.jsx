import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AccesoMiembrosPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);

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

  // Quick fill helper for development
  const handleQuickFill = (email) => {
    setLoginData({
      email,
      password: "Aboccrim2025!"
    });
    setLoginError(null);
  };

  // Iniciar Sesión
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
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
      await register({
        nombres: registerData.nombres,
        apellidos: registerData.apellidos,
        email: registerData.email,
        password: registerData.password,
        password_confirm: registerData.password_confirm
      });
      setRegisterSuccess("¡Cuenta creada exitosamente! Redirigiendo a su panel...");
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error en registro:', err);
      let errMsg = "Error al crear la cuenta.";
      if (err.data) {
        if (err.data.email) errMsg = `Correo: ${err.data.email.join(' ')}`;
        else if (err.data.password) errMsg = `Contraseña: ${err.data.password.join(' ')}`;
        else if (err.data.non_field_errors) errMsg = err.data.non_field_errors.join(' ');
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
                  onClick={() => setAuthTab("login")}
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
                  onClick={() => setAuthTab("register")}
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
                    <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form className="flex flex-col gap-space-md" onSubmit={handleLoginSubmit}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Correo Electrónico</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                        placeholder="usuario@aboccrim.test"
                        required
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Contraseña</label>
                      <div className="relative flex items-center">
                        <input
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="••••••••••••"
                          required
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-outline hover:text-on-surface"
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
                  </form>
                </div>
              )}

              {/* TAB 2: REGISTRAR CUENTA */}
              {authTab === "register" && (
                <div className="p-6 md:p-8 flex flex-col gap-space-md">
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
                        <label className="text-xs font-bold text-on-surface">Nombres</label>
                        <input
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ej. Rodrigo"
                          required
                          type="text"
                          value={registerData.nombres}
                          onChange={(e) => setRegisterData({ ...registerData, nombres: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-surface">Apellidos</label>
                        <input
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
                      <label className="text-xs font-bold text-on-surface">Correo Electrónico</label>
                      <input
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
                        <label className="text-xs font-bold text-on-surface">Contraseña (mínimo 8 car.)</label>
                        <input
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="••••••••••••"
                          required
                          minLength={8}
                          type="password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-surface">Confirmar Contraseña</label>
                        <input
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="••••••••••••"
                          required
                          minLength={8}
                          type="password"
                          value={registerData.password_confirm}
                          onChange={(e) => setRegisterData({ ...registerData, password_confirm: e.target.value })}
                        />
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
                  </form>
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
