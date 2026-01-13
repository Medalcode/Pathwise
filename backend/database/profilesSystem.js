/**
 * Profiles System - Database Schema Extension
 * Agrega soporte para múltiples perfiles de CV
 */

const sqlite3 = require('sqlite3').verbose();

/**
 * Migración para agregar tabla de perfiles
 * @param {sqlite3.Database} db - Instancia de la base de datos
 */
function migrateToProfiles(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crear tabla de perfiles
      db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL DEFAULT 1,
          name TEXT NOT NULL,
          type TEXT,
          is_default BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creando tabla profiles:', err);
          reject(err);
          return;
        }
        console.log('✅ Tabla profiles creada');
      });

      // Agregar columna profile_id a las tablas existentes
      const tables = ['personal_info', 'experience', 'education', 'skills'];
      
      tables.forEach(table => {
        // Verificar si la columna ya existe
        db.all(`PRAGMA table_info(${table})`, (err, columns) => {
          if (err) {
            console.error(`❌ Error verificando ${table}:`, err);
            return;
          }

          const hasProfileId = columns.some(col => col.name === 'profile_id');
          
          if (!hasProfileId) {
            db.run(`ALTER TABLE ${table} ADD COLUMN profile_id INTEGER`, (err) => {
              if (err) {
                console.error(`❌ Error agregando profile_id a ${table}:`, err);
              } else {
                console.log(`✅ Columna profile_id agregada a ${table}`);
              }
            });
          }
        });
      });

      // Crear perfil por defecto si no existe
      db.get('SELECT COUNT(*) as count FROM profiles', (err, row) => {
        if (!err && row.count === 0) {
          db.run(`
            INSERT INTO profiles (user_id, name, type, is_default)
            VALUES (1, 'Mi Perfil Principal', 'general', 1)
          `, (err) => {
            if (err) {
              console.error('❌ Error creando perfil por defecto:', err);
            } else {
              console.log('✅ Perfil por defecto creado');
              
              // Actualizar datos existentes para asociarlos al perfil por defecto
              db.get('SELECT id FROM profiles WHERE is_default = 1 LIMIT 1', (err, profile) => {
                if (!err && profile) {
                  const profileId = profile.id;
                  tables.forEach(table => {
                    db.run(`UPDATE ${table} SET profile_id = ? WHERE profile_id IS NULL`, [profileId]);
                  });
                  console.log('✅ Datos existentes migrados al perfil por defecto');
                }
              });
            }
          });
        }
      });

      resolve();
    });
  });
}

/**
 * Obtener todos los perfiles de un usuario
 * @param {sqlite3.Database} db
 * @param {number} userId
 */
function getAllProfiles(db, userId) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id,
        name,
        type,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM profiles
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Obtener un perfil específico
 * @param {sqlite3.Database} db
 * @param {number} profileId
 */
function getProfileById(db, profileId) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        id,
        user_id as userId,
        name,
        type,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM profiles
      WHERE id = ?
    `, [profileId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * Crear un nuevo perfil
 * @param {sqlite3.Database} db
 * @param {number} userId
 * @param {Object} profileData
 */
function createProfile(db, userId, profileData) {
  return new Promise((resolve, reject) => {
    const { name, type = 'general', isDefault = false } = profileData;
    
    db.serialize(() => {
      // Si es default, quitar default de otros perfiles
      if (isDefault) {
        db.run('UPDATE profiles SET is_default = 0 WHERE user_id = ?', [userId]);
      }

      // Crear nuevo perfil
      db.run(`
        INSERT INTO profiles (user_id, name, type, is_default)
        VALUES (?, ?, ?, ?)
      `, [userId, name, type, isDefault ? 1 : 0], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, name, type, isDefault });
        }
      });
    });
  });
}

/**
 * Actualizar un perfil
 * @param {sqlite3.Database} db
 * @param {number} profileId
 * @param {Object} updates
 */
function updateProfile(db, profileId, updates) {
  return new Promise((resolve, reject) => {
    const { name, type, isDefault } = updates;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (type !== undefined) {
      fields.push('type = ?');
      values.push(type);
    }
    if (isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(isDefault ? 1 : 0);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(profileId);

    db.serialize(() => {
      // Si se marca como default, quitar default de otros
      if (isDefault) {
        db.get('SELECT user_id FROM profiles WHERE id = ?', [profileId], (err, row) => {
          if (!err && row) {
            db.run('UPDATE profiles SET is_default = 0 WHERE user_id = ?', [row.user_id]);
          }
        });
      }

      db.run(`
        UPDATE profiles
        SET ${fields.join(', ')}
        WHERE id = ?
      `, values, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });
}

/**
 * Eliminar un perfil
 * @param {sqlite3.Database} db
 * @param {number} profileId
 */
function deleteProfile(db, profileId) {
  return new Promise((resolve, reject) => {
    // Verificar que no sea el único perfil
    db.get('SELECT user_id FROM profiles WHERE id = ?', [profileId], (err, profile) => {
      if (err) {
        reject(err);
        return;
      }

      if (!profile) {
        reject(new Error('Perfil no encontrado'));
        return;
      }

      db.get('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?', [profile.user_id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count <= 1) {
          reject(new Error('No puedes eliminar el único perfil'));
          return;
        }

        // Eliminar el perfil (CASCADE eliminará los datos asociados)
        db.run('DELETE FROM profiles WHERE id = ?', [profileId], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    });
  });
}

/**
 * Duplicar un perfil
 * @param {sqlite3.Database} db
 * @param {number} profileId
 * @param {string} newName
 */
function duplicateProfile(db, profileId, newName) {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtener perfil original
      const originalProfile = await getProfileById(db, profileId);
      if (!originalProfile) {
        reject(new Error('Perfil no encontrado'));
        return;
      }

      // Crear nuevo perfil
      const newProfile = await createProfile(db, originalProfile.userId, {
        name: newName || `${originalProfile.name} (Copia)`,
        type: originalProfile.type,
        isDefault: false
      });

      // Copiar datos del perfil original
      const tables = ['personal_info', 'experience', 'education', 'skills'];
      
      db.serialize(() => {
        tables.forEach(table => {
          db.all(`SELECT * FROM ${table} WHERE profile_id = ?`, [profileId], (err, rows) => {
            if (!err && rows) {
              rows.forEach(row => {
                const columns = Object.keys(row).filter(k => k !== 'id' && k !== 'profile_id');
                const placeholders = columns.map(() => '?').join(', ');
                const values = columns.map(k => row[k]);
                
                db.run(`
                  INSERT INTO ${table} (profile_id, ${columns.join(', ')})
                  VALUES (?, ${placeholders})
                `, [newProfile.id, ...values]);
              });
            }
          });
        });
      });

      resolve(newProfile);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  migrateToProfiles,
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  duplicateProfile
};
