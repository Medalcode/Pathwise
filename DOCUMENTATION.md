# 🚀 Panoptes (AutoApply) - Documentación Completa

**Versión**: 4.8  
**Última actualización**: 19 Enero 2026

---

## 📖 Índice

1. [Descripción General](#descripción-general)
2. [Estado Actual](#estado-actual)
3. [Instalación](#instalación)
4. [Arquitectura](#arquitectura)
5. [Mejoras Implementadas](#mejoras-implementadas)
6. [Roadmap de Mejoras Futuras](#roadmap-de-mejoras-futuras)
7. [API Reference](#api-reference)
8. [Deployment](#deployment)

---

## Descripción General

**Panoptes** es un ecosistema avanzado para automatizar la búsqueda de empleo que combina:

- 🔌 **Extensión Chrome**: Autocompletado de formularios de aplicación
- 📊 **Dashboard Web**: Gestión de perfiles y aplicaciones
- 🧠 **Motor IA (Groq + Llama 3)**: Generación de perfiles y cover letters
- 🔍 **Scrapers Modulares**: Búsqueda en múltiples portales de empleo
- 📋 **Sistema Kanban**: Tracking de aplicaciones

---

## Estado Actual

### ✅ Implementado (v4.8)

#### Backend

- ✅ Persistencia robusta con GCS (reintentos, detección de cambios)
- ✅ Autenticación JWT + bcrypt
- ✅ Sistema multi-perfil
- ✅ Tracking de aplicaciones (Kanban API)
- ✅ Generador de cover letters (3 tonos)
- ✅ Parser de CV con IA
- ✅ Scrapers de empleos (ChileTrabajos, CompuTrabajo)

#### Frontend

- ✅ Dashboard principal
- ✅ Editor de perfiles
- ✅ Búsqueda de empleos

#### Extensión

- ✅ Autocompletado de formularios
- ✅ Sincronización con backend

### ⏳ Pendiente

- ⏳ Tests automatizados (Jest + Playwright)
- ⏳ Frontend de autenticación (login.html)
- ⏳ UI del Kanban (kanban.html)
- ⏳ UI del generador de cover letters
- ⏳ CI/CD pipeline

---

## Instalación

### Requisitos

- Node.js 18+
- API Key de Groq (para IA)
- Google Cloud cuenta (opcional, para GCS)

### Setup Local

```bash
# 1. Clonar repositorio
git clone https://github.com/medalcode/Panoptes.git
cd Panoptes

# 2. Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

# 3. Iniciar servidor
npm run dev
# Server en http://localhost:8080

# 4. Extensión Chrome
# Ir a chrome://extensions/
# Activar "Developer mode"
# Click "Load unpacked"
# Seleccionar carpeta /extension
```

### Variables de Entorno

```env
PORT=8080
NODE_ENV=development
GROQ_API_KEY=tu_api_key_de_groq
GCS_BUCKET_NAME=tu_bucket_opcional
JWT_SECRET=tu_secret_min_32_chars
JWT_EXPIRATION=7d
```

---

## Arquitectura

### Stack Tecnológico

**Backend**:

- Node.js + Express
- SQLite (persistencia local)
- Google Cloud Storage (backup)
- Groq SDK (IA)
- JWT + bcrypt (auth)

**Frontend**:

- HTML/CSS/JS Vanilla
- Diseño Cyberpunk

**Extensión**:

- Chrome Manifest V3
- Content scripts + Background worker

### Estructura de Directorios

```
Panoptes/
├── backend/
│   ├── services/
│   │   ├── authService.js       # JWT + bcrypt
│   │   ├── groqService.js       # IA (perfiles + cover letters)
│   │   ├── jobService.js        # Búsqueda de empleos
│   │   └── storageService.js    # Sync con GCS
│   ├── routes/
│   │   ├── auth.js              # Register/login
│   │   ├── profiles.js          # Multi-perfil
│   │   ├── applications.js      # Kanban
│   │   └── coverLetter.js       # Generador
│   ├── database/
│   │   ├── db.js                # SQLite
│   │   ├── profilesSystem.js    # Schema perfiles
│   │   └── applicationsSchema.js # Schema aplicaciones
│   └── middleware/
│       └── auth.js              # JWT middleware
├── web-dashboard/
│   ├── index.html
│   ├── css/
│   └── js/
└── extension/
    ├── manifest.json
    ├── background/
    ├── content/
    └── popup/
```

---

## Mejoras Implementadas

### 1. Persistencia de Datos Robusta ✅

**Problema**: Cloud Run es efímero, datos se perdían al reiniciar.

**Solución**:

- Reintentos con backoff exponencial (3 intentos)
- Detección de cambios vía MD5 hash
- Sync automático cada 5 minutos
- Upload al cerrar servidor (graceful shutdown)

**Archivo**: `backend/services/storageService.js`

### 2. Sistema de Autenticación ✅

**Características**:

- Registro con validación (email + password fuerte)
- Login con JWT (expiración 7 días)
- Middleware de protección de rutas
- Bcrypt con 10 salt rounds

**Endpoints**:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` 🔒

**Archivos**:

- `backend/services/authService.js`
- `backend/middleware/auth.js`
- `backend/routes/auth.js`

### 3. Sistema de Tracking Kanban ✅

**Características**:

- Estados: `to_apply → applied → interview → offer → rejected`
- CRUD completo de aplicaciones
- Estadísticas: total, por estado, tasa de respuesta
- Filtros por estado, fecha, empresa

**Endpoints**:

- `GET /api/applications` 🔒
- `GET /api/applications/stats` 🔒
- `POST /api/applications` 🔒
- `PATCH /api/applications/:id/status` 🔒 (para drag & drop)

**Archivos**:

- `backend/database/applicationsSchema.js`
- `backend/routes/applications.js`

### 4. Generador de Cover Letters IA ✅

**Características**:

- 3 tonos: Professional, Casual, Technical
- Personalización basada en perfil del usuario
- Longitud: 250-300 palabras
- Modelo: Llama 3.3 70B (Groq)

**Endpoint**:

- `POST /api/cover-letter/generate` 🔒

**Request**:

```json
{
  "profileId": 1,
  "jobDescription": "...",
  "jobTitle": "Senior Developer",
  "company": "Tech Corp",
  "tone": "professional"
}
```

**Archivos**:

- `backend/services/groqService.js` (función `generateCoverLetter()`)
- `backend/routes/coverLetter.js`

---

## Roadmap de Mejoras Futuras

### 🔴 Alta Prioridad

1. **Tests Automatizados** (2 días)
   - Unit tests con Jest
   - E2E tests con Playwright
   - Cobertura 80%+

2. **Frontend de Autenticación** (1 día)
   - login.html + registro
   - Manejo de tokens en localStorage
   - Redirect automático

3. **UI del Kanban** (2 días)
   - Tablero drag & drop (SortableJS)
   - Modal de creación/edición
   - Estadísticas visuales

4. **UI Cover Letter Generator** (1 día)
   - Formulario de input
   - Preview editable
   - Copiar/descargar

### 🟡 Media Prioridad

5. **Resume Tailoring** (3 días)
   - Adaptar CV por oferta específica
   - Reordenar experiencias por relevancia
   - Generar PDF personalizado

6. **Soporte Multi-Sitio Extensión** (5 días)
   - LinkedIn Easy Apply
   - Indeed
   - Workday

7. **Dark Mode** (4 horas)
   - Toggle en UI
   - CSS variables
   - Persistencia de preferencia

8. **CI/CD Pipeline** (6 horas)
   - GitHub Actions
   - Deploy automático a Cloud Run
   - Tests en PR

### 🟢 Baja Prioridad

9. **Simulador de Entrevistas IA** (4 días)
10. **PWA** (2 días)
11. **i18n** (Español/Inglés/Portugués) (2 días)
12. **LinkedIn API Integration** (3 días)

---

## API Reference

### Autenticación

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response 201:
{
  "success": true,
  "user": { "id": 1, "email": "..." },
  "token": "eyJhbGc..."
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "success": true,
  "user": { "id": 1, "email": "..." },
  "token": "eyJhbGc..."
}
```

### Aplicaciones (Kanban)

#### Listar Aplicaciones

```http
GET /api/applications?status=applied&limit=50
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "applications": [...],
  "count": 25
}
```

#### Estadísticas

```http
GET /api/applications/stats
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "stats": {
    "total": 45,
    "byStatus": {
      "to_apply": 10,
      "applied": 25,
      "interview": 7,
      "offer": 2,
      "rejected": 1
    },
    "responseRate": 36.0,
    "thisWeek": 8
  }
}
```

#### Crear Aplicación

```http
POST /api/applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "jobTitle": "Senior Developer",
  "company": "Tech Corp",
  "url": "https://...",
  "status": "to_apply",
  "salaryRange": "$80k-$100k",
  "location": "Remote"
}

Response 201:
{
  "success": true,
  "application": { "id": 123, ... }
}
```

### Cover Letters

#### Generar Carta

```http
POST /api/cover-letter/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "profileId": 1,
  "jobDescription": "Buscamos desarrollador Full Stack...",
  "jobTitle": "Full Stack Developer",
  "company": "Startup XYZ",
  "tone": "casual"
}

Response 200:
{
  "success": true,
  "coverLetter": "Me entusiasma la oportunidad...",
  "wordCount": 287,
  "metadata": {
    "tone": "casual",
    "tokensUsed": 645
  }
}
```

### Perfiles

#### Listar Perfiles

```http
GET /api/profiles
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "profiles": [
    {
      "id": 1,
      "name": "Frontend Developer",
      "type": "frontend",
      "isDefault": true
    }
  ]
}
```

---

## Deployment

### Google Cloud Run

```bash
# 1. Build y deploy
./deploy-cloud-run.sh

# 2. Configurar variables de entorno en Cloud Run Console
GROQ_API_KEY=...
GCS_BUCKET_NAME=...
JWT_SECRET=...
```

### Vercel (Frontend)

```bash
cd web-dashboard
npx vercel --prod
```

---

## Métricas del Proyecto

| Métrica          | Valor          |
| ---------------- | -------------- |
| Versión          | 4.8            |
| Endpoints API    | 20+            |
| Líneas de código | ~15,000        |
| Archivos backend | 18             |
| Tests            | 0 (pendiente)  |
| Cobertura        | 0% (pendiente) |

---

## Contribuir

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-mejora`
3. Commit: `git commit -m 'Add: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-mejora`
5. Crear Pull Request

---

## Licencia

MIT © 2026 MedalCode

---

## Contacto

- GitHub: [@medalcode](https://github.com/medalcode)
- Proyecto: [Panoptes](https://github.com/medalcode/Panoptes)

---

**Nota**: Este documento consolida toda la documentación del proyecto. Para detalles técnicos específicos, revisar los archivos de código fuente.
