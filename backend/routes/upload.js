const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const db = require('../database/db');

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// POST - Subir y parsear CV en PDF
router.post('/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parsear PDF
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;
    
    // Extraer información del CV
    const parsedData = parseCV(extractedText);
    
    // Guardar en la base de datos
    const userId = 1;
    await db.saveProfile(userId, parsedData);
    
    // Eliminar archivo temporal (opcional)
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'CV procesado exitosamente',
      data: parsedData,
      stats: {
        pages: pdfData.numpages,
        textLength: extractedText.length
      }
    });

  } catch (error) {
    console.error('Error procesando CV:', error);
    res.status(500).json({ 
      error: 'Error procesando el CV',
      details: error.message 
    });
  }
});

// Función para parsear texto del CV
function parseCV(text) {
  // Esta es una implementación básica, se puede mejorar con NLP/AI
  const data = {
    personalInfo: {},
    experience: [],
    education: [],
    skills: []
  };

  // Extraer email
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) {
    data.personalInfo.email = emailMatch[0];
  }

  // Extraer teléfono
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    data.personalInfo.phone = phoneMatch[0];
  }

  // Extraer nombre (primeras líneas suelen ser el nombre)
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const nameParts = lines[0].trim().split(' ');
    if (nameParts.length >= 2) {
      data.personalInfo.firstName = nameParts[0];
      data.personalInfo.lastName = nameParts.slice(1).join(' ');
    }
  }

  // Buscar LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) {
    data.personalInfo.linkedin = 'https://' + linkedinMatch[0];
  }

  // Buscar skills comunes (mejorable con NLP)
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 
    'Git', 'Docker', 'AWS', 'Azure', 'HTML', 'CSS', 'TypeScript',
    'Angular', 'Vue', 'MongoDB', 'PostgreSQL', 'Redis', 'Kubernetes'
  ];
  
  skillKeywords.forEach(skill => {
    if (text.includes(skill)) {
      data.skills.push(skill);
    }
  });

  // Eliminar duplicados
  data.skills = [...new Set(data.skills)];

  return data;
}

module.exports = router;
