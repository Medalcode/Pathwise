const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../app');
const cvService = require('../../services/cvService');
const db = require('../../database/db');

jest.mock('../../services/cvService');
jest.mock('../../database/db');
jest.mock('../../services/storageService', () => ({
  uploadDatabase: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../services/groqService', () => ({
  isConfigured: jest.fn().mockReturnValue(false),
  parseCVWithAI: jest.fn()
}));

const uploadsDir = path.join(__dirname, '../../uploads');

async function listUploadFiles() {
  try {
    const files = await fs.readdir(uploadsDir);
    return files.sort();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

async function waitForUploads(expectedFiles, { timeoutMs = 1000, intervalMs = 50 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await listUploadFiles();
    if (JSON.stringify(current) === JSON.stringify(expectedFiles)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  const finalList = await listUploadFiles();
  throw new Error(`Uploads not cleaned. Expected ${expectedFiles.join(',')} got ${finalList.join(',')}`);
}

describe('Contract Test: POST /api/upload/cv - parsePdfFile technical failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe retornar 500, no persistir nada y limpiar temporales', async () => {
    const beforeFiles = await listUploadFiles();

    cvService.parsePdfFile.mockRejectedValue(new Error('PDF parse failure'));

    const res = await request(app)
      .post('/api/upload/cv')
      .attach('cv', Buffer.from('%PDF-1.4 dummy'), { filename: 'broken.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Error procesando el CV',
      details: 'PDF parse failure'
    });
    expect(db.saveProfile).not.toHaveBeenCalled();

    await waitForUploads(beforeFiles);
  });
});
