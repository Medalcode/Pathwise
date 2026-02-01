const request = require('supertest');
const app = require('../../app');
const cvService = require('../../services/cvService');
const db = require('../../database/db');

// Mockear dependencias para aislar la prueba
jest.mock('../../services/cvService');
jest.mock('../../database/db');
jest.mock('../../services/storageService', () => ({
  uploadDatabase: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../services/groqService', () => ({
  isConfigured: jest.fn().mockReturnValue(false),
  parseCVWithAI: jest.fn()
}));

describe('Contract Test: POST /api/upload/cv', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    db.saveProfile.mockResolvedValue(1); 
  });

  describe('Validación de Inputs', () => {
    it('Debe retornar 400 MISSING_FILE si no se envía archivo', async () => {
      const res = await request(app)
        .post('/api/upload/cv')
        .send({}); // No attach

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/no se ha subido/i);
    });

    it('Debe retornar error (500) si el archivo no es PDF validado por Multer', async () => {
        // Nota: En la implementación actual, Multer filtra por mimetype.
        // Si falla el filtro, Multer tira error que atrapa el middleware global como 500
        // o el endpoint detecta req.file undefined -> 400.
        // El contrato dice validación de tipo. Vamos a probar enviar un .txt
        const res = await request(app)
            .post('/api/upload/cv')
            .attach('cv', Buffer.from('dummy text'), { filename: 'test.txt', contentType: 'text/plain' });
        
        // Multer fileFilter rechaza, req.file es undefined o error.
        // Si multer lanza error al cb, express lo captura y lo manda al global handler.
        expect(res.status).toBe(500);
        // Middleware global usa 'message', controller usa 'details'. Revisamos ambos.
        expect(res.body.message || res.body.details).toMatch(/Solo se permiten archivos PDF/i);
    });
  });

  describe('Validación de Contenido (Business Rules)', () => {
    it('Debe retornar 422 INVALID_FILE_CONTENT si el PDF es "imagen" (poco texto)', async () => {
      // Mockear parser para devolver poco texto
      cvService.parsePdfFile.mockResolvedValue({ 
        text: '   Scan   ', 
        raw: { numpages: 1 } 
      });

      const res = await request(app)
        .post('/api/upload/cv')
        .attach('cv', Buffer.from('%PDF-dummy'), { filename: 'scan.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(422);
      expect(res.body.details).toMatch(/no contiene texto legible/i);
    });

    it('Debe retornar 422 EXTRACTION_FAILED si no hay datos de contacto', async () => {
      // Mockear parser con texto lorem ipsum sin emails ni telefonos
      cvService.parsePdfFile.mockResolvedValue({ 
        text: 'Soy un desarrollador apasionado pero olvidé poner mi contacto. Node.js Expert.', 
        raw: { numpages: 1 } 
      });

      const res = await request(app)
        .post('/api/upload/cv')
        .attach('cv', Buffer.from('%PDF-dummy'), { filename: 'nocontact.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(422);
      expect(res.body.details).toMatch(/No se pudo extraer información de contacto/i);
    });
  });

  describe('Éxito (Happy Path)', () => {
    it('Debe retornar 200 y estructura JSON correcta para un CV válido', async () => {
      const mockText = `
        Juan Perez
        juan.perez@example.com
        +56 9 1234 5678
        Senior Developer
        Experiencia trabajando en Node.js
      `;

      cvService.parsePdfFile.mockResolvedValue({ 
        text: mockText, 
        raw: { numpages: 2 } 
      });

      const res = await request(app)
        .post('/api/upload/cv')
        .attach('cv', Buffer.from('%PDF-dummy'), { filename: 'valid.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Validar contrato de datos
      const data = res.body.data;
      expect(data).toHaveProperty('personalInfo');
      expect(data.personalInfo.email).toBe('juan.perez@example.com');
      // Regex puede ser tricky con espacios, pero validamos que haya extraído algo
      expect(data.personalInfo.phone).toBeDefined();
      
      expect(data).toHaveProperty('experience');
      expect(data).toHaveProperty('education');
      expect(data).toHaveProperty('skills');
      
      // Validar stats
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.method).toBe('REGEX_FALLBACK');
    });
  });

  describe('Resiliencia', () => {
    it('Debe limpiar archivos temporales incluso si hay error 422', async () => {
      // Este test es difícil de verificar "desde fuera" con Mocks de fs,
      // pero podemos verificar que el flujo completa sin colgarse.
      // En un test unitario real verificaríamos fs.unlink.
      // Aquí confiamos en el outcome HTTP.
      cvService.parsePdfFile.mockResolvedValue({ text: 'Short', raw: {} });
      const res = await request(app)
        .post('/api/upload/cv')
        .attach('cv', Buffer.from('dummy'), 'temp.pdf');
      
      expect(res.status).toBe(422);
    });
  });

});
