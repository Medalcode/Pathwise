const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Configuración
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const DB_FILENAME = 'autoapply.db';
const LOCAL_DB_PATH = path.join(__dirname, '../database', DB_FILENAME);

// Inicializar cliente GCS
// En Cloud Run, la autenticación es automática si se tiene permiso
const storage = new Storage();

/**
 * Descarga la base de datos desde GCS al iniciar la aplicación.
 * Si no existe en GCS, permite que la aplicación cree una nueva localmente.
 */
async function downloadDatabase() {
  if (!BUCKET_NAME) {
    console.log('⚠️ GCS_BUCKET_NAME no configurado. Persistencia en la nube desactivada.');
    return;
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(DB_FILENAME);

    const [exists] = await file.exists();
    if (exists) {
      console.log('📥 Descargando base de datos desde GCS...');
      await file.download({ destination: LOCAL_DB_PATH });
      console.log('✅ Base de datos restaurada exitosamente.');
    } else {
      console.log('🆕 Base de datos no encontrada en GCS. Se creará una nueva localmente.');
    }
  } catch (error) {
    console.error('❌ Error descargando base de datos:', error);
    // No lanzamos error para permitir que la app inicie (con DB vacía) si falla la descarga
  }
}

/**
 * Sube la base de datos local a GCS.
 * Se debe llamar periódicamente o al cerrar la aplicación.
 */
async function uploadDatabase() {
  if (!BUCKET_NAME) {
    return;
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.warn('⚠️ No se encontró base de datos local para subir.');
    return;
  }

  try {
    console.log('📤 Subiendo base de datos a GCS...');
    await storage.bucket(BUCKET_NAME).upload(LOCAL_DB_PATH, {
      destination: DB_FILENAME,
      metadata: {
        cacheControl: 'no-cache',
      },
    });
    console.log('✅ Base de datos respaldada exitosamente en la nube.');
  } catch (error) {
    console.error('❌ Error subiendo base de datos:', error);
  }
}

module.exports = {
  downloadDatabase,
  uploadDatabase
};
