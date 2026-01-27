/**
 * applicationsRepo - encapsula queries de la tabla applications
 * Provee API Promise-based para ser usada por rutas/servicios.
 */

function listApplications(db, userId, { status, limit = 100, offset = 0 } = {}) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM applications WHERE user_id = ?';
    const params = [userId];
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getApplication(db, userId, applicationId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [applicationId, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function getStats(db, userId) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT status, COUNT(*) as count
      FROM applications
      WHERE user_id = ?
      GROUP BY status
    `, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function countThisWeek(db, userId) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE user_id = ?
      AND created_at >= datetime('now', '-7 days')
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row?.count || 0);
    });
  });
}

function createApplication(db, userId, payload) {
  const {
    profileId, jobTitle, company, url, status = 'to_apply', appliedDate,
    salaryRange, location, notes
  } = payload;

  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO applications (
        user_id, profile_id, job_title, company, url, status,
        applied_date, salary_range, location, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, profileId, jobTitle, company, url, status, appliedDate, salaryRange, location, notes], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function updateApplication(db, userId, applicationId, payload) {
  const {
    jobTitle, company, url, status, appliedDate, salaryRange, location, notes
  } = payload;

  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM applications WHERE id = ? AND user_id = ?', [applicationId, userId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(false);

      db.run(`
        UPDATE applications
        SET job_title = ?, company = ?, url = ?, status = ?,
            applied_date = ?, salary_range = ?, location = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [jobTitle, company, url, status, appliedDate, salaryRange, location, notes, applicationId, userId], (err2) => {
        if (err2) reject(err2);
        else resolve(true);
      });
    });
  });
}

function patchStatus(db, userId, applicationId, status) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE applications
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [status, applicationId, userId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function deleteApplication(db, userId, applicationId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM applications WHERE id = ? AND user_id = ?', [applicationId, userId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

module.exports = {
  listApplications,
  getApplication,
  getStats,
  countThisWeek,
  createApplication,
  updateApplication,
  patchStatus,
  deleteApplication
};
