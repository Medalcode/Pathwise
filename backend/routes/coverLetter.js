const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateCoverLetter } = require('../services/groqService');
const { db } = require('../database/db');

/**
 * POST /api/cover-letter/generate
 * Generar carta de presentación con IA
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId, jobDescription, jobTitle, company, tone = 'professional' } = req.body;
    
    // Validar campos requeridos
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'La descripción del trabajo es requerida'
      });
    }
    
    // Obtener datos del perfil
    let profile = null;
    
    if (profileId) {
      // Obtener perfil específico
      profile = await getProfileData(profileId, userId);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Perfil no encontrado'
        });
      }
    } else {
      // Usar perfil por defecto o el primero disponible
      const defaultProfile = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM profiles WHERE user_id = ? AND is_default = 1 LIMIT 1',
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (defaultProfile) {
        profile = await getProfileData(defaultProfile.id, userId);
      } else {
        return res.status(400).json({
          success: false,
          error: 'No se encontró un perfil. Por favor especifica profileId'
        });
      }
    }
    
    // Generar cover letter
    const result = await generateCoverLetter(profile, jobDescription, {
      tone,
      company,
      jobTitle
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error generando cover letter:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar carta de presentación',
      message: error.message
    });
  }
});

/**
 * Helper: Obtener datos completos de un perfil
 */
function getProfileData(profileId, userId) {
  return new Promise((resolve, reject) => {
    const profile = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: []
    };

    // Verificar que el perfil pertenece al usuario
    db.get(
      'SELECT id FROM profiles WHERE id = ? AND user_id = ?',
      [profileId, userId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }

        // Información personal
        db.get('SELECT * FROM personal_info WHERE profile_id = ?', [profileId], (err, row) => {
          if (!err && row) {
            profile.personalInfo = {
              firstName: row.first_name || '',
              lastName: row.last_name || '',
              email: row.email || '',
              phone: row.phone || '',
              currentTitle: row.current_title || '',
              summary: row.summary || ''
            };
          }

          // Experiencia
          db.all('SELECT * FROM experience WHERE profile_id = ? ORDER BY order_index', [profileId], (err, rows) => {
            if (!err && rows) {
              profile.experience = rows.map(row => ({
                title: row.title,
                company: row.company,
                startDate: row.start_date,
                endDate: row.end_date,
                current: Boolean(row.current),
                description: row.description
              }));
            }

            // Skills
            db.all('SELECT * FROM skills WHERE profile_id = ?', [profileId], (err, rows) => {
              if (!err && rows) {
                profile.skills = rows.map(row => row.name);
              }

              resolve(profile);
            });
          });
        });
      }
    );
  });
}

module.exports = router;
