const request = require('supertest');
const app = require('../../app');
const cvService = require('../../services/cvService');
const db = require('../../database/db');

jest.mock('../../services/cvService');
jest.mock('../../database/db');
jest.mock('../../services/storageService', () => ({ uploadDatabase: jest.fn() }));
jest.mock('../../services/groqService', () => ({ 
  isConfigured: jest.fn().mockReturnValue(false),
  parseCVWithAI: jest.fn() 
}));

describe('Resiliency Test: Upload CV Edge Cases', () => {

  it('Debe rechazar (422) y reportar explícitamente cuando el CV no tiene contacto válido', async () => {
    // 1. Setup: Texto diseñado específicamente para no tener estructura de nombre
    // Las líneas deben ser > 50 caracteres para saltarse la heurística de detección de nombre del parser.
    const textWithoutContact = `
      Linea de texto deliberadamente demasiado larga para ser considerada un nombre por el sistema (mas de 50 chars) 01
      Linea de texto deliberadamente demasiado larga para ser considerada un nombre por el sistema (mas de 50 chars) 02
      Linea de texto deliberadamente demasiado larga para ser considerada un nombre por el sistema (mas de 50 chars) 03
      Linea de texto deliberadamente demasiado larga para ser considerada un nombre por el sistema (mas de 50 chars) 04
      Linea de texto deliberadamente demasiado larga para ser considerada un nombre por el sistema (mas de 50 chars) 05
      Sin email ni telefono validos en este texto de relleno.
    `;
    
    cvService.parsePdfFile.mockResolvedValue({
      text: textWithoutContact,
      raw: { numpages: 1 }
    });

    // 2. Ejecución
    const res = await request(app)
      .post('/api/upload/cv')
      .attach('cv', Buffer.from('dummy-pdf-content'), 'fake_garbage.pdf');

    // 3. Verificación
    expect(res.status).toBe(422);
    expect(res.body).toEqual(expect.objectContaining({
      error: 'Error de validación',
      details: expect.stringMatching(/No se pudo extraer información de contacto/)
    }));
    expect(db.saveProfile).not.toHaveBeenCalled();
  });

});
