# 🚀 Guía de Instalación - AutoApply

Sigue estos pasos para poner en marcha la extensión AutoApply completa.

## ✅ Prerrequisitos

- Node.js (v16 o superior)
- Google Chrome o Chromium
- Git

## 📦 Paso 1: Instalar Dependencias del Backend

```bash
cd backend
npm install
```

Esto instalará todas las dependencias necesarias:

- Express (servidor web)
- SQLite3 (base de datos)
- Multer (manejo de archivos)
- PDF-Parse (extracción de texto de PDFs)
- CORS (seguridad)

## 🗄️ Paso 2: Inicializar la Base de Datos

La base de datos se inicializará automáticamente al iniciar el servidor por primera vez.

## ▶️ Paso 3: Iniciar el Backend

```bash
npm start
```

O para modo desarrollo con auto-reload:

```bash
npm run dev
```

Deberías ver:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 AutoApply Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 API running on: http://localhost:3000/api
🌐 Dashboard: http://localhost:3000
✅ Health check: http://localhost:3000/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🌐 Paso 4: Acceder al Dashboard Web

Abre tu navegador y ve a:

```
http://localhost:3000
```

Aquí podrás:

- ✅ Subir tu CV en PDF
- ✅ Completar manualmente tu perfil
- ✅ Ver estadísticas de completitud

## 🧩 Paso 5: Instalar la Extensión de Chrome

### Método 1: Manual (Desarrollo)

1. Abre Chrome y ve a: `chrome://extensions/`
2. Activa el **"Modo de desarrollador"** (toggle arriba a la derecha)
3. Click en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `/extension` de este proyecto
5. ¡Listo! Verás el ícono de AutoApply en tu barra de extensiones

### Método 2: Desde el Dashboard

1. En el dashboard web, click en **"Instalar Extensión"**
2. Sigue las instrucciones que aparecen

## 🎯 Paso 6: Configurar tu Perfil

### Opción A: Subir CV en PDF

1. En el dashboard, ve a la sección **"Subir CV"**
2. Arrastra tu CV o haz click para seleccionar
3. El sistema extraerá automáticamente:
   - Nombre y apellido
   - Email y teléfono
   - LinkedIn
   - Skills técnicos
   - Y más...

### Opción B: Completar Manualmente

1. Ve a **"Mi Perfil"**
2. Llena los campos:

   - **Información Personal**: Nombre, email, teléfono, etc.
   - **Información Profesional**: Título actual, LinkedIn, portfolio
   - **Habilidades**: Agrega tus skills (presiona Enter después de cada uno)
   - **Resumen**: Breve descripción profesional

3. Click en **"Guardar Perfil"**

## 🚀 Paso 7: ¡Usar la Extensión!

1. Ve a cualquier sitio de búsqueda de empleos (LinkedIn, Indeed, etc.)
2. Abre un formulario de aplicación
3. Click en el ícono de **AutoApply** en la barra de extensiones
4. Click en **"Llenar Formulario"**
5. ✨ ¡Magia! La extensión completará automáticamente los campos

### Sitios Probados

La extensión funciona en la mayoría de sitios de empleo:

- ✅ LinkedIn
- ✅ Indeed
- ✅ GetOnBoard (Chile)
- ✅ Trabajando.com
- ✅ Computrabajo
- ✅ Y muchos más...

## 🔧 Solución de Problemas

### El backend no inicia

```bash
# Verifica que Node.js esté instalado
node --version

# Reinstala dependencias
cd backend
rm -rf node_modules
npm install
```

### La extensión no se carga

1. Verifica que el **Modo de desarrollador** esté activado
2. Revisa la consola de errores en `chrome://extensions/`
3. Recarga la extensión (botón de refresh)

### La extensión no llena los campos

1. Verifica que el backend esté corriendo
2. Abre la extensión y verifica que muestre "Conectado"
3. Asegúrate de haber guardado tu perfil en el dashboard
4. Algunos campos muy personalizados pueden no detectarse

### El PDF no se procesa

1. Verifica que el archivo sea realmente un PDF (no una imagen)
2. Intenta con un PDF más simple (sin demasiado formato)
3. Como alternativa, completa manualmente el perfil

## 📊 Verificar que Todo Funciona

### Test 1: Backend

```bash
curl http://localhost:3000/api/health
```

Debe responder: `{"status":"ok",...}`

### Test 2: Dashboard

Abre: `http://localhost:3000`
Debes ver el dashboard con diseño azul moderno

### Test 3: Extensión

1. Click en el ícono de AutoApply
2. Debe mostrar tu nombre y estadísticas
3. El estado debe ser **"Conectado"** (punto verde)

## 🎨 Próximos Pasos

1. ✏️ **Personaliza**: Edita tu perfil según tus necesidades
2. 🔄 **Actualiza**: Mantén tu información sincronizada
3. 💼 **Aplica**: Usa la extensión en tus aplicaciones
4. 📈 **Mejora**: Agrega más campos según necesites

## 💡 Tips Pro

- **Múltiples Perfiles**: Puedes guardar diferentes versiones de tu información para diferentes tipos de trabajo
- **Shortcuts**: Usa el menú contextual (click derecho en un campo) para llenar rápidamente
- **Sincronización**: La extensión se sincroniza automáticamente cada 30 minutos

## 🆘 Soporte

¿Problemas? Abre un issue en GitHub o contacta al equipo de desarrollo.

---

**¡Listo para automatizar tus aplicaciones! 🚀**
