const fs = require('fs').promises;
const pdf = require('pdf-parse');

/**
 * parsePdfFile: lee el archivo PDF de forma asíncrona y extrae texto.
 * Devuelve un objeto con `text` y `raw` para futuras extensiones.
 */
async function parsePdfFile(filePath) {
  try {
    const data = await fs.readFile(filePath);
    const parsed = await pdf(data);
    return {
      text: parsed.text || '',
      raw: parsed
    };
  } catch (err) {
    // Re-lanzar error para que el caller decida fallback
    throw err;
  }
}

module.exports = {
  parsePdfFile
};
