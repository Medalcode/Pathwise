# 🚀 Panoptes (AutoApply) - Sistema Inteligente de Búsqueda y Aplicación a Empleos con IA

**Versión**: 4.8 (Enero 2026)

Panoptes es un ecosistema avanzado para automatizar la búsqueda de empleo que combina extensión Chrome, dashboard web y motor de IA.

---

## 🎯 Características Principales

- 🔌 **Extensión Chrome**: Autocompletado de formularios de aplicación
- 📊 **Dashboard Web**: Gestión de perfiles y aplicaciones
- 🧠 **Motor IA (Groq + Llama 3)**: Generación de perfiles y cover letters
- 📋 **Sistema Kanban**: Tracking de aplicaciones con estadísticas
- 🔐 **Autenticación JWT**: Sistema multi-usuario seguro
- 💾 **Persistencia Robusta**: Sync automático con Google Cloud Storage

---

## 🚀 Quick Start

```bash
# 1. Clonar repositorio
git clone https://github.com/medalcode/Panoptes.git
cd Panoptes

# 2. Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tu GROQ_API_KEY

# 3. Iniciar servidor
npm run dev
# Server en http://localhost:8080
```

**Extensión Chrome**:

1. Ir a `chrome://extensions/`
2. Activar "Developer mode"
3. Click "Load unpacked" → Seleccionar carpeta `/extension`

---

## 📚 Documentación

- **📖 [DOCUMENTATION.md](DOCUMENTATION.md)** - Documentación completa del proyecto
- **📋 [ESTADO_Y_ROADMAP.md](.gemini/antigravity/brain/.../ESTADO_Y_ROADMAP.md)** - Estado actual y mejoras futuras
- **🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guía de despliegue
- **⚙️ [INSTALL.md](INSTALL.md)** - Instalación detallada

---

## 🆕 Novedades v4.8

### ✅ Implementado

- ✅ Persistencia robusta con reintentos y detección de cambios
- ✅ Autenticación JWT + bcrypt
- ✅ Sistema de tracking Kanban (5 estados)
- ✅ Generador de cover letters IA (3 tonos)

### 📊 API Endpoints

- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/applications` - Listar aplicaciones 🔒
- `GET /api/applications/stats` - Estadísticas 🔒
- `POST /api/cover-letter/generate` - Generar carta 🔒

🔒 = Requiere autenticación JWT

---

## 🛠️ Stack Tecnológico

**Backend**: Node.js, Express, SQLite, Google Cloud Storage, Groq SDK  
**Frontend**: HTML/CSS/JS Vanilla (Diseño Cyberpunk)  
**Extensión**: Chrome Manifest V3  
**IA**: Llama 3.3 70B (Groq)

---

## 🎯 Roadmap

### Alta Prioridad

1. Tests automatizados (Jest + Playwright)
2. Frontend de autenticación (login.html)
3. UI del Kanban con drag & drop
4. UI del generador de cover letters

### Media Prioridad

5. Resume Tailoring (adaptar CV por oferta)
6. Soporte multi-sitio extensión (LinkedIn, Indeed)
7. Dark mode
8. CI/CD pipeline

Ver roadmap completo en [DOCUMENTATION.md](DOCUMENTATION.md#roadmap-de-mejoras-futuras)

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-mejora`
3. Commit: `git commit -m 'Add: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-mejora`
5. Crear Pull Request

---

## 📄 Licencia

MIT © 2026 MedalCode

---

## 📞 Contacto

- GitHub: [@medalcode](https://github.com/medalcode)
- Proyecto: [Panoptes](https://github.com/medalcode/Panoptes)
