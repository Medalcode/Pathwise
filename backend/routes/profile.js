const express = require('express');
const router = express.Router();
const db = require('../database/db');
const groqService = require('../services/groqService');

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

// POST - Generar perfiles profesionales con Groq AI
router.post('/generate-profiles', async (req, res) => {
  try {
    // Obtener API key del header (enviada desde frontend) o usar la del entorno
    const apiKeyFromHeader = req.headers['x-groq-api-key'];
    
    // Verificar que haya una API key disponible
    if (!apiKeyFromHeader && !groqService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Servicio no disponible',
        message: 'La API key de Groq no está configurada. Por favor, configura GROQ_API_KEY en el archivo .env'
      });
    }

    const userId = 1;
    
    // Obtener datos del CV desde la base de datos
    const profile = await db.getProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Perfil no encontrado',
        message: 'Primero debes subir un CV para generar perfiles profesionales'
      });
    }

    console.log('🤖 Generando perfiles profesionales con Groq AI...');
    
    // Generar perfiles con Groq (pasar API key si viene del header)
    const result = await groqService.generateProfessionalProfiles(profile, apiKeyFromHeader);
    
    console.log(`✅ Perfiles generados exitosamente (${result.profiles.length} perfiles)`);
    
    res.json({
      success: true,
      message: 'Perfiles profesionales generados exitosamente',
      data: result.profiles,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Error generando perfiles profesionales:', error);
    res.status(500).json({ 
      error: 'Error generando perfiles profesionales',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
