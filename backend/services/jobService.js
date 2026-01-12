const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();
const { scanCompuTrabajo } = require('./scrapers/computrabajoScanner');
const { scanChileTrabajos } = require('./scrapers/chiletrabajosScanner');

/**
 * Servicio para buscar empleos y calcular match con el perfil
 */

// Solo scrapers chilenos habilitados

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
    

        // Solo buscar en CompuTrabajo y ChileTrabajos
        const promises = [
            scanCompuTrabajo(mainTerm, userLocation),
            scanChileTrabajos(mainTerm, userLocation)
        ];

        // Eliminadas fuentes internacionales y ArbeitNow

    const results = await Promise.allSettled(promises);
    
    let allJobs = [];
    results.forEach(res => {
        if (res.status === 'fulfilled') {
            allJobs = [...allJobs, ...res.value];
        } else {
             console.error(`Una fuente falló: ${res.reason}`);
        }
    });

    console.log(`📊 Total Ofertas Brutas: ${allJobs.length}`);
    
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
    
    // Validación robusta: Si country viene vacío, usar Chile por defecto.
    // Evita el bug donde "".includes("") es true globalmente.
    let country = userCountry;
    if (!country || typeof country !== 'string' || country.trim() === '') {
        country = 'chile';
    }
    country = country.toLowerCase();

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
        return isExplicitlyRemote;
    }

    // CASO 2: USUARIO FLEXIBLE
    if (isExplicitlyRemote) return true;
    
    // Si NO es remoto, OBLIGATORIAMENTE debe ser en tu país.
    if (loc.includes(country)) return true;

    return false;
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
