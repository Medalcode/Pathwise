const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');
const { runSchemaSetup } = require('./schema');
const LegacyRepo = require('./legacy_repository');

// Variable para la conexión (Singleton Legacy)
let db;

const dbPath = config.DB_PATH || process.env.DB_PATH || '/tmp/autoapply.db';

/**
 * Inicializar base de datos
 * Solo responsable de:
 * 1. Abrir conexión
 * 2. Ejecutar Setup inicial (delegado)
 * 3. Ejecutar migraciones (delegado)
 */
function initDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        reject(err);
      } else {
        console.log('✅ Conexión a SQLite establecida (legacy db.js)');
        
        // 1. Setup Base Schema
        await runSchemaSetup(db);
        
        // 2. Setup Profiles System Tables (Migration)
        try {
          const { migrateToProfiles } = require('./profilesSystem');
          await migrateToProfiles(db);
          console.log('✅ Migración de perfiles completada');
        } catch (migrationError) {
          console.error('⚠️ Error en migración de perfiles:', migrationError);
        }
        
        // 3. Setup Applications System Tables (Migration)
        try {
          const { migrateApplications } = require('./applicationsSchema');
          await migrateApplications(db);
        } catch (migrationError) {
          console.error('⚠️ Error en migración de aplicaciones:', migrationError);
        }
        
        resolve(db);
      }
    });
  });
}

// Proxies para mantener compatibilidad con el resto del sistema
// Ahora delegan al LegacyRepo en lugar de contener la lógica
function getProfile(userId) {
    return LegacyRepo.getProfile(db, userId);
}

function saveProfile(userId, data) {
    return LegacyRepo.saveProfile(db, userId, data);
}

function updateProfileSection(userId, section, data) {
    return LegacyRepo.updateProfileSection(db, userId, section, data);
}

function deleteProfile(userId) {
    return LegacyRepo.deleteProfile(db, userId);
}

module.exports = {
  db,
  initDB,
  getProfile,
  saveProfile,
  updateProfileSection,
  deleteProfile
};
