# 🚀 Panoptes (AutoApply) - Sistema Inteligente de Búsqueda y Aplicación a Empleos con IA

**Versión**: 5.0 (Enero 2026)

Panoptes es un ecosistema avanzado para automatizar la búsqueda de empleo que combina extensión Chrome, dashboard web y motor de IA.

---

## 🎯 Características Principales

- 🔌 **Extensión Chrome**: Autocompletado de formularios de aplicación
- 📊 **Dashboard Web**: Gestión de perfiles y aplicaciones (Cyberpunk Aesthetics)
- 🧠 **Motor IA (Groq + Llama 3)**: Generación de perfiles y cover letters
- 🔍 **Búsqueda Avanzada**: Sistema modular de búsqueda de empleos con scoring de match
- 🔐 **Autenticación JWT**: Sistema multi-usuario seguro con UI dedicada
- 🌎 **Internacionalización (i18n)**: Soporte nativo Inglés/Español
- 🎨 **Temas Visuales**: Modo Oscuro/Claro persistente
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
# Editar .env con tu GROQ_API_KEY y credenciales GCS

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
- **🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guía de despliegue
- **⚙️ [INSTALL.md](INSTALL.md)** - Instalación detallada

---

## 🆕 Novedades v5.0

### ✅ Frontend Modular & UI Refactor

- **Arquitectura Modular**: Separación de lógica en módulos `auth.js`, `ui.js`, `cvProcessor.js`, `jobSearch.js`.
- **CV Processor**: Nuevo motor de extracción de datos de PDF optimizado con feedback visual.
- **UI System**: Sistema de utilidades de interfaz centralizado.
- **Job Search**: Módulo independiente de búsqueda con tarjetas de resultados enriquecidas.

### ✅ Experiencia de Usuario

- **Auth UI**: Modal de login/registro con validaciones y animaciones.
- **Dark/Light Mode**: Toggle de temas con persistencia y detección automática de preferencias.
- **Multi-idioma**: Interfaz completamente traducida (EN/ES).

### ✅ Backend Integration

- **Persistencia**: Sync automático con reintentos y detección de cambios.
- **Seguridad**: Autenticación vía JWT en todos los endpoints críticos.

---

## 🛠️ Stack Tecnológico

**Backend**: Node.js, Express, SQLite, Google Cloud Storage, Groq SDK  
**Frontend**: HTML5, CSS3 (Tailwind + Custom CSS Variables), Vanilla JS (ES6+ Modules)
**Extensión**: Chrome Manifest V3  
**IA**: Llama 3.3 70B (Groq)

---

## 🎯 Roadmap

### Alta Prioridad

1.  Tests automatizados (Jest + Playwright)
2.  UI del Kanban con drag & drop y estadísticas visuales
3.  Resume Tailoring (generación de PDF adaptado por oferta)

### Media Prioridad

4.  Soporte multi-sitio extensión (LinkedIn, Indeed explícito)
5.  CI/CD pipeline completo
6.  Análisis de salario de mercado con IA

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
