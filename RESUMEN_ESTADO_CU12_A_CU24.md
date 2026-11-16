# Informe de Estado y Correcciones: Casos de Uso ABOCCRIM (CU12–CU24)

**Fecha de evaluación:** 16 de noviembre de 2026  
**Sistema:** Plataforma Web de Gestión Académica e Institucional — Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)  
**Alcance:** Revisión funcional, análisis de pendientes y limpieza de interfaz en los casos de uso solicitados:  
`CU12`, `CU13`, `CU14`, `CU15`, `CU16`, `CU18`, `CU19`, `CU20`, `CU21`, `CU22`, `CU23`, `CU24`.

---

## 1. Matriz Consolidada de Estado Funcional

| Caso de Uso | Nombre | Prioridad | Backend API | Frontend React | Estado Global |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **CU12** | Consultar repositorio académico | **Crítica** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU13** | Descargar documento autorizado | **Crítica** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU14** | Administrar documentos digitales | **Crítica** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU15** | Clasificar contenido académico | **Alta** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU16** | Buscar información con filtros | **Alta** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU18** | Administrar eventos académicos | **Media** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU19** | Administrar noticias institucionales | **Media** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU20** | Administrar contenido multimedia | **Media** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU21** | Administrar convenios institucionales | **Media** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU22** | Enviar solicitud de incorporación | **Alta** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU23** | Evaluar solicitud de incorporación | **Alta** | ✅ Operativo | ✅ Operativo | **Completado y Funcional** |
| **CU24** | Registrar decisión de incorporación | **Alta** | ⚠️ Parcial (DDBB/Modelo) | ❌ Pendiente | **Pendiente de Implementación** |

---

## 2. Detalle Individual por Caso de Uso

### CU12 — Consultar repositorio académico
- **Prioridad:** Crítica.
- **Componentes Frontend:** `RepositorioAcademicoPage.jsx` (`/repositorio`), `PublicacionDetailPage.jsx` (`/repositorio/:id`), `CitationModal.jsx`.
- **Endpoints Backend:** `GET /api/v1/repository/`, `GET /api/v1/repository/<id>/`, `GET /api/v1/repository/access-status/`.
- **Tablas:** `publicacion`, `tipo_publicacion`, `autor`, `publicacion_autor`, `categoria`, `palabra_clave`, `documento_digital`, `visualizacion_contenido`.
- **¿Qué está funcional?**
  - Catálogo público accesible sin autenticación; muestra exclusivamente publicaciones con estado `aprobada`.
  - Vista de detalle con metadatos completos: título, autores con filiación institucional y ORCID, año, DOI, resumen/abstract, referencias y lista de documentos adjuntos.
  - Generador de citas académicas en múltiples formatos (APA 7, BibTeX, Chicago, MLA).
  - Contador y registro automático de métricas de visualización en la tabla `visualizacion_contenido`.
  - Aislamiento de privacidad: las publicaciones en revisión o borradores solo son visibles para su autor y revisores autorizados (`comite_academico`, `admin_academico`, `superadmin`).
- **¿Qué hace falta?**
  - Paginación por cursor o páginas numéricas en frontend y backend cuando el volumen de publicaciones sea elevado.
  - Módulo de estadísticas agregadas de impacto (gráficos de visualizaciones por mes y por área temática) para el panel de administración.

---

### CU13 — Descargar documento autorizado
- **Prioridad:** Crítica.
- **Componentes Frontend:** `PublicacionDetailPage.jsx`, `RevisionPublicacionesPage.jsx`, `AdminPublicacionesPage.jsx`.
- **Endpoints Backend:** `GET /api/v1/publications/documents/<doc_id>/download/` (soporta parámetro `?inline=1`).
- **Tablas:** `documento_digital`, `descarga_documento`, `registro_auditoria`, `miembro`, `investigador`.
- **¿Qué está funcional?**
  - Control de acceso por niveles estrictos (`publico`, `miembros`, `restringido`).
  - Verificación de acreditación institucional: para el nivel `miembros`, el backend comprueba que la cuenta tenga estado `activo` en la tabla `miembro` o `investigador`, no limitándose solo al rol de usuario.
  - Registro de auditoría con IP, ID de documento, publicación y usuario en `registro_auditoria` y métrica en `descarga_documento`.
  - Descarga blob segura con nombre sanitizado y prevención estricta de path traversal contra `settings.MEDIA_ROOT`.
- **¿Qué hace falta?**
  - Indicador visual previo en el listado de documentos (candado/etiqueta) que informe antes del clic que el archivo requiere membresía activa.
  - Límite de tasa (rate limiting) para descargas concurrentes automáticas.

---

### CU14 — Administrar documentos digitales
- **Prioridad:** Crítica.
- **Componentes Frontend:** `AdminPublicacionesPage.jsx` (modal de administración de documentos y carga inicial).
- **Endpoints Backend:**
  - `GET /api/v1/publications/<pub_id>/documents/`
  - `POST /api/v1/publications/<pub_id>/documents/`
  - `GET /api/v1/publications/documents/<doc_id>/`
  - `PATCH /api/v1/publications/documents/<doc_id>/`
  - `DELETE /api/v1/publications/documents/<doc_id>/`
  - `POST /api/v1/publications/documents/<doc_id>/replace/`
- **Tablas:** `documento_digital`, `tipo_documento`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Alta, listado, actualización de metadatos, reemplazo de archivo y eliminación permanente (registro y archivo físico).
  - Verificación de cabecera mágica `%PDF-`, extensión `.pdf` y límite de 25 MB.
  - Generación de hash SHA-256 almacenado en `checksum_sha256` y nombres basados en UUID para evitar colisiones.
- **¿Qué hace falta?**
  - Control de versiones histórico de documentos (conservar versiones previas al reemplazar un archivo).
  - Soporte de formatos complementarios no ejecutables si se aprueban para evidencias o peritajes (ej. CSV o ZIP de datos anonimizados).

---

### CU15 — Clasificar contenido académico
- **Prioridad:** Alta.
- **Componentes Frontend:** `AdminPublicacionesPage.jsx`, `RepositorioAcademicoPage.jsx`.
- **Endpoints Backend:**
  - `GET /api/v1/publications/types/`
  - `GET /api/v1/publications/document-types/`
  - `GET /api/v1/publications/categories/` (`POST` restringido a administración académica)
  - `GET /api/v1/publications/keywords/`
  - `GET /api/v1/publications/investigators/`
- **Tablas:** `tipo_publicacion`, `tipo_documento`, `area_tematica`, `categoria`, `palabra_clave`, `publicacion_categoria`, `publicacion_palabra`.
- **¿Qué está funcional?**
  - Clasificación en cuatro dimensiones: Tipo de Publicación, Área Temática, Categorías Temáticas y Palabras Clave.
  - Asignación de autores vinculados a perfiles de investigadores activos con filiación institucional y ORCID.
  - Auto-siembra de catálogos iniciales oficiales de ciencias penales y criminológicas (`ensure_catalogs_seeded`).
- **¿Qué hace falta?**
  - Pantalla o interfaz CRUD completa en el panel administrativo para dar de alta o reclasificar Áreas Temáticas y Categorías de forma autónoma.
  - Tesauro y autocompletado de palabras clave en el formulario.

---

### CU16 — Buscar información con filtros
- **Prioridad:** Alta.
- **Componentes Frontend:** `RepositorioAcademicoPage.jsx`.
- **Endpoints Backend:** `GET /api/v1/repository/` con parámetros `search`, `tipo_id`, `categoria_id`, `area_id`, `anio`, `investigador_id`, `fecha_desde`, `fecha_hasta`.
- **Tablas:** `publicacion`, `tipo_publicacion`, `categoria`, `area_tematica`, `autor`, `palabra_clave`.
- **¿Qué está funcional?**
  - Búsqueda textual sobre título, resumen, nombres/apellidos de autores, palabras clave y referencias.
  - Filtros combinados multi-criterio: Tipo, Categoría, Investigador y Año.
  - Contador en tiempo real, indicador de filtros activos y botón "Limpiar Filtros" con restablecimiento del catálogo.
- **¿Qué hace falta?**
  - Selectores de rango de fecha personalizada (`fecha_desde` y `fecha_hasta`) en la UI (el backend ya los soporta).
  - Selector de ordenamiento en el frontend (por relevancia, fecha descendente o alfabético A-Z).

---

### CU18 — Administrar eventos académicos
- **Prioridad:** Media.
- **Componentes Frontend:** `AdminEventosPage.jsx` (`/dashboard/eventos`), `EventosPage.jsx` (`/eventos`).
- **Endpoints Backend:**
  - `GET /api/v1/events/public/`
  - `GET /api/v1/events/`
  - `POST /api/v1/events/`
  - `GET /api/v1/events/<id>/`
  - `PATCH /api/v1/events/<id>/`
- **Tablas:** `evento`, `recurso_multimedia`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Gestión completa de eventos: título, lugar o modalidad virtual, fecha/hora inicio, fecha/hora fin, descripción y estado (`borrador`, `publicado`, `cancelado`).
  - Separación de vistas: solo eventos en estado `publicado` se exponen en `/eventos`.
  - Integración con material multimedia relacionado.
  - Auditoría de creación y modificación con `CREAR_EVENTO` y `ACTUALIZAR_EVENTO`.
- **¿Qué hace falta?**
  - Posibilidad de eliminación o archivado explícito de eventos pasados.
  - Gestión de inscripciones o expositores invitados si la institución lo requiere.

---

### CU19 — Administrar noticias institucionales
- **Prioridad:** Media.
- **Componentes Frontend:** `AdminNoticiasPage.jsx` (`/dashboard/noticias`), `NoticiasPage.jsx` (`/noticias`).
- **Endpoints Backend:**
  - `GET /api/v1/news/public/`
  - `GET /api/v1/news/`
  - `POST /api/v1/news/`
  - `GET /api/v1/news/<id>/`
  - `PATCH /api/v1/news/<id>/`
- **Tablas:** `noticia`, `recurso_multimedia`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Redacción y publicación de noticias oficiales con control de visibilidad (`borrador`, `publicado`, `retirada`).
  - Soporte de enlaces web complementarios autorizados.
  - Asignación automática de `fecha_publicacion` al publicarse.
  - Portal público con buscador y contenido formateado.
- **¿Qué hace falta?**
  - Editor de texto enriquecido (Markdown o WYSIWYG) para títulos secundarios, negritas o listas en el cuerpo de la noticia.
  - Carga de imagen de portada directamente desde la noticia sin requerir un paso separado en multimedia.

---

### CU20 — Administrar contenido multimedia
- **Prioridad:** Media.
- **Componentes Frontend:** `AdminMultimediaPage.jsx` (`/dashboard/multimedia`), `MultimediaPage.jsx` (`/multimedia`).
- **Endpoints Backend:**
  - `GET /api/v1/multimedia/public/`
  - `GET /api/v1/multimedia/`
  - `POST /api/v1/multimedia/`
  - `GET /api/v1/multimedia/<id>/`
  - `PATCH /api/v1/multimedia/<id>/`
  - `GET /api/v1/multimedia/<id>/descarga/`
- **Tablas:** `recurso_multimedia`, `evento`, `noticia`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Modalidad dual: enlaces externos (YouTube, podcasts, web) o subida directa de archivos (imagen, audio, video, PDF) hasta 50 MB.
  - Niveles de acceso (`publico`, `miembros`, `restringido`).
  - Vinculación relacional opcional a un evento o noticia (condicionando su visibilidad pública a que la entidad padre esté publicada).
  - Descarga protegida con validación de roles y cabeceras de seguridad.
- **¿Qué hace falta?**
  - Reproductor integrado en frontend (audio y video HTML5 embebido) para previsualizar sin descargar.
  - Botón de eliminación directa de recursos multimedia en el panel administrativo.

---

### CU21 — Administrar convenios institucionales
- **Prioridad:** Media.
- **Componentes Frontend:** `AdminConveniosPage.jsx` (`/dashboard/convenios`), `ConveniosPage.jsx` (`/convenios`).
- **Endpoints Backend:**
  - `GET /api/v1/agreements/public/`
  - `GET /api/v1/agreements/`
  - `POST /api/v1/agreements/`
  - `GET /api/v1/agreements/<id>/`
  - `PATCH /api/v1/agreements/<id>/`
  - `GET /api/v1/agreements/<id>/documento/`
  - `GET /api/v1/institutions/`
  - `POST /api/v1/institutions/`
- **Tablas:** `convenio`, `institucion`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Registro de convenios interinstitucionales y catálogo de instituciones contraparte.
  - Control de vigencia: solo convenios con estado `vigente` y dentro del rango de fechas se exponen en el portal público.
  - Adjunto documental: soporte de enlace web o PDF institucional con certificación obligatoria del administrador de ser versión autorizada.
  - Descarga pública segura del documento oficial del convenio.
- **¿Qué hace falta?**
  - Registro de adendas o historial de renovaciones de vigencia para convenios renovados.
  - Notificación anticipada en el dashboard sobre convenios próximos a expirar.

---

### CU22 — Enviar solicitud de incorporación
- **Prioridad:** Alta.
- **Componentes Frontend:** `SolicitudIncorporacionPage.jsx` (`/solicitud-incorporacion`).
- **Endpoints Backend:**
  - `POST /api/v1/incorporacion/solicitudes/`
  - `POST /api/v1/incorporacion/solicitudes/seguimiento/`
  - `POST /api/v1/incorporacion/solicitudes/seguimiento/documentos/`
- **Tablas:** `solicitud_incorporacion`, `documento_solicitud`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Postulación pública abierta sin necesidad de cuenta previa.
  - Validación de campos: nombres, apellidos, correo único para trámites activos, teléfono, antecedentes académicos, CV obligatorio en PDF y respaldos académicos (hasta 8 PDFs).
  - Emisión de código oficial correlativo (`ABO-SOL-00000X`) y credencial privada criptográfica firmada (`token_seguimiento`).
  - Consulta privada de avance en la misma página usando la credencial (con guardado local en el navegador).
  - Flujo de subsanación de observaciones: si la solicitud es observada por el Comité, el postulante puede adjuntar documentos complementarios, transicionando automáticamente a `en_revision`.
- **¿Qué hace falta?**
  - Servicio de envío automático de correo electrónico con la constancia y token al postulante.
  - Indicador visual tipo línea de tiempo (stepper) del estado del expediente.

---

### CU23 — Evaluar solicitud de incorporación
- **Prioridad:** Alta.
- **Componentes Frontend:** `EvaluarSolicitudesPage.jsx` (`/dashboard/solicitudes-incorporacion`).
- **Endpoints Backend:**
  - `GET /api/v1/incorporacion/solicitudes/revision/`
  - `GET /api/v1/incorporacion/solicitudes/<id>/revision/`
  - `POST /api/v1/incorporacion/solicitudes/<id>/evaluaciones/`
  - `GET /api/v1/incorporacion/solicitudes/<solicitud_id>/documentos/<documento_id>/download/`
- **Tablas:** `solicitud_incorporacion`, `documento_solicitud`, `evaluacion_solicitud`, `registro_auditoria`.
- **¿Qué está funcional?**
  - Interfaz exclusiva para usuarios autorizados con rol `comite_academico` o `superadmin`.
  - Vista maestro-detalle: lista con filtros por estado y buscador, visualización completa de antecedentes y descarga de todos los PDFs entregados.
  - Registro colegiado de evaluaciones acumulativas: `favorable` (transiciona a `lista_decision`), `desfavorable` (transiciona a `lista_decision`), `requiere_documentacion` (transiciona a `observada`) o `continuar_revision` (`en_revision`).
  - Requerimientos claros para el postulante cuando se solicitan documentos adicionales.
- **¿Qué hace falta?**
  - Rúbrica estructurada de ponderación curricular (puntajes por grado académico, docencia, producción criminológica).
  - Firma colectiva o dictamen conjunto final del comité evaluador.

---

### CU24 — Registrar decisión de incorporación
- **Prioridad:** Alta.
- **Componentes Frontend:** ❌ No implementado en la interfaz.
- **Endpoints Backend:** ⚠️ Modelo `DecisionIncorporacion` y tabla `decision_incorporacion` creados; **pendiente endpoint de resolución**.
- **Tablas:** `decision_incorporacion`, `solicitud_incorporacion`, `miembro`, `categoria_miembro`, `registro_auditoria`.
- **¿Qué está funcional actualmente?**
  - La tabla `decision_incorporacion` existe en PostgreSQL con las claves foráneas hacia `solicitud_incorporacion` y `usuario`.
  - El modelo Django `DecisionIncorporacion` está definido en `apps/incorporation/models.py`.
  - En CU23, la recomendación del Comité Académico transiciona correctamente la solicitud al estado `lista_decision`.
- **¿Qué hace falta para completar CU24?**
  1. **En Backend:**
     - Endpoint formal de resolución: ej. `POST /api/v1/incorporacion/solicitudes/<id>/decision/`.
     - Permiso restringido a Consejo Directivo / Presidencia / Superadministrador.
     - Registro de campos: `resultado` (`aprobada` / `rechazada`), `referencia_acta` (número de resolución/acta), `observaciones` y usuario resolutor.
     - Actualización de estado en `solicitud_incorporacion` a `aprobada` o `rechazada`.
     - En caso de aprobación: creación automática o vinculación del registro en `miembro`, asignando la `categoria_id` (de `categoria_miembro`) y `fecha_incorporacion`.
     - Auditoría `REGISTRAR_DECISION_INCORPORACION`.
  2. **En Frontend:**
     - Interfaz administrativa (pestaña en evaluación o sección en `AdminMiembrosPage`):
       - Bandeja de solicitudes en estado `lista_decision`.
       - Formulario para registrar el dictamen formal: acta, resultado, categoría estatutaria asignada y observaciones.
       - Acceso directo a la ficha del nuevo miembro tras la aprobación.

---

## 3. Limpieza y Pulido Frontend Realizado

En cumplimiento de las instrucciones de limpieza visual y eliminación de tecnicismos y códigos internos:

1. **Eliminación total de etiquetas literales tipo `CU#`:**
   - **`EvaluarSolicitudesPage.jsx`**: Se removió `CU23 · Comité Académico` reemplazándose por `Comité Académico · Evaluación`. En el texto explicativo de alcance, se eliminó la frase técnica *"la decisión formal corresponde al CU24"* sustituyéndola por *"la decisión formal corresponde a la resolución institucional de incorporación"*.
   - **`SolicitudIncorporacionPage.jsx`**: Se eliminó `Incorporación institucional · CU22` quedando como título limpio `Incorporación institucional`.
   - **`AdminEventosPage.jsx`**: Se removió `CU18 · administración institucional` por `Administración institucional · Eventos`.
   - **`AdminNoticiasPage.jsx`**: Se removió `CU19 · comunicación institucional` por `Comunicación institucional · Noticias`. Se corrigió el texto de ayuda *"La carga de archivos se gestiona en CU20"* por *"La carga de archivos y material audiovisual se gestiona en la sección de Contenido Multimedia"*.
   - **`AdminMultimediaPage.jsx`**: Se removió `CU20 · gestión institucional` por `Gestión institucional · Multimedia`. Se corrigió el texto de autoría *"Gestionado desde CU19"* por *"Gestionado desde Noticias"*.
   - **`AdminConveniosPage.jsx`**: Se removió `CU21 · gestión institucional` por `Gestión institucional · Convenios`.
   - **`AdminPublicacionesPage.jsx`**: Se limpiaron los textos de formularios `Clasificación y Categorías Temáticas (CU15)` y `Adjuntar Documento Digital Inicial (PDF - CU14)` dejándolos como títulos profesionales limpios sin códigos internos.
   - **`AdminInvestigadoresPage.jsx`**: Se removieron referencias internas a "CU06" en mensajes a usuario (`"completa su perfil en CU06"`, `"registrarse desde CU06"`), cambiándose por términos institucionales claros (`"perfil institucional"`, `"perfil académico"`).

2. **Eliminación de lenguaje técnico interno y jerga de backend:**
   - **`AdminDashboardPage.jsx`**:
     - Se reemplazó la frase: *"Sus módulos y operaciones habilitadas corresponden a los roles y permisos validados en el servidor"* por *"Los módulos y operaciones disponibles se adaptan a su nivel de acceso institucional"*.
     - Se limpió el resumen de alcance institucional, removiendo términos como *"autenticación JWT"*, *"gestión técnica"* y *"RBAC"*, adaptándolo a redacción institucional profesional.
   - **Comentarios internos de código:** Se limpiaron comentarios en `AdminPublicacionesPage.jsx`, `RepositorioAcademicoPage.jsx`, `AdminDashboardPage.jsx` y `api.js` eliminando menciones a `(CU#)` para mantener un estándar limpio y mantenible.

3. **Verificación de Integridad:**
   - Se ejecutó `npm run build` en `frontend-portal`, completándose con éxito sin ningún error ni advertencia de sintaxis.
   - Se verificó mediante búsqueda exhaustiva que existen **cero coincidencias** de patrones `CU\d+` en todo el directorio `frontend-portal/src`.
   - **No se modificó la lógica del backend**, respetando la regla estricta de la instrucción.
