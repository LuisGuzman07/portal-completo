### CU13 — Descargar documento autorizado
- **¿Qué hace falta?**
  - Indicador visual previo en el listado de documentos (candado/etiqueta) que informe antes del clic que el archivo requiere membresía activa.
 
 ### CU16 — Buscar información con filtros
- **¿Qué hace falta?**
  - Selectores de rango de fecha personalizada (`fecha_desde` y `fecha_hasta`) en la UI (el backend ya los soporta).
  - Selector de ordenamiento en el frontend (por relevancia, fecha descendente o alfabético A-Z).

### CU19 — Administrar noticias institucionales
  - Editor de texto enriquecido (Markdown o WYSIWYG) para títulos secundarios, negritas o listas en el cuerpo de la noticia.
  - Carga de imagen de portada directamente desde la noticia sin requerir un paso separado en multimedia.

### CU20 — Administrar contenido multimedia
- **¿Qué hace falta?**
  - Reproductor integrado en frontend (audio y video HTML5 embebido) para previsualizar sin descargar.
  - Botón de eliminación directa de recursos multimedia en el panel administrativo.

### CU22 — Enviar solicitud de incorporación
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