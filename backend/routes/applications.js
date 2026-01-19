const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/applications
 * Obtener todas las aplicaciones del usuario
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM applications WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const applications = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
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
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          status,
          COUNT(*) as count
        FROM applications
        WHERE user_id = ?
        GROUP BY status
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    // Total de aplicaciones
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    // Calcular tasa de respuesta (interview + offer) / applied
    const applied = stats.find(s => s.status === 'applied')?.count || 0;
    const interview = stats.find(s => s.status === 'interview')?.count || 0;
    const offer = stats.find(s => s.status === 'offer')?.count || 0;
    
    const responseRate = applied > 0 ? ((interview + offer) / applied * 100).toFixed(1) : 0;
    
    // Aplicaciones esta semana
    const thisWeek = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count
        FROM applications
        WHERE user_id = ?
        AND created_at >= datetime('now', '-7 days')
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
    
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
    
    const application = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [applicationId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
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
    
    const applicationId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO applications (
          user_id, profile_id, job_title, company, url, status,
          applied_date, salary_range, location, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, profileId, jobTitle, company, url, status,
        appliedDate, salaryRange, location, notes
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
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
    const existing = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM applications WHERE id = ? AND user_id = ?',
        [applicationId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Aplicación no encontrada'
      });
    }
    
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE applications
        SET job_title = ?, company = ?, url = ?, status = ?,
            applied_date = ?, salary_range = ?, location = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [
        jobTitle, company, url, status, appliedDate, salaryRange,
        location, notes, applicationId, userId
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
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
    
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE applications
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [status, applicationId, userId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
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
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM applications WHERE id = ? AND user_id = ?',
        [applicationId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
    
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
