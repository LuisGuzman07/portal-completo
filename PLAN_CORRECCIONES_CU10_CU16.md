# Correcciones CU10–CU16

Alcance: revisión e integración de los casos de uso de publicaciones, revisión, repositorio, documentos, clasificación y búsqueda. Las entidades siguen mapeando las tablas existentes; no se agregan tablas ni migraciones.

## Lista de correcciones

- [x] **CU10 — Estado inicial controlado por el servidor.** Toda publicación nueva entra como `pendiente`; el cliente no puede declararla aprobada al crearla.
- [x] **CU13/CU14 — Validar niveles de acceso.** Carga y edición aceptan únicamente `publico`, `miembros` o `restringido`; un valor histórico desconocido se deniega al descargar.
- [x] **CU10/CU12 — Restringir datos editoriales privados.** La lista y el detalle autenticados limitan publicaciones no públicas a su registrante/autor y a revisores autorizados.
- [x] **CU12 — Separar respuestas públicas y privadas.** El repositorio público no devuelve correo del registrante, checksum, datos de quien cargó el archivo ni historial/observaciones de revisión.
- [x] **CU12/CU16 — Habilitar filtros del repositorio público.** Los catálogos se pueden consultar sin sesión; su escritura queda limitada a administración académica/superadministración.
- [x] **CU13 — Comprobar acreditación vigente.** El acceso de miembros/investigadores requiere estado `activo` en la tabla de membresía o acreditación; el rol de cuenta por sí solo no concede acceso.
- [x] **CU11 — Proteger el dictamen final.** Solo publicaciones pendientes, observadas o en revisión admiten dictamen; aprobar/rechazar deja el registro fuera de la cola modificable.
- [x] **CU15 — Restringir cambios de catálogos.** Cuentas autenticadas pueden consultar catálogos; solo administración académica/superadministración puede crearlos.

## Estado de validación

- [x] Recorrer en Docker los endpoints con comité, administración/autor, miembro activo, miembro inactivo, cuenta con rol pero sin acreditación y visitante. Se verificaron altas, privacidad, revisión final, filtros, catálogos y descarga; las escrituras se revirtieron al terminar.
- [x] Confirmar que un archivo del volumen `MEDIA_ROOT` sigue disponible después de reiniciar el contenedor backend. El compose monta `./backend-portal:/app` y el marcador de prueba se eliminó después.
- [x] Ejecutar las seis pruebas existentes de CU10–CU15; todas pasaron y Django eliminó la base de pruebas temporal al finalizar.
- [ ] Confirmar la persistencia del almacenamiento en el proveedor de despliegue de producción antes de subir archivos reales allí.

La validación local de Docker está completa. Solo falta comprobar el almacenamiento cuando se defina el proveedor de producción.
