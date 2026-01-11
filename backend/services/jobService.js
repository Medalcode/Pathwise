const axios = require('axios');
const { scanCompuTrabajo } = require('./scrapers/computrabajoScanner');

/**
 * Servicio para buscar empleos y calcular match con el perfil
 */

// Fuentes de empleo soportadas (APIs y Scrapers)
const JOB_SOURCES = {
  REMOTEOK: 'https://remoteok.com/api',
  ARBEITNOW: 'https://arbeitnow.com/api/job-board-api'
};

/**
 * Busca empleos basándose en las keywords del perfil
 * @param {Object} profile - Perfil profesional seleccionado (con searchKeywords)
 * @returns {Promise<Array>} - Lista de ofertas con score de match
 */
async function searchJobsForProfile(profile, userLocation = 'Chile', remoteOnly = false) {
  try {
    const keywords = profile.searchKeywords || [];
    const role = profile.title || '';
    const mainTerm = keywords.length > 0 ? keywords[0] : role;
    
    console.log(`🔍 Buscando empleos para: ${mainTerm} (${userLocation}) [RemoteOnly: ${remoteOnly}]`);
    
    // ... (fetch logic remains same)
    const [remoteOkJobs, arbeitJobs, computrabajoJobs] = await Promise.allSettled([
      fetchRemoteOkJobs(keywords),
      fetchArbeitNowJobs(mainTerm),
      scanCompuTrabajo(mainTerm, userLocation) // CompuTrabajo busca en la ubicación igual
    ]);
    
    let allJobs = [];
    if (remoteOkJobs.status === 'fulfilled') allJobs = [...allJobs, ...remoteOkJobs.value];
    if (arbeitJobs.status === 'fulfilled') allJobs = [...allJobs, ...arbeitJobs.value];
    if (computrabajoJobs.status === 'fulfilled') allJobs = [...allJobs, ...computrabajoJobs.value];
    
    // FILTRADO GEOGRÁFICO
    const filteredJobs = allJobs.filter(job => isLocationValid(job, userLocation, remoteOnly));
    
    // ... (rest remains same)
    // Calcular Match Score
    const scoredJobs = filteredJobs.map(job => {
      const matchDetails = calculateMatchScore(job, profile);
      return { ...job, ...matchDetails };
    });
    
    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
    
  } catch (error) {
    console.error('Error buscando empleos:', error);
    throw error;
  }
}

/**
 * Valida si la ubicación del trabajo es aceptable para el usuario
 */
/**
 * Valida si la ubicación del trabajo es aceptable para el usuario
 */
function isLocationValid(job, userCountry, remoteOnly) {
    const loc = (job.location || '').toLowerCase();
    const country = (userCountry || 'chile').toLowerCase(); 
    
    // Lista de términos que confirman explícitamente que es remoto
    const REMOTE_TERMS = [
        'remote', 'remoto', 
        'teletrabajo', 'home office', 
        'trabajo desde casa', 'anywhere', 
        'worldwide', 'global', 
        'latam', 'cuidar de casa'
    ];

    // Verificar si contiene algún término remoto explícito
    const isExplicitlyRemote = REMOTE_TERMS.some(term => loc.includes(term));
    
    // CASO 1: USUARIO PIDE "SOLO REMOTO"
    if (remoteOnly) {
        // Solo aceptamos si es explícitamente remoto.
        // Incluso si es en Chile, si es presencial, se descarta.
        return isExplicitlyRemote;
    }

    // CASO 2: USUARIO FLEXIBLE (REMOTO O PRESENCIAL EN SU PAÍS)
    if (isExplicitlyRemote) return true;
    
    // Si no es remoto, debe estar en su país
    if (loc.includes(country)) return true;

    // Caso contrario (Presencial en otro país) -> Descartar
    return false;
}

async function fetchRemoteOkJobs(tags) {
  try {
    // RemoteOK usa tags en la URL: https://remoteok.com/api?tag=python
    // Tomamos el primer tag relevante
    const tag = tags[0] ? tags[0].toLowerCase().replace(' ', '-') : 'dev';
    const url = `${JOB_SOURCES.REMOTEOK}?tag=${tag}`;
    
    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PanoptesBot/1.0)' }
    });
    
    // La API de RemoteOK devuelve un array donde el primer elemento a veces es metadata legal
    let jobs = Array.isArray(response.data) ? response.data : [];
    jobs = jobs.filter(j => j.company); // Filtrar metadata
    
    return jobs.map(j => ({
      id: j.id,
      title: j.position,
      company: j.company,
      location: j.location,
      url: j.url,
      description: j.description,
      date: j.date,
      tags: j.tags,
      source: 'RemoteOK',
      salary: j.salary_min ? `${j.salary_min}-${j.salary_max} ${j.salary_currency}` : 'No especificado'
    }));
  } catch (e) {
    console.error('Error fetching RemoteOK:', e.message);
    return [];
  }
}

async function fetchArbeitNowJobs(search) {
    try {
        const url = `${JOB_SOURCES.ARBEITNOW}?search=${encodeURIComponent(search)}&sort=relevance`;
        const response = await axios.get(url);
        
        const data = response.data.data || [];
        
        return data.map(j => ({
            id: j.slug,
            title: j.title,
            company: j.company_name,
            location: j.location,
            url: j.url,
            description: j.description, // HTML content
            date: j.created_at,
            tags: j.tags,
            source: 'ArbeitNow',
            salary: 'No especificado'
        }));
    } catch (e) {
        console.error('Error fetching ArbeitNow:', e.message);
        return [];
    }
}

/**
 * Algoritmo simple de Matching
 */
function calculateMatchScore(job, profile) {
    let score = 0;
    let matchedKeywords = [];
    
    const textToAnalyze = (job.title + ' ' + (job.description || '') + ' ' + (job.tags || []).join(' ')).toLowerCase();
    
    // 1. Keyword Matching
    const keywords = profile.searchKeywords || [];
    const skills = profile.keySkills || [];
    const allTerms = [...new Set([...keywords, ...skills])]; // Unique
    
    allTerms.forEach(term => {
        if (textToAnalyze.includes(term.toLowerCase())) {
            score += 10;
            matchedKeywords.push(term);
        }
    });
    
    // 2. Title Matching (Bonus alto)
    if (job.title.toLowerCase().includes(profile.title.toLowerCase())) {
        score += 30;
    }
    
    // Normalizar score (0-100) - heurística simple
    // Asumimos que un score > 50 es muy bueno
    const normalizedScore = Math.min(100, Math.round(score));
    
    return {
        matchScore: normalizedScore,
        matchedKeywords: matchedKeywords
    };
}

module.exports = {
    searchJobsForProfile
};
