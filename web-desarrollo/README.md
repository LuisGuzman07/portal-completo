# NovaSoft Solutions — Sitio Web Corporativo

> **Capítulo VII. Sitio Web Corporativo**  
> *Proyecto de Ingeniería de Software — Sistema de Presencia Institucional y Catálogo de Servicios Tecnológicos*  
> **Empresa:** NovaSoft Solutions  
> **Eslogan:** *"Transformamos ideas en soluciones digitales"*  

---

## 1. Contexto Académico y Estructura del Capítulo VII

Este repositorio contiene la implementación completa e independiente del sitio web corporativo de **NovaSoft Solutions**. Este desarrollo simula una empresa real de desarrollo de software y servicios tecnológicos, encargada de proveer soluciones a organizaciones y clientes externos.

El desarrollo da cumplimiento a la estructura del documento de grado:

- **7.1. Propósito y alcance:** Definición institucional, objetivos del portal y público objetivo.
- **7.2. Identidad corporativa:** Nombre comercial, misión, visión, valores y paleta visual oficial.
- **7.3. Estructura y navegación del sitio:** Arquitectura de información, componentes modulares y diseño responsive.
- **7.4. Componentes funcionales:**
  - *7.4.1. Página de inicio (Hero Section).*
  - *7.4.2. Acerca de NovaSoft Solutions (Identidad y Valores).*
  - *7.4.3. Servicios de desarrollo (Catálogo de 6 líneas técnicas).*
  - *7.4.4. Productos y soluciones (NovaGest, NovaDocs y NovaMobile).*
  - *7.4.5. Descargas y actualizaciones (Centro de distribución de APK e instaladores).*
  - *7.4.6. Planes y cotizaciones (Básico, Profesional y Empresarial).*
  - *7.4.7. Contacto y atención al cliente (Formulario validado con integración mailto).*
  - *7.4.8. Chat y asistencia automatizada (Asistente virtual por reglas).*
- **7.5. Diseño de interfaces:** Paleta de colores, tipografía, iconografía SVG y maquetación SaaS.
- **7.6. Capturas de pantalla del sitio web:** Guía de secciones para obtención de evidencias visuales.

---

## 2. Tecnologías Empleadas

| Capa / Módulo | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Frontend** | React 18 + JavaScript (JSX) | Arquitectura modular de componentes desacoplados, alto rendimiento y renderizado reactivo. |
| **Empaquetador & Build Tool** | Vite 6 | Tiempos de arranque ultrarrápidos, recarga en caliente (HMR) y compilación optimizada con Rollup. |
| **Estilos & Maquetación** | Tailwind CSS 3 | Utilidades atómicas de diseño rápido, responsive design fluido y paleta personalizada sin sobrecarga de CSS. |
| **Iconografía** | Lucide React | Paquete de iconos vectoriales ligeros, consistentes y personalizables vía props. |
| **Servidor Web de Producción** | Nginx Alpine 1.27 | Servidor HTTP de alto rendimiento, bajo consumo de memoria RAM (< 15 MB) y soporte para compresión Gzip. |
| **Contenedorización** | Docker & Docker Compose | Aislamiento completo del entorno, reproducibilidad idéntica entre desarrollo local y la máquina virtual en Google Cloud Platform (GCP). |

---

## 3. Identidad Visual y Paleta Corporativa

La identidad visual está configurada dentro del sistema Tailwind (`tailwind.config.js`):

- **Azul Oscuro Corporativo:** `#0B1530` (Fondos profundos, navegación oscura, contraste principal)
- **Azul Principal Vibrante:** `#2563EB` (Botones primarios, enlaces activos, acentos)
- **Celeste / Sky:** `#38BDF8` (Llamadas a la acción, badges, efectos de iluminación)
- **Blanco Puro:** `#FFFFFF` (Tarjetas de contenido y legibilidad)
- **Gris Claro:** `#F8FAFC` (Fondos de sección y superficies secundarias)
- **Tipografía:** *Inter* y fuentes del sistema (`system-ui`), con soporte monoespaciado para métricas técnicas.

---

## 4. Estructura del Proyecto

```text
web-desarrollo/
├── public/
│   ├── downloads/
│   │   ├── novamobile-v1.0.0-demo.txt    # Archivo demostrativo de verificación de canal
│   │   └── (Aquí se colocan los APKs reales: novamobile.apk)
│   ├── favicon.svg                       # Logotipo SVG corporativo sin dependencias externas
│   └── robots.txt                        # Políticas de indexación para buscadores
├── src/
│   ├── components/
│   │   ├── Logo.jsx                      # Componente de marca vectorial SVG escalable
│   │   ├── Navbar.jsx                    # Menú superior sticky con menú hamburguesa móvil
│   │   ├── Hero.jsx                      # Sección principal con dashboard SaaS y métricas
│   │   ├── About.jsx                     # Quiénes somos, misión, visión y 5 valores
│   │   ├── Services.jsx                  # Catálogo de los 6 servicios de desarrollo
│   │   ├── Products.jsx                  # Catálogo demostrativo (NovaGest, NovaDocs, NovaMobile)
│   │   ├── Downloads.jsx                 # Centro de descargas y registro de cambios (Changelog)
│   │   ├── Pricing.jsx                   # Planes Básico, Profesional (destacado) y Empresarial
│   │   ├── Process.jsx                   # Proceso metodológico de ingeniería (4 etapas)
│   │   ├── Contact.jsx                   # Formulario corporativo con validación y mailto
│   │   ├── FAQ.jsx                       # Acordeón de preguntas frecuentes institucionales
│   │   ├── ChatWidget.jsx                # Asistente virtual automatizado flotante
│   │   ├── PrivacyModal.jsx              # Modal institucional de política de privacidad
│   │   ├── TermsModal.jsx                # Modal de términos y condiciones de contratación
│   │   └── Footer.jsx                    # Pie de página con copyright dinámico y enlaces
│   ├── config/
│   │   ├── company.js                    # Configuración centralizada de datos institucionales
│   │   └── downloads.js                  # Catálogo JSON/JS de descargas y versiones
│   ├── App.jsx                           # Componente raíz y orquestador de estado
│   ├── main.jsx                          # Punto de entrada de renderizado React
│   └── index.css                         # Directivas Tailwind, fuentes y utilidades glassmorphism
├── dist/                                 # Artefactos compilados listos para producción
├── Dockerfile                            # Construcción multietapa (Node.js -> Nginx Alpine)
├── docker-compose.yml                    # Orquestación del contenedor web
├── nginx.conf                            # Configuración Nginx (SPA, Gzip, cabeceras y /downloads/)
├── .dockerignore                         # Exclusiones de contexto para Docker
├── .env.example                          # Plantilla de variables de entorno
├── .gitignore                            # Exclusiones de Git
├── package.json                          # Dependencias y scripts
└── README.md                             # Documentación completa y guía de despliegue
```

---

## 5. Instrucciones de Ejecución Local

### Prerrequisitos
- Node.js versión 18+ (recomendado Node 20 LTS o superior).
- Gestor de paquetes `npm`.

### Paso 1: Instalación de Dependencias
```bash
cd web-desarrollo
npm install
```

### Paso 2: Ejecución en Modo Desarrollo
```bash
npm run dev
```
El servidor de desarrollo se iniciará en `http://localhost:3000` con recarga rápida (HMR).

### Paso 3: Compilación para Producción
```bash
npm run build
```
Genera la carpeta optimizada `dist/` con activos minificados y listos para servir.

### Paso 4: Previsualizar la Compilación
```bash
npm run preview
```

---

## 6. Despliegue en Vercel (Producción Oficial)

El proyecto está 100% optimizado para desplegarse en **Vercel** (`https://vercel.com/luis-guzman`) a través de dos modalidades:

### Opción A: Despliegue Directo por Terminal (Vercel CLI)
El proyecto ya cuenta con el CLI de Vercel preinstalado en sus dependencias.

1. Abre una terminal en la carpeta del proyecto:
   ```bash
   cd c:\Proyectos\Taller\web-desarrollo
   ```
2. Ejecuta el asistente de despliegue:
   ```bash
   npx vercel
   ```
   - Si es tu primera vez, te abrirá el navegador para autenticarte con tu cuenta `luis-guzman`.
   - Presiona `Y` para configurar el proyecto.
   - Selecciona tu cuenta `luis-guzman`.
   - Confirma el nombre (ej. `novasoft-solutions`).
   - El sistema detectará automáticamente la configuración de [vercel.json](./vercel.json).
3. Para publicar directo a producción:
   ```bash
   npx vercel --prod
   ```

### Opción B: Despliegue desde el Panel Web de Vercel (GitHub)
1. Ingresa a tu panel en [vercel.com/dashboard](https://vercel.com/dashboard).
2. Haz clic en **Add New...** > **Project**.
3. Conecta o selecciona tu repositorio de GitHub (`LuisGuzman07/portal-completo`).
4. En **Root Directory**, haz clic en **Edit** y selecciona la subcarpeta `web-desarrollo`.
5. Vercel detectará automáticamente **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Haz clic en **Deploy**. En menos de 1 minuto tendrás tu dominio activo `https://novasoft-solutions.vercel.app` con HTTPS automático y CDN global.

---

## 7. Despliegue Alternativo con Docker (Servidor / GCP)

Dado que ya cuentas con una máquina virtual de Google Cloud Platform (GCP) con servicios Docker en funcionamiento, este frontend se despliega como un contenedor independiente de Nginx.

### Configuración de Variables de Entorno
Crea o edita el archivo `.env` en el directorio `web-desarrollo`:
```bash
cp .env.example .env
```
Contenido de `.env`:
```env
PORT=8085
VITE_CONTACT_EMAIL=contacto@novasoft.dev
```
*(Puedes cambiar `PORT=8085` a cualquier puerto libre en tu VM, por ejemplo `8080`, `3000` u `80`).*

### Construir y Levantar el Servicio en Segundo Plano
```bash
docker compose up -d --build
```

### Verificar el Estado del Contenedor
```bash
docker compose ps
docker compose logs -f novasoft-web
```

### Reglas de Firewall en Google Cloud Platform (GCP)
Para acceder mediante `http://<IP_PUBLICA_VM>:8085`, asegúrate de habilitar el puerto en las reglas de firewall de GCP:
1. En la consola de GCP: **VPC Network** > **Firewall**.
2. Crear una regla de entrada (Ingress):
   - **Nombre:** `allow-novasoft-web`
   - **Destino:** Todas las instancias o etiqueta específica.
   - **Rango de IPs de origen:** `0.0.0.0/0`
   - **Protocolos y puertos:** `tcp:8085` (o el puerto configurado).

---

## 7. Distribución de Archivos APK Reales

El sistema incluye una arquitectura desacoplada para la distribución de aplicaciones:

1. **Subir el archivo binario:**
   Copia el archivo compilado de tu aplicación Android (ej. `novamobile.apk`) dentro de la carpeta:
   `public/downloads/novamobile.apk`
   
   *(Si el contenedor ya está corriendo en la VM, gracias al volumen mapeado en `docker-compose.yml`, el archivo estará disponible al instante).*

2. **Actualizar la ficha técnica:**
   Abre el archivo `src/config/downloads.js` y edita la entrada correspondiente:
   ```javascript
   {
     id: 'novamobile-apk',
     productName: 'NovaMobile Android Client',
     category: 'Móvil',
     version: 'v1.0.0',
     os: 'Android 8.0+',
     fileSize: '18.4 MB',
     releaseDate: 'Noviembre 2026',
     fileName: 'novamobile.apk',
     filePath: '/downloads/novamobile.apk',
     isAvailable: true,
     isDemo: false,
     badge: 'Oficial Release',
     badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
     description: 'Versión estable para producción con sincronización en tiempo real.',
     requirements: ['Arquitectura ARM64 / x86_64', '50 MB libres']
   }
   ```
3. Recompila con `npm run build` o `docker compose up -d --build` para actualizar la metadata visual.

---

## 8. Guía para Asignación de Dominio y Certificado SSL/HTTPS

Inicialmente el sitio opera mediante `http://<IP_PUBLICA>:8085`. Para publicarlo formalmente con un dominio propio (ej. `novasoft.example.com` o dominio gratuito DuckDNS / No-IP) y HTTPS:

### Opción A: Configurar Nginx Reverse Proxy en la Máquina Virtual Host

Instalar Nginx y Certbot en el sistema operativo de la máquina virtual (fuera de Docker):
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

Crear un bloque de configuración en `/etc/nginx/sites-available/novasoft`:
```nginx
server {
    server_name midominio.com www.midominio.com;

    location / {
        proxy_pass http://127.0.0.1:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilitar el sitio y reiniciar:
```bash
sudo ln -s /etc/nginx/sites-available/novasoft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtener certificado SSL gratuito de Let's Encrypt:
```bash
sudo certbot --nginx -d midominio.com -d www.midominio.com
```

Certbot actualizará automáticamente la configuración de Nginx redirigiendo todo el tráfico HTTP (puerto 80) a HTTPS (puerto 443) con renovación automática.

---

## 9. Evidencias para el Capítulo VII de la Tesis

Para la sección **7.6. Capturas de pantalla del sitio web**, se recomienda tomar capturas de:

1. **Hero & Barra de Navegación:** Captura de la vista superior con el logotipo, menú sticky, botones de llamado a la acción y el dashboard tecnológico.
2. **Identidad Institucional (Nosotros):** Tarjetas de Misión, Visión, Quiénes somos y los 5 pilares de valores corporativos en fondo oscuro.
3. **Catálogo de Servicios:** Cuadrícula con las 6 tarjetas de desarrollo de software y badges de especialidad.
4. **Catálogo de Productos:** Tarjetas de NovaGest, NovaDocs y NovaMobile con etiquetas de producto demostrativo y lista de módulos.
5. **Centro de Descargas:** Tarjeta de descarga de paquete Android, badges de versión y vista desplegable del historial de cambios (Changelog).
6. **Planes y Cotizaciones:** Comparativa de los tres niveles destacando el plan Profesional.
7. **Proceso de Trabajo:** Las 4 fases numeradas de la metodología de ingeniería.
8. **Formulario de Contacto:** Campos con validación interactiva y aviso de despacho vía cliente de correo.
9. **Asistente Virtual Automatizado:** Widget de chat flotante desplegado en la esquina inferior con respuestas predefinidas.
10. **Diseño Móvil:** Vista del menú hamburguesa y tarjetas adaptadas en resolución de smartphone.

---

## 10. Mantenimiento y Licencia

Proyecto desarrollado para el **Capítulo VII. Sitio Web Corporativo** del proyecto de titulación en Ingeniería de Software.  
© 2026 **NovaSoft Solutions**. Todos los derechos reservados.
