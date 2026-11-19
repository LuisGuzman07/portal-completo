# =========================================================================
# NovaSoft Solutions — Dockerfile Corporativo Multietapa
# =========================================================================
# Etapa 1: Compilación de activos estáticos con Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de paquetes
COPY package*.json ./

# Instalar dependencias exactas
RUN npm ci

# Copiar código fuente del proyecto
COPY . .

# Argumento para inyectar correo de contacto si se especifica en build time
ARG VITE_CONTACT_EMAIL=contacto@novasoft.dev
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL

# Compilación optimizada para producción con Vite
RUN npm run build

# =========================================================================
# Etapa 2: Servidor de producción ultraligero con Nginx Alpine
FROM nginx:1.27-alpine AS runner

# Copiar archivo de configuración personalizado de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos estáticos generados en la etapa de compilación
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto interno HTTP
EXPOSE 80

# Comprobación de salud del servicio (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
