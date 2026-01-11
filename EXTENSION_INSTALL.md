# 🔌 Instalación Rápida - Extensión de Chrome

## 📦 Método 1: Modo Desarrollador (Recomendado para Testing)

### **Pasos:**

1. **Abre Chrome Extensions**

   ```
   chrome://extensions/
   ```

   O ve a: Menú (⋮) → Más herramientas → Extensiones

2. **Activa el Modo de Desarrollador**

   - Busca el interruptor en la esquina superior derecha
   - Click para activar

3. **Carga la Extensión**

   - Click en "Cargar extensión sin empaquetar"
   - Navega a la carpeta del proyecto
   - Selecciona la carpeta `extension/`
   - Click en "Seleccionar carpeta"

4. **¡Listo!**
   - La extensión aparecerá en tu barra de herramientas
   - Ícono: 🚀 AutoApply

---

## 🌐 Método 2: Desde Chrome Web Store (Cuando esté publicada)

### **Pasos:**

1. **Visita Chrome Web Store**

   ```
   https://chrome.google.com/webstore/
   ```

2. **Busca "AutoApply"**

   - Escribe "AutoApply Job Application Assistant"
   - O usa el link directo (cuando esté disponible)

3. **Instala**
   - Click en "Agregar a Chrome"
   - Confirma los permisos
   - ¡Listo!

---

## ⚙️ Configuración Inicial

### **Después de Instalar:**

1. **Click en el ícono de la extensión** 🚀

2. **Abre el Dashboard**

   - Click en "Abrir Dashboard"
   - O visita directamente tu URL de Cloud Run

3. **Sube tu CV**

   - Click en "Subir CV PDF"
   - Selecciona tu archivo
   - Espera la extracción automática

4. **Genera Perfiles con IA**

   - Click en "Generar Perfiles con IA"
   - Si es la primera vez, configura tu API key de Groq
   - Selecciona uno de los 3 perfiles generados

5. **¡Comienza a Aplicar!**
   - Visita cualquier sitio de empleos
   - La extensión detectará formularios automáticamente
   - Click en el botón de autocompletar

---

## 🔑 Obtener API Key de Groq (Gratis)

1. **Visita:** https://console.groq.com
2. **Crea una cuenta** (gratis)
3. **Ve a "API Keys"**
4. **Genera una nueva key**
5. **Copia la key** (empieza con `gsk_`)
6. **Pégala en AutoApply** cuando te lo pida

---

## 🎯 Uso Básico

### **Autocompletar Formularios:**

1. Abre un sitio de empleos (LinkedIn, Indeed, etc.)
2. Navega a un formulario de aplicación
3. La extensión detectará los campos automáticamente
4. Click en el botón flotante "Autocompletar con AutoApply"
5. ¡Los campos se llenarán automáticamente!

### **Atajos de Teclado:**

- `Ctrl+Shift+A` (Windows/Linux)
- `Cmd+Shift+A` (Mac)

Activa el autocompletado rápido

---

## 🐛 Solución de Problemas

### **La extensión no aparece**

- Verifica que el Modo de Desarrollador esté activado
- Recarga la página de extensiones (F5)
- Reinicia Chrome

### **No se conecta al servidor**

- Verifica que `extension/config.js` tenga la URL correcta
- Si usas localhost, asegúrate de que el servidor esté corriendo
- Revisa la consola del navegador (F12)

### **No autocompleta formularios**

- Verifica que hayas subido tu CV
- Asegúrate de que los campos del formulario sean compatibles
- Algunos sitios pueden bloquear scripts externos

### **Error de API Key**

- Verifica que la API key sea válida
- Asegúrate de que empiece con `gsk_`
- Genera una nueva key si es necesario

---

## 📱 Permisos Requeridos

La extensión solicita estos permisos:

- **storage**: Para guardar tu información localmente
- **activeTab**: Para detectar formularios en la página actual
- **scripting**: Para autocompletar campos
- **host_permissions**: Para conectarse al backend

**Nota:** Tu información nunca se comparte con terceros.

---

## 🔄 Actualizar la Extensión

### **Modo Desarrollador:**

1. Ve a `chrome://extensions/`
2. Click en el ícono de recarga (🔄) en la tarjeta de AutoApply

### **Chrome Web Store:**

- Las actualizaciones se instalan automáticamente

---

## 🗑️ Desinstalar

1. Ve a `chrome://extensions/`
2. Busca "AutoApply"
3. Click en "Quitar"
4. Confirma

**Nota:** Esto eliminará la extensión pero NO tus datos del servidor.

---

## 📞 Soporte

- **Documentación:** Ver `README.md`
- **Guía de Despliegue:** Ver `DEPLOYMENT_GUIDE.md`
- **Issues:** GitHub Issues (si está en GitHub)

---

## ✨ Características

- ✅ Autocompletado inteligente de formularios
- ✅ Generación de perfiles profesionales con IA
- ✅ Almacenamiento seguro de datos
- ✅ Compatible con sitios de empleo populares
- ✅ Interfaz intuitiva y moderna
- ✅ Totalmente gratis

---

**¡Disfruta de AutoApply y buena suerte en tu búsqueda de empleo!** 🚀

---

**Desarrollado por:** MedalCode  
**Versión:** 1.0.0  
**Última actualización:** 2026-01-11
