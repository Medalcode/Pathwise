const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Configuración de base de datos y almacenamiento
const { initDB } = require('./database/db');
const storageService = require('./services/storageService');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos del dashboard
app.use(express.static(path.join(__dirname, '../web-dashboard')));

// Rutas de la API
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const jobsRoutes = require('./routes/jobs');

app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AutoApply API is running',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal - Servir el dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web-dashboard/index.html'));
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
      console.log('🚀 Panoptes (AutoApply) Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`💾 Persistencia: ${process.env.GCS_BUCKET_NAME ? 'ACTIVADA (GCS)' : 'LOCAL ONLY'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Configurar backup automático periódico (cada 10 minutos)
    if (process.env.GCS_BUCKET_NAME) {
      setInterval(() => {
        storageService.uploadDatabase().catch(err => console.error('❌ Error en backup automático:', err));
      }, 10 * 60 * 1000);
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
