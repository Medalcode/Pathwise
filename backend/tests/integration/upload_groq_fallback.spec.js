const request = require('supertest');
const app = require('../../app');
const cvService = require('../../services/cvService');
const db = require('../../database/db');

jest.mock('../../services/cvService');
jest.mock('../../database/db');
jest.mock('../../services/storageService', () => ({
  uploadDatabase: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../services/groqService', () => ({
  isConfigured: jest.fn().mockReturnValue(true),
  parseCVWithAI: jest.fn().mockResolvedValue({ success: false, error: 'AI failed' })
}));

function expectNoUndefined(obj, keys) {
  keys.forEach((key) => {
    expect(obj[key]).not.toBeUndefined();
  });
}

describe('Integration: POST /api/upload/cv (Groq fallback to Regex)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.saveProfile.mockResolvedValue(1);
  });

  it('Debe retornar 200, método REGEX_FALLBACK y JSON completo', async () => {
    const mockText = `
      Ana Pérez
      ana.perez@example.com
      +56 9 1234 5678
      Senior Backend Engineer
      linkedin.com/in/anaperez
      github.com/anaperez
      Santiago, Chile

      Experiencia Profesional
      Senior Engineer
      Acme Corp
      2020 - Presente
      - Build APIs

      Educación
      BSc Computer Science
      University
      2015 - 2019

      Skills
      Node.js, SQL
    `;

    cvService.parsePdfFile.mockResolvedValue({
      text: mockText,
      raw: { numpages: 2 }
    });

    const res = await request(app)
      .post('/api/upload/cv')
      .attach('cv', Buffer.from('%PDF-1.4 dummy'), { filename: 'valid.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'CV procesado exitosamente');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats.method).toBe('REGEX_FALLBACK');

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
      expect(typeof data.personalInfo[key]).toBe('string');
    });

    expect(Array.isArray(data.experience)).toBe(true);
    expect(Array.isArray(data.education)).toBe(true);
    expect(Array.isArray(data.skills)).toBe(true);
    expect(data.experience.length).toBeGreaterThan(0);
    expect(data.education.length).toBeGreaterThan(0);
    expect(data.skills.length).toBeGreaterThan(0);

    const exp = data.experience[0];
    expectNoUndefined(exp, ['title', 'company', 'startDate', 'endDate', 'current', 'description']);
    expect(typeof exp.title).toBe('string');
    expect(typeof exp.company).toBe('string');
    expect(typeof exp.current).toBe('boolean');

    const edu = data.education[0];
    expectNoUndefined(edu, ['degree', 'school', 'startDate', 'endDate', 'current']);
    expect(typeof edu.degree).toBe('string');
    expect(typeof edu.school).toBe('string');
    expect(typeof edu.current).toBe('boolean');

    expectNoUndefined(res.body.stats, ['pages', 'textLength', 'method']);
    expect(typeof res.body.stats.pages).toBe('number');
    expect(typeof res.body.stats.textLength).toBe('number');
  });
});
