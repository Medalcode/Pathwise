const sqlite3 = require('sqlite3');
const applicationsRepo = require('../database/repos/applicationsRepo');
const applicationsSchema = require('../database/applicationsSchema');

describe('applicationsRepo', () => {
  let db;

  function runAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  beforeAll(async () => {
    db = await new Promise((resolve, reject) => {
      const d = new sqlite3.Database(':memory:', (err) => (err ? reject(err) : resolve(d)));
    });

    // Initialize applications table
    await applicationsSchema.createApplicationsTable(db);

    // Insert sample application
    await runAsync(db, `INSERT INTO applications (user_id, job_title, company, status, created_at) VALUES (?, ?, ?, ?, datetime('now'))`, [1, 'Dev', 'Acme', 'applied']);
    await runAsync(db, `INSERT INTO applications (user_id, job_title, company, status, created_at) VALUES (?, ?, ?, ?, datetime('now', '-2 days'))`, [1, 'QA', 'Beta', 'interview']);
  });

  afterAll(async () => {
    await new Promise((resolve) => db.close(resolve));
  });

  test('listApplications returns rows', async () => {
    const rows = await applicationsRepo.listApplications(db, 1, { limit: 10, offset: 0 });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  test('getStats and countThisWeek return sensible values', async () => {
    const stats = await applicationsRepo.getStats(db, 1);
    expect(Array.isArray(stats)).toBe(true);
    const thisWeek = await applicationsRepo.countThisWeek(db, 1);
    expect(typeof thisWeek).toBe('number');
  });

  test('create/get/update/patch/delete application flow', async () => {
    const newIdRes = await applicationsRepo.createApplication(db, 1, { profileId: null, jobTitle: 'New', company: 'C', url: null, status: 'to_apply', appliedDate: null, salaryRange: null, location: null, notes: null });
    const newId = newIdRes; // returns numeric id
    expect(typeof newId).toBe('number');

    const app = await applicationsRepo.getApplication(db, 1, newId);
    expect(app).toBeDefined();
    expect(app.job_title).toBe('New');

    const updated = await applicationsRepo.updateApplication(db, 1, newId, { jobTitle: 'Updated', company: 'C2', url: null, status: 'applied', appliedDate: null, salaryRange: null, location: null, notes: null });
    expect(updated).toBe(true);

    const patched = await applicationsRepo.patchStatus(db, 1, newId, 'interview');
    expect(typeof patched).toBe('number');

    const deleted = await applicationsRepo.deleteApplication(db, 1, newId);
    expect(typeof deleted).toBe('number');
  });
});
