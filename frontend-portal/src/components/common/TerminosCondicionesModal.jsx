import React, { useState } from 'react';

export default function TerminosCondicionesModal({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'terminos',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-terminos-title"
    >
      <div className="relative bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-outline-variant/30 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/20 bg-surface-container-low flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface-container-lowest p-1.5 shadow-xs border border-outline-variant/20 flex items-center justify-center shrink-0">
              <img
                src="/ABOCCRIM.webp"
                alt="Emblema ABOCCRIM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">gavel</span>
                Marco Normativo y Seguridad Institucional
              </div>
              <h2 id="modal-terminos-title" className="text-base sm:text-lg font-bold text-primary tracking-tight">
                Términos y Condiciones y Política de Privacidad
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors shrink-0"
            title="Cerrar ventana"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex bg-surface-container border-b border-outline-variant/20 px-4 pt-2 gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('terminos')}
            className={`py-2.5 px-3.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'terminos'
                ? 'bg-surface-container-lowest text-primary border-t border-x border-outline-variant/30 shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">description</span>
            <span>11.6.3 Términos de Uso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacidad')}
            className={`py-2.5 px-3.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'privacidad'
                ? 'bg-surface-container-lowest text-primary border-t border-x border-outline-variant/30 shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">privacy_tip</span>
            <span>11.6.2 Privacidad y Datos (D.S. 1793)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seguridad')}
            className={`py-2.5 px-3.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'seguridad'
                ? 'bg-surface-container-lowest text-primary border-t border-x border-outline-variant/30 shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">security</span>
            <span>11.6.1 Seguridad de la Información</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm text-on-surface-variant space-y-4 leading-relaxed flex-1">
          {/* TAB 1: TÉRMINOS Y CONDICIONES (11.6.3) */}
          {activeTab === 'terminos' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0">info</span>
                <div>
                  <h3 className="font-bold text-primary text-xs uppercase tracking-wider">
                    11.6.3. Términos y condiciones de uso del portal
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Rigen la utilización de la plataforma institucional para visitantes, usuarios registrados, miembros, postulantes y administradores.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  Reglas de Utilización y Obligaciones del Usuario
                </h4>
                <ul className="space-y-2 pl-3">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong>Responsabilidad sobre credenciales:</strong> El usuario es estrictamente responsable de la confidencialidad de sus credenciales de acceso y de la veracidad e integridad de toda la información que registra en la plataforma.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong>Finalidades institucionales:</strong> La plataforma debe utilizarse exclusivamente para las finalidades académicas, científicas, gremiales y de divulgación de ABOCCRIM.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong>Carga legítima de documentos:</strong> La carga y publicación de artículos, libros, conferencias y currículums solo se permite cuando el usuario cuente con los derechos de autor, licencias o autorizaciones institucionales correspondientes.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong>Propiedad intelectual y privacidad:</strong> Los usuarios se comprometen a respetar la autoría, derechos patrimoniales y morales, y restricciones de acceso asociadas a cada publicación o expediente.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong>Consulta y descarga regulada:</strong> La visualización y descarga de archivos digitales se efectúa conforme a los permisos y roles de control de acceso (RBAC) asignados por la plataforma.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-accent shrink-0 mt-0.5">smart_toy</span>
                    <span>
                      <strong>Uso del Asistente Académico con Inteligencia Artificial:</strong> El asistente académico con IA es una herramienta técnica de apoyo a la consulta documental y búsqueda bibliográfica. En ningún caso sustituye la revisión analítica ni los dictámenes resolutivos de las instancias institucionales, comités de evaluación o directiva de ABOCCRIM.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5 text-xs text-on-surface-variant">
                <strong>Nota de gobernanza institucional:</strong> La política de privacidad y los términos descritos constituyen los lineamientos que acompañan la operación del sistema. Su promulgación como documentos oficiales requiere revisión y aprobación formal de ABOCCRIM.
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACIDAD Y TRATAMIENTO DE DATOS (11.6.2) */}
          {activeTab === 'privacidad' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-xl mt-0.5 shrink-0">verified</span>
                <div>
                  <h3 className="font-bold text-secondary text-xs uppercase tracking-wider">
                    11.6.2. Política de privacidad y tratamiento de datos personales
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Consentimiento expreso conforme al marco normativo boliviano y estándares de seguridad cloud.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  Tratamiento de Información y Consentimiento
                </h4>
                <p>
                  ABOCCRIM procesa información vinculada con visitantes, usuarios registrados, miembros colegiados, investigadores acreditados y postulantes. Entre los datos tratados se contemplan:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">badge</span>
                    <span>Identificación personal, CI y contacto</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">school</span>
                    <span>Perfiles académicos y títulos</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">description</span>
                    <span>Currículums y documentos de respaldo</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">history</span>
                    <span>Registros de actividad y trazabilidad</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  Marco Normativo Nacional (Decreto Supremo N.º 1793, Art. 56)
                </h4>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-on-surface-variant">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Consentimiento previo y expreso del titular:
                  </p>
                  <p className="mt-1">
                    De conformidad con el <strong>artículo 56 del Decreto Supremo N.º 1793</strong>, el tratamiento de los datos responde a finalidades institucionales determinadas. El titular presta su conocimiento previo y consentimiento expreso para la gestión de su expediente, acreditación académica y comunicaciones institucionales, pudiendo ejercer en cualquier momento sus derechos de acceso, rectificación, actualización, cancelación u oposición (ARCO).
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  Ubicación de Servidores y Proveedores Externos
                </h4>
                <ul className="space-y-2 pl-3">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">cloud</span>
                    <span>
                      <strong>Alojamiento en Google Cloud Platform (GCP):</strong> Se informa que los servidores principales de la plataforma se alojan en la nube de <strong>Google Cloud, región us-central1 (Estados Unidos)</strong>, bajo contenedores Docker y almacenamiento seguro de datos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">lock</span>
                    <span>
                      <strong>Tratamiento con Inteligencia Artificial:</strong> Cualquier proveedor externo de IA se sujeta a revisión previa de privacidad y confidencialidad. No se remiten documentos personales sensibles a servicios externos sin autorización expresa y evaluación institucional.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: SEGURIDAD DE LA INFORMACIÓN (11.6 & 11.6.1) */}
          {activeTab === 'seguridad' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0">shield</span>
                <div>
                  <h3 className="font-bold text-primary text-xs uppercase tracking-wider">
                    11.6.1. Política de seguridad de la información
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Criterios operativos y mecanismos técnicos implementados para la protección de cuentas y activos digitales.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-on-surface text-sm">Criterios Operativos del Sistema:</h4>
                <ul className="space-y-2 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <span><strong>Acceso por Rol (RBAC):</strong> Cada usuario utiliza sus propias credenciales y accede únicamente a las vistas autorizadas según su rol.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <span><strong>Protección de Secretos:</strong> Contraseñas hasheadas (PBKDF2/Argon2), tokens JWT efímeros, variables de entorno y claves de servicios no se exponen al frontend ni a repositorios públicos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <span><strong>Espacios Privados:</strong> Expedientes, currículums y documentos de respaldo permanecen en almacenamiento restringido (MinIO/GCP) y se entregan exclusivamente a usuarios autenticados con permisos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <span><strong>Bitácora de Auditoría:</strong> Registro inmutable con marcas de tiempo, IP y usuario para todas las operaciones administrativas y de autenticación.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <span><strong>Puertos y Servicios:</strong> Exposición controlada en red, limitando puertos a las necesidades de la aplicación.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5 text-xs text-on-surface-variant space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-on-surface">
                  <span className="material-symbols-outlined text-sm text-outline">info</span>
                  Estado actual de transporte web
                </div>
                <p>
                  El acceso público actual opera bajo protocolo HTTP sin dominio personalizado con certificado TLS/HTTPS activo. La configuración de dominio institucional, proxy inverso y certificado SSL/TLS está identificada como mejora necesaria para reforzar la seguridad de transporte web.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-outline-variant/20 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-outline text-center sm:text-left">
            ABOCCRIM • Documento técnico 11.6 • Bolivia
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold transition-all"
            >
              Cerrar
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Aceptar y Continuar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
