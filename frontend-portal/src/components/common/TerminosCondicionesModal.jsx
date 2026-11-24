import React, { useState, useEffect } from 'react';

export default function TerminosCondicionesModal({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'terminos',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-terminos-title"
    >
      <div className="relative bg-white text-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] max-h-[850px] flex flex-col border border-slate-200 overflow-hidden font-sans">
        
        {/* Cabecera Formal e Institucional */}
        <div className="shrink-0 px-6 py-4 sm:py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-xs border border-slate-200 shrink-0">
              <img
                src="/ABOCCRIM.webp"
                alt="Emblema ABOCCRIM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Academia Boliviana de Ciencias Criminológicas
              </p>
              <h2 id="modal-terminos-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                Marco Normativo, Privacidad y Términos de Servicio
              </h2>
              <p className="text-xs text-slate-500">
                Reglamentación del Sistema Institucional y Tratamiento de Información
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors shrink-0"
            title="Cerrar ventana"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Barra de Secciones (Pestañas formales con altura fija y sin desborde vertical) */}
        <div className="shrink-0 flex items-stretch border-b border-slate-200 bg-slate-100/80 px-4 sm:px-6 pt-2 gap-2 overflow-x-auto overflow-y-hidden text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('terminos')}
            className={`py-3 px-4 rounded-t-lg font-bold transition-all border-b-2 text-center whitespace-nowrap shrink-0 flex items-center justify-center ${
              activeTab === 'terminos'
                ? 'bg-white text-slate-900 border-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            Términos y Condiciones de Uso
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacidad')}
            className={`py-3 px-4 rounded-t-lg font-bold transition-all border-b-2 text-center whitespace-nowrap shrink-0 flex items-center justify-center ${
              activeTab === 'privacidad'
                ? 'bg-white text-slate-900 border-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            Política de Privacidad (D.S. 1793)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seguridad')}
            className={`py-3 px-4 rounded-t-lg font-bold transition-all border-b-2 text-center whitespace-nowrap shrink-0 flex items-center justify-center ${
              activeTab === 'seguridad'
                ? 'bg-white text-slate-900 border-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            Seguridad de la Información
          </button>
        </div>

        {/* Cuerpo del Documento: Texto enriquecido, formal y serio */}
        <div className="px-6 py-6 overflow-y-auto text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed flex-1">
          
          {/* SECCIÓN 1: TÉRMINOS Y CONDICIONES DE USO */}
          {activeTab === 'terminos' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-l-4 border-slate-700 pl-4 py-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Términos y Condiciones Generales de Uso del Portal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reglas de utilización para visitantes, usuarios registrados, postulantes, investigadores y miembros colegiados.
                </p>
              </div>

              <div className="space-y-4 text-justify">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    1. Objeto y Ámbito de Aplicación
                  </h4>
                  <p>
                    Las presentes condiciones establecen los derechos, obligaciones y directrices operativas que rigen el acceso, consulta, interacción y utilización de los servicios digitales puestos a disposición por la <strong>Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)</strong>. Su aceptación formal es requisito indispensable para la creación de cuentas de usuario y la tramitación de expedientes institucionales.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    2. Finalidades Institucionales y Uso Autorizado
                  </h4>
                  <p>
                    El usuario se compromete a utilizar la plataforma única y exclusivamente para los fines estatutarios de ABOCCRIM, vinculados al fomento de la investigación criminológica, ciencias penales, criminalística, medicina legal y ciencias forenses. Queda terminantemente prohibido cualquier uso ilícito, con fines de lucro personal no autorizado, o que atente contra el prestigio y los objetivos gremiales y científicos de la institución.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    3. Responsabilidad sobre Credenciales y Declaraciones
                  </h4>
                  <p>
                    Cada usuario es el único responsable civil y administrativo de la estricta reserva y custodia de sus credenciales personales de acceso (usuario y contraseña). Cualquier actividad, registro, trámite o carga documental efectuada mediante una cuenta autenticada se presumirá realizada por su titular legítimo. El usuario declara bajo juramento la total exactitud, veracidad e integridad de todos los datos personales, profesionales y curriculares que consigne en la plataforma.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    4. Propiedad Intelectual y Publicación de Documentos
                  </h4>
                  <p>
                    La carga, depósito o divulgación de obras científicas, monografías, artículos doctrinales, libros o conferencias en el repositorio digital requiere obligatoriamente que el usuario cuente con los derechos de autor, licencias de distribución vigentes o autorizaciones expresas de los titulares. Se prohíbe de forma terminante el plagio, la copia no autorizada y la vulneración de los derechos morales y patrimoniales previstos en la legislación sobre propiedad intelectual.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    5. Consulta, Descargas y Restricciones de Acceso
                  </h4>
                  <p>
                    El acceso a los documentos, actas y expedientes se encuentra estructurado bajo un sistema de control de acceso basado en roles (RBAC). El usuario podrá consultar y descargar material únicamente conforme a los permisos asignados a su perfil (público, miembro acreditado o comité evaluador), debiendo respetar estrictamente las restricciones de confidencialidad y los términos de citación bibliográfica correspondientes.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    6. Asistente Académico con Inteligencia Artificial
                  </h4>
                  <p>
                    Se deja expresa constancia de que el <strong>Asistente Académico automatizado con Inteligencia Artificial</strong> constituye una herramienta tecnológica orientada de manera exclusiva al auxilio en la búsqueda bibliográfica, resumen de documentos y localización temática dentro del catálogo institucional. Dicha herramienta en ningún caso sustituye el juicio analítico humano, la revisión pericial de pares, ni las resoluciones vinculantes adoptadas por los Comités Académicos o el Tribunal de Honor de la institución.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    7. Gobernanza Institucional
                  </h4>
                  <p>
                    Las presentes directrices constituyen los lineamientos operacionales vigentes para el despliegue técnico del sistema. Su consolidación y publicación formal como normativa reglamentaria definitiva se sujeta a la aprobación de las instancias directivas competentes de ABOCCRIM.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS */}
          {activeTab === 'privacidad' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-l-4 border-slate-700 pl-4 py-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Política de Privacidad y Tratamiento de Datos Personales
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marco normativo boliviano, consentimiento expreso y estándares de retención y custodia.
                </p>
              </div>

              <div className="space-y-4 text-justify">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    1. Alcance y Categorías de Información Tratada
                  </h4>
                  <p>
                    En el ejercicio de sus atribuciones científicas e institucionales, ABOCCRIM recopila y procesa datos pertinentes relativos a visitantes, usuarios registrados, miembros colegiados, investigadores y postulantes a membresía. Dicho tratamiento comprende:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                    <li><strong>Datos de Identificación y Contacto:</strong> Nombres completos, número de cédula de identidad, nacionalidad, dirección electrónica y teléfonos.</li>
                    <li><strong>Datos Académicos y Profesionales:</strong> Títulos universitarios, grados académicos, afiliación institucional, currículum vitae y certificados de acreditación.</li>
                    <li><strong>Documentos de Respaldo:</strong> Diplomas, certificados de no antecedentes penales, cartas de postulación y constancias de arbitraje.</li>
                    <li><strong>Registros Técnicos de Actividad:</strong> Credenciales de acceso cifradas, marcas temporales de conexión, direcciones IP y bitácoras de auditoría de transacciones.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    2. Consentimiento Expreso del Titular (Decreto Supremo N.º 1793, Artículo 56)
                  </h4>
                  <p>
                    De estricto acuerdo con el <strong>artículo 56 del Decreto Supremo N.º 1793</strong> (Reglamento para el desarrollo de las Tecnologías de Información y Comunicación), el tratamiento de los datos personales requiere el conocimiento previo y el <strong>consentimiento expreso e informado del titular</strong>. Al registrarse en este portal, el usuario otorga su autorización expresa para que ABOCCRIM procese, almacene y verifique la documentación aportada con fines de evaluación de postulaciones, gestión del padrón de miembros y difusión científica autorizada.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    3. Ejercicio de los Derechos ARCO
                  </h4>
                  <p>
                    El titular de los datos personales tiene garantizado el ejercicio pleno, continuo y gratuito de los derechos de <strong>Acceso, Rectificación, Actualización, Cancelación y Oposición (ARCO)</strong> respecto de su información almacenada. Dichas solicitudes podrán canalizarse a través de las funciones habilitadas en el panel de usuario o mediante requerimiento formal dirigido al Comité de Administración de ABOCCRIM.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    4. Infraestructura Cloud y Ubicación Geográfica del Alojamiento
                  </h4>
                  <p>
                    Se informa formalmente al usuario que los servidores de producción, bases de datos y contenedores del sistema se encuentran alojados en la infraestructura de computación en la nube de <strong>Google Cloud Platform (GCP)</strong>, en la región geográfica <strong>us-central1 (Estados Unidos)</strong>. La infraestructura cumple con estándares internacionales de seguridad física, redundancia energética y aislamiento lógico de redes.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    5. Proveedores Externos de Inteligencia Artificial y Confidencialidad
                  </h4>
                  <p>
                    La integración de servicios externos de inteligencia artificial para indexación documental y búsqueda semántica se rige por estrictas cláusulas de no retención de información sensible. No corresponde en ningún caso remitir documentos personales, antecedentes disciplinarios ni expedientes confidenciales a servicios externos sin la autorización institucional previa y la comprobación de los acuerdos de privacidad aplicables.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: SEGURIDAD DE LA INFORMACIÓN */}
          {activeTab === 'seguridad' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-l-4 border-slate-700 pl-4 py-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Política de Seguridad de la Información y Arquitectura del Sistema
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mecanismos técnicos de autenticación, control de accesos, protección de secretos y auditoría.
                </p>
              </div>

              <div className="space-y-4 text-justify">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    1. Arquitectura de Seguridad y Autenticación Criptográfica
                  </h4>
                  <p>
                    La plataforma incorpora mecanismos de autenticación basados en <strong>Tokens Web JSON (JWT)</strong> emitidos con algoritmos criptográficos robustos y tiempos de caducidad limitados. Las contraseñas de los usuarios son procesadas mediante funciones hash irreversibles con sal (PBKDF2/SHA-256), impidiendo su recuperación en texto claro incluso para los administradores del sistema.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    2. Control de Acceso Basado en Roles (RBAC)
                  </h4>
                  <p>
                    El principio de menor privilegio rige la totalidad de las interacciones. Los usuarios acceden de manera restrictiva únicamente a las vistas, endpoints de API y datos expresamente facultados para su rol verificado (Visitante, Usuario Registrado, Investigador Acreditado, Miembro de Número, Administrador Académico o Superadministrador).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    3. Almacenamiento Privado de Documentos y Custodia de Secretos
                  </h4>
                  <p>
                    Los currículums, expedientes de postulación y publicaciones en revisión se custodian en depósitos de almacenamiento privados (MinIO/Google Cloud Storage), desvinculados de rutas públicas directas. La descarga se gestiona mediante tokens de acceso autorizados. Asimismo, las claves maestras, variables de entorno y tokens de servicios externos permanecen estrictamente resguardados en el backend del servidor y nunca se exponen al frontend ni a repositorios de código.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    4. Trazabilidad Inmutable mediante Bitácora de Auditoría
                  </h4>
                  <p>
                    Con el fin de garantizar la transparencia institucional y el no repudio, la plataforma mantiene un registro de auditoría inmutable en base de datos. Se conserva registro detallado de eventos relevantes tales como: inicios de sesión exitosos o fallidos, modificaciones de roles, recepción y dictamen de solicitudes de membresía, y publicaciones aprobadas o rechazadas, archivando marca de tiempo UTC, usuario responsable y dirección IP.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                    5. Estado de los Canales de Transporte y Mejoras Técnicas Identificadas
                  </h4>
                  <p>
                    En el marco de la transparencia institucional, se hace constar que el acceso público actual utiliza el protocolo HTTP y no dispone aún de un dominio oficial con certificado SSL/TLS activo. En consecuencia, la transmisión cifrada de extremo a extremo mediante TLS no se presenta como una medida plenamente implementada en el entorno actual. La configuración de un nombre de dominio institucional con proxy inverso y certificado SSL/TLS se encuentra formalmente identificada como una mejora necesaria para reforzar la seguridad perimetral de la aplicación web.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Pie del Modal: Acciones y Formalidad Institucional */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            ABOCCRIM • Bolivia • Documento de Cumplimiento Normativo
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
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
                className="flex-1 sm:flex-initial py-2 px-5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Aceptar y Continuar</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
