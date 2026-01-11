const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET - Obtener perfil del usuario
router.get('/', async (req, res) => {
  try {
    const userId = 1; // Por ahora, solo un usuario
    
    const profile = await db.getProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear o actualizar perfil
router.post('/', async (req, res) => {
  try {
    const userId = 1;
    const profileData = req.body;
    
    const success = await db.saveProfile(userId, profileData);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Perfil guardado exitosamente' 
      });
    } else {
      res.status(500).json({ error: 'Error guardando perfil' });
    }
  } catch (error) {
    console.error('Error guardando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar sección específica del perfil
router.put('/:section', async (req, res) => {
  try {
    const userId = 1;
    const { section } = req.params;
    const data = req.body;
    
    const success = await db.updateProfileSection(userId, section, data);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Sección ${section} actualizada` 
      });
    } else {
      res.status(500).json({ error: 'Error actualizando perfil' });
    }
  } catch (error) {
    console.error('Error actualizando sección:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar perfil
router.delete('/', async (req, res) => {
  try {
    const userId = 1;
    const success = await db.deleteProfile(userId);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Perfil eliminado' 
      });
    } else {
      res.status(500).json({ error: 'Error eliminando perfil' });
    }
  } catch (error) {
    console.error('Error eliminando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
