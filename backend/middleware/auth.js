const jwt = require('jsonwebtoken');
const config = require('../config');

const JWT_SECRET = config.JWT_SECRET;

/**
 * Middleware para autenticar requests usando JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Autenticación requerida',
      message: 'No se proporcionó token de autenticación'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Agregar usuario decodificado al request
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      error: 'Token inválido',
      message: error.message
    });
  }
}

/**
 * Middleware opcional de autenticación
 * Si hay token, lo valida. Si no hay, continúa sin usuario.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token inválido, pero no bloqueamos el request
      req.user = null;
    }
  }
  
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
