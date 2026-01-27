const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const config = require('../config');

// Configuración
const BUCKET_NAME = config.GCS_BUCKET_NAME;
const DB_FILENAME = config.DB_FILENAME || 'autoapply.db';
const LOCAL_DB_PATH = config.DB_PATH || path.join(__dirname, '../database', DB_FILENAME);
const LOCK_FILE = path.join(path.dirname(LOCAL_DB_PATH), '.upload.lock');

// Inicializar cliente GCS
const storage = new Storage();

// Último hash conocido (memoria local)
let lastUploadHash = null;

// TTL para lock stale (ms)
const LOCK_TTL = 5 * 60 * 1000; // 5 minutos

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

function hashStream(stream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function getFileHash(filePath) {
  if (!await fileExists(filePath)) return null;
  const stream = fs.createReadStream(filePath);
  return hashStream(stream);
}

async function hasChanges() {
  const currentHash = await getFileHash(LOCAL_DB_PATH);
  return currentHash !== lastUploadHash;
}

async function tryCreateLock() {
  try {
    const fh = await fsp.open(LOCK_FILE, 'wx');
    const payload = JSON.stringify({ pid: process.pid, ts: Date.now() });
    await fh.writeFile(payload, { encoding: 'utf8' });
    await fh.close();
    return true;
  } catch (err) {
    // If file exists, check age and remove if stale
    if (err.code === 'EEXIST') {
      try {
        const st = await fsp.stat(LOCK_FILE);
        const age = Date.now() - st.mtimeMs;
        if (age > LOCK_TTL) {
          // stale lock — remove and try again
          await fsp.unlink(LOCK_FILE).catch(() => {});
          // try once more
          const fh2 = await fsp.open(LOCK_FILE, 'wx');
          await fh2.writeFile(JSON.stringify({ pid: process.pid, ts: Date.now() }), 'utf8');
          await fh2.close();
          return true;
        }
      } catch (e) {
        // ignore and return false
      }
    }
    return false;
  }
}

async function releaseLock() {
  try {
    if (await fileExists(LOCK_FILE)) {
      await fsp.unlink(LOCK_FILE);
    }
  } catch (e) {
    // ignore
  }
}

async function downloadDatabase(maxRetries = 3) {
  if (!BUCKET_NAME) {
    console.log('⚠️  GCS_BUCKET_NAME not set. Cloud persistence disabled.');
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(DB_FILENAME);

      const [exists] = await file.exists();
      if (exists) {
        console.log(`📥 [${new Date().toISOString()}] Downloading DB from GCS... (attempt ${attempt}/${maxRetries})`);

        const tempPath = `${LOCAL_DB_PATH}.tmp`;
        await file.download({ destination: tempPath });
        await fsp.rename(tempPath, LOCAL_DB_PATH);

        lastUploadHash = await getFileHash(LOCAL_DB_PATH);
        console.log('✅ Database restored from GCS.');
        return;
      } else {
        console.log('🆕 No DB in GCS. Proceeding with local DB.');
        return;
      }
    } catch (error) {
      console.error(`❌ Error downloading DB (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${waitTime/1000}s...`);
        await sleep(waitTime);
      } else {
        console.error('❌ Maximum retries reached. Using local DB.');
      }
    }
  }
}

async function uploadDatabase(maxRetries = 3) {
  if (!BUCKET_NAME) return;

  if (!await fileExists(LOCAL_DB_PATH)) {
    console.warn('⚠️  Local DB not found to upload.');
    return;
  }

  if (!await hasChanges()) {
    console.log('ℹ️  No DB changes detected. Skipping upload.');
    return;
  }

  // Try to acquire lock
  const locked = await tryCreateLock();
  if (!locked) {
    console.log('⏳ Another upload in progress (lock present). Skipping.');
    return;
  }

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 [${new Date().toISOString()}] Uploading DB to GCS... (attempt ${attempt}/${maxRetries})`);
        await storage.bucket(BUCKET_NAME).upload(LOCAL_DB_PATH, {
          destination: DB_FILENAME,
          metadata: {
            cacheControl: 'no-cache',
            metadata: { lastSync: new Date().toISOString() }
          }
        });

        lastUploadHash = await getFileHash(LOCAL_DB_PATH);
        console.log('✅ Database backed up to cloud.');
        return;
      } catch (err) {
        console.error(`❌ Upload error (attempt ${attempt}):`, err.message || err);
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying in ${waitTime/1000}s...`);
          await sleep(waitTime);
        } else {
          console.error('❌ Upload failed after retries.');
          throw err;
        }
      }
    }
  } finally {
    await releaseLock();
  }
}

async function forceUpload() {
  lastUploadHash = null;
  return uploadDatabase();
}

async function getSyncStatus() {
  return {
    isEnabled: !!BUCKET_NAME,
    isSyncing: await fileExists(LOCK_FILE),
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
