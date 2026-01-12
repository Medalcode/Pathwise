# Dockerfile para Panoptes - Optimizado para Cloud Run
FROM node:18-slim

# Metadata
LABEL maintainer="MedalCode"
LABEL description="Panoptes - Sistema de aplicación automática a empleos con IA"

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY backend/package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar todo el código del backend
COPY backend/ ./


# Copiar dashboard web al lugar correcto relativo al backend
COPY web-dashboard/ /app/web-dashboard/

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar
CMD ["node", "server.js"]
