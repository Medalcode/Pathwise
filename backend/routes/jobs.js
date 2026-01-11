const express = require('express');
const router = express.Router();
const jobService = require('../services/jobService');

// POST /api/jobs/search
// Body: { profile: { ... } }
router.post('/search', async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Se requiere un perfil para buscar empleos' });
    }
    
    console.log(`📡 Buscando empleos para perfil: ${profile.title}`);
    
    const jobs = await jobService.searchJobsForProfile(profile);
    
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
