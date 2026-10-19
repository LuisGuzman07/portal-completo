import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AccesoMiembrosPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [authTab, setAuthTab] = useState("login"); // "login" | "register" | "incorporation"
  const [authMethod, setAuthMethod] = useState("institucional"); // "institucional" | "orcid" | "firma"
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rolePreference: "colegiado"
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Register form state (CU01)
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
      password: "Aboccrim2025!",
      rolePreference: "colegiado"
    });
    setLoginError(null);
  };

  // CU02: Iniciar Sesión
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

  // CU01: Registrar Cuenta
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
    <div className="flex flex-col w-full">
      {/* Top Security Banner */}
      <div className="w-full bg-primary-container text-on-primary py-space-sm px-margin-mobile md:px-margin-desktop">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm text-xs font-medium">
          <div className="flex items-center gap-space-xs text-primary-fixed">
            <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
            <span>Conexión cifrada TLS 1.3 • Autenticación Oficial ABOCCRIM (CU01–CU05)</span>
          </div>
          <div className="flex items-center gap-space-md text-primary-fixed-dim">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-primary/40 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              API-REST: ONLINE
            </span>
            <span className="hidden sm:inline">Servidor Central La Paz</span>
          </div>
        </div>
      </div>

      <div className="w-full px-margin-mobile md:px-margin-desktop py-space-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Main Card with Login / Register / Incorporation tabs */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Header institution card with WebP Logo */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg md:p-space-xl flex flex-col sm:flex-row items-center gap-space-lg border border-outline-variant/20">
              <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low rounded-xl flex items-center justify-center p-2 shadow-sm border border-outline-variant/20">
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
                  Portal de Miembros e Investigadores Colegiados
                </h1>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Autenticación centralizada para el cuerpo académico, dictaminadores y postulantes de la Academia Boliviana de Ciencias Criminológicas.
                </p>
              </div>
            </div>

            {/* Interactive Tab Box */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
              <div className="flex bg-surface-container-low p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className={`flex-1 py-3 px-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authTab === "login"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Iniciar Sesión (CU02)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab("register")}
                  className={`flex-1 py-3 px-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authTab === "register"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Registrar Cuenta (CU01)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab("incorporation")}
                  className={`flex-1 py-3 px-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authTab === "incorporation"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">how_to_reg</span>
                  <span>Incorporación (CU22)</span>
                </button>
              </div>

              {/* TAB 1: INICIAR SESIÓN (CU02) */}
              {authTab === "login" && (
                <div className="p-space-lg md:p-space-xl flex flex-col gap-space-lg">
                  {/* Auth method buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("institucional")}
                      className={`px-3 py-2 rounded-lg text-left text-xs font-semibold ${
                        authMethod === "institucional"
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>ABOCCRIM ID</span>
                        <span className="material-symbols-outlined text-sm">badge</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled
                      title="Integración oficial en fase posterior"
                      className="px-3 py-2 rounded-lg text-left text-xs font-semibold bg-surface-container/50 text-outline cursor-not-allowed opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <span>ORCID iD (Próx.)</span>
                        <span className="text-emerald-500 font-bold">iD</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled
                      title="Integración con firma digital ADSIB en fase posterior"
                      className="px-3 py-2 rounded-lg text-left text-xs font-semibold bg-surface-container/50 text-outline cursor-not-allowed opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <span>Firma Digital (Próx.)</span>
                        <span className="material-symbols-outlined text-sm">key</span>
                      </div>
                    </button>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form className="flex flex-col gap-space-md" onSubmit={handleLoginSubmit}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Correo Electrónico Registrado</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                        placeholder="usuario@aboccrim.test"
                        required
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-on-surface">Contraseña</label>
                        <span className="text-secondary hover:underline cursor-pointer">¿Olvidó su clave?</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
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

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-on-surface">Preferencia de Vista en Sesión</label>
                        <span className="text-[10px] text-outline italic">El backend autoriza permisos reales</span>
                      </div>
                      <select
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                        value={loginData.rolePreference}
                        onChange={(e) => setLoginData({ ...loginData, rolePreference: e.target.value })}
                      >
                        <option value="colegiado">Miembro Colegiado (Titular / Activo)</option>
                        <option value="investigador">Investigador Asociado / Red Científica</option>
                        <option value="revisor">Revisor por Pares (Comité Académico y Ética)</option>
                        <option value="administrador">Administración Técnica</option>
                      </select>
                    </div>

                    <button
                      disabled={loginLoading}
                      className="py-3 px-space-lg rounded-lg bg-on-tertiary-container hover:bg-tertiary-container text-on-tertiary font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-lg">vpn_key</span>
                      <span>{loginLoading ? "Verificando Credenciales..." : "Ingresar al Portal Privado (CU02)"}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: REGISTRAR CUENTA (CU01) */}
              {authTab === "register" && (
                <div className="p-space-lg md:p-space-xl flex flex-col gap-space-lg">
                  <div className="p-space-md rounded-lg bg-surface-container-high text-on-surface flex items-start gap-space-md">
                    <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">how_to_reg</span>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-primary">Registro Público de Cuenta (CU01)</p>
                      <p className="text-on-surface-variant leading-relaxed">
                        Este formulario crea una cuenta de usuario con credenciales seguras. El registro otorga permisos mínimos de usuario y <strong>no concede automáticamente acreditación como miembro ni investigador institucional</strong> (procedimiento reservado para CU22).
                      </p>
                    </div>
                  </div>

                  {registerError && (
                    <div className="p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      <span>{registerError}</span>
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                      <span>{registerSuccess}</span>
                    </div>
                  )}

                  <form className="flex flex-col gap-space-md" onSubmit={handleRegisterSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-surface">Nombres</label>
                        <input
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
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
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ej. Claros Flores"
                          required
                          type="text"
                          value={registerData.apellidos}
                          onChange={(e) => setRegisterData({ ...registerData, apellidos: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Correo Electrónico Único</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
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
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
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
                          className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
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
                      className="py-3 px-space-lg rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      <span>{registerLoading ? "Creando Cuenta..." : "Registrar Mi Cuenta de Usuario (CU01)"}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: SOLICITAR INCORPORACIÓN (CU22) */}
              {authTab === "incorporation" && (
                <div className="p-space-lg md:p-space-xl flex flex-col gap-space-lg">
                  <div className="p-space-md rounded-lg bg-surface-container-high text-on-surface flex items-start gap-space-md">
                    <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">gavel</span>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-primary">Solicitud de Incorporación Institucional (CU22)</p>
                      <p className="text-on-surface-variant leading-relaxed">
                        Este trámite formal evalúa su postulación académica mediante el Comité de Ética y Dictamen de ABOCCRIM. <em>Esta funcionalidad corresponde a una fase posterior del proyecto. Para ingresar al sistema actual utilice la pestaña "Iniciar Sesión" o "Registrar Cuenta".</em>
                      </p>
                    </div>
                  </div>

                  <form className="flex flex-col gap-space-md opacity-80" onSubmit={(e) => { e.preventDefault(); alert("Expediente de prueba recibido. En la fase correspondiente (CU22) este flujo guardará el expediente en solicitud_incorporacion."); }}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Nombres y Apellidos Completos</label>
                      <input className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm" placeholder="Ej. Dra. Jimena Claure Soria" type="text" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-surface">Cédula de Identidad</label>
                        <input className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-sm" placeholder="4839201 SC" type="text" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-surface">Categoría Solicitada</label>
                        <select className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold">
                          <option>Miembro de Número (Ph.D. / Titulado)</option>
                          <option>Investigador Asociado</option>
                          <option>Postulante Junior</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="py-3 px-space-lg rounded-lg bg-surface-container-high text-primary font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
                      <span>Enviar Expediente a Secretaría Académica (CU22)</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Information Column & Development Test Accounts Helper */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Demo Accounts Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-primary/20">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-on-tertiary-container text-xl">science</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Cuentas de Prueba por Actor (Fase CU01–CU05)</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                Haga clic sobre un actor para cargar automáticamente sus credenciales en el formulario de inicio de sesión:
              </p>

              <div className="mt-3 space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill("superadmin@aboccrim.test")}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Superadministrador</span>
                    <span className="text-[11px] text-outline font-mono">superadmin@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">Control Total</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("academico@aboccrim.test")}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Administrador Académico</span>
                    <span className="text-[11px] text-outline font-mono">academico@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[10px]">Académico</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("investigador@aboccrim.test")}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Investigador Titular</span>
                    <span className="text-[11px] text-outline font-mono">investigador@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold text-[10px]">Investigador</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("usuario@aboccrim.test")}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Usuario Registrado</span>
                    <span className="text-[11px] text-outline font-mono">usuario@aboccrim.test</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-bold text-[10px]">Sin Acreditación</span>
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline">
                <span>Contraseña estándar:</span>
                <span className="font-mono font-bold text-primary">Aboccrim2025!</span>
              </div>
            </div>

            {/* Academic regulations note */}
            <div className="bg-surface-container-low rounded-xl p-space-lg text-xs space-y-2 border border-outline-variant/20">
              <span className="font-bold text-primary block">Reglamento de Seguridad y Acceso</span>
              <p className="text-on-surface-variant leading-relaxed">
                El sistema de control de acceso RBAC de ABOCCRIM valida en tiempo real los roles y permisos del usuario desde el servidor PostgreSQL. Ningún selector visual en el cliente puede elevar privilegios.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-secondary font-semibold">
                <span className="material-symbols-outlined text-sm">shield</span>
                <span>Protección contra escalamiento de privilegios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
