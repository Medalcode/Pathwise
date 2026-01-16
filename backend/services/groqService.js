const Groq = require('groq-sdk');

// La inicialización del cliente se hace bajo demanda en generateProfessionalProfiles

/**
 * Genera 3 perfiles profesionales basados en los datos extraídos del CV
 * @param {Object} cvData - Datos parseados del CV
 * @param {string} apiKey - API key de Groq (opcional, usa env si no se proporciona)
 * @returns {Promise<Array>} - Array con 3 perfiles profesionales
 */
async function generateProfessionalProfiles(cvData, apiKey = null) {
  try {
    // Usar API key proporcionada o la del entorno
    const groqApiKey = apiKey || process.env.GROQ_API_KEY;
    
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      throw new Error('API key de Groq no configurada');
    }
    
    // Crear cliente con la API key
    const groqClient = new Groq({ apiKey: groqApiKey });
    
    // Construir el prompt con los datos del CV
    const prompt = buildPrompt(cvData);
    
    // Llamar a Groq API
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un experto en recursos humanos y orientación profesional. Tu tarea es analizar la información de un CV y generar 3 perfiles profesionales diferentes pero complementarios que maximicen las oportunidades de empleo del candidato.

Cada perfil debe:
1. Tener un título profesional claro y atractivo
2. Incluir una descripción breve (2-3 líneas) del perfil
3. Listar las habilidades clave relevantes para ese perfil
4. Sugerir palabras clave para búsqueda de empleo
5. Indicar el nivel de experiencia (Junior, Mid-level, Senior)

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones. El formato debe ser exactamente:

{
  "profiles": [
    {
      "title": "Título del perfil profesional",
      "description": "Descripción breve del perfil",
      "keySkills": ["skill1", "skill2", "skill3"],
      "searchKeywords": ["keyword1", "keyword2", "keyword3"],
      "experienceLevel": "Junior|Mid-level|Senior",
      "targetRoles": ["rol1", "rol2", "rol3"]
    }
  ]
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    // Extraer la respuesta
    const responseText = completion.choices[0]?.message?.content || '';
    
    // Limpiar la respuesta (remover markdown si existe)
    let cleanedResponse = responseText.trim();
    
    // Remover bloques de código markdown si existen
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    // Parsear JSON
    const result = JSON.parse(cleanedResponse);
    
    // Validar que tengamos 3 perfiles
    if (!result.profiles || !Array.isArray(result.profiles)) {
      throw new Error('La respuesta de Groq no contiene perfiles válidos');
    }
    
    // Asegurar que tengamos exactamente 3 perfiles
    const profiles = result.profiles.slice(0, 3);
    
    // Validar estructura de cada perfil
    profiles.forEach((profile, index) => {
      if (!profile.title || !profile.description || !profile.keySkills || !profile.searchKeywords) {
        throw new Error(`Perfil ${index + 1} tiene estructura inválida`);
      }
    });
    
    return {
      success: true,
      profiles: profiles,
      metadata: {
        model: 'llama-3.3-70b-versatile',
        generatedAt: new Date().toISOString(),
        tokensUsed: completion.usage?.total_tokens || 0
      }
    };
    
  } catch (error) {
    console.error('❌ Error generando perfiles con Groq:', error);
    
    // Si es error de parsing JSON, intentar extraer el JSON de la respuesta
    if (error instanceof SyntaxError) {
      console.error('Respuesta recibida:', error.message);
    }
    
    throw new Error(`Error al generar perfiles profesionales: ${error.message}`);
  }
}

/**
 * Construye el prompt para Groq basado en los datos del CV
 * @param {Object} cvData - Datos del CV
 * @returns {string} - Prompt formateado
 */
function buildPrompt(cvData) {
  const { personalInfo, experience, education, skills } = cvData;
  
  let prompt = 'Analiza la siguiente información de CV y genera 3 perfiles profesionales diferentes:\n\n';
  
  // Información Personal
  if (personalInfo) {
    prompt += '## INFORMACIÓN PERSONAL\n';
    if (personalInfo.firstName && personalInfo.lastName) {
      prompt += `Nombre: ${personalInfo.firstName} ${personalInfo.lastName}\n`;
    }
    if (personalInfo.currentTitle) {
      prompt += `Título actual: ${personalInfo.currentTitle}\n`;
    }
    if (personalInfo.city || personalInfo.country) {
      prompt += `Ubicación: ${personalInfo.city || ''}${personalInfo.city && personalInfo.country ? ', ' : ''}${personalInfo.country || ''}\n`;
    }
    prompt += '\n';
  }
  
  // Experiencia Profesional
  if (experience && experience.length > 0) {
    prompt += '## EXPERIENCIA PROFESIONAL\n';
    experience.forEach((exp, index) => {
      prompt += `${index + 1}. ${exp.title} en ${exp.company}\n`;
      prompt += `   Período: ${exp.startDate} - ${exp.endDate}${exp.current ? ' (Actual)' : ''}\n`;
      if (exp.description) {
        prompt += `   Descripción: ${exp.description}\n`;
      }
      prompt += '\n';
    });
  }
  
  // Educación
  if (education && education.length > 0) {
    prompt += '## EDUCACIÓN\n';
    education.forEach((edu, index) => {
      prompt += `${index + 1}. ${edu.degree}\n`;
      prompt += `   Institución: ${edu.school}\n`;
      if (edu.startDate || edu.endDate) {
        prompt += `   Período: ${edu.startDate} - ${edu.endDate}${edu.current ? ' (En curso)' : ''}\n`;
      }
      prompt += '\n';
    });
  }
  
  // Habilidades
  if (skills && skills.length > 0) {
    prompt += '## HABILIDADES TÉCNICAS\n';
    prompt += skills.join(', ') + '\n\n';
  }

  // Certificaciones (NUEVO)
  if (cvData.certifications && cvData.certifications.length > 0) {
    prompt += '## CERTIFICACIONES\n';
    cvData.certifications.forEach(cert => {
      prompt += `- ${cert.name} (${cert.issuer}, ${cert.date})\n`;
    });
    prompt += '\n';
  }

  // Idiomas (NUEVO)
  if (cvData.languages && cvData.languages.length > 0) {
    prompt += '## IDIOMAS\n';
    cvData.languages.forEach(lang => {
      prompt += `- ${lang.language}: ${lang.level}\n`;
    });
    prompt += '\n';
  }

  // Proyectos (NUEVO)
  if (cvData.projects && cvData.projects.length > 0) {
    prompt += '## PROYECTOS DESTACADOS\n';
    cvData.projects.forEach(proj => {
      prompt += `- ${proj.name}: ${proj.description} (${proj.url})\n`;
    });
    prompt += '\n';
  }
  
  prompt += '\n---\n\n';
  prompt += 'Basándote en esta información, genera 3 perfiles profesionales diferentes que maximicen las oportunidades de empleo. Los perfiles deben ser complementarios y aprovechar diferentes aspectos de la experiencia y habilidades del candidato.\n\n';
  prompt += 'Responde ÚNICAMENTE con el objeto JSON solicitado, sin texto adicional.';
  
  return prompt;
}

/**
 * Valida que la API key de Groq esté configurada
 * @returns {boolean}
 */
function isConfigured() {
  return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
}

module.exports = {
  generateProfessionalProfiles,
  parseCVWithAI, // Nueva función exportada
  isConfigured
};

/**
 * Parsea el texto crudo de un CV y extrae información estructurada usando IA
 * @param {string} rawText - Texto extraído del PDF
 * @param {string} apiKey - API key de Groq (opcional)
 * @returns {Promise<Object>} - Objeto con datos estructurados (personalInfo, experience, etc.)
 */
async function parseCVWithAI(rawText, apiKey = null) {
  try {
    const groqApiKey = apiKey || process.env.GROQ_API_KEY;
    
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      throw new Error('API key de Groq no configurada');
    }
    
    const groqClient = new Groq({ apiKey: groqApiKey });
    
    // Limitar el texto si es muy largo para no exceder tokens (aprox 25k chars)
    const truncatedText = rawText.length > 25000 ? rawText.substring(0, 25000) : rawText;

    const systemPrompt = `Eres un experto en extracción de datos de currículums (CV parsing). Tu tarea es extraer información estructurada de un texto plano de CV.
    
DEBES devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "personalInfo": {
    "firstName": "String",
    "lastName": "String",
    "email": "String",
    "phone": "String",
    "currentTitle": "String (título profesional actual)",
    "city": "String (ciudad de residencia)",
    "country": "String (país de residencia)",
    "linkedin": "String (URL completa)",
    "portfolio": "String (URL completa o GitHub)",
    "summary": "String (resumen profesional/perfil si existe)"
  },
  "experience": [
    {
      "title": "String",
      "company": "String",
      "startDate": "String (formato flexible pero consistente)",
      "endDate": "String (o 'Presente')",
      "current": Boolean,
      "description": "String (resumen de responsabilidades)"
    }
  ],
  "education": [
    {
      "degree": "String",
      "school": "String",
      "startDate": "String",
      "endDate": "String",
      "current": Boolean
    }
  ],
  "skills": ["String", "String", ...] (lista plana de tecnologías y habilidades técnicas)
}

REGLAS:
1. Si un campo no se encuentra, usa null o array vacío [], no inventes datos.
2. Normaliza los nombres de skills (ej. "NodeJS" -> "Node.js").
3. Para 'current', deduce basado en las fechas o palabras como "Presente", "Actualidad".
4. Extrae la mayor cantidad posible de items de experiencia y educación.
5. NO incluyas markdown, ni bloques de código, solo el JSON raw.`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `El texto del CV es:\n\n${truncatedText}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Baja temperatura para precisión
      max_tokens: 4096,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);
    
    return {
      success: true,
      data: result,
      metadata: {
        method: 'AI_GROQ_LLAMA3',
        tokensUsed: completion.usage?.total_tokens || 0
      }
    };

  } catch (error) {
    console.error('❌ Error parseando CV con Groq:', error);
    return { success: false, error: error.message };
  }
}
