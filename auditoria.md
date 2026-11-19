# AUDITORÍA INTEGRAL DEL PROYECTO ABOCCRIM – ESTADO REAL DE DESARROLLO

**Fecha de la auditoría:** 19 de noviembre de 2026  
**Sistema auditado:** Plataforma Web Inteligente para la Gestión y Difusión del Conocimiento Criminológico (ABOCCRIM)  
**Modalidad:** Inspección técnica no invasiva (análisis estático, verificación de rutas, modelos, vistas, esquemas SQL y dependencias).

---

## A. RESUMEN EJECUTIVO

### ¿Qué es ABOCCRIM en el marco del proyecto?
La **Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)** es una sociedad civil de carácter científico, técnico e investigativo (reconocida con Personería Jurídica R.A. N.º 232/2023 y Testimonio N.º 299/2023 en Bolivia). El proyecto de grado consiste en el desarrollo de una plataforma tecnológica integral compuesta por:
1. Un **portal web institucional público** que difunde la identidad, historia, principios rectores, autoridades, eventos, noticias, contenido multimedia y convenios interinstitucionales.
2. Un **repositorio académico científico** con control estricto de acceso y descarga autorizada de documentos PDF de investigación forense y penal.
3. Un **módulo de gestión colegiada** que separa rigurosamente el registro técnico de una cuenta del trámite formal de postulación, evaluación colegiada e incorporación formal de miembros.
4. Un **asistente académico inteligente con arquitectura RAG (Retrieval-Augmented Generation)**, que permite a los investigadores realizar consultas en lenguaje natural fundamentadas exclusivamente en fragmentos documentales autorizados del repositorio, citando fuentes, autores y páginas reales.
5. Una **consola administrativa privada con control de acceso basado en roles (RBAC)** y bitácora inmutable de auditoría para la gobernanza institucional.

### Estado general del desarrollo
El proyecto **NO es un prototipo vacío ni una maqueta superficial**. Presenta un nivel de avance consolidado de **78.1% de casos de uso completamente implementados y operativos** (25 de 32), un **6.25% parcialmente implementado** (2 de 32) y un **15.6% planificado** (5 de 32 correspondientes a reportes analíticos, evaluación curricular por IA y la aplicación móvil Android).

El frontend compila limpiamente a producción mediante Vite sin advertencias de sintaxis (`npm run build` genera 67 módulos transformados con éxito). El backend en Django REST Framework dispone de 12 aplicaciones modulares con modelos mapeados a las tablas relacionales de PostgreSQL, middlewares de seguridad, servicios de almacenamiento en MinIO/S3, autenticación JWT, un motor RAG desacoplado y salvaguardas que impiden la desconfiguración del sistema.

---

## B. ARQUITECTURA REAL DEL PROYECTO

### 1. Diagrama de la arquitectura implementada

```
+--------------------------------------------------------------------------------------------------+
|                                    CLIENTE (NAVEGADOR WEB)                                       |
|                                                                                                  |
|   [ Portal Institucional Público ]                 [ Consola Privada (Dashboard) ]              |
|   - Inicio (Hero, Banner, Pilares)                 - Mi Solicitud / Acreditación de Membresía    |
|   - Acerca de ABOCCRIM (Tabs Estatutarios)         - Mi Perfil Académico                         |
|   - Directorio de Investigadores                   - Gestión y Carga de Publicaciones            |
|   - Repositorio y Fichas con Citas APA             - Revisión Editorial por Pares                |
|   - Eventos, Noticias, Multimedia HTML5            - Gestión de Investigadores y Miembros        |
|   - Solicitud de Incorporación y Seguimiento       - Evaluación Colegiada de Incorporaciones     |
|   - Asistente Académico IA (Chat RAG)              - Administración de Usuarios, Roles, Auditoría|
+--------------------------------------------------------------------------------------------------+
                                        │  HTTP / REST (JSON) + JWT Bearer
                                        ▼
+--------------------------------------------------------------------------------------------------+
|                          BACKEND API REST (Django 5.1 / DRF 3.15)                                |
|                                                                                                  |
|   [ Endpoints Públicos ]                           [ Endpoints Protegidos (RBAC) ]               |
|   - /api/v1/auth/login, register, confirm-email    - /api/v1/users/, /api/v1/roles/, /audit/     |
|   - /api/v1/repository/, /academic/public/*        - /api/v1/publications/, /review-queue/       |
|   - /api/v1/events/public/, /news/public/          - /api/v1/incorporacion/solicitudes/revision/ |
|   - /api/v1/multimedia/public/, /convenios/public/ - /api/v1/incorporacion/solicitudes/:id/eval/ |
|   - /api/v1/incorporacion/solicitudes/ (postular)  - /api/v1/incorporacion/solicitudes/:id/deci/ |
|   - /api/v1/ai/consultar/, /conversaciones/        - /api/v1/academic/profile/me/, /members/     |
|                                                                                                  |
|   [ Servicios de Soporte ]                                                                       |
|   - storage_service.py: Abstracción MinIO / S3 con fallback a sistema de archivos local         |
|   - rag_engine.py: Recuperación semántica de fragmentos por similitud coseno de embeddings       |
|   - embedding_service.py: Generación vectorial (Ollama / Gemini / Fallback determinista)        |
|   - llm_service.py: Generación de respuestas (Groq / Ollama / Gemini / Fallback estructurado)    |
|   - pdf_extractor.py: Extracción por páginas y chunking solapado mediante PyMuPDF (fitz)        |
|   - email_service.py: Notificaciones transaccionales vía Google SMTP                             |
+--------------------------------------------------------------------------------------------------+
                         │                                    │                      │
                         ▼                                    ▼                      ▼
+------------------------------------+   +---------------------------+   +-------------------------+
|     PostgreSQL 16 + pgvector       |   | Almacenamiento MinIO (S3) |   |    Servicios de IA      |
|                                    |   |                           |   |                         |
| - 36 tablas oficiales DDL          |   | - Bucket 'aboccrim-media' |   | - Ollama (Llama 3.2 3B, |
| - Tablas RAG (conversacion_ia,     |   | - Documentos PDF de tesis |   |   nomic-embed-text)     |
|   mensaje_ia, fuente_mensaje_ia,   |   |   y artículos             |   | - Google Gemini 1.5     |
|   documento_indexado, fragmento)   |   | - Portadas y afiches      |   |   Flash / Embeddings    |
| - Persistencia: volumen docker     |   | - Recursos multimedia     |   | - Groq Llama 3.3 70B    |
+------------------------------------+   +---------------------------+   +-------------------------+
```

### 2. Contraste: Tecnologías documentadas vs. Tecnologías realmente presentes

| Tecnología Documentada | ¿Está en el código? | Modo de implementación real | Archivos de respaldo |
| :--- | :---: | :--- | :--- |
| **React** | ✅ Presente | Versión 18.3.1 (SPA con hooks, estados locales y contexto global). | `frontend-portal/package.json` |
| **JavaScript** | ✅ Presente | ESModules nativos, JSX, sin TypeScript en frontend. | `frontend-portal/src/App.jsx` |
| **Vite** | ✅ Presente | Vite 6.0.7 configurado como bundler de desarrollo y compilador de producción. | `frontend-portal/vite.config.js` |
| **React Router** | ✅ Presente | `react-router-dom` v6.28.0 (rutas anidadas, `Outlet`, `Navigate`, `ProtectedRoute`). | `frontend-portal/src/App.jsx` |
| **Tailwind CSS** | ✅ Presente | Tailwind CSS 3.4.17 con diseño tokenizado (`surface`, `primary`, `on-surface`). | `frontend-portal/tailwind.config.js` |
| **Python** | ✅ Presente | Python 3.12 en contenedor Docker (`python:3.12-slim`). | `backend-portal/Dockerfile` |
| **Django & DRF** | ✅ Presente | Django 5.1.x y Django REST Framework 3.15.x. | `backend-portal/requirements.txt` |
| **PostgreSQL** | ✅ Presente | PostgreSQL 16 Alpine orquestado en Docker Compose con 36 tablas SQL. | `docker-compose.yml` |
| **pgvector** | ⚠️ Parcial | La imagen Docker es `pgvector/pgvector:pg16` y la extensión se crea en la migración `0001_initial.py`. Sin embargo, `FragmentoDocumento.embedding` utiliza `models.JSONField` y la similitud coseno se calcula en memoria con Python, no con operadores de índice vectorial SQL (`<=>`). | `backend-portal/apps/ai_assistant/migrations/0001_initial.py`, `backend-portal/apps/ai_assistant/services/rag_engine.py` |
| **MinIO** | ✅ Presente | Servicio Docker `cgr.dev/chainguard/minio` en puertos 9000/9001. Servicio desacoplado `MinioStorageService` mediante `boto3`. | `docker-compose.yml`, `backend-portal/apps/common/storage_service.py` |
| **Ollama, Llama 3.2, nomic-embed** | ✅ Presente | Contenedor `ollama/ollama:latest` en Compose. Clientes REST en `llm_service.py` (`llama3.2:3b`) y `embedding_service.py` (`nomic-embed-text`). | `docker-compose.yml`, `backend-portal/config/settings.py` |
| **Arquitectura RAG** | ✅ Presente | Pipeline completo: PDF -> PyMuPDF -> Chunks de 600 caracteres -> Vectorización 768d -> Almacenamiento -> Similitud coseno -> Contexto prompt -> LLM -> Citas numéricas `[1]` y fuentes. | `backend-portal/apps/ai_assistant/services/rag_engine.py`, `backend-portal/apps/ai_assistant/services/indexer.py` |
| **Docker & Docker Compose** | ✅ Presente | Archivo `docker-compose.yml` multi-servicio con dependencias de arranque y healthchecks. | `docker-compose.yml` |
| **Nginx** | ❌ Ausente | **No existe ningún archivo de configuración Nginx (`nginx.conf`) ni contenedor Nginx en el workspace.** El frontend expone Vite en el puerto 5173 y el backend expone Gunicorn/runserver en el puerto 8000 directamente. | Raíz del proyecto y subdirectorios |
| **React Native y Expo** | ❌ Ausente | **No existe código de React Native ni proyecto Expo en el repositorio.** Las funcionalidades móviles (CU30, CU31, CU32) son requerimientos documentados en Enterprise Architect (`ppp.eapx`), pero no tienen implementación física en este workspace. | Búsqueda exhaustiva en workspace |
| **Autenticación JWT** | ✅ Presente | Simple JWT (`rest_framework_simplejwt`) con access token (4 horas), refresh token (7 días) y cabecera `Bearer`. | `backend-portal/config/settings.py` |

---

## C. ESTADO DEL FRONTEND

### 1. Estructura de carpetas y archivos

```text
frontend-portal/
├── public/
│   ├── aboccrim-banner.webp      # Banner panorámico oficial del portal
│   └── ABOCCRIM.webp             # Isologo oficial de la Academia
├── src/
│   ├── assets/
│   │   └── ABOCCRIM.webp
│   ├── components/
│   │   ├── common/
│   │   │   └── ProtectedRoute.jsx       # Guardia de rutas autenticadas y verificación RBAC
│   │   ├── layout/
│   │   │   ├── Header.jsx               # Barra de navegación superior con menús desplegables
│   │   │   ├── Footer.jsx               # Pie de página institucional y enlaces
│   │   │   └── DashboardLayout.jsx      # Maquetación privada con barra lateral retráctil
│   │   └── public/
│   │       └── CitationModal.jsx        # Generador interactivo de citas (APA 7, BibTeX, Chicago, MLA)
│   ├── contexts/
│   │   └── AuthContext.jsx              # Contexto de autenticación, sesión y comprobación de roles
│   ├── pages/
│   │   ├── academic/                    # Páginas académicas y operativas de membresía/asistente
│   │   │   ├── AcademicProfilePage.jsx
│   │   │   ├── AdminInvestigadoresPage.jsx
│   │   │   ├── AdminMiembrosPage.jsx
│   │   │   ├── AsistenteAcademicoPage.jsx
│   │   │   ├── EvaluarSolicitudesPage.jsx
│   │   │   └── MiSolicitudMembresiaPage.jsx
│   │   ├── admin/                       # Consola de administración general del sistema
│   │   │   ├── AdminAuditoriaPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AdminRolesPage.jsx
│   │   │   └── AdminUsuariosPage.jsx
│   │   ├── auth/                        # Páginas de acceso y confirmación
│   │   │   ├── AccesoMiembrosPage.jsx
│   │   │   └── ConfirmarCuentaPage.jsx
│   │   ├── institutional/               # Páginas administrativas de contenidos institucionales
│   │   │   ├── AdminConveniosPage.jsx
│   │   │   ├── AdminEventosPage.jsx
│   │   │   ├── AdminMultimediaPage.jsx
│   │   │   └── AdminNoticiasPage.jsx
│   │   ├── public/                      # Páginas públicas accesibles a cualquier visitante
│   │   │   ├── ConveniosPage.jsx
│   │   │   ├── EventosPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── InstitucionalPage.jsx
│   │   │   ├── InvestigadorDetailPage.jsx
│   │   │   ├── InvestigadoresPage.jsx
│   │   │   ├── MultimediaPage.jsx
│   │   │   ├── NoticiasPage.jsx
│   │   │   ├── PublicacionDetailPage.jsx
│   │   │   ├── RepositorioAcademicoPage.jsx
│   │   │   └── SolicitudIncorporacionPage.jsx
│   │   └── publications/                # Páginas de producción científica
│   │       ├── AdminPublicacionesPage.jsx
│   │       └── RevisionPublicacionesPage.jsx
│   ├── services/
│   │   └── api.js                       # Cliente HTTP unificado con interceptores JWT
│   ├── App.jsx                          # Matriz de rutas (públicas y privadas)
│   ├── index.css                        # Tokens CSS de Tailwind, tipografía e iconografía
│   └── main.jsx                         # Entrada de renderizado React 18
├── Dockerfile
├── package.json
├── tailwind.config.js
└── vite.config.js
```

### 2. Componentes reutilizables identificados
- `Header.jsx`: Control de navegación responsiva, acordeón en móviles, menús desplegables (`Institucional`, `Investigación`, `Actualidad`, `Convocatorias`), botón destacado de acceso a Biblioteca, indicador de usuario activo y botón de cierre de sesión.
- `Footer.jsx`: Ficha institucional, columnas de áreas temáticas, enlaces institucionales y derechos reservados.
- `DashboardLayout.jsx`: Barra lateral con avatar del usuario, indicador de roles activos, menú modular sensible a permisos y botón de salida segura.
- `ProtectedRoute.jsx`: Interceptor de rutas cliente que evalúa token activo, `requiredRole` y `requiredPermission`.
- `CitationModal.jsx`: Modal reutilizable para copiar o descargar referencias bibliográficas en APA 7, BibTeX, Chicago y MLA.

### 3. Matriz de rutas y navegación del Frontend

| Ruta URL | Componente | Acceso / Protección | Finalidad funcional |
| :--- | :--- | :---: | :--- |
| `/` | `HomePage.jsx` | Público | Portada institucional con banner oficial, últimas publicaciones, evento destacado, video HTML5 y pilares estatutarios. |
| `/institucional` | `InstitucionalPage.jsx` | Público | Portal corporativo con pestañas: ¿Quiénes somos?, Historia, Principios rectores, Autoridades, Ejes de investigación y Normativa. |
| `/investigadores` | `InvestigadoresPage.jsx` | Público | Directorio público de investigadores con búsqueda textual y filtro por área temática. |
| `/investigadores/:id` | `InvestigadorDetailPage.jsx` | Público | Ficha completa del investigador, biografía, filiación, ORCID y lista de publicaciones. |
| `/repositorio` | `RepositorioAcademicoPage.jsx` | Público | Catálogo público con filtros combinados (tipo, categoría, investigador, año) y búsqueda textual. |
| `/repositorio/:id` | `PublicacionDetailPage.jsx` | Público / Parcial | Detalle bibliográfico de la investigación, resumen, autores, citas APA y descarga protegida de PDFs. |
| `/asistente-academico` | `AsistenteAcademicoPage.jsx` | Autenticado | Interfaz de chat RAG con barra lateral de conversaciones, fuentes consultadas y visor PDF. |
| `/eventos` | `EventosPage.jsx` | Público | Cartelera de eventos institucionales y congresos programados con afiches. |
| `/noticias` | `NoticiasPage.jsx` | Público | Portal de noticias institucionales con buscador y artículos oficiales. |
| `/multimedia` | `MultimediaPage.jsx` | Público | Galería audiovisual con reproductor integrado HTML5 para videos MP4/WebM y audios. |
| `/convenios` | `ConveniosPage.jsx` | Público | Catálogo de convenios interinstitucionales vigentes y descarga de documentos oficiales. |
| `/solicitud-incorporacion`| `SolicitudIncorporacionPage.jsx` | Público | Postulación externa para nuevos miembros con carga de CV, respaldos PDF y consulta por token. |
| `/acceso-miembros` | `AccesoMiembrosPage.jsx` | Público | Formularios unificados de Login (CU02) y Registro de cuenta (CU01), con botones demo rápidos. |
| `/confirmar-cuenta` | `ConfirmarCuentaPage.jsx` | Público | Activación criptográfica de cuentas vía token de correo electrónico. |
| `/dashboard` | `AdminDashboardPage.jsx` | Protegido | Hub de operaciones con tarjetas de acceso rápido según rol y tarjeta de estado de postulación. |
| `/dashboard/solicitud-membresia` | `MiSolicitudMembresiaPage.jsx`| Protegido | Seguimiento del postulante a miembro, subsanación de observaciones y visualización de credencial. |
| `/dashboard/perfil-academico` | `AcademicProfilePage.jsx` | Protegido | Edición de grado académico, biografía, ORCID, áreas temáticas y solicitud de inclusión a directorio. |
| `/dashboard/publicaciones` | `AdminPublicacionesPage.jsx` | Protegido | CRUD de publicaciones, vinculación de autores, categorías temáticas y gestión de PDFs. |
| `/dashboard/revisiones` | `RevisionPublicacionesPage.jsx`| Protegido | Cola de arbitraje editorial para Comité Académico y Administrador Académico. |
| `/dashboard/eventos` | `AdminEventosPage.jsx` | Protegido | Administración de eventos, fechas, enlaces y afiches publicitarios. |
| `/dashboard/noticias` | `AdminNoticiasPage.jsx` | Protegido | Redacción de noticias con editor Markdown, portadas y estados de publicación. |
| `/dashboard/multimedia` | `AdminMultimediaPage.jsx` | Protegido | Carga, categorización y eliminación física de recursos audiovisuales (hasta 50 MB). |
| `/dashboard/convenios` | `AdminConveniosPage.jsx` | Protegido | Registro de convenios institucionales, contrapartes y subida de convenios en PDF. |
| `/dashboard/solicitudes-incorporacion` | `EvaluarSolicitudesPage.jsx` | Protegido | Revisión colegiada de expedientes, descarga de CVs y registro de decisión formal (CU24). |
| `/dashboard/investigadores` | `AdminInvestigadoresPage.jsx` | Protegido | Validación y publicación de perfiles en el directorio público de investigadores. |
| `/dashboard/miembros` | `AdminMiembrosPage.jsx` | Protegido | Padrón general de miembros colegiados y gestión de categorías estatutarias. |
| `/dashboard/usuarios` | `AdminUsuariosPage.jsx` | Protegido | Administración técnica de cuentas, activación/desactivación y asignación de roles. |
| `/dashboard/roles` | `AdminRolesPage.jsx` | Protegido | Matriz de permisos RBAC y consulta de roles del sistema. |
| `/dashboard/auditoria` | `AdminAuditoriaPage.jsx` | Protegido | Bitácora inmutable de eventos con filtros por usuario, acción y rango temporal. |

### 4. Elementos con datos reales vs. Elementos simulados o estáticos

- **Conectados a la API con datos reales:**
  - El 100% de los formularios de autenticación, usuarios, roles, auditoría, publicaciones, cola editorial, investigadores, miembros, eventos, noticias, multimedia, convenios, postulaciones de incorporación y el asistente IA operan con peticiones `fetch` contra el backend.
  - El buscador del repositorio realiza consultas directas con parámetros `search`, `tipo_id`, `categoria_id`, etc.
  - La descarga de PDFs valida permisos y transmite streams binarios desde MinIO o disco.
- **Elementos estáticos o datos fijos identificados en el frontend:**
  1. *Textos institucionales estatutarios:* Los textos de Misión, Visión, Principios rectores (8 principios) e Historia en `InstitucionalPage.jsx` están definidos como constantes en el archivo JSX (`PRINCIPIOS_DATA`, `SECTIONS`). No se cargan desde una base de datos CMS, lo cual es habitual en portales institucionales de alcance fijo.
  2. *Pilares Estatutarios:* Los 3 pilares al pie de `HomePage.jsx` ("Ciencias Penales y Forenses", "Comunidad Colegiada", "Política Criminal") son componentes estáticos de maquetación.
  3. *Preguntas sugeridas en Asistente IA:* La constante `SUGGESTED_QUERIES` en `AsistenteAcademicoPage.jsx` provee 4 preguntas de ejemplo para orientar al investigador antes de abrir un hilo de conversación.
  4. *Convocatorias no habilitadas:* En `Header.jsx`, las opciones "Convocatorias vigentes" y "Premios y reconocimientos" figuran con la propiedad `available: false` (deshabilitadas visualmente).

---

## D. ESTADO DEL BACKEND

### 1. Estructura de Aplicaciones Django

El backend se organiza en 12 aplicaciones dentro del directorio `backend-portal/apps/`:

```text
backend-portal/
├── apps/
│   ├── academics/       # Perfil académico, directorio de investigadores, miembros colegiados y categorías
│   ├── accounts/        # Modelo Usuario personalizado, autenticación JWT, registro, confirmación y usuarios
│   ├── agreements/      # Convenios institucionales e instituciones contraparte
│   ├── ai_assistant/    # Motor RAG, extracción de texto PDF, embeddings, LLM y sesiones de diálogo
│   ├── audit/           # Bitácora inmutable de auditoría (registro_auditoria)
│   ├── common/          # Servicios compartidos: storage_service (MinIO), email_service y comandos seed
│   ├── events/          # Eventos académicos, conferencias y talleres
│   ├── incorporation/   # Procedimiento de admisión: solicitudes, documentos, evaluaciones y resoluciones
│   ├── multimedia/      # Recursos audiovisuales (videos, audios, fotos) y descargas protegidas
│   ├── news/            # Noticias institucionales oficiales y publicaciones informativas
│   ├── publications/    # Producción científica, documentos digitales, revisión por pares y repositorio
│   └── roles/           # Modelo RBAC: Rol, Permiso, RolPermiso, UsuarioRol
├── config/              # Configuración global (settings.py, urls.py, wsgi.py)
├── Dockerfile           # Imagen Docker base Python 3.12-slim
├── entrypoint.sh        # Script de inicialización: migraciones fake-initial, seed y sincronización
├── manage.py
└── requirements.txt
```

### 2. Inventario de Modelos, Endpoints y Servicios

```
====================================================================================================
APLICACIÓN        MODELOS PRINCIPALES                ENDPOINTS CLAVE                      ESTADO REAL
====================================================================================================
accounts          Usuario,                           POST /api/v1/auth/register/          Operativo 100%
                  EmailConfirmationToken             POST /api/v1/auth/login/
                                                     POST /api/v1/auth/logout/
                                                     GET  /api/v1/auth/me/
                                                     POST /api/v1/auth/confirm-email/
                                                     GET  /api/v1/users/
                                                     POST /api/v1/users/:id/assign_roles/
----------------------------------------------------------------------------------------------------
roles             Rol, Permiso,                      GET  /api/v1/roles/                  Operativo 100%
                  RolPermiso, UsuarioRol             GET  /api/v1/permissions/
                                                     POST /api/v1/roles/:id/permissions/
----------------------------------------------------------------------------------------------------
audit             RegistroAuditoria                  GET  /api/v1/audit/                  Operativo 100%
----------------------------------------------------------------------------------------------------
academics         PerfilAcademico, Investigador,     GET  /api/v1/academic/profile/me/    Operativo 100%
                  Miembro, CategoriaMiembro,         GET  /api/v1/academic/public/investigators/
                  AreaTematica                       GET  /api/v1/academic/investigators/
                                                     GET  /api/v1/academic/members/
                                                     GET  /api/v1/academic/member-categories/
----------------------------------------------------------------------------------------------------
publications      Publicacion, Autor,                GET  /api/v1/repository/             Operativo 100%
                  PublicacionAutor, Categoria,       GET  /api/v1/repository/:id/
                  PalabraClave, DocumentoDigital,    POST /api/v1/publications/
                  RevisionPublicacion,               GET  /api/v1/publications/review-queue/
                  TipoPublicacion, TipoDocumento,    POST /api/v1/publications/:id/review/
                  DescargaDocumento,                 POST /api/v1/publications/:id/documents/
                  VisualizacionContenido             GET  /api/v1/publications/documents/:id/download/
----------------------------------------------------------------------------------------------------
events            Evento                             GET  /api/v1/events/public/          Operativo 100%
                                                     GET/POST /api/v1/events/
----------------------------------------------------------------------------------------------------
news              Noticia                            GET  /api/v1/news/public/            Operativo 100%
                                                     GET/POST /api/v1/news/
----------------------------------------------------------------------------------------------------
multimedia        RecursoMultimedia                  GET  /api/v1/multimedia/public/      Operativo 100%
                                                     GET/POST /api/v1/multimedia/
                                                     GET  /api/v1/multimedia/:id/download/
----------------------------------------------------------------------------------------------------
agreements        Convenio, Institucion              GET  /api/v1/convenios/public/       Operativo 100%
                                                     GET/POST /api/v1/convenios/
                                                     GET  /api/v1/convenios/:id/documento/
                                                     GET/POST /api/v1/instituciones/
----------------------------------------------------------------------------------------------------
incorporation     SolicitudIncorporacion,            POST /api/v1/incorporacion/solicitudes/  Operativo 100%
                  DocumentoSolicitud,                POST /api/v1/incorporacion/solicitudes/seguimiento/
                  EvaluacionSolicitud,               GET  /api/v1/incorporacion/solicitudes/revision/
                  DecisionIncorporacion              POST /api/v1/incorporacion/solicitudes/:id/evaluaciones/
                                                     POST /api/v1/incorporacion/solicitudes/:id/decision/
                                                     GET/POST /api/v1/incorporacion/mi-solicitud/
----------------------------------------------------------------------------------------------------
ai_assistant      ConversacionIA, MensajeIA,         GET/POST /api/v1/ai/conversaciones/  Operativo 100%
                  FuenteMensajeIA,                   POST /api/v1/ai/consultar/
                  DocumentoIndexado,                 POST /api/v1/ai/mensajes/:id/feedback/
                  FragmentoDocumento                 GET  /api/v1/ai/indexacion/estado/
====================================================================================================
```

### 3. Procesamiento Documental y Servicios de IA

- **Extracción de texto PDF:** El módulo `backend-portal/apps/ai_assistant/services/pdf_extractor.py` procesa documentos directamente desde memoria o disco con PyMuPDF (`fitz`), limpiando saltos de línea y fragmentando el contenido en segmentos de 600 caracteres con 100 caracteres de solapamiento.
- **Indexación documental:** El servicio `backend-portal/apps/ai_assistant/services/indexer.py` y el comando `python manage.py indexar_publicaciones` recorren las publicaciones aprobadas, obtienen los PDFs desde MinIO mediante `storage_service`, extraen los textos, generan los vectores y los guardan en `fragmento_documento`.
- **Motor RAG:** El servicio `backend-portal/apps/ai_assistant/services/rag_engine.py` valida los permisos del usuario (público, miembros, restringido), calcula la similitud coseno entre el embedding de la pregunta y los fragmentos candidatos autorizados, selecciona los 2 más relevantes, arma el prompt con directivas anti-alucinación y solicita la respuesta al LLM, guardando la trazabilidad en `fuente_mensaje_ia`.
- **Integración con MinIO:** `backend-portal/apps/common/storage_service.py` utiliza `boto3` para interactuar con la API S3 de MinIO. Maneja la creación automática del bucket `aboccrim-media`, generación de URLs firmadas, subida en chunks y fallback transparente al sistema de archivos local si el contenedor MinIO estuviese detenido.

---

## E. ACTORES, ROLES Y PERMISOS

En la especificación oficial y en el código del sistema se distinguen los siguientes **7 actores funcionales** (más un rol técnico de usuario básico):

```
+-------------------------------------------------------------------------------------------------------+
| ACTOR OFICIAL              ROL TÉCNICO       ALCANCE Y PERMISOS EN CÓDIGO                             |
+-------------------------------------------------------------------------------------------------------+
| Visitante                  (Sin sesión)      Acceso libre a Inicio, Acerca de ABOCCRIM, Noticias,    |
|                                              Eventos, Multimedia pública, Convenios, Directorio de    |
|                                              Investigadores y Catálogo de Publicaciones. Puede enviar |
|                                              solicitud de incorporación (CU22) y registrar cuenta.   |
|-------------------------------------------------------------------------------------------------------|
| Usuario Registrado         usuario           Cuenta técnica confirmada por email. Acceso al Dashboard |
| (Actor complementario)                       básico, edición de su Perfil Académico (CU06), postulación|
|                                              a membresía (CU22) y consulta del Asistente Académico IA.|
|-------------------------------------------------------------------------------------------------------|
| Investigador               investigador      Perfil científico activo en el directorio. Registro y    |
|                                              administración de publicaciones propias (CU10, CU14),    |
|                                              descarga autorizada de documentos y uso del Asistente IA.|
|-------------------------------------------------------------------------------------------------------|
| Miembro ABOCCRIM           miembro           Miembro colegiado incorporado. Acceso a documentos con   |
|                                              nivel 'miembros', consulta de su acreditación estatutaria|
|                                              y uso pleno del Asistente IA.                            |
|-------------------------------------------------------------------------------------------------------|
| Comité Académico           comite_academico  Arbitraje editorial de investigaciones en cola (CU11) y |
|                                              evaluación técnica de expedientes de admisión (CU23).    |
|-------------------------------------------------------------------------------------------------------|
| Comité de Ética            comite_etica      Supervisión deontológica y consulta de auditoría/exped.  |
|-------------------------------------------------------------------------------------------------------|
| Administrador Académico    admin_academico   Gestión integral de investigadores, miembros, convenios, |
|                                              eventos, noticias y catálogos de clasificación.          |
|-------------------------------------------------------------------------------------------------------|
| Administrador del Sistema  superadmin        Control técnico total: administración de usuarios (CU04),|
|                                              matriz de roles/permisos (CU05), bitácora inmutable de   |
|                                              auditoría (CU27) y decisión final de admisión (CU24).    |
+-------------------------------------------------------------------------------------------------------+
```

### Distinción crítica: Registro de cuenta (CU01) vs. Incorporación institucional (CU22–CU24)
El código respeta estrictamente la diferencia señalada en la especificación:
1. **CU01 (Registrar cuenta):** En `backend-portal/apps/accounts/views.py` (`RegisterView`), cualquier persona se registra con sus datos y contraseña. El backend asigna automáticamente y de forma exclusiva el rol `usuario`. Se ignora cualquier intento de autoasignarse privilegios institucionales.
2. **CU22–CU24 (Incorporación de miembro):** Es un proceso colegiado independiente. El postulante (público o autenticado) envía su postulación con CV y constancias en PDF (`SolicitudIncorporacionCreateView`). El Comité Académico evalúa sus méritos emitiendo un dictamen colegiado (CU23). Finalmente, el Consejo / Administrador emite la resolución formal mediante `SolicitudIncorporacionDecisionView` (CU24), la cual, si es aprobatoria, **crea el registro formal en la tabla `miembro`, le asigna su categoría estatutaria (`categoria_id`) y le otorga el rol institucional `miembro` en `usuario_rol`**.

---

## F. ESTADO DE LOS 32 CASOS DE USO

La siguiente tabla refleja la trazabilidad exacta extraída del modelo de Enterprise Architect (`ppp.eapx`) contrastada contra los componentes de React, vistas de Django y esquemas de base de datos presentes en el código:

| Código | Nombre Oficial | Paquete Arquitectónico | Ciclo | Componentes Frontend / Endpoints Backend | Estado Real | Evidencia en el Código |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **CU01** | Registrar cuenta | Usuarios y Seguridad | Ciclo 1 | `AccesoMiembrosPage.jsx`<br>`POST /api/v1/auth/register/` | **Implementado** | `RegisterView`, tabla `usuario`. |
| **CU02** | Iniciar sesión | Usuarios y Seguridad | Ciclo 1 | `AccesoMiembrosPage.jsx`<br>`POST /api/v1/auth/login/` | **Implementado** | `LoginView`, tabla `usuario_rol`. |
| **CU03** | Cerrar sesión | Usuarios y Seguridad | Ciclo 1 | `Header.jsx`, `DashboardLayout.jsx`<br>`POST /api/v1/auth/logout/` | **Implementado** | `LogoutView`, `registro_auditoria`. |
| **CU04** | Administrar usuarios | Usuarios y Seguridad | Ciclo 1 | `AdminUsuariosPage.jsx`<br>`GET/POST /api/v1/users/` | **Implementado** | `UsuarioListCreateView`, protección superadmin. |
| **CU05** | Administrar roles y permisos | Usuarios y Seguridad | Ciclo 1 | `AdminRolesPage.jsx`<br>`GET/POST /api/v1/roles/` | **Implementado** | `RolListCreateView`, tabla `rol_permiso`. |
| **CU06** | Gestionar perfil académico | Gestión del Conocimiento | Ciclo 1 | `AcademicProfilePage.jsx`<br>`GET/PUT /api/v1/academic/profile/me/` | **Implementado** | `MiPerfilAcademicoView`, `perfil_academico`. |
| **CU07** | Administrar investigadores | Gestión del Conocimiento | Ciclo 1 | `AdminInvestigadoresPage.jsx`<br>`GET/POST /api/v1/academic/investigators/`| **Implementado** | `InvestigadorListCreateView`, `investigador`. |
| **CU08** | Consultar investigadores | Consulta y Difusión | Ciclo 1 | `InvestigadoresPage.jsx`, `InvestigadorDetailPage.jsx`<br>`GET /api/v1/academic/public/investigators/` | **Implementado** | `InvestigadoresPublicosView`. |
| **CU09** | Administrar miembros ABOCCRIM | Gestión del Conocimiento | Ciclo 1 | `AdminMiembrosPage.jsx`<br>`GET/POST /api/v1/academic/members/` | **Implementado** | `MiembroListCreateView`, tabla `miembro`. |
| **CU10** | Registrar publicación científica | Gestión del Conocimiento | Ciclo 2 | `AdminPublicacionesPage.jsx`<br>`GET/POST /api/v1/publications/` | **Implementado** | `PublicacionListCreateView`, `publicacion`. |
| **CU11** | Revisar publicación académica | Gestión del Conocimiento | Ciclo 2 | `RevisionPublicacionesPage.jsx`<br>`POST /api/v1/publications/:id/review/` | **Implementado** | `RevisionPublicacionActionView`. |
| **CU12** | Consultar repositorio académico | Consulta y Difusión | Ciclo 2 | `RepositorioAcademicoPage.jsx`, `PublicacionDetailPage.jsx`<br>`GET /api/v1/repository/` | **Implementado** | `RepositorioListView`, citas APA. |
| **CU13** | Descargar documento autorizado | Consulta y Difusión | Ciclo 2 | `PublicacionDetailPage.jsx`<br>`GET /publications/documents/:id/download/` | **Implementado** | `DocumentoDigitalDownloadView`. |
| **CU14** | Administrar documentos digitales | Gestión del Conocimiento | Ciclo 2 | `AdminPublicacionesPage.jsx`<br>`POST /publications/:id/documents/` | **Implementado** | `DocumentoDigitalListCreateView`, MinIO. |
| **CU15** | Clasificar contenido académico | Búsqueda Semántica | Ciclo 2 | `AdminPublicacionesPage.jsx`<br>`GET /publications/categories/` | **Implementado** | `CategoriaListCreateView`, catálogos. |
| **CU16** | Buscar información con filtros | Búsqueda Semántica | Ciclo 2 | `RepositorioAcademicoPage.jsx`<br>`GET /repository/?search=...&tipo_id=...`| **Implementado** | `RepositorioListView`, filtros combinados. |
| **CU17** | Buscar mediante búsqueda semántica | Búsqueda Semántica | Ciclo 2 | `AsistenteAcademicoPage.jsx` (integrado en RAG)<br>Sin endpoint de repositorio puro | **Parcial** | Similitud coseno operativa en `rag_engine.py`, pero falta endpoint puro en `/repository/`. |
| **CU18** | Administrar eventos académicos | Administración y Reportes | Ciclo 3 | `AdminEventosPage.jsx`, `EventosPage.jsx`<br>`GET/POST /api/v1/events/` | **Implementado** | `EventoAdminListCreateView`, afiches multimedia. |
| **CU19** | Administrar noticias institucionales | Administración y Reportes | Ciclo 3 | `AdminNoticiasPage.jsx`, `NoticiasPage.jsx`<br>`GET/POST /api/v1/news/` | **Implementado** | `NoticiaAdminListCreateView`, Markdown. |
| **CU20** | Administrar contenido multimedia | Administración y Reportes | Ciclo 3 | `AdminMultimediaPage.jsx`, `MultimediaPage.jsx`<br>`GET/POST /api/v1/multimedia/` | **Implementado** | `RecursoMultimediaAdminListCreateView`, reproductor HTML5. |
| **CU21** | Administrar convenios institucionales | Administración y Reportes | Ciclo 3 | `AdminConveniosPage.jsx`, `ConveniosPage.jsx`<br>`GET/POST /api/v1/convenios/` | **Implementado** | `ConvenioAdminListCreateView`, PDFs de convenios. |
| **CU22** | Enviar solicitud de incorporación | Administración y Reportes | Ciclo 1 | `SolicitudIncorporacionPage.jsx`, `MiSolicitudMembresiaPage.jsx`<br>`POST /incorporacion/solicitudes/` | **Implementado** | `SolicitudIncorporacionCreateView`, código y token. |
| **CU23** | Evaluar solicitud de incorporación | Administración y Reportes | Ciclo 1 | `EvaluarSolicitudesPage.jsx`<br>`POST /incorporacion/solicitudes/:id/evaluaciones/` | **Implementado** | `SolicitudIncorporacionEvaluateView`, dictámenes. |
| **CU24** | Registrar decisión de incorporación | Administración y Reportes | Ciclo 1 | Modal en `EvaluarSolicitudesPage.jsx`<br>`POST /incorporacion/solicitudes/:id/decision/` | **Implementado** | `SolicitudIncorporacionDecisionView`, alta de miembro. |
| **CU25** | Generar reportes académicos | Administración y Reportes | Ciclo 3 | Sin interfaz ni servicio de reportes en backend | **Planificado** | Tabla `ejecucion_reporte` existe en SQL, pero no hay modelo Django ni vistas. |
| **CU26** | Consultar dashboard institucional | Administración y Reportes | Ciclo 3 | `AdminDashboardPage.jsx`<br>`GET /dashboard` | **Parcial** | Hub de navegación y estado de membresía funcional; faltan métricas y gráficos estadísticos. |
| **CU27** | Consultar bitácora de auditoría | Usuarios y Seguridad | Ciclo 1 | `AdminAuditoriaPage.jsx`<br>`GET /api/v1/audit/` | **Implementado** | `RegistroAuditoriaListView`, filtros por fecha/evento. |
| **CU28** | Consultar asistente académico inteligente | Búsqueda Semántica | Ciclo 2 | `AsistenteAcademicoPage.jsx`<br>`POST /api/v1/ai/consultar/` | **Implementado** | `EnviarConsultaIAView`, RAG, citas y visor PDF. |
| **CU29** | Gestionar evaluación curricular asistida | Búsqueda Semántica | Ciclo 2 | Sin componentes frontend ni backend | **Planificado** | Documentado en Enterprise Architect `ppp.eapx`. |
| **CU30** | Gestionar inscripciones desde Android | Consulta y Difusión | Ciclo 3 | Sin app móvil en el repositorio | **Planificado** | Documentado en Enterprise Architect `ppp.eapx`. |
| **CU31** | Gestionar notificaciones móviles | Consulta y Difusión | Ciclo 3 | Sin servicio push en backend ni app móvil | **Planificado** | Documentado en Enterprise Architect `ppp.eapx`. |
| **CU32** | Consultar ubicación y navegar a eventos | Consulta y Difusión | Ciclo 3 | Sin app móvil en el repositorio | **Planificado** | Documentado en Enterprise Architect `ppp.eapx`. |

---

## G. ESTADO DEL SITIO WEB INSTITUCIONAL (ANÁLISIS ESPECIAL CAPÍTULO 7)

Este análisis resuelve directamente las inquietudes sobre el alcance del capítulo 7 solicitado por el docente/ingeniero:

### 1. ¿Las secciones del capítulo 7 ya están implementadas en el frontend actual?
**Sí, el 90% de las secciones ya están plenamente implementadas.**
- **7.4.1 Página de inicio:** Implementada en `frontend-portal/src/pages/public/HomePage.jsx` (ruta `/`). Contiene el banner fotográfico oficial (`/aboccrim-banner.webp`), bienvenida formal, botones de acceso directo a Miembros y Biblioteca, visualización en tiempo real de las 2 últimas publicaciones científicas aprobadas, tarjeta interactiva del último evento académico con afiche, reproductor embebido HTML5 del último contenido audiovisual y los 3 pilares estatutarios.
- **7.4.2 Acerca de ABOCCRIM:** Implementada en `frontend-portal/src/pages/public/InstitucionalPage.jsx` (ruta `/institucional`). Dispone de una barra de pestañas que expone:
  1. *¿Quiénes somos?* (Identidad, misión, visión, personería jurídica R.A. N.º 232/2023).
  2. *Historia* (Antecedentes de fundación).
  3. *Principios rectores* (8 principios éticos y deontológicos).
  4. *Órganos y Categorías* (Estructura orgánica y tipos de miembros colegiados).
  5. *Ejes de investigación* (Líneas de trabajo técnico).
  6. *Normativa y admisión* (Estatuto y bases de incorporación).
- **7.4.3 Investigadores y miembros:**
  - *Investigadores:* Implementada en `frontend-portal/src/pages/public/InvestigadoresPage.jsx` (`/investigadores`) y `frontend-portal/src/pages/public/InvestigadorDetailPage.jsx` (`/investigadores/:id`).
  - *Miembros:* Las categorías y requisitos están descritos públicamente en `InstitucionalPage.jsx`. El padrón nominal detallado se gestiona en la consola privada `frontend-portal/src/pages/academic/AdminMiembrosPage.jsx`.
- **7.4.4 Publicaciones y repositorio:** Implementada en `frontend-portal/src/pages/public/RepositorioAcademicoPage.jsx` (`/repositorio`) y `frontend-portal/src/pages/public/PublicacionDetailPage.jsx` (`/repositorio/:id`), con generador de citas en APA 7 `frontend-portal/src/components/public/CitationModal.jsx`.
- **7.4.5 Eventos y noticias:** Implementada en `frontend-portal/src/pages/public/EventosPage.jsx` (`/eventos`), `frontend-portal/src/pages/public/NoticiasPage.jsx` (`/noticias`) y `frontend-portal/src/pages/public/MultimediaPage.jsx` (`/multimedia`).
- **7.4.6 Contacto institucional:** **PENDIENTE.** Actualmente no existe una página dedicada `/contacto` ni un formulario de contacto general para consultas externas en el frontend.

### 2. ¿Existe una página pública institucional independiente de los paneles privados?
**Sí, existe una separación arquitectónica estricta.**
- En `frontend-portal/src/App.jsx`, las páginas institucionales públicas están envueltas en el componente `PublicLayout`, que proporciona el `Header` institucional público y el `Footer`, permitiendo la libre navegación sin solicitar inicio de sesión ni token.
- Las funciones administrativas residen bajo el prefijo `/dashboard/*`, envueltas en `ProtectedRoute` y `DashboardLayout`, con una barra lateral dedicada y menús restringidos según el rol del usuario autenticado.

### 3. ¿Las interfaces existentes pueden utilizarse para cumplir el capítulo 7?
**Sí, de forma inmediata y directa.** Las páginas existentes cumplen con el estándar visual corporativo de ABOCCRIM:
- Tipografía limpia, paleta de colores institucional basada en tonos penales/forenses (azul marino oscuro, gris pizarra, ámbar institucional).
- Banner panorámico oficial de ABOCCRIM cargado en `/public/aboccrim-banner.webp`.
- Maquetación adaptativa fluida (diseño responsive para teléfonos, tabletas y monitores de escritorio).

### 4. ¿Es necesario crear una página de presentación institucional?
**No es necesario crear una nueva página de presentación desde cero.**
`HomePage.jsx` y `InstitucionalPage.jsx` ya cumplen esa función con gran nivel de detalle. Lo único que debe redactarse y documentarse en el Capítulo 7 es el contenido que ya está plasmado en estas interfaces.

### 5. ¿Debemos incorporar únicamente componentes o pantallas que todavía no existen?
**Exacto.** Solo se requiere incorporar:
1. Una pantalla o componente de **Contacto Institucional** (`ContactoPage.jsx` en la ruta `/contacto`), correspondiente al punto 7.4.6 del índice del capítulo 7, con:
   - Formulario de consulta externa (nombre, correo, asunto, mensaje).
   - Datos oficiales de sede institucional (La Paz, Bolivia), correo de contacto (`soporte.aboccrim@gmail.com`).
   - Horarios de atención y enlaces a redes institucionales.
2. Registrar el enlace `/contacto` en la barra de navegación `Header.jsx` y en el `Footer.jsx`.

### 6. ¿Cómo se relaciona el portal público con el registro, inicio de sesión y las funcionalidades autenticadas?
- En el `Header` público y en el Hero de `HomePage`:
  - Si el usuario **no está autenticado**, visualiza los botones "Acceso a Miembros" y "Registrarse", los cuales conducen a `/acceso-miembros?tab=login` y `/acceso-miembros?tab=register`.
  - Si el usuario **inicia sesión con éxito**, el botón se transforma automáticamente en "Mi Panel de Control" (`/dashboard`) mostrando el nombre del usuario y su rol.
- En la barra lateral del `DashboardLayout`, el usuario tiene en todo momento un enlace de retorno ("Portal Académico Público" -> `/`) para volver al sitio institucional sin perder su sesión.
- Si un visitante intenta descargar un documento privado o abrir la cola de revisión, el sistema presenta un aviso o lo redirige amigablemente a la pantalla de acceso.

### 7. ¿Qué contenido institucional ya está disponible y qué información todavía falta?
- **Disponible:** Misión, Visión, Reseña histórica, 8 Principios rectores, Personería jurídica (R.A. 232/2023), Estructura orgánica (Directorio, Comités, Tipos de miembros), 4 Áreas temáticas criminológicas, Convenios vigentes, Procedimiento estatutario de incorporación y Catálogo de publicaciones.
- **Pendiente de definir:** Dirección física exacta de la sede en Bolivia, número telefónico institucional de contacto oficial y la página de Contacto Institucional (7.4.6).

---

## H. ESTADO DE LA INFRAESTRUCTURA Y DESPLIEGUE

| Componente | Configurado en el Proyecto | Pendiente / Solo en Documentación |
| :--- | :--- | :--- |
| **Docker Compose** | Archivo `docker-compose.yml` completo con servicios: `db` (Postgres 16 + pgvector), `backend` (Django 5.1), `frontend` (Node 22 / Vite), `minio` (S3) y `ollama` (IA local). Redes compartidas, volúmenes y healthchecks configurados. | El arranque directo requiere Docker Desktop activo en la máquina anfitriona. |
| **PostgreSQL & pgvector** | Imagen `pgvector/pgvector:pg16`. Script DDL oficial `ABOCCRIM_PostgreSQL.sql` (36 tablas) montado en `docker-entrypoint-initdb.d/`. Migración Django con `CREATE EXTENSION IF NOT EXISTS vector;`. | Operadores nativos de indexación vectorial (`ivfflat` / `hnsw`) y tipo `VectorField` en Django no utilizados (se usa `JSONField` + cálculo Python). |
| **Almacenamiento MinIO** | Contenedor Chainguard MinIO en puertos 9000/9001. Variables `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, etc. Código de conexión `boto3` en `storage_service.py` con creación automática del bucket `aboccrim-media`. | Certificados SSL/TLS (HTTPS) para el puerto 9000 (actualmente opera en HTTP plano para desarrollo). |
| **Ollama / Modelos IA** | Servicio `ollama:latest` en Compose en puerto 11434 con volumen persistente `ollama_data`. Endpoints de consumo definidos en `llm_service.py` y `embedding_service.py`. | Los pesos de los modelos `llama3.2:3b` y `nomic-embed-text` deben descargarse (`ollama pull`) la primera vez que se levanta el contenedor. |
| **Nginx** | ❌ **No configurado.** No existe servicio Nginx en `docker-compose.yml` ni archivos de configuración en el workspace. | Pendiente configurar si se desea actuar como proxy inverso unificado en el puerto 80/443 en producción. |
| **Google Cloud Platform (GCP)** | Backend preparado en `settings.py` con variables `GCP_PROJECT_ID`, `GCP_LOCATION`, `GEMINI_API_KEY` y cliente `google.generativeai`. | El despliegue de infraestructura en GCP (Cloud Run, Cloud SQL) es una opción de producción; actualmente el proyecto corre con Docker local. |
| **Aplicación Móvil Expo/Android**| ❌ **No configurada.** Sin código ni archivos de proyecto Expo en el repositorio. | Solo documentada en los casos de uso CU30, CU31, CU32. |

---

## I. PROBLEMAS Y ASPECTOS INCOMPLETOS

1. **Sección de Contacto Institucional no desarrollada (Capítulo 7.4.6):**
   - No existe la ruta `/contacto` ni el componente `ContactoPage.jsx`.
   - El `Header.jsx` y `Footer.jsx` no tienen enlace ni formulario de contacto para el visitante general.
2. **Búsqueda Semántica del Repositorio (CU17) desacoplada de la interfaz:**
   - La búsqueda semántica vectorial mediante IA está implementada dentro del Asistente Académico (CU28), pero la página del repositorio académico (`/repositorio`) solo cuenta con búsqueda textual (`icontains`) y filtros categóricos (CU16). Falta un botón o pestaña en el repositorio que permita ejecutar búsqueda semántica pura de artículos.
3. **Métricas y gráficos en el Dashboard (CU26):**
   - `AdminDashboardPage.jsx` es un excelente centro de navegación y seguimiento de trámites, pero carece de gráficos (Chart.js / Recharts) y contadores estadísticos agregados (ej. Total de publicaciones, descargas del mes, postulaciones pendientes).
4. **Módulo de Reportes Analíticos (CU25) pendiente:**
   - No hay generador ni exportador de reportes a PDF o Excel en backend ni frontend.
5. **Evaluación Curricular Asistida por IA (CU29) pendiente:**
   - La evaluación de solicitudes en `EvaluarSolicitudesPage.jsx` es 100% manual por parte del Comité Académico; no tiene un botón para pedirle al LLM un resumen curricular o scoring automatizado.
6. **Módulo Móvil Android (CU30, CU31, CU32) inexistente en el workspace:**
   - No hay código ni dependencias de React Native o Expo en el proyecto.
7. **Vectorización en base de datos vs. en memoria:**
   - En `FragmentoDocumento`, el campo `embedding` se guardó como `JSONField` y la similitud coseno se calcula iterando los fragmentos en memoria mediante Python. Si bien es suficiente y rápido para el volumen actual de publicaciones académicas, no aprovecha los índices vectoriales directos de PostgreSQL `pgvector`.

---

## J. PLAN DE TRABAJO RECOMENDADO PARA COMPLETAR EL CAPÍTULO 7

Para redactar y sustentar el **Capítulo 7: Sitio Web Institucional de ABOCCRIM** con total coherencia técnica y sin reconstruir nada de lo desarrollado:

### Fase 1: Lo que debemos aprovechar y documentar tal como está (90% del capítulo)
1. **7.1 Propósito y alcance:** Explicar el portal web institucional público como el canal oficial de difusión científica, memoria histórica y vinculación de ABOCCRIM con la sociedad boliviana e internacional.
2. **7.2 Identidad institucional:** Documentar la misión, visión, personería jurídica (R.A. 232/2023), los 8 principios rectores estatutarios y la paleta de colores/tokens implementados en Tailwind CSS.
3. **7.3 Estructura y navegación:** Describir la arquitectura de dos capas (`PublicLayout` vs. `DashboardLayout`), el menú multinivel de `Header.jsx` y los accesos rápidos a Miembros y Biblioteca.
4. **7.4.1 a 7.4.5 Componentes funcionales:**
   - Documentar la Página de Inicio (`frontend-portal/src/pages/public/HomePage.jsx`) con su banner, últimas investigaciones, tarjeta de evento con afiche, video HTML5 y pilares.
   - Documentar Acerca de ABOCCRIM (`frontend-portal/src/pages/public/InstitucionalPage.jsx`) con sus 6 pestañas temáticas.
   - Documentar Investigadores (`frontend-portal/src/pages/public/InvestigadoresPage.jsx`) y la ficha de perfil (`frontend-portal/src/pages/public/InvestigadorDetailPage.jsx`).
   - Documentar Repositorio (`frontend-portal/src/pages/public/RepositorioAcademicoPage.jsx`) y citas bibliográficas APA 7 (`frontend-portal/src/components/public/CitationModal.jsx`).
   - Documentar Eventos, Noticias y Multimedia (`frontend-portal/src/pages/public/EventosPage.jsx`, `frontend-portal/src/pages/public/NoticiasPage.jsx`, `frontend-portal/src/pages/public/MultimediaPage.jsx`).

### Fase 2: Lo que debemos implementar puntualmente (Solo 7.4.6)
1. **Crear la vista de Contacto Institucional (`ContactoPage.jsx`):**
   - Diseñar una interfaz institucional limpia en `frontend-portal/src/pages/public/ContactoPage.jsx`.
   - Incorporar formulario de contacto (nombres, correo, teléfono, asunto, mensaje).
   - Incorporar datos institucionales: Sede La Paz, Bolivia; correo oficial `soporte.aboccrim@gmail.com`; horario de atención académica; mapa referencial o indicaciones de contacto.
2. **Registrar la ruta en `App.jsx`:**
   - Añadir `<Route path="/contacto" element={<ContactoPage />} />` dentro de `PublicLayout`.
3. **Vincular en `Header.jsx` y `Footer.jsx`:**
   - Agregar el enlace "Contacto" en la barra superior y en el pie de página institucional.

### Fase 3: Evidencias y capturas de pantalla a obtener (7.6)
Una vez disponible la vista de contacto, levantar los servicios y tomar las capturas oficiales para la memoria académica:
1. Captura de la portada institucional con banner y destacados (`/`).
2. Capturas de las pestañas de Acerca de ABOCCRIM (`/institucional`).
3. Captura del Directorio de Investigadores (`/investigadores`).
4. Captura del Catálogo del Repositorio y modal de citas APA (`/repositorio`).
5. Capturas de Eventos, Noticias y Multimedia (`/eventos`, `/noticias`, `/multimedia`).
6. Captura de la nueva pantalla de Contacto Institucional (`/contacto`).

---

## K. ARCHIVOS IMPORTANTES DEL PROYECTO

### 1. Documentación y Modelado
- `README.md`: Documentación general del stack y cuentas demo.
- `RESUMEN_ESTADO_CU12_A_CU24.md`: Registro previo de casos de uso del ciclo intermedio.
- `Implementar_IA.md`: Especificación funcional del Asistente Académico (CU28) inspirado en LeapSpace.
- `ABOCCRIM_PostgreSQL.sql`: Script DDL oficial con las 36 tablas relacionales.
- `ppp.eapx`: Proyecto de Enterprise Architect con los paquetes, casos de uso y diagramas UML oficiales.

### 2. Frontend Institucional y Público
- `frontend-portal/src/App.jsx`: Matriz de enrutamiento pública y privada.
- `frontend-portal/src/components/layout/Header.jsx`: Menú de navegación institucional.
- `frontend-portal/src/components/layout/Footer.jsx`: Pie de página institucional.
- `frontend-portal/src/pages/public/HomePage.jsx`: Portada y página de inicio oficial.
- `frontend-portal/src/pages/public/InstitucionalPage.jsx`: Sección "Acerca de ABOCCRIM" (Misión, Visión, Principios, Normativa).
- `frontend-portal/src/pages/public/InvestigadoresPage.jsx`: Directorio público de investigadores.
- `frontend-portal/src/pages/public/RepositorioAcademicoPage.jsx`: Catálogo del repositorio académico.
- `frontend-portal/src/pages/public/EventosPage.jsx`: Cartelera de eventos institucionales.
- `frontend-portal/src/pages/public/NoticiasPage.jsx`: Noticias y comunicados.
- `frontend-portal/src/pages/public/MultimediaPage.jsx`: Biblioteca de medios con reproductor HTML5.
- `frontend-portal/src/pages/public/SolicitudIncorporacionPage.jsx`: Formulario público de incorporación.
- `frontend-portal/src/pages/academic/AsistenteAcademicoPage.jsx`: Interfaz del Asistente Inteligente RAG.
- `frontend-portal/src/services/api.js`: Cliente HTTP y servicios API del frontend.

### 3. Backend, Servicios e Infraestructura
- `backend-portal/config/settings.py`: Configuración central (PostgreSQL, JWT, MinIO, Gemini, Ollama, SMTP).
- `backend-portal/config/urls.py`: Enrutador maestro de la API REST (`/api/v1/`).
- `docker-compose.yml`: Orquestación de contenedores (`db`, `backend`, `frontend`, `minio`, `ollama`).
- `backend-portal/apps/common/storage_service.py`: Capa de almacenamiento MinIO / S3 desacoplada.
- `backend-portal/apps/ai_assistant/services/rag_engine.py`: Motor RAG de búsqueda semántica y citas verificables.
- `backend-portal/apps/ai_assistant/services/indexer.py`: Servicio de indexación y chunking de PDFs.
- `backend-portal/apps/common/management/commands/seed_demo_data.py`: Inicialización idempotente de roles, permisos y usuarios de prueba.
