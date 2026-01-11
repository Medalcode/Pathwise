# AutoApply - Extensión de Chrome para Aplicaciones Automáticas

🚀 **AutoApply** es una extensión de Chrome que automatiza el proceso de aplicación a trabajos llenando formularios automáticamente con tu información personal y profesional.

## 🌟 Características Principales

### 📝 Sistema de Extracción de CV Completo

- **Parsing Avanzado de PDF**: Extracción inteligente de datos desde tu CV
  - 👤 Información personal (nombre, email, teléfono, ubicación, LinkedIn, GitHub)
  - 💼 **Experiencia profesional completa** (título, empresa, fechas, descripción)
  - 🎓 **Educación** (títulos, instituciones, años)
  - 🎯 **Habilidades técnicas** (60+ tecnologías detectadas automáticamente)

### ✏️ Vista Previa Editable Completa

- **Edición total** de todos los campos extraídos antes de guardar
- **Agregar campos adicionales** con botones ➕ para experiencia y educación
- **Eliminar items** con botones × rojos
- **Visual feedback** con indicadores de campos detectados (✓) y editados (✎)
- **Contador en tiempo real** de campos detectados y editados
- **Word-wrap inteligente** para textos largos sin desbordamiento

### 🎨 Interfaz Moderna

- **Dashboard Web Premium**: Diseño moderno con gradientes azul/violeta
- **Responsive**: Funciona en todos los tamaños de pantalla
- **Drag & drop**: Sube tu CV arrastrando el archivo
- **Toast notifications**: Feedback visual claro de todas las acciones
- **Campos editables inline**: Edita directamente en la vista previa

### 🔄 Autocompletado Inteligente

- **Detección automática** de formularios de trabajo
- **Matching inteligente** de campos (por id, name, placeholder, aria-label)
- **Colores de feedback**: Verde para campos completados
- **Popup moderno**: Control fácil desde la extensión

### 💾 Almacenamiento Seguro

- **Backend con API REST** y base de datos SQLite
- **Sincronización automática** entre dashboard y extensión
- **Múltiples perfiles**: Diferentes versiones para diferentes trabajos

## 📊 Capacidades de Extracción de CV

### Antes vs Ahora

| Aspecto              | Versión Básica | **Versión Actual**         |
| -------------------- | -------------- | -------------------------- |
| Campos extraídos     | ~10            | **30-50+**                 |
| Información personal | 4 campos       | **9 campos completos**     |
| Experiencia          | ❌ No extraía  | ✅ **Múltiples trabajos**  |
| Educación            | ❌ No extraía  | ✅ **Múltiples títulos**   |
| Habilidades          | 19 tecnologías | **60+ tecnologías**        |
| Editable             | ❌ No          | ✅ **Totalmente editable** |

### Datos Extraídos por Sección

#### 👤 Información Personal

- Nombre y apellido
- Email, teléfono
- Ciudad, país
- LinkedIn, GitHub, Portfolio
- Título profesional actual

#### 💼 Experiencia Profesional

Para cada trabajo:

- Título del puesto
- Nombre de la empresa
- Fecha de inicio y fin
- Indicador de "trabajo actual"
- Descripción de responsabilidades

#### 🎓 Educación

Para cada título:

- Grado/título obtenido
- Institución educativa
- Año de inicio y fin
- Indicador de "en curso"

#### 🎯 Habilidades

60+ tecnologías detectadas automáticamente:

- **Lenguajes**: JavaScript, TypeScript, Python, Java, C#, C++, PHP, Ruby, Go, Rust, Swift, Kotlin
- **Frontend**: React, Vue, Angular, Svelte, HTML, CSS, SASS, Tailwind, Bootstrap
- **Backend**: Node.js, Express, Django, Flask, Spring, Laravel
- **Bases de Datos**: SQL, PostgreSQL, MySQL, MongoDB, Redis, Cassandra, DynamoDB
- **DevOps**: Git, GitHub, Docker, Kubernetes, Jenkins, CI/CD
- **Cloud**: AWS, Azure, GCP, Heroku, Vercel, Netlify
- **Otros**: REST, GraphQL, Agile, Scrum, Machine Learning, TensorFlow

## 📁 Estructura del Proyecto

```
AutoApply/
├── extension/              # Extensión de Chrome (Manifest V3)
│   ├── manifest.json
│   ├── popup/             # Interfaz popup moderna
│   ├── content/           # Scripts de autocompletado inteligente
│   ├── background/        # Service worker con sincronización
│   └── icons/             # Iconos responsive
├── web-dashboard/         # Panel web premium
│   ├── index.html         # Dashboard con múltiples secciones
│   ├── css/
│   │   └── style.css      # Diseño moderno con gradientes
│   └── js/
│       └── app.js         # Lógica completa de edición
├── backend/               # API REST + Base de datos
│   ├── server.js          # Express server
│   ├── routes/
│   │   ├── profile.js     # CRUD de perfiles
│   │   └── upload.js      # Parsing avanzado de CV
│   └── database/
│       └── db.js          # SQLite con schema completo
├── CV_PARSING_IMPROVEMENTS.md    # Documentación técnica del parser
├── COMPLETE_EDITING_SYSTEM.md    # Guía completa del sistema de edición
├── FEATURE_EXTRACTED_DATA_PREVIEW.md  # Docs de vista previa
└── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 14+ y npm
- Google Chrome
- PDF con tu CV actualizado

### 1. Instalar Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

El servidor se iniciará en `http://localhost:3000`

### 2. Abrir Dashboard Web

```bash
# Opción 1: Abrir directamente
open web-dashboard/index.html

# Opción 2: Con servidor local (recomendado)
cd web-dashboard
python -m http.server 8000
# Abrir http://localhost:8000
```

### 3. Instalar Extensión de Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa **"Modo de desarrollador"** (esquina superior derecha)
3. Click en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `extension/`
5. ¡Listo! Verás el ícono de AutoApply en la barra

## 🎯 Guía de Uso

### Primera Configuración

1. **Abre el Dashboard** (http://localhost:3000)
2. **Ve a "Subir CV"**
3. **Arrastra tu PDF** o haz click para seleccionarlo
4. **Revisa la vista previa editable**:
   - ✓ Campos detectados automáticamente (borde verde)
   - ✏️ Edita cualquier campo que necesite corrección
   - ➕ Agrega experiencias o educación adicional
   - × Elimina items incorrectos
5. **Click en "Guardar y Continuar"**

### Usar la Extensión

1. **Abre cualquier formulario** de aplicación a trabajo
2. **Click en el ícono** de AutoApply
3. **Verifica tu información** en el popup
4. **Click en "Autocompletar Formulario"**
5. **¡Listo!** Todos los campos se llenan automáticamente

### Editar tu Perfil

1. Ve a **"Mi Perfil"** en el dashboard
2. Edita cualquier información
3. Agrega o elimina skills
4. **Guarda los cambios**
5. La extensión se sincroniza automáticamente

## 🛠️ Stack Tecnológico

### Frontend

- **HTML5 Semantic**: Estructura accesible
- **CSS3 Modern**: Gradients, animations, flexbox, grid
- **Vanilla JavaScript ES6+**: Sin frameworks, máximo rendimiento
- **Chrome Extension API**: Manifest V3, Storage, Scripting

### Backend

- **Node.js 14+**: Runtime moderno
- **Express 4.x**: Framework minimalista
- **SQLite3**: Base de datos embebida
- **Multer**: Upload de archivos
- **pdf-parse**: Extracción de texto de PDFs

### DevOps

- **Git**: Control de versiones
- **npm**: Gestión de dependencias
- **Nodemon**: Auto-reload en desarrollo

## 📝 Documentación Adicional

- **[INSTALL.md](./INSTALL.md)**: Guía detallada de instalación
- **[DEMO.md](./DEMO.md)**: Demo completa del sistema
- **[CV_PARSING_IMPROVEMENTS.md](./CV_PARSING_IMPROVEMENTS.md)**: Detalles técnicos del parser
- **[COMPLETE_EDITING_SYSTEM.md](./COMPLETE_EDITING_SYSTEM.md)**: Sistema de edición completo
- **[FEATURE_EXTRACTED_DATA_PREVIEW.md](./FEATURE_EXTRACTED_DATA_PREVIEW.md)**: Vista previa editable

## 🎨 Características de UX

### Visual Feedback Completo

- **Verde (✓)**: Campo detectado automáticamente del CV
- **Naranja (✎)**: Campo editado manualmente por el usuario
- **Azul**: Campo en focus (editando actualmente)
- **Toast Notifications**: Confirmación de todas las acciones

### Interacciones Modernas

- **Hover effects**: En botones y cards
- **Smooth transitions**: Animaciones suaves
- **Responsive design**: Desde móvil hasta desktop
- **Keyboard shortcuts**: Navegación rápida

### Accesibilidad

- **Semantic HTML**: Screen readers friendly
- **ARIA labels**: Descripciones claras
- **Color contrast**: WCAG AA compliant
- **Keyboard navigation**: Tab, Enter, Escape

## 🔒 Seguridad

- ✅ Solo permisos necesarios en la extensión
- ✅ Datos almacenados localmente (SQLite)
- ✅ Sin envío de datos a terceros
- ✅ HTTPS recomendado para producción
- ✅ Validación de inputs en backend
- ✅ Sanitización de datos del PDF

## 🚀 Roadmap Futuro

- [ ] Soporte para más formatos de CV (DOCX, TXT)
- [ ] Templates de CV personalizables
- [ ] Exportar CV editado como PDF
- [ ] Múltiples idiomas (i18n)
- [ ] Analytics de aplicaciones
- [ ] Integración con LinkedIn
- [ ] Cover letter generator
- [ ] Interview preparation tips

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m '✨ Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📊 Estado del Proyecto

**Versión**: 2.0.0  
**Estado**: ✅ Producción Ready  
**Última actualización**: Enero 2026  
**Commits totales**: 10+  
**Líneas de código**: 1500+

## 📄 Licencia

MIT © 2026 MedalCode

---

**Desarrollado con ❤️ por MedalCode**

¿Necesitas ayuda? Abre un issue en GitHub o consulta la documentación completa.
