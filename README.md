# Panoptes (AutoApply) - Sistema Inteligente de Búsqueda y Aplicación a Empleos con IA

🚀 **Panoptes** es un ecosistema avanzado para automatizar la búsqueda de empleo. Combina una extensión de Chrome, un dashboard de gestión y un motor de IA que optimiza tu perfil para pasar los filtros ATS y encontrar las mejores oportunidades.

**🌐 Estado Actual:** Versión 4.7 (Enero 2026)

## 🌟 Novedades de la Versión 4.6 (Enero 2026)

### 🧠 Motor de Perfiles IA Mejorado (Groq + Llama 3)

- **Prompt Engineering Contextual**: Ahora la IA analiza no solo tu experiencia, sino también tus **Certificaciones, Idiomas y Proyectos** para generar perfiles de alto impacto.
- **Estrategias Multi-Perfil**: Genera hasta 3 variantes de perfil (ej: "Full Stack", "Backend Specialist", "Tech Lead") para atacar diferentes nichos de mercado.

### 🔌 Arquitectura de Búsqueda Modular (Plugins)

- **Plugin System**: Nuevo sistema de scrapers modulares. Agregar una nueva fuente de empleo (ej: LinkedIn, Indeed) es tan fácil como añadir un archivo `.js`.
- **Fuentes Actuales**: ChileTrabajos, CompuTrabajo (Optimizados con anti-bot delay).
- **Matching Híbrido**: Algoritmo que combina palabras clave (20%), skills (40%) y coincidencia de título (40%) para rankear ofertas. Deduplicación inteligente de ofertas repetidas.

### � Gestión de Datos Profesional

- **Nuevas Secciones Soportadas**:
  - 📜 **Certificaciones**: Valida tu expertise con credenciales.
  - �️ **Idiomas**: Nivel de dominio (Básico a Nativo).
  - � **Proyectos**: Portafolio destacado con URLs.
- **Validación Robusta**: Reglas de negocio para fechas, URLs y consistencia de datos.

---

## 🚀 Características Core

### 1. Extracción de Datos (CV Parser)

- **PDF a JSON**: Convierte tu CV en datos estructurados.
- **Detección de Skills**: Identifica +60 tecnologías automáticamente.
- **Edición en Vivo**: Interfaz visual para corregir o enriquecer los datos extraídos antes de procesarlos.

### 2. Dashboard de Control

- **Stepper Guiado**: Flujo paso a paso (Subir CV -> Verificar -> IA -> Búsqueda).
- **Gestión de Perfiles**: Crea, edita y guarda múltiples versiones de tu "yo profesional".
- **Búsqueda en Tiempo Real**: Lanza búsquedas federadas en múltiples portales con un solo click.

### 3. Extensión de Chrome (AutoApply)

- **Autocompletado**: Rellena formularios de postulación (Workday, Greenhouse, etc.) con sus datos guardados.
- **Sincronización Bidireccional**: Lo que editas en el dashboard se refleja en la extensión.

---

## 📁 Estructura del Proyecto

```
Panoptes/
├── backend/               # Servidor Node.js (Express)
│   ├── services/          # Lógica de negocio (GroqService, JobService)
│   ├── scrapers/          # Plugins de búsqueda de empleo (Modular)
│   └── database/          # SQLite + GCS Sync
├── web-dashboard/         # Interfaz de Usuario (HTML/JS Vanilla Moderno)
├── extension/             # Extensión Chrome Manifest V3
└── docs/                  # Documentación técnica detallada
```

## 🛠️ Instalación y Despliegue

### Requisitos

- Node.js 18+
- API Key de Groq (para funcionalidades de IA)
- Cuenta de Google Cloud (opcional, para persistencia remota)

### Local Development

```bash
# 1. Backend
cd backend
npm install
npm run dev
# Server running on http://localhost:3000

# 2. Frontend
# Abrir http://localhost:3000 en tu navegador (El backend sirve el frontend)
```

### 🚀 Despliegue Simplificado

### Backend (Google Cloud Run)

El backend procesa los CVs usando IA y gestiona la base de datos.

```bash
./deploy-cloud-run.sh
```

### Frontend (Vercel)

El dashboard web moderno con interfaz Cyberpunk.

```bash
cd web-dashboard
npx vercel --prod
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Revisa los issues abiertos para empezar.

## 📄 Licencia

MIT © 2026 MedalCode
