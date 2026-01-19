const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuración
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const DB_FILENAME = 'autoapply.db';
const LOCAL_DB_PATH = path.join(__dirname, '../database', DB_FILENAME);
const LOCK_FILE = path.join(__dirname, '../database', '.upload.lock');

// Inicializar cliente GCS
const storage = new Storage();

// Estado de sincronización
let lastUploadHash = null;
let isSyncing = false;

/**
 * Calcula el hash MD5 de un archivo
 */
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      resolve(null);
      return;
    }

    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Verifica si hay cambios en la base de datos
 */
async function hasChanges() {
  const currentHash = await getFileHash(LOCAL_DB_PATH);
  return currentHash !== lastUploadHash;
}

/**
 * Función auxiliar para esperar (sleep)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Descarga la base de datos desde GCS al iniciar la aplicación.
 * Incluye reintentos con backoff exponencial.
 */
async function downloadDatabase(maxRetries = 3) {
  if (!BUCKET_NAME) {
    console.log('⚠️  GCS_BUCKET_NAME no configurado. Persistencia en la nube desactivada.');
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(DB_FILENAME);

      const [exists] = await file.exists();
      if (exists) {
        console.log(`📥 [${new Date().toISOString()}] Descargando base de datos desde GCS... (intento ${attempt}/${maxRetries})`);
        
        // Descargar a archivo temporal primero
        const tempPath = `${LOCAL_DB_PATH}.tmp`;
        await file.download({ destination: tempPath });
        
        // Mover archivo temporal a ubicación final
        fs.renameSync(tempPath, LOCAL_DB_PATH);
        
        // Actualizar hash después de descarga exitosa
        lastUploadHash = await getFileHash(LOCAL_DB_PATH);
        
        console.log('✅ Base de datos restaurada exitosamente.');
        return;
      } else {
        console.log('🆕 Base de datos no encontrada en GCS. Se creará una nueva localmente.');
        return;
      }
    } catch (error) {
      console.error(`❌ Error descargando base de datos (intento ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
        console.log(`⏳ Reintentando en ${waitTime / 1000} segundos...`);
        await sleep(waitTime);
      } else {
        console.error('❌ Máximo de reintentos alcanzado. Continuando con base de datos local.');
        // No lanzamos error para permitir que la app inicie
      }
    }
  }
}

/**
 * Sube la base de datos local a GCS con reintentos.
 */
async function uploadDatabase(maxRetries = 3) {
  if (!BUCKET_NAME) {
    return;
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.warn('⚠️  No se encontró base de datos local para subir.');
    return;
  }

  // Verificar si hay cambios
  const changed = await hasChanges();
  if (!changed) {
    console.log('ℹ️  No hay cambios en la base de datos. Omitiendo upload.');
    return;
  }

  // Verificar lock file para prevenir uploads concurrentes
  if (isSyncing) {
    console.log('⏳ Upload ya en progreso. Omitiendo...');
    return;
  }

  isSyncing = true;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 [${new Date().toISOString()}] Subiendo base de datos a GCS... (intento ${attempt}/${maxRetries})`);
      
      await storage.bucket(BUCKET_NAME).upload(LOCAL_DB_PATH, {
        destination: DB_FILENAME,
        metadata: {
          cacheControl: 'no-cache',
          metadata: {
            lastSync: new Date().toISOString()
          }
        },
      });
      
      // Actualizar hash después de upload exitoso
      lastUploadHash = await getFileHash(LOCAL_DB_PATH);
      
      console.log('✅ Base de datos respaldada exitosamente en la nube.');
      isSyncing = false;
      return;
    } catch (error) {
      console.error(`❌ Error subiendo base de datos (intento ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
        console.log(`⏳ Reintentando en ${waitTime / 1000} segundos...`);
        await sleep(waitTime);
      } else {
        console.error('❌ Máximo de reintentos alcanzado. Upload fallido.');
        isSyncing = false;
        throw error; // Lanzar error en el último intento
      }
    }
  }
}

/**
 * Sincronización forzada (sin verificar cambios)
 */
async function forceUpload() {
  lastUploadHash = null; // Resetear hash para forzar upload
  return uploadDatabase();
}

/**
 * Obtener estado de sincronización
 */
function getSyncStatus() {
  return {
    isEnabled: !!BUCKET_NAME,
    isSyncing,
    lastUploadHash,
    dbPath: LOCAL_DB_PATH
  };
}

module.exports = {
  downloadDatabase,
  uploadDatabase,
  forceUpload,
  getSyncStatus
};
