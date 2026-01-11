#!/bin/bash

# Script de despliegue para Google Cloud Run
# Uso: ./deploy-cloud-run.sh [PROJECT_ID] [REGION]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 AutoApply - Despliegue en Google Cloud Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Variables
PROJECT_ID=${1:-""}
REGION=${2:-"us-central1"}
SERVICE_NAME="autoapply"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Verificar que se proporcionó PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar el PROJECT_ID${NC}"
    echo -e "${YELLOW}Uso: ./deploy-cloud-run.sh [PROJECT_ID] [REGION]${NC}"
    echo -e "${YELLOW}Ejemplo: ./deploy-cloud-run.sh mi-proyecto-123 us-central1${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuración:${NC}"
echo -e "  Project ID: ${GREEN}${PROJECT_ID}${NC}"
echo -e "  Region: ${GREEN}${REGION}${NC}"
echo -e "  Service: ${GREEN}${SERVICE_NAME}${NC}"
echo -e "  Image: ${GREEN}${IMAGE_NAME}${NC}"
echo ""

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo -e "${YELLOW}Instala gcloud desde: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está instalado${NC}"
    echo -e "${YELLOW}Instala Docker desde: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Configurar proyecto
echo -e "${BLUE}🔧 Configurando proyecto...${NC}"
gcloud config set project ${PROJECT_ID}

# Habilitar APIs necesarias
echo -e "${BLUE}🔌 Habilitando APIs necesarias...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Configurar autenticación de Docker
echo -e "${BLUE}🔐 Configurando autenticación de Docker...${NC}"
gcloud auth configure-docker

# Build de la imagen
echo -e "${BLUE}🏗️  Construyendo imagen Docker...${NC}"
docker build -t ${IMAGE_NAME}:latest .

# Push de la imagen
echo -e "${BLUE}📤 Subiendo imagen a Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

# Desplegar en Cloud Run
echo -e "${BLUE}🚀 Desplegando en Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8080 \
  --set-env-vars NODE_ENV=production

# Obtener URL del servicio
echo ""
echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)')

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 Tu aplicación está disponible en:${NC}"
echo -e "${YELLOW}${SERVICE_URL}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚙️  Próximos pasos:${NC}"
echo -e "  1. Configura las variables de entorno (GROQ_API_KEY)"
echo -e "  2. Actualiza la extensión de Chrome con la nueva URL"
echo -e "  3. Prueba la aplicación en: ${SERVICE_URL}"
echo ""
echo -e "${BLUE}📝 Para configurar variables de entorno:${NC}"
echo -e "${YELLOW}gcloud run services update ${SERVICE_NAME} \\${NC}"
echo -e "${YELLOW}  --region ${REGION} \\${NC}"
echo -e "${YELLOW}  --set-env-vars GROQ_API_KEY=tu_api_key_aqui${NC}"
echo ""
