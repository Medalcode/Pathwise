/**
 * Applications Tracking Schema
 * Sistema de seguimiento de aplicaciones laborales
 */

function createApplicationsTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        profile_id INTEGER,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        url TEXT,
        status TEXT CHECK(status IN ('to_apply', 'applied', 'interview', 'offer', 'rejected')) DEFAULT 'to_apply',
        applied_date DATETIME,
        salary_range TEXT,
        location TEXT,
        notes TEXT,
        screenshot_path TEXT,
        reminder_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_applications_reminder ON applications(reminder_date);
      CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(user_id, created_at DESC);
    `;

    db.exec(sql, (err) => {
      if (err) {
        console.error('❌ Error creando tabla applications:', err);
        return reject(err);
      }
      console.log('✅ Tabla applications creada');
      resolve();
    });
  });
}

/**
 * Migración para agregar tabla de aplicaciones
 */
async function migrateApplications(db) {
  try {
    await createApplicationsTable(db);
    console.log('✅ Migración de applications completada');
  } catch (error) {
    console.error('❌ Error en migración de applications:', error);
    throw error;
  }
}

module.exports = {
  createApplicationsTable,
  migrateApplications
};
