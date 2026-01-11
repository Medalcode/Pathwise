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
async function searchJobsForProfile(profile) {
  try {
    const keywords = profile.searchKeywords || [];
    const role = profile.title || '';
    
    // Término principal
    const mainTerm = keywords.length > 0 ? keywords[0] : role;
    
    console.log(`🔍 Buscando empleos para: ${mainTerm} con keywords: ${keywords.join(', ')}`);
    
    // Ejecutar búsquedas en paralelo (RemoteOK, ArbeitNow, CompuTrabajo)
    const [remoteOkJobs, arbeitJobs, computrabajoJobs] = await Promise.allSettled([
      fetchRemoteOkJobs(keywords),
      fetchArbeitNowJobs(mainTerm),
      scanCompuTrabajo(mainTerm, profile.location || 'Chile')
    ]);
    
    let allJobs = [];
    
    if (remoteOkJobs.status === 'fulfilled') allJobs = [...allJobs, ...remoteOkJobs.value];
    if (arbeitJobs.status === 'fulfilled') allJobs = [...allJobs, ...arbeitJobs.value];
    if (computrabajoJobs.status === 'fulfilled') allJobs = [...allJobs, ...computrabajoJobs.value];
    
    // Si no hay resultados y el usuario buscó algo muy específico, intentar solo con el rol
    if (allJobs.length === 0) {
        console.log("⚠️ Sin resultados, reintentando solo con título del rol...");
        const retryJobs = await scanCompuTrabajo(role.split(' ')[0], 'Chile'); // Intento simple
        allJobs = [...retryJobs];
    }
    
    // Calcular Match Score para cada oferta
    const scoredJobs = allJobs.map(job => {
      const matchDetails = calculateMatchScore(job, profile);
      return { ...job, ...matchDetails };
    });
    
    // Ordenar por score descendente
    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
    
  } catch (error) {
    console.error('Error buscando empleos:', error);
    throw error;
  }
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
