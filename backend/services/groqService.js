const aiProvider = require('./aiProvider');
const config = require('../config');

// La inicialización del cliente se delega a `aiProvider`

/**
 * Genera 3 perfiles profesionales basados en los datos extraídos del CV
 * @param {Object} cvData - Datos parseados del CV
 * @param {string} apiKey - API key de Groq (opcional, usa env si no se proporciona)
 * @returns {Promise<Array>} - Array con 3 perfiles profesionales
 */
async function generateProfessionalProfiles(cvData, apiKey = null) {
  try {
    // Usar API key proporcionada o la del config
    const groqApiKey = apiKey || config.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      throw new Error('API key de Groq no configurada');
    }

    // Construir prompt y mensajes
    const prompt = buildPrompt(cvData);
    const messages = [
      { role: 'system', content: `Eres un experto en recursos humanos y orientación profesional. Tu tarea es analizar la información de un CV y generar 3 perfiles profesionales diferentes pero complementarios que maximicen las oportunidades de empleo del candidato. Responde únicamente con un JSON válido en el formato solicitado.` },
      { role: 'user', content: prompt }
    ];

    // Llamar al proveedor AI a través del adaptador
    const completion = await aiProvider.chatCompletion({ messages, model: 'llama-3.3-70b-versatile', temperature: 0.7, max_tokens: 2048 }, groqApiKey);

    const responseText = completion.choices?.[0]?.message?.content || '';
    const parsed = aiProvider.parseJsonSafely(responseText);
    if (!parsed.ok) {
      throw new Error('No se pudo parsear la respuesta JSON del proveedor AI: ' + (parsed.error && parsed.error.message));
    }

    const result = parsed.data;
    if (!result.profiles || !Array.isArray(result.profiles)) {
      throw new Error('La respuesta AI no contiene perfiles válidos');
    }

    const profiles = result.profiles.slice(0, 3);
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
  return !!config.GROQ_API_KEY && config.GROQ_API_KEY !== 'your_groq_api_key_here';
}

/**
 * Genera una carta de presentación personalizada usando IA
 * @param {Object} profile - Perfil del usuario
 * @param {string} jobDescription - Descripción del trabajo
 * @param {Object} options - Opciones (tone, company, jobTitle)
 * @returns {Promise<Object>} - Carta generada
 */
async function generateCoverLetter(profile, jobDescription, options = {}) {
  try {
    const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      throw new Error('API key de Groq no configurada');
    }

    const { tone = 'professional', company = '', jobTitle = '' } = options;
    
    const tonePrompts = {
      professional: 'formal y corporativo, apropiado para empresas establecidas',
      casual: 'amigable y cercano, apropiado para startups y empresas innovadoras',
      technical: 'técnico y detallado, enfocado en habilidades y logros específicos'
    };
    
    const toneInstruction = tonePrompts[tone] || tonePrompts.professional;
    
    // Construir contexto del perfil
    let profileContext = '';
    
    if (profile.personalInfo) {
      const { firstName, lastName, currentTitle, summary } = profile.personalInfo;
      profileContext += `Nombre: ${firstName} ${lastName}\n`;
      if (currentTitle) profileContext += `Título actual: ${currentTitle}\n`;
      if (summary) profileContext += `Resumen: ${summary}\n`;
    }
    
    if (profile.experience && profile.experience.length > 0) {
      profileContext += '\nExperiencia:\n';
      profile.experience.slice(0, 3).forEach(exp => {
        profileContext += `- ${exp.title} en ${exp.company}\n`;
        if (exp.description) profileContext += `  ${exp.description.substring(0, 200)}\n`;
      });
    }
    
    if (profile.skills && profile.skills.length > 0) {
      profileContext += `\nHabilidades: ${profile.skills.slice(0, 10).join(', ')}\n`;
    }
    
    const prompt = `Genera una carta de presentación ${toneInstruction} para:
- Puesto: ${jobTitle || 'el puesto descrito'}
- Empresa: ${company || 'la empresa'}
- Descripción del trabajo: ${jobDescription}

Basándote en mi perfil profesional:
${profileContext}

Requisitos:
- Longitud: 250-300 palabras
- Estructura: Introducción (por qué me interesa), cuerpo (experiencia y skills relevantes), cierre (llamado a la acción)
- Destacar experiencia y habilidades que coincidan con la descripción del trabajo
- Mencionar por qué me interesa la empresa/puesto
- Tono: ${toneInstruction}
- Idioma: Español
- NO incluir dirección ni fecha (solo el cuerpo de la carta)

Genera SOLO la carta de presentación, sin comentarios adicionales, sin "Estimado/a", sin firma al final.`;

    const completion = await aiProvider.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800
    }, groqApiKey);

    const coverLetter = completion.choices?.[0]?.message?.content || '';
    const wordCount = coverLetter ? coverLetter.split(/\s+/).length : 0;

    return {
      success: true,
      coverLetter,
      wordCount,
      metadata: {
        tone,
        model: 'llama-3.3-70b-versatile',
        tokensUsed: completion.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Error generando cover letter:', error);
    throw new Error(`Error al generar carta de presentación: ${error.message}`);
  }
}

module.exports = {
  generateProfessionalProfiles,
  parseCVWithAI,
  generateCoverLetter,
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
    const groqApiKey = apiKey || config.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      throw new Error('API key de Groq no configurada');
    }

    // Limitar el texto si es muy largo para no exceder tokens (aprox 25k chars)
    const truncatedText = rawText.length > 25000 ? rawText.substring(0, 25000) : rawText;

    const systemPrompt = `Eres un experto en extracción de datos de currículums (CV parsing). Tu tarea es extraer información estructurada de un texto plano de CV.\n\nDEBES devolver ÚNICAMENTE un objeto JSON válido con la estructura solicitada. Si no hay dato, usa null o array vacío.`;

    const completion = await aiProvider.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `El texto del CV es:\n\n${truncatedText}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 4096,
      top_p: 1,
      stream: false
    }, groqApiKey);

    const responseText = completion.choices?.[0]?.message?.content || '{}';
    const parsed = aiProvider.parseJsonSafely(responseText);
    if (!parsed.ok) {
      throw new Error('No se pudo parsear la respuesta JSON del proveedor AI: ' + (parsed.error && parsed.error.message));
    }

    const result = parsed.data;
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
