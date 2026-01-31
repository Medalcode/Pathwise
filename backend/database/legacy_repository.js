/**
 * Legacy Repository / DAO
 * Responsabilidad Única: Mapeo de objetos de dominio (Perfil) a SQL y viceversa.
 * Aísla la lógica compleja de transformación de datos del driver de conexión.
 */

// Obtener perfil completo
function getProfile(db, userId) {
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
function saveProfile(db, userId, data) {
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

function updateProfileSection(db, userId, section, data) {
  return saveProfile(db, userId, { [section]: data });
}

function deleteProfile(db, userId) {
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
  getProfile,
  saveProfile,
  updateProfileSection,
  deleteProfile
};
