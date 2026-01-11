const express = require('express');
const router = express.Router();
const jobService = require('../services/jobService');

// POST /api/jobs/search
// Body: { profile: { ... } }
router.post('/search', async (req, res) => {
  try {
    const { profile, preferences } = req.body;
    
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Se requiere un perfil para buscar empleos' });
    }
    
    // location del usuario (fallback a Chile si no se especifica)
    const userLocation = preferences?.location || 'Chile';
    const remoteOnly = preferences?.remoteOnly === true;
    
    console.log(`📡 Buscando empleos para perfil: ${profile.title}, en: ${userLocation}, remotoOnly: ${remoteOnly}`);
    
    const jobs = await jobService.searchJobsForProfile(profile, userLocation, remoteOnly);
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
    
  } catch (error) {
    console.error('Error en /jobs/search:', error);
    res.status(500).json({ success: false, message: 'Error buscando empleos', error: error.message });
  }
});

module.exports = router;
