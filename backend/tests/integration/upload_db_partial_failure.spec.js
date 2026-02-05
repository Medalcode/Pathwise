const request = require('supertest');
const sqlite3 = require('sqlite3');

let app;
let dbModule;

describe('Integration: POST /api/upload/cv (partial DB failure)', () => {
  beforeAll(async () => {
    jest.resetModules();
    process.env.DB_PATH = ':memory:';

    jest.doMock('../../services/cvService', () => ({
      parsePdfFile: jest.fn().mockResolvedValue({
        text: `
          Ana Perez
          ana.perez@example.com
          +56 9 1234 5678
          Senior Backend Engineer con experiencia en Node.js y APIs.
        `,
        raw: { numpages: 1 }
      })
    }));

    jest.doMock('../../services/groqService', () => ({
      isConfigured: jest.fn().mockReturnValue(false),
      parseCVWithAI: jest.fn()
    }));

    dbModule = require('../../database/db');
    await dbModule.initDB();
    app = require('../../app');
  });

  afterAll(() => {
    delete process.env.DB_PATH;
  });

  it('Debe retornar 500 y no dejar datos parciales cuando falla un INSERT intermedio', async () => {
    const originalRun = sqlite3.Database.prototype.run;
    let runCount = 0;

    sqlite3.Database.prototype.run = function (...args) {
      runCount += 1;
      if (runCount === 3) {
        throw new Error('Simulated DB failure on second insert');
      }
      return originalRun.apply(this, args);
    };

    let res;
    try {
      res = await request(app)
        .post('/api/upload/cv')
        .attach('cv', Buffer.from('%PDF-1.4 dummy'), { filename: 'valid.pdf', contentType: 'application/pdf' });
    } finally {
      sqlite3.Database.prototype.run = originalRun;
    }

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Error procesando el CV',
      details: 'Simulated DB failure on second insert'
    });

    const profile = await dbModule.getProfile(1);
    expect(Object.keys(profile.personalInfo)).toHaveLength(0);
    expect(profile.experience).toHaveLength(0);
    expect(profile.education).toHaveLength(0);
    expect(profile.skills).toHaveLength(0);
  });
});
