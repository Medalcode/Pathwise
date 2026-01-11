#!/bin/bash

# Script para empaquetar la extensión de Chrome
# Uso: ./package-extension.sh

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 AutoApply - Empaquetado de Extensión de Chrome"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Variables
EXTENSION_DIR="extension"
OUTPUT_DIR="dist"
ZIP_NAME="autoapply-extension-v1.0.0.zip"

# Crear directorio de salida
echo -e "${BLUE}📁 Creando directorio de salida...${NC}"
mkdir -p ${OUTPUT_DIR}

# Limpiar zip anterior si existe
if [ -f "${OUTPUT_DIR}/${ZIP_NAME}" ]; then
    echo -e "${YELLOW}🗑️  Eliminando versión anterior...${NC}"
    rm "${OUTPUT_DIR}/${ZIP_NAME}"
fi

# Crear zip de la extensión
echo -e "${BLUE}📦 Empaquetando extensión...${NC}"
cd ${EXTENSION_DIR}
zip -r ../${OUTPUT_DIR}/${ZIP_NAME} . \
    -x "*.git*" \
    -x "*node_modules*" \
    -x "*.DS_Store" \
    -x "*Thumbs.db"
cd ..

# Obtener tamaño del archivo
FILE_SIZE=$(du -h "${OUTPUT_DIR}/${ZIP_NAME}" | cut -f1)

echo ""
echo -e "${GREEN}✅ Extensión empaquetada exitosamente!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📦 Archivo creado:${NC} ${OUTPUT_DIR}/${ZIP_NAME}"
echo -e "${GREEN}📊 Tamaño:${NC} ${FILE_SIZE}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos pasos para instalar en Chrome:${NC}"
echo ""
echo -e "  1. Abre Chrome y ve a: ${GREEN}chrome://extensions/${NC}"
echo -e "  2. Activa el ${GREEN}\"Modo de desarrollador\"${NC} (esquina superior derecha)"
echo -e "  3. Haz click en ${GREEN}\"Cargar extensión sin empaquetar\"${NC}"
echo -e "  4. Selecciona la carpeta: ${GREEN}${EXTENSION_DIR}/${NC}"
echo ""
echo -e "${YELLOW}📤 Para publicar en Chrome Web Store:${NC}"
echo ""
echo -e "  1. Ve a: ${GREEN}https://chrome.google.com/webstore/devconsole${NC}"
echo -e "  2. Crea una cuenta de desarrollador (pago único de \$5)"
echo -e "  3. Sube el archivo: ${GREEN}${OUTPUT_DIR}/${ZIP_NAME}${NC}"
echo -e "  4. Completa la información y envía para revisión"
echo ""
echo -e "${BLUE}⚠️  Importante:${NC}"
echo -e "  - Actualiza ${GREEN}extension/config.js${NC} con tu URL de Cloud Run"
echo -e "  - Verifica que todas las URLs apunten a producción"
echo -e "  - Prueba la extensión antes de publicar"
echo ""
