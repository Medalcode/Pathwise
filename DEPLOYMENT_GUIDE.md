# 🚀 Guía de Despliegue - AutoApply en Google Cloud Run

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue en Cloud Run](#despliegue-en-cloud-run)
3. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
4. [Instalación de la Extensión de Chrome](#instalación-de-la-extensión-de-chrome)
5. [Publicación en Chrome Web Store](#publicación-en-chrome-web-store)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### 1. **Cuenta de Google Cloud**

- Crea una cuenta en [Google Cloud](https://cloud.google.com/)
- Crea un nuevo proyecto o usa uno existente
- Habilita la facturación (Cloud Run tiene capa gratuita)

### 2. **Herramientas Instaladas**

```bash
# Verificar instalaciones
gcloud --version  # Google Cloud SDK
docker --version  # Docker
```

### 3. **Instalar Google Cloud SDK** (si no está instalado)

```bash
# Linux/Mac
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Inicializar
gcloud init
```

---

## 🚀 Despliegue en Cloud Run

### **Opción 1: Script Automático** (Recomendado)

```bash
# Ejecutar script de despliegue
./deploy-cloud-run.sh TU_PROJECT_ID us-central1
```

**Ejemplo:**

```bash
./deploy-cloud-run.sh autoapply-prod us-central1
```

El script hará automáticamente:

- ✅ Configurar el proyecto
- ✅ Habilitar APIs necesarias
- ✅ Construir la imagen Docker
- ✅ Subir a Container Registry
- ✅ Desplegar en Cloud Run
- ✅ Mostrar la URL de tu aplicación

---

### **Opción 2: Despliegue Manual**

#### **Paso 1: Configurar Proyecto**

```bash
# Configurar proyecto
gcloud config set project TU_PROJECT_ID

# Habilitar APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### **Paso 2: Autenticar Docker**

```bash
gcloud auth configure-docker
```

#### **Paso 3: Build de la Imagen**

```bash
# Construir imagen
docker build -t gcr.io/TU_PROJECT_ID/autoapply:latest .

# Subir imagen
docker push gcr.io/TU_PROJECT_ID/autoapply:latest
```

#### **Paso 4: Desplegar en Cloud Run**

```bash
gcloud run deploy autoapply \
  --image gcr.io/TU_PROJECT_ID/autoapply:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --port 8080
```

---

### **Opción 3: Cloud Build Automático**

#### **Conectar con GitHub**

```bash
# Conectar repositorio
gcloud builds submit --config cloudbuild.yaml
```

#### **Configurar Trigger Automático**

1. Ve a [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click en "Crear Trigger"
3. Conecta tu repositorio de GitHub
4. Configura el trigger para ejecutar en cada push a `main`
5. Usa el archivo `cloudbuild.yaml`

---

## ⚙️ Configuración de Variables de Entorno

### **Configurar GROQ_API_KEY**

```bash
gcloud run services update autoapply \
  --region us-central1 \
  --set-env-vars GROQ_API_KEY=gsk_tu_api_key_aqui
```

### **Ver Variables Configuradas**

```bash
gcloud run services describe autoapply \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### **Configurar Múltiples Variables**

```bash
gcloud run services update autoapply \
  --region us-central1 \
  --set-env-vars \
    NODE_ENV=production,\
    GROQ_API_KEY=gsk_...,\
    PORT=8080
```

---

## 🌐 Obtener URL de la Aplicación

```bash
gcloud run services describe autoapply \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

**Ejemplo de URL:**

```
https://autoapply-abc123xyz-uc.a.run.app
```

---

## 📦 Instalación de la Extensión de Chrome

### **Paso 1: Actualizar Configuración**

Edita `extension/config.js`:

```javascript
const CONFIG = {
  ENVIRONMENT: "production",

  API_URLS: {
    development: "http://localhost:3000/api",
    production: "https://TU-URL-DE-CLOUD-RUN.run.app/api", // ← Actualizar aquí
  },

  DASHBOARD_URLS: {
    development: "http://localhost:3000",
    production: "https://TU-URL-DE-CLOUD-RUN.run.app", // ← Actualizar aquí
  },
};
```

### **Paso 2: Instalar en Chrome (Modo Desarrollador)**

1. Abre Chrome y ve a: `chrome://extensions/`
2. Activa el **"Modo de desarrollador"** (esquina superior derecha)
3. Click en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `extension/`
5. ¡Listo! La extensión aparecerá en tu barra de herramientas

### **Paso 3: Empaquetar para Distribución**

```bash
# Ejecutar script de empaquetado
./package-extension.sh
```

Esto creará: `dist/autoapply-extension-v1.0.0.zip`

---

## 🏪 Publicación en Chrome Web Store

### **Requisitos**

- Cuenta de Google
- Pago único de **$5 USD** para registro de desarrollador
- Extensión empaquetada (`.zip`)

### **Pasos**

1. **Registrarse como Desarrollador**

   - Ve a: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Paga la tarifa de registro ($5 USD)

2. **Subir Extensión**

   - Click en "Nuevo elemento"
   - Sube el archivo `dist/autoapply-extension-v1.0.0.zip`

3. **Completar Información**

   - **Nombre:** AutoApply - Job Application Assistant
   - **Descripción:** Automatiza tus aplicaciones a trabajos con IA
   - **Categoría:** Productivity
   - **Idioma:** Español / English
   - **Capturas de pantalla:** Mínimo 1, máximo 5 (1280x800 o 640x400)
   - **Ícono:** 128x128 px

4. **Privacidad**

   - Declara qué permisos usas y por qué
   - Política de privacidad (requerida)

5. **Enviar para Revisión**
   - Click en "Enviar para revisión"
   - Tiempo de revisión: 1-3 días hábiles

---

## 🎨 Capturas de Pantalla Recomendadas

Para Chrome Web Store, incluye:

1. **Dashboard principal** mostrando estadísticas
2. **Modal de perfiles profesionales** con los 3 perfiles
3. **Formulario autocompletado** en acción
4. **Configuración de API Key**
5. **Extensión en uso** en un sitio de empleo

**Dimensiones:** 1280x800 px o 640x400 px

---

## 📊 Monitoreo y Logs

### **Ver Logs en Tiempo Real**

```bash
gcloud run services logs read autoapply \
  --region us-central1 \
  --follow
```

### **Ver Métricas**

```bash
gcloud run services describe autoapply \
  --region us-central1 \
  --format="value(status.traffic)"
```

### **Dashboard de Cloud Run**

[https://console.cloud.google.com/run](https://console.cloud.google.com/run)

---

## 🔒 Seguridad

### **Configurar Autenticación** (Opcional)

```bash
gcloud run services update autoapply \
  --region us-central1 \
  --no-allow-unauthenticated
```

### **Configurar CORS** (Ya configurado en el código)

El servidor ya tiene CORS habilitado para permitir requests desde la extensión.

---

## 💰 Costos Estimados

### **Cloud Run - Capa Gratuita**

- 2 millones de requests/mes
- 360,000 GB-segundos/mes
- 180,000 vCPU-segundos/mes

### **Estimación para 1000 usuarios/mes:**

- **Costo:** ~$0-5 USD/mes
- **Tráfico:** Dentro de capa gratuita

### **Chrome Web Store**

- **Registro:** $5 USD (pago único)
- **Publicación:** Gratis

---

## 🐛 Troubleshooting

### **Error: "Permission denied"**

```bash
# Verificar autenticación
gcloud auth login
gcloud auth configure-docker
```

### **Error: "Service not found"**

```bash
# Verificar región
gcloud run services list --platform managed
```

### **Error: "Build failed"**

```bash
# Ver logs de build
gcloud builds list
gcloud builds log [BUILD_ID]
```

### **Extensión no se conecta al servidor**

1. Verifica que la URL en `config.js` sea correcta
2. Verifica que Cloud Run esté corriendo
3. Revisa la consola del navegador (F12)

### **Base de datos no persiste**

Cloud Run es stateless. Para persistencia:

- Usa Cloud SQL
- Usa Cloud Storage
- Usa Firestore

---

## 📝 Checklist de Despliegue

- [ ] Cuenta de Google Cloud creada
- [ ] Proyecto configurado
- [ ] gcloud CLI instalado
- [ ] Docker instalado
- [ ] Imagen construida y subida
- [ ] Servicio desplegado en Cloud Run
- [ ] GROQ_API_KEY configurada
- [ ] URL de producción obtenida
- [ ] `extension/config.js` actualizado con URL de producción
- [ ] Extensión probada localmente
- [ ] Extensión empaquetada
- [ ] Capturas de pantalla preparadas
- [ ] Cuenta de Chrome Web Store Developer creada
- [ ] Extensión publicada

---

## 🎯 Próximos Pasos

1. **Desplegar el backend** en Cloud Run
2. **Actualizar la extensión** con la URL de producción
3. **Probar** la aplicación completa
4. **Publicar** en Chrome Web Store
5. **Compartir** con usuarios

---

## 📞 Soporte

- **Documentación Cloud Run:** https://cloud.google.com/run/docs
- **Chrome Extensions:** https://developer.chrome.com/docs/extensions/
- **Chrome Web Store:** https://developer.chrome.com/docs/webstore/

---

**Desarrollado por:** MedalCode  
**Fecha:** 2026-01-11  
**Versión:** 1.0.0
