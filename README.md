# 🚀 Panoptes (AutoApply) - Sistema Inteligente de Búsqueda y Aplicación a Empleos con IA

**Versión**: 5.2 (Enero 2026)

Panoptes es un ecosistema avanzado para automatizar la búsqueda de empleo que combina extensión Chrome, dashboard web y motor de IA. Destaca por su capacidad de parsear CVs complejos y generar perfiles adaptados.

---

## 🎯 Características Principales

- 🔌 **Extensión Chrome**: Autocompletado de formularios de aplicación
- 📊 **Dashboard Web Premium**: Interfaz "Glassmorphism" con animaciones fluidas
- 🧠 **Motor IA (Groq + Llama 3)**: Generación de perfiles y cover letters inteligentes
- 📄 **Procesamiento de CV Avanzado**: Parser de PDF con preprocesamiento y detección estructural
- ⚡ **Generación Instantánea**: Cacheo inteligente de resultados para velocidad extrema
- 🔍 **Búsqueda Avanzada**: Sistema de búsqueda de empleos con scoring de match analítico
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

# 2. Iniciar Web Dashboard (Local)
# Simplemente abrir web-dashboard/index.html en un navegador
# O usar Live Server
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

## 🆕 Novedades v5.2 (Parser & UI Overhaul)

### ✅ Motor de Parsing de PDF (Deep Extract)

- **Layout Aware Engine**: Algoritmo que detecta automáticamente CVs de dos columnas y procesa el texto en orden lógico visual.
- **Split View Interface**: Visor de PDF integrado junto al formulario de extracción para validación visual inmediata.
- **Visual Career Timeline**: Gráfico interactivo que visualiza la trayectoria laboral y detecta automáticamente huecos (gaps) temporales.
- **ATS Compatbility Score**: Análisis en tiempo real de la legibilidad del CV para sistemas automáticos.
- **Preprocesamiento Inteligente**: Reconstrucción estructural de PDFs con formato roto.
- **Extracción de Precisión**: Lógica mejorada para separar Experiencia de Educación.

### ✅ Generación de Perfiles Premium

- **Glassmorphism UI**: Tarjetas holográficas con efectos de hover y feedback visual.
- **Salary Market Value**: Estimación automática de rango salarial basada en rol, nivel y ubicación geográfica.
- **Sistema de Caché**: Persistencia local de perfiles generados (7 días de retención).
- **Preview Panel**: Vista detallada de perfiles generados antes de seleccionarlos.
- **Acciones Rápidas**: Copiar, regenerar y descargar PDF directamente.

### ✅ Demo de Búsqueda de Empleo ("Living Search")

- **Generador de Datos Mock**: Simulación realista de ofertas basada en el perfil del usuario.
- **Análisis de Match**: Visualización de compatibilidad y habilidades faltantes.
- **Cover Letter AI**: Generación instantánea de borradores de carta de presentación.
- **Modal de Detalles**: Vista expandida con descripción rica y métricas.

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
2.  Persistencia en Backend de postulaciones (Kanban real)
3.  Resume Tailoring (generación de PDF adaptado por oferta)

### Media Prioridad

4.  Soporte multi-sitio extensión (LinkedIn, Indeed explícito)
5.  CI/CD pipeline completo
6.  Análisis de salario de mercado con IA
