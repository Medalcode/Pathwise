const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const applicationsRepo = require('../database/repos/applicationsRepo');

/**
 * GET /api/applications
 * Obtener todas las aplicaciones del usuario
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 100, offset = 0 } = req.query;
    
    const applications = await applicationsRepo.listApplications(db, userId, { status, limit, offset });
    
    res.json({
      success: true,
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error obteniendo aplicaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener aplicaciones',
      message: error.message
    });
  }
});

/**
 * GET /api/applications/stats
 * Obtener estadísticas de aplicaciones
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Contar por estado
    const stats = await applicationsRepo.getStats(db, userId);
    
    // Total de aplicaciones
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    // Calcular tasa de respuesta (interview + offer) / applied
    const applied = stats.find(s => s.status === 'applied')?.count || 0;
    const interview = stats.find(s => s.status === 'interview')?.count || 0;
    const offer = stats.find(s => s.status === 'offer')?.count || 0;
    
    const responseRate = applied > 0 ? ((interview + offer) / applied * 100).toFixed(1) : 0;
    
    // Aplicaciones esta semana
    const thisWeek = await applicationsRepo.countThisWeek(db, userId);
    
    res.json({
      success: true,
      stats: {
        total,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {}),
        responseRate: parseFloat(responseRate),
        thisWeek
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

/**
 * GET /api/applications/:id
 * Obtener una aplicación específica
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = parseInt(req.params.id);
    
    const application = await applicationsRepo.getApplication(db, userId, applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Aplicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error obteniendo aplicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener aplicación',
      message: error.message
    });
  }
});

/**
 * POST /api/applications
 * Crear nueva aplicación
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      profileId,
      jobTitle,
      company,
      url,
      status = 'to_apply',
      appliedDate,
      salaryRange,
      location,
      notes
    } = req.body;
    
    // Validar campos requeridos
    if (!jobTitle || !company) {
      return res.status(400).json({
        success: false,
        error: 'Job title y company son requeridos'
      });
    }
    
    const applicationId = await applicationsRepo.createApplication(db, userId, {
      profileId, jobTitle, company, url, status, appliedDate, salaryRange, location, notes
    });
    
    res.status(201).json({
      success: true,
      message: 'Aplicación creada exitosamente',
      application: {
        id: applicationId,
        userId,
        profileId,
        jobTitle,
        company,
        url,
        status,
        appliedDate,
        salaryRange,
        location,
        notes
      }
    });
  } catch (error) {
    console.error('Error creando aplicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear aplicación',
      message: error.message
    });
  }
});

/**
 * PUT /api/applications/:id
 * Actualizar aplicación completa
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = parseInt(req.params.id);
    const {
      jobTitle,
      company,
      url,
      status,
      appliedDate,
      salaryRange,
      location,
      notes
    } = req.body;
    
    // Verificar que la aplicación pertenece al usuario
    const updated = await applicationsRepo.updateApplication(db, userId, applicationId, {
      jobTitle, company, url, status, appliedDate, salaryRange, location, notes
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Aplicación no encontrada' });
    }
    
    res.json({
      success: true,
      message: 'Aplicación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando aplicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar aplicación',
      message: error.message
    });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Cambiar solo el estado de una aplicación
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = parseInt(req.params.id);
    const { status } = req.body;
    
    const validStatuses = ['to_apply', 'applied', 'interview', 'offer', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }
    
    const result = await applicationsRepo.patchStatus(db, userId, applicationId, status);
    
    if (result === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aplicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado',
      message: error.message
    });
  }
});

/**
 * DELETE /api/applications/:id
 * Eliminar aplicación
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = parseInt(req.params.id);
    
    const result = await applicationsRepo.deleteApplication(db, userId, applicationId);
    
    if (result === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aplicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Aplicación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando aplicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar aplicación',
      message: error.message
    });
  }
});

module.exports = router;
