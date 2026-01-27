const sqlite3 = require('sqlite3');
const profilesRepo = require('../database/repos/profilesRepo');

describe('profilesRepo.getProfileData', () => {
  let db;

  function runAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  function getAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
  }

  beforeAll(async () => {
    db = await new Promise((resolve, reject) => {
      const d = new sqlite3.Database(':memory:', (err) => (err ? reject(err) : resolve(d)));
    });

    // Create minimal tables needed by the repo
    await runAsync(db, `CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT)`);
    await runAsync(db, `CREATE TABLE profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT)`);
    await runAsync(db, `CREATE TABLE personal_info (id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id INTEGER, first_name TEXT, last_name TEXT, email TEXT, phone TEXT, address TEXT, city TEXT, country TEXT, postal_code TEXT, current_title TEXT, linkedin TEXT, portfolio TEXT, github TEXT, summary TEXT)`);
    await runAsync(db, `CREATE TABLE experience (id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id INTEGER, title TEXT, company TEXT, location TEXT, start_date TEXT, end_date TEXT, current INTEGER, description TEXT, order_index INTEGER)`);
    await runAsync(db, `CREATE TABLE education (id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id INTEGER, degree TEXT, school TEXT, field_of_study TEXT, start_date TEXT, end_date TEXT, current INTEGER, description TEXT, order_index INTEGER)`);
    await runAsync(db, `CREATE TABLE skills (id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id INTEGER, name TEXT)`);

    // Insert sample profile and data
    const info = await runAsync(db, `INSERT INTO profiles (user_id, name) VALUES (?, ?)`, [1, 'Test Profile']);
    const profileId = info.lastID || 1;
    await runAsync(db, `INSERT INTO personal_info (profile_id, first_name, last_name, email) VALUES (?, ?, ?, ?)`, [profileId, 'Ada', 'Lovelace', 'ada@example.com']);
    await runAsync(db, `INSERT INTO experience (profile_id, title, company, start_date, end_date, current, description, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [profileId, 'Developer', 'Acme', '2019', '2021', 0, 'Worked on X', 0]);
    await runAsync(db, `INSERT INTO education (profile_id, degree, school, start_date, end_date, current) VALUES (?, ?, ?, ?, ?, ?)`, [profileId, 'BSc', 'University', '2015', '2018', 0]);
    await runAsync(db, `INSERT INTO skills (profile_id, name) VALUES (?, ?)`, [profileId, 'JavaScript']);
  });

  afterAll(async () => {
    await new Promise((resolve) => db.close(resolve));
  });

  test('returns composed profile data', async () => {
    const profileIdRow = await getAsync(db, 'SELECT id FROM profiles LIMIT 1');
    const profileId = profileIdRow.id;

    const data = await profilesRepo.getProfileData(db, profileId);

    expect(data).toBeDefined();
    expect(data.personalInfo).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });
    expect(Array.isArray(data.experience)).toBe(true);
    expect(data.experience.length).toBeGreaterThan(0);
    expect(Array.isArray(data.education)).toBe(true);
    expect(Array.isArray(data.skills)).toBe(true);
    expect(data.skills).toContain('JavaScript');
  });
});
