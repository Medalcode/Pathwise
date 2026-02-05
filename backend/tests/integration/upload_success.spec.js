const request = require('supertest');

let app;
let dbModule;

function expectNoUndefined(obj, keys) {
  keys.forEach((key) => {
    expect(obj[key]).not.toBeUndefined();
  });
}

describe('Integration: POST /api/upload/cv (success path)', () => {
  beforeAll(async () => {
    jest.resetModules();
    process.env.DB_PATH = ':memory:';

    jest.doMock('../../services/cvService', () => ({
      parsePdfFile: jest.fn().mockResolvedValue({
        text: 'Este CV tiene texto suficiente para pasar validaciones. email: ana@example.com',
        raw: { numpages: 1 }
      })
    }));

    jest.doMock('../../services/groqService', () => ({
      isConfigured: jest.fn().mockReturnValue(true),
      parseCVWithAI: jest.fn().mockResolvedValue({
        success: true,
        data: {
          personalInfo: {
            email: 'ana@example.com',
            phone: '+56 9 1234 5678',
            firstName: 'Ana',
            lastName: 'Pérez',
            currentTitle: 'Backend Engineer',
            linkedin: 'https://linkedin.com/in/ana',
            portfolio: 'https://ana.dev',
            city: 'Santiago',
            country: 'Chile'
          },
          experience: [
            {
              title: 'Senior Engineer',
              company: 'Acme',
              startDate: '2020-01',
              endDate: 'Presente',
              current: true,
              description: 'Build APIs'
            }
          ],
          education: [
            {
              degree: 'BSc Computer Science',
              school: 'University',
              startDate: 2015,
              endDate: 2019,
              current: false
            }
          ],
          skills: ['Node.js', 'SQL']
        }
      })
    }));

    dbModule = require('../../database/db');
    await dbModule.initDB();
    app = require('../../app');
  });

  afterAll(() => {
    delete process.env.DB_PATH;
  });

  it('Debe retornar 200 con JSON completo y datos persistidos', async () => {
    const res = await request(app)
      .post('/api/upload/cv')
      .attach('cv', Buffer.from('%PDF-1.4 dummy'), { filename: 'valid.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'CV procesado exitosamente');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('stats');

    const data = res.body.data;
    expect(data).toHaveProperty('personalInfo');
    expect(data).toHaveProperty('experience');
    expect(data).toHaveProperty('education');
    expect(data).toHaveProperty('skills');

    const personalInfoKeys = [
      'email',
      'phone',
      'firstName',
      'lastName',
      'currentTitle',
      'linkedin',
      'portfolio',
      'city',
      'country'
    ];
    expectNoUndefined(data.personalInfo, personalInfoKeys);
    personalInfoKeys.forEach((key) => {
      const value = data.personalInfo[key];
      expect(value === null || typeof value === 'string').toBe(true);
    });

    expect(Array.isArray(data.experience)).toBe(true);
    expect(Array.isArray(data.education)).toBe(true);
    expect(Array.isArray(data.skills)).toBe(true);
    expect(data.skills.length).toBeGreaterThan(0);
    data.skills.forEach((skill) => expect(typeof skill).toBe('string'));

    expect(data.experience.length).toBeGreaterThan(0);
    const exp = data.experience[0];
    expectNoUndefined(exp, ['title', 'company', 'startDate', 'endDate', 'current', 'description']);
    expect(typeof exp.title).toBe('string');
    expect(typeof exp.company).toBe('string');
    expect(typeof exp.current).toBe('boolean');
    expect(typeof exp.description).toBe('string');

    expect(data.education.length).toBeGreaterThan(0);
    const edu = data.education[0];
    expectNoUndefined(edu, ['degree', 'school', 'startDate', 'endDate', 'current']);
    expect(typeof edu.degree).toBe('string');
    expect(typeof edu.school).toBe('string');
    expect(typeof edu.current).toBe('boolean');

    expectNoUndefined(res.body.stats, ['pages', 'textLength', 'method']);
    expect(typeof res.body.stats.pages).toBe('number');
    expect(typeof res.body.stats.textLength).toBe('number');
    expect(['AI_GROQ', 'REGEX_FALLBACK']).toContain(res.body.stats.method);

    const persisted = await dbModule.getProfile(1);
    expect(persisted.personalInfo.email).toBe('ana@example.com');
    expect(persisted.personalInfo.firstName).toBe('Ana');
    expect(persisted.experience.length).toBeGreaterThan(0);
  });
});
