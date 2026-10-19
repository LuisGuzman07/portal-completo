p# Prompt para Antigravity — ABOCCRIM | Primera fase CU01–CU05

## Rol y objetivo

Actúa como arquitecto de software senior y desarrollador full stack especializado en **React + Vite + Tailwind CSS, Django + Django REST Framework, PostgreSQL y Docker Compose**. Implementa la primera fase del **Sistema Web de Gestión Académica e Institucional de ABOCCRIM (Academia Boliviana de Ciencias Criminológicas)** sobre mis proyectos existentes. No te limites a proponer código: inspecciona, implementa, ejecuta pruebas y documenta.

**Alcance funcional de esta fase:** CU01 Registrar cuenta, CU02 Iniciar sesión, CU03 Cerrar sesión, CU04 Administrar usuarios y CU05 Administrar roles y permisos. No implementar todavía CU06–CU27; mantener sus pantallas de la plantilla cuando existan, sin presentar funcionalidades simuladas como reales.

## 1. Rutas reales y organización obligatoria

Mi estructura de trabajo **ya está definida**:

```text
C:\Proyectos\Taller\
├── backend-portal\       # Proyecto Django y API REST
├── frontend-portal\      # Proyecto React y plantilla visual
├── docker-compose.yml    # Si ya existe aquí, conservarlo y adaptarlo
└── ...                    # SQL y otros archivos existentes: localizarlos
```

**No crees un directorio adicional `aboccrim/`, ni cambies el nombre de `backend-portal` o `frontend-portal`, ni muevas arbitrariamente los proyectos.** Inspecciona primero los directorios y adapta la estructura interna de cada uno a lo que ya exista. La ubicación del archivo Compose y del SQL **no se presupone**: búscalos en `C:\Proyectos\Taller` y sus subcarpetas; si faltan, informa exactamente qué archivo necesitas y dónde colocarlo. Trabaja con rutas Windows válidas y rutas relativas dentro de Docker.

Estructura interna **orientativa, no destructiva**:

```text
C:\Proyectos\Taller\
├── backend-portal\
│   ├── config\
│   ├── apps\
│   │   ├── accounts\
│   │   ├── roles\
│   │   └── audit\
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-portal\
│   ├── public\
│   ├── src\
│   │   ├── assets\
│   │   ├── components\
│   │   │   ├── layout\
│   │   │   ├── common\
│   │   │   └── auth\
│   │   ├── pages\
│   │   │   ├── public\
│   │   │   ├── auth\
│   │   │   └── admin\
│   │   ├── routes\
│   │   ├── contexts\
│   │   ├── services\
│   │   ├── hooks\
│   │   ├── styles\
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

Si el Compose existente se encuentra dentro de uno de los proyectos, **prioriza adaptarlo en su ubicación actual**, siempre que pueda construir ambos servicios mediante contextos correctos. Si resulta indispensable ubicarlo en `C:\Proyectos\Taller`, explica por qué antes de cambiarlo.

## 2. Stack obligatorio

- Frontend: **React con Vite**, JavaScript/JSX, **React Router**, **Tailwind CSS instalado localmente**.
- Backend: **Python, Django, Django REST Framework**.
- Base de datos: **PostgreSQL**.
- Seguridad: autenticación Django mediante sesiones seguras o JWT con estrategia de expiración/revocación documentada; control RBAC verificado en backend.
- Infraestructura: **Docker y Docker Compose**.
- API REST versionada: `/api/v1/`.

No utilizar Next.js, Firebase, Supabase, MongoDB ni servicios que sustituyan el stack. Mantener la implementación comprensible para un Taller de Grado.

## 3. Plantilla HTML: referencia visual obligatoria

Tengo una plantilla HTML de ABOCCRIM que adjunto o incorporo al proyecto. **No rediseñes la fachada**: úsala como fuente principal para convertirla a componentes React reales. La plantilla ya contiene código React 18, React Router, Tailwind mediante CDN y Babel standalone en un solo HTML; debes modularizarla para Vite, retirar la dependencia de Babel/CDN en ejecución y corregir JSX (`className`, `htmlFor`, etc.). Sustituye `MemoryRouter` por `BrowserRouter` y configura las rutas y el servidor para permitir recarga directa.

**Conservar:** cabecera, navegación, pie de página, composición de las secciones, tarjetas, responsive, tipografía **Inter**, iconografía **Material Symbols**, identidad minimalista académica y tokens Tailwind. Colores observados:

- Primario `#00055D`.
- Azul institucional `#111B83`.
- Secundario `#00658D`.
- Acento naranja `#F6672C`.
- Fondo `#F9F9FF`.
- Blanco `#FFFFFF`.

Mantener las pantallas existentes de Inicio, Repositorio Académico, Detalle de Publicación, Búsqueda Semántica, Acceso a Miembros e Investigadores. En esta fase, solo la autenticación y administración CU01–CU05 requieren funcionamiento real. Identifica enlaces, cifras, resultados, DOI, certificaciones, validaciones y botones de demostración; no afirmes que una integración, certificación o búsqueda está operativa si no lo está. Evita los `alert()` ficticios: conecta los flujos de esta fase al backend y presenta estados honestos para los demás.

**Atención a la pantalla “Acceso a Miembros”:** contiene inicio de sesión simulado y una pestaña “Solicitar Incorporación”. Separa **CU01 Crear cuenta** de **CU22 Solicitar incorporación** (fuera del alcance actual), sin perder la apariencia visual. El selector de rol del login **no puede conceder permisos**: los roles se obtienen exclusivamente del backend. Las opciones visuales ORCID y Firma Digital no son autenticación real; deshabilítalas o márcalas como futuras si no hay integración oficial.

## 4. Actores y reglas institucionales

Actores oficiales:

1. **Superadministrador:** administración técnica integral, usuarios, roles, permisos, parámetros, auditoría; no sustituye decisiones institucionales reservadas.
2. **Administrador académico:** gestión académica e institucional según permisos.
3. **Investigador:** perfil y publicaciones autorizadas; recursos de consulta.
4. **Miembro ABOCCRIM:** perfil, recursos y propuestas permitidas.
5. **Comité Académico:** revisión académica y evaluación de incorporación según procedimientos.
6. **Comité de Ética:** participación únicamente en procedimientos éticos habilitados.
7. **Visitante:** consulta pública sin autenticación; puede actuar como postulante en CU22 (posterior).

Un usuario puede tener **múltiples roles**. El visitante no requiere una cuenta. Una cuenta recién registrada **no se convierte automáticamente** en investigador acreditado ni miembro de ABOCCRIM y no puede publicar trabajos por registrarse. Nadie puede autoconcederse roles institucionales. Los permisos se evalúan **en el backend**, no solo ocultando botones en React.

## 5. Implementación de los cinco casos de uso

### CU01 — Registrar cuenta

- Formulario de registro integrado en la estética original.
- Validación de datos, correo único, contraseña y confirmación.
- Hash seguro mediante Django; nunca guardar contraseñas en texto plano.
- Persistencia PostgreSQL, errores claros y protección frente a duplicados.
- Asignar únicamente permisos mínimos de usuario registrado.
- No confundir crear cuenta con incorporación institucional (CU22).
- No aceptar roles, permisos ni `is_staff`/`is_superuser` enviados por el registro público.

### CU02 — Iniciar sesión

- Autenticación real Django/API REST; validación de credenciales y cuentas activas.
- Recuperar usuario autenticado, roles y permisos.
- Manejar sesión o tokens de forma segura; documentar la elección.
- Rutas privadas protegidas y navegación basada en permisos.
- Mensajes de error sin filtrar información sensible.
- El selector de rol de la plantilla no determina autorizaciones.

### CU03 — Cerrar sesión

- Acción real de logout con invalidación de sesión/token cuando aplique.
- Limpiar estado de autenticación en React.
- Redirigir al portal público y evitar acceso posterior a rutas protegidas.
- Registrar auditoría básica del evento.

### CU04 — Administrar usuarios

Crear panel administrativo con el estilo ABOCCRIM. El Superadministrador podrá listar, buscar, filtrar, consultar, crear, editar y activar/desactivar cuentas, así como asignar/revocar roles autorizados. Incluir paginación, validaciones, errores, confirmaciones y estados vacíos. Preferir desactivación a eliminación física. Impedir la desactivación del último Superadministrador activo y proteger operaciones críticas sobre la propia cuenta.

### CU05 — Administrar roles y permisos

- RBAC con roles, permisos y relaciones muchos-a-muchos cuando corresponda.
- Listar y consultar roles/permisos, asignar y revocar roles de usuarios, administrar permisos de roles con autorización adecuada.
- Evitar escalamiento de privilegios y cambios que dejen al sistema sin Superadministrador activo.
- Permisos efectivos evaluados en Django REST Framework.
- React solo adapta menú y visibilidad; **no sustituye autorización de servidor**.
- Preparar la expansión futura a CU06–CU27 sin implementarlos ahora.

## 6. Base de datos: reutilizar el SQL existente

**Ya tengo un script SQL de PostgreSQL.** Localízalo y úsalo como referencia del esquema aprobado. Inspecciona tablas, PK, FK, restricciones, usuarios, roles, permisos y auditoría. No crees una segunda base de datos ni tablas paralelas para la misma entidad.

**Especial cuidado con Django:** analiza la compatibilidad entre el SQL y el modelo de usuario/autenticación/migraciones. Decide y documenta si corresponde integrar una tabla existente mediante un modelo Django compatible, adaptar el esquema antes de la primera migración o utilizar las tablas estándar de Django **sin duplicar entidades**. Si se requiere un `AUTH_USER_MODEL` personalizado, configúralo antes de generar las migraciones iniciales. No asumas que `inspectdb` resuelve por sí solo autenticación, relaciones y permisos.

Si el SQL tiene conflictos con Django, informa el diagnóstico y plantea cambios mínimos. **No borres ni recrees tablas existentes de forma destructiva.** Si el script no está presente, solicita el archivo en vez de inventar su contenido.

## 7. Docker Compose e inicialización

Tengo un archivo `docker-compose.yml` existente: inspecciónalo y **adáptalo, no lo sustituyas ciegamente**. Debe permitir levantar PostgreSQL, Django y React con:

```bash
docker compose up --build
```

Requisitos:

- `build.context` y rutas de volúmenes correctas para **`backend-portal` y `frontend-portal`**, que son carpetas hermanas.
- PostgreSQL con volumen persistente y `healthcheck`.
- Django esperando disponibilidad de PostgreSQL.
- Variables mediante `.env` y ejemplo `.env.example`, sin secretos reales en Git.
- Puertos de desarrollo documentados; CORS/CSRF correctamente configurados.
- Migraciones seguras e inicialización reproducible.
- Logs claros y volúmenes de desarrollo razonables.
- No eliminar volúmenes automáticamente.

El SQL inicial debe cargarse automáticamente **solo al crear una base vacía** cuando el método elegido sea `/docker-entrypoint-initdb.d/`. Recuerda que PostgreSQL no vuelve a ejecutar esos scripts si el volumen ya tiene datos. Coordina cuidadosamente la ejecución de SQL y migraciones Django para evitar tablas duplicadas o conflictos de orden. Documenta qué hacer con una base ya inicializada y cómo verificar que el esquema se creó correctamente. No usar `docker compose down -v` como solución automática.

## 8. Usuarios de prueba por actor

Crear un comando Django de semillas **idempotente**, exclusivo de desarrollo, que se ejecute cuando `SEED_DEMO_USERS=true` y `DEBUG=true` o una condición equivalente de entorno no productivo. Crear:

| Actor | Correo de prueba |
|---|---|
| Superadministrador | `superadmin@aboccrim.test` |
| Administrador académico | `academico@aboccrim.test` |
| Investigador | `investigador@aboccrim.test` |
| Miembro ABOCCRIM | `miembro@aboccrim.test` |
| Comité Académico | `comite.academico@aboccrim.test` |
| Comité de Ética | `comite.etica@aboccrim.test` |
| Usuario registrado sin acreditación | `usuario@aboccrim.test` |

El **Visitante** se prueba sin iniciar sesión, no mediante una cuenta artificial. Usar contraseña de prueba configurable por `DEMO_USER_PASSWORD`, no incrustada en código ni en repositorios. Mostrar cómo consultar las credenciales de desarrollo. Asignar a cada usuario solo los permisos previstos para esta fase; para funcionalidades futuras, no inventar autorizaciones operativas. Asegurar que repetir el seed no duplique cuentas, roles ni permisos.

## 9. Dashboard privado y API

Crear panel privado responsive con cabecera, menú lateral, usuario, roles, enlaces autorizados y cerrar sesión, **manteniendo el lenguaje visual de la plantilla**. El Superadministrador tendrá vistas de usuarios y roles/permisos; los otros actores tendrán una bienvenida y opciones realmente disponibles, sin módulos falsamente funcionales.

API REST orientativa (ajustar a convenciones del proyecto):

```text
POST /api/v1/auth/register/
POST /api/v1/auth/login/
POST /api/v1/auth/logout/
GET  /api/v1/auth/me/
GET  /api/v1/users/
POST /api/v1/users/
GET  /api/v1/users/{id}/
PATCH /api/v1/users/{id}/
GET  /api/v1/roles/
GET  /api/v1/roles/{id}/
GET  /api/v1/permissions/
```

Agregar endpoints autorizados de asignación/revocación según diseño. Utilizar serializadores, validación, paginación, códigos HTTP adecuados y pruebas de autorización. No exponer contraseñas ni hashes.

## 10. Auditoría básica y pruebas

Preparar infraestructura mínima de auditoría, sin implementar todavía CU27: registrar inicios de sesión correctos/fallidos, logout, creación/activación/desactivación de usuarios y cambios de roles/permisos. No registrar contraseñas, tokens ni datos innecesarios.

Probar al menos:

1. Navegación pública sin login.
2. Registro sin acreditación institucional.
3. Login correcto e incorrecto.
4. Logout e invalidación de acceso.
5. Bloqueo de rutas/endpoints administrativos a usuarios sin permiso.
6. Gestión de usuarios por Superadministrador.
7. Asignación y revocación de roles con permisos correctos.
8. Protección del último Superadministrador activo.
9. Persistencia de datos tras reiniciar contenedores.
10. Seed repetible sin duplicados.
11. Conservación del diseño responsive.
12. Arranque real con `docker compose up --build`.

Ejecutar pruebas del backend y verificaciones de compilación del frontend. Informar los comandos ejecutados y resultados reales; no declarar pruebas exitosas si no pudieron ejecutarse.

## 11. Documentación y forma de trabajo

Generar un `README.md` en español que explique estructura de carpetas, arquitectura, variables, puertos, Docker, SQL, migraciones, seeds, cuentas de prueba, rutas, endpoints, pruebas y limitaciones. Incluir tabla de trazabilidad **CU01–CU05 → pantalla React → endpoint Django → tablas → prueba**.

Trabaja en este orden:

1. Inspeccionar `C:\Proyectos\Taller\backend-portal`, `C:\Proyectos\Taller\frontend-portal`, HTML, SQL y Compose existentes.
2. Presentar diagnóstico breve de compatibilidad y plan de cambios, indicando archivos afectados.
3. Migrar la plantilla HTML a React/Vite/Tailwind sin alterar la fachada.
4. Configurar Django/DRF, PostgreSQL y Docker respetando las carpetas actuales.
5. Integrar SQL existente y migraciones sin duplicaciones.
6. Implementar CU01–CU03.
7. Implementar CU04–CU05.
8. Crear seeds de desarrollo y dashboard por permisos.
9. Ejecutar pruebas, corregir errores y documentar.

**No te detengas tras entregar una propuesta: implementa la solución en los archivos reales.** Pide confirmación antes de cambios destructivos, migraciones irreversibles o alteraciones importantes del esquema SQL. Si falta un archivo esencial, identifica exactamente cuál y continúa con lo que sea seguro implementar.

## Criterios de aceptación

La fase está terminada únicamente cuando el frontend React conserva la fachada original, el backend Django se conecta a PostgreSQL, el SQL existente está integrado correctamente, Docker Compose inicia los servicios, CU01–CU05 funcionan con permisos comprobados en servidor, existen cuentas demo por actor autenticado, los datos persisten y la documentación permite reproducir el entorno.

**Prioridad absoluta:** respetar estas rutas existentes — `C:\Proyectos\Taller\backend-portal` y `C:\Proyectos\Taller\frontend-portal` —, conservar el diseño ABOCCRIM y construir una base sólida para los restantes casos de uso.
