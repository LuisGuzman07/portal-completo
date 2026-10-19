# ABOCCRIM — Sistema Web de Gestión Académica e Institucional
## Primera Fase: Casos de Uso CU01–CU05

Bienvenido a la documentación oficial de la primera fase del **Sistema Web de Gestión Académica e Institucional de la Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)**.

Esta implementación comprende la modularización e integración del diseño institucional oficial, la autenticación segura mediante tokens JWT, el control de acceso basado en roles (RBAC) verificado en el servidor y la administración completa de usuarios y roles sobre PostgreSQL 16 y Docker Compose.

---

## 1. Estructura Real del Proyecto

El espacio de trabajo respeta estrictamente las rutas organizativas requeridas:

```text
C:\Proyectos\Taller\
├── backend-portal/                 # Backend API REST (Python 3.12, Django 5.1, DRF)
│   ├── config/                     # Configuración central (settings, urls, wsgi)
│   ├── apps/
│   │   ├── accounts/               # CU01, CU02, CU03, CU04 (Usuario, autenticación, CRUD)
│   │   ├── roles/                  # CU05 (Rol, Permiso, UsuarioRol, RolPermiso, RBAC)
│   │   ├── audit/                  # Bitácora inmutable de eventos de seguridad (registro_auditoria)
│   │   └── common/                 # Comandos de gestión (seed_demo_data)
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── manage.py
├── frontend-portal/                # Frontend SPA (React 18, Vite 6, Tailwind CSS local)
│   ├── public/
│   │   └── ABOCCRIM.webp           # Emblema oficial de ABOCCRIM en formato WebP
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/             # Header, Footer, DashboardLayout
│   │   │   └── common/             # ProtectedRoute (Guardias de ruta RBAC)
│   │   ├── contexts/               # AuthContext (Estado global de sesión y permisos)
│   │   ├── services/               # api.js (Cliente HTTP con interceptores JWT)
│   │   ├── pages/
│   │   │   ├── public/             # Inicio, Repositorio, Detalle, Búsqueda PLN, Investigadores
│   │   │   ├── auth/               # AccesoMiembrosPage (CU01 Registro, CU02 Login, CU22)
│   │   │   └── admin/              # Panel, Usuarios (CU04), Roles (CU05), Auditoría
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml              # Orquestación de PostgreSQL 16, backend y frontend
├── ABOCCRIM_PostgreSQL.sql         # Script DDL oficial de PostgreSQL (36 tablas)
├── ABOCCRIM.webp                   # Logotipo oficial
├── .env.example                    # Plantilla de variables de entorno
├── .env                            # Variables activas de desarrollo
└── README.md                       # Documentación técnica y tabla de trazabilidad
```

---

## 2. Stack Tecnológico

- **Frontend:** React 18, React Router v6, Tailwind CSS (instalado localmente con tokens de la plantilla), Vite 6.
- **Backend:** Python 3.12, Django 5.1, Django REST Framework 3.15, SimpleJWT.
- **Base de Datos:** PostgreSQL 16 Alpine.
- **Infraestructura:** Docker & Docker Compose con redes aisladas y healthchecks.
- **Seguridad:** Autenticación JWT (`Bearer <access_token>`), contraseñas hasheadas con PBKDF2/SHA256, RBAC evaluado en backend.

---

## 3. Integración de la Base de Datos y Compatibilidad SQL

El esquema de base de datos se basa íntegramente en `ABOCCRIM_PostgreSQL.sql` (36 tablas relacionales).

1. **Carga Inicial del DDL:** El contenedor `db` monta `./ABOCCRIM_PostgreSQL.sql` en `/docker-entrypoint-initdb.d/01_init.sql:ro`. Al levantarse una base de datos vacía, PostgreSQL crea automáticamente todas las tablas oficiales sin modificación ni duplicación.
2. **Modelo de Usuario Personalizado (`Usuario`):** Se definió `AUTH_USER_MODEL = 'accounts.Usuario'` mapeado con `db_table = 'usuario'` para coincidir con las columnas reales:
   - `password_hash` -> Mapeado al campo `password` de Django.
   - `ultimo_acceso` -> Mapeado al campo `last_login` de Django.
   - `activo` -> Mapeado a la propiedad booleana `is_active`.
   - `roles` -> Relación Many-to-Many mediante la tabla intermedia `usuario_rol`.
3. **Migraciones Seguras:** El script `entrypoint.sh` ejecuta `python manage.py migrate --fake-initial`. De este modo, Django reconoce que las tablas `usuario`, `rol`, `permiso`, `usuario_rol`, `rol_permiso` y `registro_auditoria` ya existen y no intenta recrearlas, creando únicamente sus tablas de soporte estándar (`django_session`, etc.).

---

## 4. Variables de Entorno y Puertos

El archivo `.env` en la raíz contiene las siguientes variables:

| Variable | Valor por Defecto | Descripción |
|---|---|---|
| `POSTGRES_DB` | `aboccrim_db` | Nombre de la base de datos PostgreSQL |
| `POSTGRES_USER` | `aboccrim_user` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `aboccrim_password` | Contraseña de PostgreSQL |
| `POSTGRES_PORT` | `5432` | Puerto expuesto para PostgreSQL |
| `BACKEND_PORT` | `8000` | Puerto expuesto para Django REST Framework |
| `FRONTEND_PORT` | `5173` | Puerto expuesto para el portal React |
| `VITE_API_URL` | `http://localhost:8000/api/v1` | URL base consumida por el frontend |
| `SEED_DEMO_USERS` | `true` | Habilita la creación de usuarios y roles demo |
| `DEMO_USER_PASSWORD` | `Aboccrim2025!` | Contraseña inicial de los usuarios demo |

---

## 5. Instrucciones de Ejecución

Para iniciar todo el entorno de forma reproducible:

```bash
# 1. Clonar o ubicarse en el directorio
cd C:\Proyectos\Taller

# 2. Levantar los servicios con construcción de imágenes
docker compose up --build -d
```

### Verificación de Servicios:
- **Portal Web (Frontend):** [http://localhost:5173](http://localhost:5173)
- **API REST (Backend):** [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
- **Base de Datos (PostgreSQL):** `localhost:5432` (Base: `aboccrim_db`)

---

## 6. Cuentas de Demostración por Actor

El comando `seed_demo_data` crea automáticamente los siguientes actores de prueba de manera **idempotente** (sin duplicar registros al reiniciar):

| Actor | Correo de Prueba | Contraseña | Alcance / Permisos |
|---|---|---|---|
| **Superadministrador** | `superadmin@aboccrim.test` | `Aboccrim2025!` | Control total: gestión de usuarios, roles, permisos y auditoría. |
| **Administrador Académico** | `academico@aboccrim.test` | `Aboccrim2025!` | Gestión académica, consulta de usuarios y roles. |
| **Investigador** | `investigador@aboccrim.test` | `Aboccrim2025!` | Consulta de perfil, producción científica y repositorio. |
| **Miembro ABOCCRIM** | `miembro@aboccrim.test` | `Aboccrim2025!` | Perfil colegiado y consulta institucional. |
| **Comité Académico** | `comite.academico@aboccrim.test` | `Aboccrim2025!` | Revisión académica y consulta de repositorio. |
| **Comité de Ética** | `comite.etica@aboccrim.test` | `Aboccrim2025!` | Dictámenes éticos y consulta institucional. |
| **Usuario Registrado** | `usuario@aboccrim.test` | `Aboccrim2025!` | Cuenta básica pública sin acreditación institucional. |
| **Visitante** | *(Sin autenticación)* | N/A | Navegación libre por el portal público y repositorio. |

> **Acceso Rápido:** En la pantalla de login (`/acceso-miembros`), se incluyeron botones de llenado rápido de un solo clic para cada uno de estos actores.

---

## 7. Tabla de Trazabilidad CU01–CU05

| Caso de Uso | Pantalla / Componente React | Endpoint Django REST | Tablas PostgreSQL | Prueba / Verificación |
|---|---|---|---|---|
| **CU01 Registrar cuenta** | `AccesoMiembrosPage.jsx` (Pestaña "Registrar Cuenta") | `POST /api/v1/auth/register/` | `usuario`, `usuario_rol`, `registro_auditoria` | Registro de usuario con nombres, correo único y contraseña hasheada. Asignación automática del rol base `usuario` sin privilegios. |
| **CU02 Iniciar sesión** | `AccesoMiembrosPage.jsx` (Pestaña "Iniciar Sesión") | `POST /api/v1/auth/login/` | `usuario`, `usuario_rol`, `rol`, `permiso`, `registro_auditoria` | Validación de credenciales y cuentas activas. Retorno de JWT tokens, roles y permisos efectivos del backend. Actualización de `ultimo_acceso`. |
| **CU03 Cerrar sesión** | `Header.jsx`, `DashboardLayout.jsx` (Botón "Cerrar Sesión") | `POST /api/v1/auth/logout/` | `registro_auditoria` | Invalidación y revocación de tokens JWT en backend. Limpieza completa de estado en localStorage de React y redirección al portal público. |
| **CU04 Administrar usuarios** | `AdminUsuariosPage.jsx` | `GET /api/v1/users/`<br>`POST /api/v1/users/`<br>`PATCH /api/v1/users/{id}/` | `usuario`, `usuario_rol`, `registro_auditoria` | Listado con búsqueda y filtros por rol y estado. Creación administrativa, edición y activación/desactivación. **Salvaguarda:** Impide desactivar al último Superadministrador activo y la propia cuenta en sesión. |
| **CU05 Administrar roles y permisos** | `AdminRolesPage.jsx`<br>`AdminUsuariosPage.jsx` (Modal Asignar Roles) | `GET /api/v1/roles/`<br>`GET /api/v1/roles/{id}/`<br>`POST /api/v1/roles/{id}/permissions/`<br>`POST /api/v1/users/{id}/assign_roles/` | `rol`, `permiso`, `rol_permiso`, `usuario_rol`, `registro_auditoria` | Consulta de roles y permisos. Asignación y revocación de roles a usuarios. Edición de matriz de permisos por rol. **Salvaguarda:** Impide revocar el rol o permisos críticos del último Superadmin. |

---

## 8. Salvaguardas Críticas de Seguridad y Auditoría

1. **Protección del Último Superadministrador Activo:** El backend impide que el único superadministrador activo sea desactivado o se le revoque su rol.
2. **Protección de la Propia Cuenta:** Un superadministrador en sesión no puede desactivarse a sí mismo.
3. **Imposibilidad de Autoasignación de Privilegios:** El endpoint público `POST /api/v1/auth/register/` ignora cualquier intento de inyectar roles o privilegios, asignando únicamente el rol de usuario básico sin acreditación institucional.
4. **Separación de CU01 vs CU22:** Se separó la creación de cuenta técnica (CU01) de la postulación formal a colegiatura (CU22), conservando la estética del formulario de postulación original.
5. **Bitácora Inmutable de Auditoría:** Toda operación crítica (`LOGIN_EXITOSO`, `LOGIN_FALLIDO`, `LOGOUT`, `REGISTRO_CUENTA`, `CREAR_USUARIO_ADMIN`, `ACTUALIZAR_USUARIO`, `ASIGNAR_ROLES_A_USUARIO`, `ASIGNAR_PERMISOS_A_ROL`) queda registrada en la tabla `registro_auditoria` con su timestamp, usuario, dirección IP de origen y detalle descriptivo.

---

## 9. Comandos Útiles

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs del backend Django en vivo
docker compose logs -f backend

# Ejecutar pruebas unitarias de Django
docker compose exec backend python manage.py test

# Re-ejecutar el seed de datos de prueba
docker compose exec backend python manage.py seed_demo_data

# Compilar frontend para producción
cd frontend-portal && npm run build
```
