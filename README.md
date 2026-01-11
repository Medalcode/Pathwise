# AutoApply - Extensión de Chrome para Aplicaciones Automáticas

🚀 **AutoApply** es una extensión de Chrome que automatiza el proceso de aplicación a trabajos llenando formularios automáticamente con tu información personal y profesional.

## 🌟 Características

- **Dashboard Web**: Sube tu CV en PDF o llena manualmente tu información
- **Almacenamiento Seguro**: Backend con API REST y base de datos SQLite
- **Autocompletado Inteligente**: La extensión detecta y rellena formularios automáticamente
- **Múltiples Perfiles**: Guarda diferentes versiones de tu CV para diferentes tipos de trabajo
- **Sincronización**: Tu información siempre actualizada en todos tus dispositivos

## 📁 Estructura del Proyecto

```
AutoApply/
├── extension/          # Extensión de Chrome
│   ├── manifest.json
│   ├── popup/         # Interfaz popup
│   ├── content/       # Scripts para autocompletar
│   ├── background/    # Service worker
│   └── icons/         # Iconos de la extensión
├── web-dashboard/     # Panel web para gestión de CV
│   ├── index.html
│   ├── css/
│   └── js/
├── backend/           # API y servidor
│   ├── server.js
│   ├── routes/
│   ├── models/
│   └── database/
└── README.md
```

## 🚀 Instalación Rápida

### 1. Backend

```bash
cd backend
npm install
npm start
```

### 2. Web Dashboard

```bash
cd web-dashboard
# Abrir index.html en navegador o usar servidor local
python -m http.server 8000
```

### 3. Extensión de Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa "Modo de desarrollador"
3. Click en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `extension/`

## 🎯 Uso

1. **Configura tu perfil** en el dashboard web
2. **Sube tu CV** en formato PDF (parsing automático)
3. **Activa la extensión** cuando estés en un formulario de trabajo
4. **¡Aplica automáticamente!** con un solo click

## 🛠️ Tecnologías

- **Extension**: Chrome Manifest V3, JavaScript ES6+
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express, SQLite
- **Parsing**: PDF.js para extracción de datos

## 📝 Licencia

MIT © MedalCode
