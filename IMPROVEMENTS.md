# 🚀 Roadmap de Mejoras para Panoptes

A continuación se detalla una lista de mejoras recomendadas para llevar a Panoptes al siguiente nivel, categorizadas por prioridad e impacto.

## 🔴 Prioridad Crítica (Infraestructura 100% Gratuita)

### 1. Persistencia de Datos "Zero Cost"

**Problema:** Cloud Run es efímero y Cloud SQL no tiene capa gratuita permanente.
**Solución Open Source & Free Tier:**

- **SQLite + Google Cloud Storage (GCS):**
  - Usar un bucket de GCS (5GB gratis/mes) como almacenamiento persistente.
  - Implementar un script de "Backup & Restore" automático:
    - **Al iniciar:** Descargar `autoapply.db` del bucket.
    - **Periódicamente/Al cerrar:** Subir cambios al bucket.
  - Usar `@google-cloud/storage` (librería oficial open source).
- **LiteFS (Opcional):** Explorar LiteFS para replicación de SQLite si se necesita escalar.

### 2. Autenticación Gratuita

**Solución:**

- **Firebase Authentication (Plan Spark):**
  - Gratis para siempre (email/password ilimitados).
  - Fácil integración con frontend y backend (verificación de JWT).
  - Permite separar los datos de cada usuario en la base de datos.
- **Alternativa 100% Self-Hosted:**
  - Implementar autenticación local con `passport.js` + JWT.
  - Guardar usuarios en la misma base de datos SQLite.

---

## 🟡 Prioridad Media (Funcionalidades AI & Core)

### 3. Generador de Cover Letters con IA

**Idea:** Usar la misma integración de Groq para generar cartas de presentación personalizadas.
**Flujo:**

1. Usuario pega la descripción del trabajo.
2. Selecciona uno de sus perfiles generados.
3. La IA genera una carta de presentación adaptada específicamente para ese rol y empresa.

### 4. Adaptador de CV por Oferta (Resume Tailoring)

**Idea:** Ajustar el CV automáticamente para una oferta específica.
**Flujo:**

1. Usuario introduce la descripción de la oferta.
2. La IA reordena y reescribe puntos del CV para resaltar la experiencia más relevante.
3. Generar un PDF descargable de esta versión "tailored".

### 5. Simulador de Entrevistas

**Idea:** Chatbot interactivo para practicar entrevistas.
**Flujo:**

1. La IA asume el rol de entrevistador para el perfil seleccionado.
2. Realiza preguntas técnicas y de comportamiento.
3. Evalúa las respuestas del usuario y da feedback.

---

## 🟢 Mejoras de Extensión y Automatización

### 6. Soporte Específico para Sitios Populares

**Idea:** Mejorar la lógica de autocompletado para sitios complejos.

- **LinkedIn Easy Apply:** Script específico para detectar y llenar el modal de LinkedIn.
- **Indeed / Glassdoor:** Mapeo específico de sus selectores.
- **Workday:** Soporte para estos portales corporativos que suelen ser difíciles de automatizar.

### 7. Tracking de Aplicaciones (Kanban)

**Idea:** Convertir el dashboard en un tracker de empleos.

- Cuando el usuario aplica usando la extensión, guardar automáticamente el puesto, empresa y fecha.
- Tablero visual: Por aplicar -> Aplicado -> Entrevista -> Oferta -> Rechazado.

### 8. Captura de Evidencia

**Idea:** Tomar una captura de pantalla automática de la página de confirmación "¡Aplicación enviada!" y guardarla en el registro de la aplicación.

---

## 🔵 Mejoras de UX/UI

### 9. Dark Mode

**Idea:** Implementar un toggle para modo oscuro en el dashboard y la extensión.

- Mejora la accesibilidad y la experiencia de uso nocturno.

### 10. Exportación de Perfil

**Idea:** Permitir exportar el perfil editado en el dashboard.

- Formatos: PDF estilizado, JSON (para backups), o formato compatible con LinkedIn.

### 11. Onboarding Interactivo

**Idea:** Guía paso a paso para nuevos usuarios.

- Tour interactivo que muestre cómo subir el CV, generar el perfil y usar la extensión por primera vez.

---

## ⚙️ DevOps & Calidad

### 12. CI/CD Pipeline

**Idea:** Automatizar completamente el despliegue.

- Configurar GitHub Actions para que cada push a `main` ejecute tests y despliegue automáticamente a Cloud Run (reemplazando los scripts manuales).

### 13. Tests Automatizados

**Idea:** Asegurar la estabilidad.

- **Unit Tests:** Para la lógica de parsing de PDF y la API.
- **E2E Tests:** Usar Playwright o Cypress para probar el flujo completo: Subir CV -> Editar -> Generar Perfil.

---

## 📝 Resumen de Acción Inmediata

Si vas a usar esto en serio, **te recomiendo encarecidamente atacar el punto 1 (Persistencia) antes de nada**, o perderás tus datos.

1.  **Persistencia:** Configurar Cloud SQL o Volumes.
2.  **Seguridad:** Implementar Login básico.
3.  **Feature:** Generador de Cartas de Presentación (alto valor, bajo esfuerzo con Groq ya integrado).
