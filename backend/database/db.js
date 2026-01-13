const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Variable para la conexión
let db;

const dbPath = process.env.DB_PATH || '/tmp/autoapply.db';

// Inicializar base de datos
function initDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        reject(err);
      } else {
        console.log('✅ Conexión a SQLite establecida');
        initializeTables();
        
        // Ejecutar migración de perfiles
        try {
          const { migrateToProfiles } = require('./profilesSystem');
          await migrateToProfiles(db);
          console.log('✅ Migración de perfiles completada');
        } catch (migrationError) {
          console.error('⚠️ Error en migración de perfiles:', migrationError);
        }
        
        resolve(db);
      }
    });
  });
}

// Inicializar tablas
function initializeTables() {
  db.serialize(() => {
    // Tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de información personal
    db.run(`
      CREATE TABLE IF NOT EXISTS personal_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        postal_code TEXT,
        current_title TEXT,
        linkedin TEXT,
        portfolio TEXT,
        github TEXT,
        summary TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de experiencia laboral
    db.run(`
      CREATE TABLE IF NOT EXISTS experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        start_date TEXT,
        end_date TEXT,
        current BOOLEAN DEFAULT 0,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de educación
    db.run(`
      CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        degree TEXT NOT NULL,
        school TEXT NOT NULL,
        field_of_study TEXT,
        start_date TEXT,
        end_date TEXT,
        current BOOLEAN DEFAULT 0,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de habilidades
    db.run(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        level INTEGER DEFAULT 3,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tablas inicializadas');
  });
}

// Funciones de base de datos

// Obtener perfil completo
function getProfile(userId) {
  return new Promise((resolve, reject) => {
    const profile = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: []
    };

    // Información personal
    db.get('SELECT * FROM personal_info WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        profile.personalInfo = {
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          email: row.email || '',
          phone: row.phone || '',
          address: row.address || '',
          city: row.city || '',
          country: row.country || '',
          postalCode: row.postal_code || '',
          currentTitle: row.current_title || '',
          linkedin: row.linkedin || '',
          portfolio: row.portfolio || '',
          github: row.github || '',
          summary: row.summary || ''
        };
      }

      // Experiencia
      db.all('SELECT * FROM experience WHERE user_id = ? ORDER BY order_index', [userId], (err, rows) => {
        if (!err && rows) {
          profile.experience = rows.map(row => ({
            id: row.id,
            title: row.title,
            company: row.company,
            location: row.location,
            startDate: row.start_date,
            endDate: row.end_date,
            current: Boolean(row.current),
            description: row.description
          }));
        }

        // Educación
        db.all('SELECT * FROM education WHERE user_id = ? ORDER BY order_index', [userId], (err, rows) => {
          if (!err && rows) {
            profile.education = rows.map(row => ({
              id: row.id,
              degree: row.degree,
              school: row.school,
              fieldOfStudy: row.field_of_study,
              startDate: row.start_date,
              endDate: row.end_date,
              current: Boolean(row.current),
              description: row.description
            }));
          }

          // Skills
          db.all('SELECT * FROM skills WHERE user_id = ?', [userId], (err, rows) => {
            if (!err && rows) {
              profile.skills = rows.map(row => row.name);
            }

            resolve(profile);
          });
        });
      });
    });
  });
}

// Guardar perfil completo
function saveProfile(userId, data) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crear usuario si no existe
      db.run('INSERT OR IGNORE INTO users (id) VALUES (?)', [userId]);

      // Guardar información personal
      if (data.personalInfo) {
        const info = data.personalInfo;
        db.run(`
          INSERT OR REPLACE INTO personal_info 
          (user_id, first_name, last_name, email, phone, address, city, country, postal_code, current_title, linkedin, portfolio, github, summary)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, info.firstName, info.lastName, info.email, info.phone,
          info.address, info.city, info.country, info.postalCode,
          info.currentTitle, info.linkedin, info.portfolio, info.github, info.summary
        ]);
      }

      // Guardar experiencia
      if (data.experience && Array.isArray(data.experience)) {
        db.run('DELETE FROM experience WHERE user_id = ?', [userId]);
        
        data.experience.forEach((exp, index) => {
          db.run(`
            INSERT INTO experience 
            (user_id, title, company, location, start_date, end_date, current, description, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userId, exp.title, exp.company, exp.location,
            exp.startDate, exp.endDate, exp.current ? 1 : 0,
            exp.description, index
          ]);
        });
      }

      // Guardar educación
      if (data.education && Array.isArray(data.education)) {
        db.run('DELETE FROM education WHERE user_id = ?', [userId]);
        
        data.education.forEach((edu, index) => {
          db.run(`
            INSERT INTO education 
            (user_id, degree, school, field_of_study, start_date, end_date, current, description, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userId, edu.degree, edu.school, edu.fieldOfStudy,
            edu.startDate, edu.endDate, edu.current ? 1 : 0,
            edu.description, index
          ]);
        });
      }

      // Guardar skills
      if (data.skills && Array.isArray(data.skills)) {
        db.run('DELETE FROM skills WHERE user_id = ?', [userId]);
        
        data.skills.forEach(skill => {
          db.run('INSERT INTO skills (user_id, name) VALUES (?, ?)', [userId, skill]);
        });
      }

      resolve(true);
    });
  });
}

// Actualizar sección del perfil
function updateProfileSection(userId, section, data) {
  return saveProfile(userId, { [section]: data });
}

// Eliminar perfil
function deleteProfile(userId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  db,
  initDB,
  getProfile,
  saveProfile,
  updateProfileSection,
  deleteProfile
};
