# ================================================================
# DOCKERFILE - FRONTEND REACT + VITE (QUINTO AVANCE SENA)
# MiTienda: Build multi-stage → Node.js build + Nginx serve
# ================================================================

# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias e instalar
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Recibir la URL del backend como argumento de build (Railway la inyecta)
# Fallback local en caso de build manual sin --build-arg
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

# Copiar el resto del código fuente y compilar
COPY . .
RUN npm run build

# ── Stage 2: Serve con Nginx ──────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Eliminar configuración default de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar artefactos de build del Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway inyecta $PORT dinámicamente; por defecto usamos 80
EXPOSE 80

# Health check del contenedor Nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
