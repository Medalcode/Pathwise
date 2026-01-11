# 🚀 Quick Start: Generación de Perfiles Profesionales

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Configurar API Key de Groq

```bash
# Obtén tu API key gratis en: https://console.groq.com
cd backend
echo "GROQ_API_KEY=gsk_tu_api_key_aqui" >> .env
```

### 2️⃣ Instalar Dependencias

```bash
npm install
# Ya incluye groq-sdk
```

### 3️⃣ Iniciar Servidor

```bash
npm run dev
# Servidor en http://localhost:3000
```

### 4️⃣ Subir tu CV

```bash
curl -X POST http://localhost:3000/api/upload/cv \
  -F "cv=@/ruta/a/tu/cv.pdf"
```

### 5️⃣ Generar Perfiles

```bash
curl -X POST http://localhost:3000/api/profile/generate-profiles \
  -H "Content-Type: application/json"
```

## 🎯 Respuesta Esperada

```json
{
  "success": true,
  "message": "Perfiles profesionales generados exitosamente",
  "data": [
    {
      "title": "Desarrollador Full Stack Senior",
      "description": "Profesional con amplia experiencia...",
      "keySkills": ["JavaScript", "React", "Node.js"],
      "searchKeywords": ["full stack", "javascript"],
      "experienceLevel": "Senior",
      "targetRoles": ["Full Stack Developer", "Tech Lead"]
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

## 🧪 Probar con Script

```bash
chmod +x test-profile-generation.sh
./test-profile-generation.sh
```

## 📱 Integrar en Frontend

```javascript
// Agregar en tu dashboard
async function generateProfiles() {
  const response = await fetch(
    "http://localhost:3000/api/profile/generate-profiles",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  const result = await response.json();
  console.log("Perfiles generados:", result.data);

  // Renderizar en UI
  result.data.forEach((profile) => {
    console.log(`📌 ${profile.title}`);
    console.log(`   Nivel: ${profile.experienceLevel}`);
    console.log(`   Skills: ${profile.keySkills.join(", ")}`);
  });
}

// Llamar cuando el usuario haga click
document
  .getElementById("generate-btn")
  .addEventListener("click", generateProfiles);
```

## 🎨 Agregar Botón en Dashboard

```html
<!-- En web-dashboard/index.html -->
<div class="action-card">
  <h3>🤖 Perfiles Profesionales con IA</h3>
  <p>Genera 3 perfiles optimizados para búsqueda de empleo</p>
  <button onclick="generateProfiles()" class="btn-primary">
    Generar Perfiles
  </button>
  <div id="profiles-container"></div>
</div>
```

## 🔧 Troubleshooting Rápido

### ❌ Error: "API key no configurada"

```bash
# Verificar .env
cat backend/.env | grep GROQ_API_KEY

# Si no existe, crear
echo "GROQ_API_KEY=tu_api_key" >> backend/.env
```

### ❌ Error: "Perfil no encontrado"

```bash
# Subir CV primero
curl -X POST http://localhost:3000/api/upload/cv \
  -F "cv=@tu-cv.pdf"
```

### ❌ Error: "Cannot find module 'groq-sdk'"

```bash
cd backend
npm install groq-sdk
```

## 📚 Documentación Completa

- **[GROQ_PROFILE_GENERATION.md](./GROQ_PROFILE_GENERATION.md)** - Guía completa
- **[EXAMPLE_GENERATED_PROFILES.md](./EXAMPLE_GENERATED_PROFILES.md)** - Ejemplos reales
- **[SESSION_GROQ_PROFILES.md](./SESSION_GROQ_PROFILES.md)** - Resumen de desarrollo

## 🎯 Próximos Pasos

1. ✅ Configurar Groq API key
2. ✅ Probar generación de perfiles
3. ⬜ Integrar en dashboard web
4. ⬜ Guardar perfiles en base de datos
5. ⬜ Permitir edición de perfiles
6. ⬜ Usar perfiles para búsqueda automática

## 💡 Tips

- **Gratis**: Groq ofrece tier gratuito generoso
- **Rápido**: Respuestas en ~2-3 segundos
- **Calidad**: Modelo llama-3.3-70b es muy capaz
- **Personalizable**: Edita el prompt en `groqService.js`

## 🆘 Ayuda

¿Problemas? Revisa:

1. Logs del servidor (`npm run dev`)
2. Respuesta completa del endpoint
3. Documentación de Groq: https://console.groq.com/docs

---

**¡Listo para generar tus perfiles profesionales! 🚀**
