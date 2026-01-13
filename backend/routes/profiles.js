/**
 * Profiles API Routes
 * Endpoints para gestionar múltiples perfiles de CV
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  duplicateProfile
} = require('../database/profilesSystem');

/**
 * GET /api/profiles
 * Obtener todos los perfiles del usuario
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Por ahora user_id = 1
    const profiles = await getAllProfiles(db, userId);
    
    res.json({
      success: true,
      profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error obteniendo perfiles:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo perfiles',
      message: error.message
    });
  }
});

/**
 * GET /api/profiles/:id
 * Obtener un perfil específico con todos sus datos
 */
router.get('/:id', async (req, res) => {
  try {
    const profileId = parseInt(req.params.id);
    
    // Obtener metadata del perfil
    const profileMeta = await getProfileById(db, profileId);
    
    if (!profileMeta) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    // Obtener datos del perfil
    const profileData = await getProfileData(db, profileId);
    
    res.json({
      success: true,
      profile: {
        ...profileMeta,
        data: profileData
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo perfil',
      message: error.message
    });
  }
});

/**
 * POST /api/profiles
 * Crear un nuevo perfil
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.body.userId || 1;
    const { name, type, isDefault, copyFromProfile } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del perfil es requerido'
      });
    }

    let newProfile;

    // Si se especifica copyFromProfile, duplicar
    if (copyFromProfile) {
      newProfile = await duplicateProfile(db, copyFromProfile, name);
    } else {
      // Crear perfil vacío
      newProfile = await createProfile(db, userId, {
        name,
        type: type || 'general',
        isDefault: isDefault || false
      });
    }

    res.status(201).json({
      success: true,
      profile: newProfile,
      message: 'Perfil creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando perfil',
      message: error.message
    });
  }
});

/**
 * PUT /api/profiles/:id
 * Actualizar metadata de un perfil
 */
router.put('/:id', async (req, res) => {
  try {
    const profileId = parseInt(req.params.id);
    const { name, type, isDefault } = req.body;

    await updateProfile(db, profileId, { name, type, isDefault });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando perfil',
      message: error.message
    });
  }
});

/**
 * PUT /api/profiles/:id/set-default
 * Marcar un perfil como predeterminado
 */
router.put('/:id/set-default', async (req, res) => {
  try {
    const profileId = parseInt(req.params.id);
    
    await updateProfile(db, profileId, { isDefault: true });

    res.json({
      success: true,
      message: 'Perfil marcado como predeterminado'
    });
  } catch (error) {
    console.error('Error marcando perfil como default:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando perfil',
      message: error.message
    });
  }
});

/**
 * DELETE /api/profiles/:id
 * Eliminar un perfil
 */
router.delete('/:id', async (req, res) => {
  try {
    const profileId = parseInt(req.params.id);
    
    await deleteProfile(db, profileId);

    res.json({
      success: true,
      message: 'Perfil eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error eliminando perfil',
      message: error.message
    });
  }
});

/**
 * POST /api/profiles/:id/duplicate
 * Duplicar un perfil existente
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const profileId = parseInt(req.params.id);
    const { name } = req.body;

    const newProfile = await duplicateProfile(db, profileId, name);

    res.status(201).json({
      success: true,
      profile: newProfile,
      message: 'Perfil duplicado exitosamente'
    });
  } catch (error) {
    console.error('Error duplicando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error duplicando perfil',
      message: error.message
    });
  }
});

/**
 * Helper: Obtener datos completos de un perfil
 */
function getProfileData(db, profileId) {
  return new Promise((resolve, reject) => {
    const profile = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: []
    };

    // Información personal
    db.get('SELECT * FROM personal_info WHERE profile_id = ?', [profileId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        profile.personalInfo = {
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          email: row.email || '',
          phone: row.phone || '',
          address: row.address || '',
          city: row.city || '',
          country: row.country || '',
          postalCode: row.postal_code || '',
          currentTitle: row.current_title || '',
          linkedin: row.linkedin || '',
          portfolio: row.portfolio || '',
          github: row.github || '',
          summary: row.summary || ''
        };
      }

      // Experiencia
      db.all('SELECT * FROM experience WHERE profile_id = ? ORDER BY order_index', [profileId], (err, rows) => {
        if (!err && rows) {
          profile.experience = rows.map(row => ({
            id: row.id,
            title: row.title,
            company: row.company,
            location: row.location,
            startDate: row.start_date,
            endDate: row.end_date,
            current: Boolean(row.current),
            description: row.description
          }));
        }

        // Educación
        db.all('SELECT * FROM education WHERE profile_id = ? ORDER BY order_index', [profileId], (err, rows) => {
          if (!err && rows) {
            profile.education = rows.map(row => ({
              id: row.id,
              degree: row.degree,
              school: row.school,
              fieldOfStudy: row.field_of_study,
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
    });
  });
}

module.exports = router;
