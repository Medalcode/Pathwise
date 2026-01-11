# Generación de Perfiles Profesionales con Groq AI

## 📋 Descripción

Este módulo implementa la **generación automática de 3 perfiles profesionales** basados en los datos extraídos del CV del usuario, utilizando la API de **Groq** con el modelo `llama-3.3-70b-versatile`.

## 🎯 Objetivo

Después de extraer todos los datos del CV (Paso 1), este paso utiliza inteligencia artificial para:

1. **Analizar** la información del CV (experiencia, educación, habilidades)
2. **Generar** 3 perfiles profesionales diferentes pero complementarios
3. **Optimizar** cada perfil para maximizar oportunidades de empleo
4. **Proporcionar** palabras clave y roles objetivo para cada perfil

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Frontend      │
│  (Dashboard)    │
└────────┬────────┘
         │
         │ POST /api/profile/generate-profiles
         ▼
┌─────────────────┐
│  Profile Route  │
│  (profile.js)   │
└────────┬────────┘
         │
         │ 1. Obtiene CV de DB
         │ 2. Llama a Groq Service
         ▼
┌─────────────────┐
│  Groq Service   │
│ (groqService.js)│
└────────┬────────┘
         │
         │ Groq API
         │ llama-3.3-70b-versatile
         ▼
┌─────────────────┐
│   Respuesta     │
│  3 Perfiles     │
└─────────────────┘
```

## 📦 Componentes Creados

### 1. **Groq Service** (`backend/services/groqService.js`)

Servicio encargado de la comunicación con la API de Groq.

**Funciones principales:**

- `generateProfessionalProfiles(cvData)` - Genera los 3 perfiles
- `buildPrompt(cvData)` - Construye el prompt optimizado
- `isConfigured()` - Verifica configuración de API key

**Características:**

- ✅ Manejo robusto de errores
- ✅ Limpieza de respuestas (elimina markdown)
- ✅ Validación de estructura JSON
- ✅ Logging detallado
- ✅ Metadata de uso (tokens, timestamp)

### 2. **Endpoint API** (`backend/routes/profile.js`)

**Ruta:** `POST /api/profile/generate-profiles`

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Perfiles profesionales generados exitosamente",
  "data": [
    {
      "title": "Desarrollador Full Stack Senior",
      "description": "Profesional con amplia experiencia...",
      "keySkills": ["JavaScript", "React", "Node.js"],
      "searchKeywords": ["full stack", "javascript", "react"],
      "experienceLevel": "Senior",
      "targetRoles": ["Full Stack Developer", "Tech Lead", "Software Architect"]
    }
    // ... 2 perfiles más
  ],
  "metadata": {
    "model": "llama-3.3-70b-versatile",
    "generatedAt": "2026-01-11T15:30:00.000Z",
    "tokensUsed": 1234
  }
}
```

**Errores posibles:**

- `503` - API key no configurada
- `404` - No hay CV cargado
- `500` - Error en generación

## 🔧 Configuración

### 1. Instalar dependencias

```bash
cd backend
npm install groq-sdk
```

### 2. Configurar API Key

Crear archivo `.env` en `backend/`:

```bash
PORT=3000
NODE_ENV=development
GROQ_API_KEY=gsk_tu_api_key_aqui
```

**Obtener API Key:**

1. Ir a [console.groq.com](https://console.groq.com)
2. Crear cuenta o iniciar sesión
3. Generar API key en la sección de configuración
4. Copiar y pegar en `.env`

### 3. Iniciar servidor

```bash
npm run dev
```

## 🧪 Pruebas

### Usando cURL

```bash
# 1. Primero subir un CV
curl -X POST http://localhost:3000/api/upload/cv \
  -F "cv=@/ruta/a/tu/cv.pdf"

# 2. Generar perfiles profesionales
curl -X POST http://localhost:3000/api/profile/generate-profiles \
  -H "Content-Type: application/json"
```

### Usando el Dashboard

1. Subir CV en la interfaz web
2. Hacer clic en "Generar Perfiles Profesionales"
3. Ver los 3 perfiles generados

## 📊 Estructura de Perfiles Generados

Cada perfil incluye:

| Campo             | Tipo   | Descripción                            |
| ----------------- | ------ | -------------------------------------- |
| `title`           | string | Título profesional claro y atractivo   |
| `description`     | string | Descripción breve (2-3 líneas)         |
| `keySkills`       | array  | Habilidades clave para ese perfil      |
| `searchKeywords`  | array  | Palabras clave para búsqueda de empleo |
| `experienceLevel` | string | Junior, Mid-level o Senior             |
| `targetRoles`     | array  | Roles objetivo sugeridos               |

## 🎨 Prompt Engineering

El sistema utiliza un prompt optimizado que:

1. **Contexto claro:** Define el rol del asistente (experto en RRHH)
2. **Instrucciones específicas:** Formato JSON exacto
3. **Datos estructurados:** Información del CV organizada por secciones
4. **Restricciones:** Solo JSON, sin markdown ni explicaciones

## 🔄 Flujo de Trabajo Completo

```
1. Usuario sube CV (PDF)
   ↓
2. Sistema extrae datos (parseCV)
   ↓
3. Datos se guardan en SQLite
   ↓
4. Usuario solicita generar perfiles
   ↓
5. Sistema recupera datos del CV
   ↓
6. Groq AI analiza y genera 3 perfiles
   ↓
7. Perfiles se devuelven al usuario
   ↓
8. Usuario puede usar perfiles para búsqueda de empleo
```

## 🚀 Próximos Pasos

- [ ] Guardar perfiles generados en la base de datos
- [ ] Permitir edición de perfiles generados
- [ ] Generar búsquedas automáticas basadas en perfiles
- [ ] Integrar con portales de empleo
- [ ] A/B testing de diferentes prompts
- [ ] Cache de perfiles generados

## 📝 Notas Técnicas

### Modelo Utilizado

- **Modelo:** `llama-3.3-70b-versatile`
- **Temperatura:** 0.7 (balance creatividad/precisión)
- **Max tokens:** 2048
- **Top-p:** 1.0

### Manejo de Errores

- Validación de API key
- Validación de CV existente
- Limpieza de respuestas markdown
- Validación de estructura JSON
- Logs detallados para debugging

### Seguridad

- API key en variable de entorno
- No se expone en respuestas
- Validación de entrada
- Sanitización de datos

## 🐛 Troubleshooting

### Error: "La API key de Groq no está configurada"

**Solución:** Verificar que existe el archivo `.env` con `GROQ_API_KEY`

### Error: "Primero debes subir un CV"

**Solución:** Subir un CV usando el endpoint `/api/upload/cv`

### Error: "La respuesta de Groq no contiene perfiles válidos"

**Solución:** Revisar logs del servidor, posible problema con el prompt o respuesta de Groq

### Respuesta con markdown

**Solución:** El sistema automáticamente limpia markdown, pero si persiste, revisar `groqService.js`

## 📚 Referencias

- [Groq API Documentation](https://console.groq.com/docs)
- [Llama 3.3 Model Card](https://www.llama.com/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

**Desarrollado por:** MedalCode  
**Fecha:** 2026-01-11  
**Versión:** 1.0.0
