const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Rutas de la API
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const jobsRoutes = require('./routes/jobs');
const profilesRoutes = require('./routes/profiles');
const applicationsRoutes = require('./routes/applications');
const coverLetterRoutes = require('./routes/coverLetter');

const storageService = require('./services/storageService'); // Solo para status endpoint

const app = express();

// Middleware de logging global
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (Lógica de fallback)
// 1. Intenta estructura local (../web-dashboard)
let staticPath = path.join(__dirname, '../web-dashboard');
if (!fs.existsSync(staticPath)) {
    // 2. Si falla, intenta estructura Docker/Prod (./web-dashboard)
    staticPath = path.join(__dirname, 'web-dashboard');
}

console.log('🗂️  Configurando estáticos desde:', staticPath);
app.use(express.static(staticPath));

// Mounting de Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/cover-letter', coverLetterRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AutoApply API is running',
    timestamp: new Date().toISOString()
  });
});

// Sync status endpoint
app.get('/api/sync/status', (req, res) => {
  const syncStatus = storageService.getSyncStatus();
  res.json({
    success: true,
    ...syncStatus
  });
});

// Ruta principal - Fallback a index.html para SPA/Frontend
app.get('/', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  console.log('➡️  Petición a raíz, sirviendo:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error enviando index.html:', err);
      res.status(500).send('Error interno al servir el dashboard');
    }
  });
});

// Middleware de manejo global de errores (Debe ir al final)
app.use((err, req, res, next) => {
  console.error('🌋 Error global:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
