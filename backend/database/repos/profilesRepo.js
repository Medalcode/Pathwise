const dbModule = require('../db');

/**
 * profilesRepo - combina utilidades de acceso a datos para perfiles.
 * - Exporta funciones de alto nivel para rutas que gestionan múltiples perfiles
 * - Incluye también wrappers ligeros sobre `dbModule` usados por rutas de perfil único
 */

function getProfileData(db, profileId) {
  return new Promise((resolve, reject) => {
    const profile = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: []
    };

    db.get('SELECT * FROM personal_info WHERE profile_id = ?', [profileId], (err, row) => {
      if (err) return reject(err);

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

      db.all('SELECT * FROM experience WHERE profile_id = ? ORDER BY order_index', [profileId], (err, rows) => {
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

        db.all('SELECT * FROM education WHERE profile_id = ? ORDER BY order_index', [profileId], (err, rows) => {
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

          db.all('SELECT * FROM skills WHERE profile_id = ?', [profileId], (err, rows) => {
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

// Wrappers sobre `dbModule` para operaciones de perfil único
async function getProfile(userId) {
  return dbModule.getProfile(userId);
}

async function saveProfile(userId, profileData) {
  return dbModule.saveProfile(userId, profileData);
}

async function updateProfileSection(userId, section, data) {
  return dbModule.updateProfileSection(userId, section, data);
}

async function deleteProfile(userId) {
  return dbModule.deleteProfile(userId);
}

module.exports = {
  getProfileData,
  getProfile,
  saveProfile,
  updateProfileSection,
  deleteProfile
};
