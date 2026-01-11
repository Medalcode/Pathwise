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
  isConfigured
};
