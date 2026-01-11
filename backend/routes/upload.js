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

// Función mejorada para parsear texto del CV
function parseCV(text) {
  const data = {
    personalInfo: {},
    experience: [],
    education: [],
    skills: []
  };

  // Limpiar y normalizar texto
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line);
  
  // ========== INFORMACIÓN PERSONAL ==========
  
  // Extraer email
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) {
    data.personalInfo.email = emailMatch[0];
  }

  // Extraer teléfono (múltiples formatos)
  const phonePatterns = [
    /(\+?56\s?9\s?\d{4}\s?\d{4})/,  // Chile: +56 9 1234 5678
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,  // General
    /(\+\d{1,3}\s?)?\d{9,11}/  // Internacional simple
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.personalInfo.phone = match[0].trim();
      break;
    }
  }

  // Extraer nombre (primera línea no vacía que no sea muy larga)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].length > 5 && lines[i].length < 50 && !lines[i].includes('@') && !lines[i].startsWith('+')) {
      const nameParts = lines[i].split(' ').filter(part => part.length > 1);
      if (nameParts.length >= 2 && nameParts.length <= 6) {
        data.personalInfo.firstName = nameParts[0];
        data.personalInfo.lastName = nameParts.slice(1).join(' ');
        break;
      }
    }
  }

  // Detectar título profesional (segunda línea típicamente)
  const titlePatterns = [
    /^(desarrollador|developer|ingeniero|engineer|analista|analyst|diseñador|designer|arquitecto|architect)/i,
    /(full\s*stack|front\s*end|back\s*end|devops|qa|tester|scrum\s*master)/i
  ];
  
  for (let i = 1; i < Math.min(8, lines.length); i++) {
    for (const pattern of titlePatterns) {
      if (pattern.test(lines[i]) && lines[i].length < 60) {
        data.personalInfo.currentTitle = lines[i];
        break;
      }
    }
    if (data.personalInfo.currentTitle) break;
  }

  // Buscar LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) {
    data.personalInfo.linkedin = 'https://' + linkedinMatch[0];
  }

  // Buscar GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  if (githubMatch) {
    data.personalInfo.portfolio = 'https://' + githubMatch[0];
  }

  // Extraer ciudad y país
  const locationPatterns = [
    /Santiago,?\s*Chile/i,
    /Buenos\s*Aires,?\s*Argentina/i,
    /Lima,?\s*Per[uú]/i,
    /(Bogot[aá]|Ciudad\s*de\s*M[eé]xico|Madrid|Barcelona)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const location = match[0].split(',').map(s => s.trim());
      if (location.length >= 2) {
        data.personalInfo.city = location[0];
        data.personalInfo.country = location[1];
      } else {
        data.personalInfo.city = location[0];
      }
      break;
    }
  }

  // ========== EXPERIENCIA PROFESIONAL ==========
  
  const experienceKeywords = [
    'experiencia profesional', 'experiencia laboral', 'experience', 
    'work experience', 'employment', 'historial laboral', 'trabajo'
  ];
  
  let experienceStartIndex = -1;
  let experienceEndIndex = lines.length;
  
  // Encontrar inicio de sección de experiencia
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      experienceStartIndex = i + 1;
      break;
    }
  }
  
  // Encontrar fin de sección de experiencia (inicio de educación u otra sección)
  const otherSectionKeywords = ['educaci[oó]n', 'education', 'formaci[oó]n', 'habilidades', 'skills', 'certificaciones'];
  if (experienceStartIndex > -1) {
    for (let i = experienceStartIndex; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (otherSectionKeywords.some(keyword => new RegExp(keyword).test(line))) {
        experienceEndIndex = i;
        break;
      }
    }
  }
  
  // Parsear experiencias
  if (experienceStartIndex > -1) {
    let currentExperience = null;
    
    for (let i = experienceStartIndex; i < experienceEndIndex; i++) {
      const line = lines[i];
      
      // Detectar nuevo puesto (línea corta-media, posiblemente título)
      const datePattern = /\b(20\d{2}|19\d{2})\b/;
      const isTitleLine = line.length > 10 && line.length < 80 && !datePattern.test(line) && !line.startsWith('-') && !line.startsWith('•');
      
      if (isTitleLine && currentExperience === null) {
        // Posible título de puesto
        currentExperience = {
          title: line,
          company: '',
          startDate: '',
          endDate: '',
          current: false,
          description: ''
        };
      } else if (currentExperience && !currentExperience.company && line.length > 3) {
        // Posible empresa (segunda línea)
        const hasDate = datePattern.test(line);
        if (!hasDate && line.length < 80) {
          currentExperience.company = line;
        } else if (hasDate) {
          // Parse fechas
          const dates = parseDates(line);
          if (dates) {
            currentExperience.startDate = dates.start;
            currentExperience.endDate = dates.end;
            currentExperience.current = dates.current;
            if (lines[i - 1] && !currentExperience.company) {
              currentExperience.company = lines[i - 1];
            }
          }
        }
      } else if (currentExperience && currentExperience.company && !currentExperience.startDate) {
        // Buscar fechas
        const dates = parseDates(line);
        if (dates) {
          currentExperience.startDate = dates.start;
          currentExperience.endDate = dates.end;
          currentExperience.current = dates.current;
        }
      } else if (currentExperience && currentExperience.startDate) {
        // Descripción (líneas que empiezan con - o •)
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          currentExperience.description += (currentExperience.description ? '\n' : '') + line.substring(1).trim();
        } else if (datePattern.test(line) || isTitleLine) {
          // Nueva experiencia detectada
          if (currentExperience.title && currentExperience.company) {
            data.experience.push(currentExperience);
          }
          currentExperience = {
            title: line,
            company: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
          };
        }
      }
    }
    
    // Agregar última experiencia
    if (currentExperience && currentExperience.title && currentExperience.company) {
      data.experience.push(currentExperience);
    }
  }

  // ========== EDUCACIÓN ==========
  
  const educationKeywords = ['educaci[oó]n', 'education', 'formaci[oó]n', 'estudios', 'academic'];
  let educationStartIndex = -1;
  let educationEndIndex = lines.length;
  
  // Encontrar inicio de sección de educación
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (educationKeywords.some(keyword => new RegExp(keyword).test(line))) {
      educationStartIndex = i + 1;
      break;
    }
  }
  
  // Encontrar fin de sección
  const afterEducationKeywords = ['habilidades', 'skills', 'certificaciones', 'certifications', 'idiomas', 'languages'];
  if (educationStartIndex > -1) {
    for (let i = educationStartIndex; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (afterEducationKeywords.some(keyword => line.includes(keyword))) {
        educationEndIndex = i;
        break;
      }
    }
  }
  
  // Parsear educación
  if (educationStartIndex > -1) {
    let currentEducation = null;
    
    for (let i = educationStartIndex; i < educationEndIndex; i++) {
      const line = lines[i];
      const datePattern = /\b(20\d{2}|19\d{2})\b/;
      
      if (!currentEducation && line.length > 5) {
        currentEducation = {
          degree: line,
          school: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          current: false
        };
      } else if (currentEducation && !currentEducation.school && line.length > 3 && !datePattern.test(line)) {
        currentEducation.school = line;
      } else if (currentEducation && currentEducation.school && !currentEducation.startDate) {
        const dates = parseDates(line);
        if (dates) {
          currentEducation.startDate = dates.start;
          currentEducation.endDate = dates.end;
          currentEducation.current = dates.current;
          
          // Agregar y resetear
          if (currentEducation.degree && currentEducation.school) {
            data.education.push(currentEducation);
          }
          currentEducation = null;
        }
      }
    }
    
    // Agregar última educación si existe
    if (currentEducation && currentEducation.degree && currentEducation.school) {
      data.education.push(currentEducation);
    }
  }

  // ========== HABILIDADES ==========
  
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'React', 'Vue', 'Angular', 'Svelte', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
    'HTML', 'CSS', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
    'AWS', 'Azure', 'GCP', 'Heroku', 'Vercel', 'Netlify',
    'REST', 'GraphQL', 'API', 'Microservices', 'Serverless',
    'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello',
    'Linux', 'Ubuntu', 'Debian', 'Windows', 'macOS',
    'TensorFlow', 'PyTorch', 'Machine Learning', 'AI', 'Data Science',
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator'
  ];
  
  skillKeywords.forEach(skill => {
    // Escapar caracteres especiales en regex
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Buscar con word boundaries para evitar falsos positivos
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    if (regex.test(text)) {
      data.skills.push(skill);
    }
  });

  // Eliminar duplicados
  data.skills = [...new Set(data.skills)];

  return data;
}

// Función auxiliar para parsear fechas
function parseDates(text) {
  // Patterns para fechas
  const patterns = [
    /(\w+\s+)?(20\d{2}|19\d{2})\s*[-–—]\s*(\w+\s+)?(20\d{2}|19\d{2}|presente|actualidad|current|present)/i,
    /(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2}|presente|actualidad|current|present)/i,
    /desde\s*(20\d{2}|19\d{2})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const isCurrent = /presente|actualidad|current|present/i.test(match[0]);
      const years = match[0].match(/20\d{2}|19\d{2}/g);
      
      if (years && years.length >= 1) {
        return {
          start: years[0],
          end: isCurrent ? 'Presente' : (years[1] || ''),
          current: isCurrent
        };
      } else if (isCurrent && years) {
        return {
          start: years[0],
          end: 'Presente',
          current: true
        };
      }
    }
  }
  
  return null;
}

module.exports = router;
