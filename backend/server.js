const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuración de base de datos y almacenamiento
const { initDB } = require('./database/db');
const storageService = require('./services/storageService');

const app = express();
const PORT = process.env.PORT || 8080;


// Middleware de logging global
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de manejo global de errores
app.use((err, req, res, next) => {
  console.error('🌋 Error global:', err);
  res.status(500).send('Error interno global');
});

// Servir archivos estáticos del dashboard (Lógica Adaptativa Local/Docker)
// 1. Intenta estructura local (../web-dashboard)
let staticPath = path.join(__dirname, '../web-dashboard');
if (!fs.existsSync(staticPath)) {
    // 2. Si falla, intenta estructura Docker/Prod (./web-dashboard)
    staticPath = path.join(__dirname, 'web-dashboard');
}

console.log('🗂️ Servir estáticos desde:', staticPath);
app.use(express.static(staticPath));

// Rutas de la API
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const jobsRoutes = require('./routes/jobs');
const profilesRoutes = require('./routes/profiles');
const applicationsRoutes = require('./routes/applications');
const coverLetterRoutes = require('./routes/coverLetter');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/cover-letter', coverLetterRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AutoApply API is running',
    timestamp: new Date().toISOString()
  });
});

// Sync status endpoint
app.get('/api/sync/status', (req, res) => {
  const syncStatus = storageService.getSyncStatus();
  res.json({
    success: true,
    ...syncStatus
  });
});


// Ruta principal - Servir el dashboard
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'web-dashboard/index.html');
  console.log('➡️ Petición a /, intentando servir:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error enviando index.html:', err);
      res.status(500).send('Error interno al servir el dashboard');
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Función de inicio asíncrona
async function startServer() {
  try {
    console.log('🔄 Iniciando secuencia de arranque...');
    
    // 1. Descargar base de datos desde GCS si existe
    await storageService.downloadDatabase();
    
    // 2. Inicializar conexión a SQLite
    await initDB();
    
    // 3. Iniciar servidor Express
    const server = app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 Panoptes (AutoApply) Server v4.5 [CLEAN REBUILD]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`💾 Persistencia: ${process.env.GCS_BUCKET_NAME ? 'ACTIVADA (GCS)' : 'LOCAL ONLY'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Configurar backup automático periódico (cada 5 minutos)
    if (process.env.GCS_BUCKET_NAME) {
      setInterval(() => {
        storageService.uploadDatabase().catch(err => console.error('❌ Error en backup automático:', err));
      }, 5 * 60 * 1000); // 5 minutos
      console.log('🔄 Backup automático configurado (cada 5 minutos)');
    }

    // Manejo de cierre graceful
    const shutdown = async () => {
      console.log('\n🛑 Cerrando servidor...');
      server.close();
      
      // Subir base de datos antes de salir
      if (process.env.GCS_BUCKET_NAME) {
        console.log('💾 Guardando estado final en GCS...');
        await storageService.uploadDatabase();
      }
      
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar
startServer();

module.exports = app;
