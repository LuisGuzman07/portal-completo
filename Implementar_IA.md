# PROMPT MAESTRO PARA ANTIGRAVITY
## Implementación del CU28 – Asistente Académico Inteligente de ABOCCRIM

### 1. CONTEXTO GENERAL DEL PROYECTO

Estoy desarrollando una plataforma web académica para la **Academia Boliviana de Ciencias Criminológicas (ABOCCRIM)** como parte de mi proyecto de grado.

La plataforma está orientada a la gestión de investigadores, miembros académicos, publicaciones científicas, documentos digitales, repositorios institucionales y servicios de inteligencia artificial aplicados a la investigación criminológica.

**Stack tecnológico del proyecto:**

- Frontend: React.
- Backend: Django y Django REST Framework.
- Base de datos: PostgreSQL.
- Almacenamiento de archivos: MinIO, compatible con S3.
- Contenedores: Docker y Docker Compose.
- Inteligencia artificial: por definir según las mejores alternativas técnicas.
- Proveedor de IA disponible: Google Gemini mediante Google Cloud, donde cuento con créditos para consumir servicios.
- Alternativas: modelos locales mediante Ollama, librerías de Python, Sentence Transformers y otras tecnologías de código abierto.

**Estructura del proyecto:**

```text
C:\Proyectos\Taller\
├── backend-portal/
├── frontend-portal/
└── docker-compose.yml
```

La plataforma ya tiene funcionalidades implementadas, por lo que NO debes reconstruir el proyecto ni modificar módulos ajenos a este requerimiento.

Debes inspeccionar primero el código existente, identificar su arquitectura, sus modelos, sus endpoints, sus permisos y los componentes React disponibles.

Es obligatorio reutilizar los módulos existentes siempre que sea posible.

---

### 2. OBJETIVO PRINCIPAL

Quiero implementar un **Asistente Académico Inteligente**, inspirado funcionalmente en LeapSpace de Elsevier:

https://researcher.elsevier.com/

No pretendo copiar el código ni acceder ilegalmente a los servicios de Elsevier. Quiero desarrollar una implementación propia para ABOCCRIM, utilizando tecnologías disponibles y modelos de IA mediante API o ejecución local.

El asistente debe permitir que los investigadores y miembros de ABOCCRIM consulten información académica en lenguaje natural, utilizando como fuentes las publicaciones científicas y los documentos autorizados almacenados en el repositorio institucional.

**El asistente NO debe comportarse como un chatbot genérico.**

Su principal característica será generar respuestas académicas fundamentadas en documentos verificables, con referencias bibliográficas, páginas y enlaces a los documentos originales.

La arquitectura recomendada es **RAG (Retrieval-Augmented Generation)**.

---

### 3. CASO DE USO OFICIAL

**CU28. Consultar asistente académico inteligente**

**Propósito:**
Permitir consultas académicas en lenguaje natural con respuestas basadas en documentos autorizados.

**Descripción:**
El usuario realiza una pregunta; el sistema recupera información mediante búsqueda semántica y genera una respuesta con referencias a las fuentes.

**Actores:**
Investigador, Miembro ABOCCRIM.

**Actor iniciador:**
Investigador o Miembro ABOCCRIM.

**Precondición:**
El usuario inició sesión y tiene permisos para consultar documentos indexados.

**Proceso principal:**

1. Ingresar al asistente académico.
2. Escribir una consulta.
3. Validar los permisos del usuario.
4. Recuperar fragmentos relacionados del repositorio.
5. Generar la respuesta mediante RAG.
6. Mostrar la respuesta y sus fuentes.

**Postcondición:**
La respuesta se presenta con referencias documentales.

**Excepciones:**
Consulta inválida, falta de información, documentos no indexados o servicio de IA no disponible.

Esta especificación es obligatoria y debe orientar toda la implementación.

Las funcionalidades adicionales descritas a continuación son subprocesos del CU28 y no deben generar nuevos casos de uso oficiales sin mi autorización.

---

### 4. INTERFAZ DE USUARIO EXISTENTE

Ya cuento con una interfaz del asistente académico desarrollada en React, cuya captura de pantalla adjunto como referencia visual.

La interfaz contiene:

**Panel lateral izquierdo:**

- Título: Asistente Académico.
- Botón Nueva conversación.
- Sección Mis conversaciones.
- Sección Favoritas.
- Listado de conversaciones recientes.
- Fecha y hora de cada conversación.
- Información sobre el uso del asistente y las fuentes documentales autorizadas.

**Panel principal:**

- Encabezado Asistente Académico Inteligente.
- Área de conversación.
- Mensajes del usuario.
- Respuestas de la inteligencia artificial.
- Referencias numeradas dentro de las respuestas.
- Sección desplegable Fuentes consultadas.
- Botones para abrir documentos PDF.
- Acciones para copiar respuestas, valorar respuestas y guardar favoritos.
- Campo para introducir nuevas preguntas.
- Botón para enviar consultas.
- Opción de adjuntar documentos, sujeta a los permisos del usuario.

**IMPORTANTE:**

No quiero que rediseñes completamente esta interfaz.

Primero debes localizar sus componentes React y analizar cómo están construidos.

Tu tarea consiste en conectar esta interfaz a un backend funcional de IA, manteniendo su estructura visual y adaptando únicamente los elementos necesarios.

Si actualmente utiliza información simulada, debes identificarla y proponer cómo sustituirla progresivamente por información real.

---

### 5. FUNCIONALIDADES DE INTELIGENCIA ARTIFICIAL

Quiero implementar las siguientes funcionalidades inspiradas en LeapSpace.

#### 5.1. Consultas académicas en lenguaje natural

El investigador podrá escribir preguntas como:

- ¿Qué es la criminología crítica?
- ¿Qué investigaciones existen sobre reincidencia delictiva?
- ¿Qué autores han investigado la criminalidad juvenil?
- ¿Qué publicaciones abordan la prevención del delito en Bolivia?
- ¿Cuáles son las principales conclusiones de las investigaciones sobre seguridad ciudadana?

El sistema deberá:

1. Interpretar la pregunta.
2. Buscar documentos relevantes.
3. Recuperar fragmentos de información.
4. Construir un contexto académico.
5. Generar una respuesta fundamentada.
6. Incorporar referencias verificables.

No debe inventar autores, documentos, páginas, DOI ni resultados científicos.

Cuando no exista información suficiente, deberá indicarlo expresamente.

#### 5.2. Búsqueda semántica

La búsqueda no debe depender únicamente de coincidencias exactas de palabras.

Por ejemplo:

Consulta: "Factores que provocan que una persona vuelva a delinquir".

El sistema debería encontrar documentos sobre "reincidencia delictiva", aunque no contengan literalmente la pregunta.

Investiga y compara estas tecnologías:

- PostgreSQL con pgvector.
- Sentence Transformers.
- BGE-M3.
- Embeddings de Google.
- LlamaIndex.
- LangChain.
- Búsqueda híbrida semántica y textual.

Selecciona una alternativa compatible con la infraestructura existente y explica por qué.

#### 5.3. Respuestas con referencias documentales

Cada respuesta académica debe contener referencias numeradas.

Ejemplo:

"La criminología crítica estudia las relaciones entre criminalidad, poder y control social [1]. También analiza el funcionamiento de las instituciones penales [2]."

Debajo debe mostrarse:

**Fuentes consultadas**

[1] Título de la publicación, autor, año y página.

[2] Título de la publicación, autor, año y página.

Cada referencia deberá permitir:

- Visualizar los metadatos bibliográficos.
- Abrir la publicación original.
- Acceder al PDF autorizado.
- Identificar la página de origen.
- Verificar la correspondencia entre la afirmación y el texto recuperado.

Las referencias deben provenir de registros reales de la base de datos, nunca de información bibliográfica inventada por el modelo.

Si se utiliza una API de Gemini, la aplicación debe validar las referencias devueltas antes de mostrarlas.

#### 5.4. Análisis de documentos PDF

El sistema debe procesar documentos científicos almacenados en MinIO.

Cuando una publicación sea registrada o actualizada, el backend deberá:

1. Identificar el archivo almacenado en MinIO.
2. Obtenerlo mediante acceso autorizado.
3. Extraer el texto.
4. Identificar las páginas.
5. Dividir el contenido en fragmentos.
6. Generar representaciones vectoriales.
7. Almacenar los fragmentos y embeddings.
8. Asociarlos con la publicación original.
9. Registrar el estado de indexación.

Investiga herramientas como:

- PyMuPDF.
- pypdf.
- OCR para documentos escaneados.
- Sentence Transformers.
- pgvector.

Debe existir un mecanismo para reindexar documentos cuando cambien y eliminar sus fragmentos cuando sean retirados del repositorio.

#### 5.5. Resumen inteligente de publicaciones

El usuario podrá seleccionar una publicación y solicitar:

- Resumen general.
- Objetivo de investigación.
- Problema abordado.
- Metodología utilizada.
- Principales resultados.
- Conclusiones.
- Limitaciones del estudio.
- Palabras clave.

La IA debe diferenciar entre información expresamente indicada en el documento e inferencias realizadas a partir de su contenido.

Si un documento no incluye metodología, no debe inventarla.

#### 5.6. Comparación de investigaciones científicas

Inspirado en las funciones de comparación de LeapSpace.

El investigador podrá seleccionar dos o más publicaciones y solicitar una comparación.

Ejemplo:

"Compara las investigaciones sobre prevención del delito realizadas en Bolivia entre 2020 y 2025".

El sistema deberá generar una tabla con:

| Criterio | Investigación A | Investigación B |
|---|---|---|
| Autor | Autor real | Autor real |
| Año | Año real | Año real |
| Objetivo | Objetivo identificado | Objetivo identificado |
| Metodología | Metodología identificada | Metodología identificada |
| Resultados | Resultados encontrados | Resultados encontrados |
| Conclusiones | Conclusiones | Conclusiones |

La comparación debe utilizar únicamente documentos recuperados y autorizados.

#### 5.7. Preguntas de seguimiento

El asistente debe mantener el contexto de una conversación.

Ejemplo:

Usuario: "¿Qué es la criminología crítica?"

IA: Respuesta con fuentes.

Usuario: "¿Cuáles son sus principales representantes?"

IA: Responde considerando el contexto anterior y buscando evidencia adicional cuando corresponda.

Usuario: "Compara sus principales teorías".

IA: Realiza una comparación fundamentada.

El historial debe almacenarse en PostgreSQL y asociarse con el usuario autenticado.

#### 5.8. Gestión de conversaciones

Implementar funcionalmente:

- Crear conversación.
- Consultar conversaciones anteriores.
- Continuar una conversación.
- Cambiar el título.
- Eliminar una conversación.
- Marcar o desmarcar favoritos.
- Consultar mensajes anteriores.
- Copiar respuestas.
- Valorar respuestas mediante Me gusta o No me gusta.

Las conversaciones deben ser privadas para sus propietarios, salvo permisos administrativos expresamente definidos.

#### 5.9. Recomendaciones académicas

Como funcionalidad avanzada, el sistema podrá recomendar:

- Publicaciones relacionadas.
- Documentos del mismo campo científico.
- Investigadores asociados con determinadas temáticas.
- Otras investigaciones del repositorio.

Las recomendaciones deben derivarse de metadatos y relaciones verificables, no de autores inventados.

#### 5.10. Modo de consulta restringido al repositorio

Implementar inicialmente un modo denominado:

**Consultar repositorio ABOCCRIM**

En este modo, el asistente solamente podrá fundamentar sus respuestas en documentos autorizados del repositorio institucional.

No debe recurrir a conocimiento general del modelo para presentar afirmaciones como si provinieran de las publicaciones de ABOCCRIM.

Si la pregunta no puede responderse con los documentos recuperados, debe informar:

"No se encontró información suficiente en los documentos autorizados del repositorio ABOCCRIM para responder esta consulta".

En el futuro podría incorporarse un modo de investigación con fuentes académicas externas, pero NO forma parte de la primera implementación.

### 7. INTEGRACIÓN CON GOOGLE GEMINI

Cuento con créditos disponibles en Google Cloud y me interesa aprovecharlos.

Por ello, debes investigar la viabilidad de utilizar Gemini como motor generativo.

Evalúa:

**Alternativa A: Google Gemini mediante Vertex AI**

- Autenticación mediante credenciales de servicio o identidad de carga de trabajo.
- Consumo de modelos generativos.
- Costos estimados.
- Compatibilidad con Django.
- Gestión de cuotas.
- Seguridad de la información.
- Modelos disponibles en mi proyecto y región.

**Alternativa B: Gemini Developer API**

- Disponibilidad.
- Autenticación.
- Costos.
- Diferencias respecto de Vertex AI.
- Compatibilidad con los créditos disponibles.

No asumas que los créditos de Google Cloud pueden utilizarse automáticamente con cualquier modalidad de Gemini.

Verifica las condiciones aplicables antes de recomendar una opción.

**Alternativa C: IA local**

Analiza Ollama y modelos abiertos compatibles.

Considera consumo de RAM, necesidad de GPU, velocidad de respuesta y calidad de resultados en español.

**Mi preferencia inicial es Gemini mediante Google Cloud, siempre que resulte técnicamente viable.**

La arquitectura debe permitir cambiar de proveedor sin modificar la lógica principal del asistente.

---

### 8. ARQUITECTURA RAG PROPUESTA

El flujo de consultas debe ser aproximadamente:

```text
USUARIO
   |
   v
INTERFAZ REACT
   |
   v
API DJANGO REST FRAMEWORK
   |
   v
VALIDACIÓN DE AUTENTICACIÓN Y PERMISOS
   |
   v
GENERACIÓN DEL EMBEDDING DE LA CONSULTA
   |
   v
BÚSQUEDA EN POSTGRESQL + PGVECTOR
   |
   v
RECUPERACIÓN DE FRAGMENTOS AUTORIZADOS
   |
   v
CONSTRUCCIÓN DEL CONTEXTO ACADÉMICO
   |
   v
GOOGLE GEMINI / MODELO CONFIGURADO
   |
   v
VALIDACIÓN DE REFERENCIAS
   |
   v
RESPUESTA CON CITAS DOCUMENTALES
   |
   v
INTERFAZ REACT
```

Para documentos:

```text
PUBLICACIÓN REGISTRADA
   |
   v
PDF ALMACENADO EN MINIO
   |
   v
TAREA DE INDEXACIÓN
   |
   v
EXTRACCIÓN DE TEXTO
   |
   v
FRAGMENTACIÓN POR PÁGINAS
   |
   v
GENERACIÓN DE EMBEDDINGS
   |
   v
POSTGRESQL + PGVECTOR
   |
   v
DOCUMENTO DISPONIBLE PARA CONSULTAS RAG
```

Puedes mejorar esta arquitectura si encuentras una solución técnicamente superior, pero debes justificar los cambios.

---

### 9. BASE DE DATOS

No debes modificar arbitrariamente las tablas existentes.

Primero identifica:

- Tabla de usuarios.
- Tabla de roles y permisos.
- Tabla de investigadores.
- Tabla de publicaciones.
- Tabla de documentos digitales.
- Relaciones entre publicaciones y documentos.
- Referencias a MinIO.

Después propón las tablas adicionales necesarias para:

- Documentos indexados.
- Fragmentos documentales.
- Embeddings.
- Conversaciones.
- Mensajes.
- Fuentes utilizadas por respuesta.
- Valoraciones.
- Procesos de indexación.

Utiliza migraciones de Django.

No ejecutes migraciones destructivas ni elimines información existente.

---

**Por ahora NO quiero que implementes todo el sistema.**

Primero necesito que inspecciones el proyecto existente y me entregues un **PLAN DE IMPLEMENTACIÓN Y WORKFLOW DE PRUEBAS DEL CU28**.

Tu primera respuesta debe incluir:

1. Diagnóstico de los componentes actuales del proyecto.
2. Tecnologías recomendadas para el asistente académico.
3. Comparación entre Gemini, modelos locales y simulación.
4. Arquitectura RAG propuesta.
5. Integración prevista con MinIO y PostgreSQL.
6. Flujo de procesamiento de documentos.
7. Flujo de consultas académicas.
8. Workflow de pruebas organizado por etapas.
9. Criterios de aceptación.
10. Riesgos técnicos y dependencias.
11. Orden recomendado de implementación.
12. Primera prueba mínima que debemos realizar.

Organiza el trabajo de manera que podamos avanzar fase por fase y validar cada componente antes de continuar.

**Al finalizar el análisis, detente y espera mi autorización para comenzar la primera fase de implementación.**

El objetivo final es disponer de un asistente académico propio de ABOCCRIM, inspirado en LeapSpace, capaz de analizar documentos científicos del repositorio institucional y generar respuestas académicas fundamentadas, verificables y seguras.