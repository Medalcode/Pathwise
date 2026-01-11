#!/bin/bash

# Script de prueba para el generador de perfiles profesionales
# Uso: ./test-profile-generation.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Test: Generación de Perfiles Profesionales con Groq AI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="http://localhost:3000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Verificar que el servidor esté corriendo
echo "1️⃣  Verificando servidor..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/health)

if [ "$HEALTH_CHECK" != "200" ]; then
    print_error "El servidor no está corriendo en $API_URL"
    print_info "Inicia el servidor con: cd backend && npm run dev"
    exit 1
fi
print_success "Servidor activo"
echo ""

# 2. Verificar si existe un perfil
echo "2️⃣  Verificando perfil existente..."
PROFILE_CHECK=$(curl -s $API_URL/api/profile)

if echo "$PROFILE_CHECK" | grep -q "Perfil no encontrado"; then
    print_error "No hay perfil cargado"
    print_info "Primero sube un CV usando: curl -X POST $API_URL/api/upload/cv -F 'cv=@tu-cv.pdf'"
    exit 1
fi
print_success "Perfil encontrado"
echo ""

# 3. Generar perfiles profesionales
echo "3️⃣  Generando perfiles profesionales con Groq AI..."
echo ""

RESPONSE=$(curl -s -X POST $API_URL/api/profile/generate-profiles \
    -H "Content-Type: application/json")

# Verificar si la respuesta es exitosa
if echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "Perfiles generados exitosamente!"
    echo ""
    
    # Mostrar los perfiles de forma bonita
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 PERFILES PROFESIONALES GENERADOS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Usar jq si está disponible para formatear JSON
    if command -v jq &> /dev/null; then
        echo "$RESPONSE" | jq -r '.data[] | "
╔════════════════════════════════════════════════════════════╗
║ PERFIL: \(.title)
╠════════════════════════════════════════════════════════════╣
║ Nivel: \(.experienceLevel)
║ 
║ Descripción:
║ \(.description)
║
║ Habilidades Clave:
║ • \(.keySkills | join("\n║ • "))
║
║ Palabras Clave:
║ \(.searchKeywords | join(", "))
║
║ Roles Objetivo:
║ • \(.targetRoles | join("\n║ • "))
╚════════════════════════════════════════════════════════════╝
"'
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📈 METADATA"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$RESPONSE" | jq '.metadata'
        
    else
        # Fallback sin jq
        echo "$RESPONSE" | python3 -m json.tool
        print_info "Instala 'jq' para mejor formato: sudo apt install jq"
    fi
    
else
    print_error "Error generando perfiles"
    echo ""
    echo "Respuesta del servidor:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    
    # Verificar errores comunes
    if echo "$RESPONSE" | grep -q "API key de Groq no está configurada"; then
        echo ""
        print_info "Configura tu API key de Groq:"
        echo "  1. Crea un archivo .env en backend/"
        echo "  2. Agrega: GROQ_API_KEY=tu_api_key_aqui"
        echo "  3. Obtén tu API key en: https://console.groq.com"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
