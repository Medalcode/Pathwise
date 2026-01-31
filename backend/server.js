const app = require('./app');
const config = require('./config');
const { initDB } = require('./database/db');
const storageService = require('./services/storageService');

const PORT = config.PORT || 3000;

/**
 * Orquestador de Arranque del Sistema
 * Responsable de:
 * 1. Preparar persistencia (Sync)
 * 2. Inicializar DB
 * 3. Iniciar Servidor HTTP
 * 4. Manejar señales de cierre (Graceful Shutdown)
 */
async function startServer() {
  try {
    console.log('🔄 Iniciando secuencia de arranque Pathwise...');
    
    // 1. Fase de Persistencia: Descargar DB si aplica
    // Esta es una dependencia crítica antes de conectar la DB
    if (config.GCS_BUCKET_NAME) {
      console.log('☁️  Modo Persistencia Cloud detectado');
      await storageService.downloadDatabase();
    } else {
      console.log('💻 Modo Local (Sin persistencia cloud)');
    }
    
    // 2. Fase de Datos: Inicializar conexión SQLite
    await initDB();
    
    // 3. Fase de Servicio: Iniciar HTTP Server
    const server = app.listen(PORT, () => {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 Pathwise (AutoApply) Server Ready');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`💾 Storage: ${config.GCS_BUCKET_NAME ? 'GCS Sync' : 'Local Disk'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Configurar backup automático en background
    if (config.GCS_BUCKET_NAME) {
      setupAutomaticBackup();
    }

    // Registrar manejadores de cierre
    registerShutdownHandlers(server);

  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

function setupAutomaticBackup() {
  const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
  
  setInterval(() => {
    console.log('⏰ Ejecutando backup programado...');
    storageService.uploadDatabase()
      .catch(err => console.error('❌ Error en backup automático:', err));
  }, BACKUP_INTERVAL_MS);
  
  console.log('🔄 Backup automático configurado (cada 5 minutos)');
}

function registerShutdownHandlers(server) {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
    
    // 1. Dejar de aceptar nuevas conexiones
    server.close(async () => {
      console.log('🔌 Servidor HTTP cerrado.');

      // 2. Persistir estado final
      if (config.GCS_BUCKET_NAME) {
        console.log('💾 Guardando estado final en GCS antes de salir...');
        try {
          await storageService.uploadDatabase();
          console.log('d✅ Estado guardado.');
        } catch (err) {
          console.error('❌ Error guardando estado final:', err);
        }
      }
      
      console.log('👋 Adios.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Iniciar
startServer();
