const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();
const { scanCompuTrabajo } = require('./scrapers/computrabajoScanner');
const { scanChileTrabajos } = require('./scrapers/chiletrabajosScanner');

/**
 * Servicio para buscar empleos y calcular match con el perfil
 */

// Fuentes de empleo soportadas (APIs y Scrapers)
const JOB_SOURCES = {
  REMOTEOK: 'https://remoteok.com/api',
  ARBEITNOW: 'https://arbeitnow.com/api/job-board-api',
  REMOTIVE: 'https://remotive.com/api/remote-jobs',
  WEWORKREMOTELY_RSS: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
  ADZUNA: 'https://api.adzuna.com/v1/api/jobs'
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
    
    // Ejecutar TODAS las búsquedas en paralelo
    const promises = [
      fetchRemoteOkJobs(keywords),
      fetchArbeitNowJobs(mainTerm),
      fetchRemotiveJobs(mainTerm),
      fetchWeWorkRemotelyRSS(mainTerm),
      scanCompuTrabajo(mainTerm, userLocation),
      scanChileTrabajos(mainTerm, userLocation)
    ];

    // Adzuna requires keys
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
        promises.push(fetchAdzunaJobs(mainTerm, 'cl')); // Default to Chile or use logic
    }

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
    // OJO: ArbeitNow a veces trae la flag en 'remote' (bool) dentro del objeto original si lo mapeamos, 
    // pero aquí 'job' es nuestro objeto normalizado. 
    // Asumiremos que si la fuente lo sabe, lo puso en location o title.
    const isExplicitlyRemote = REMOTE_TERMS.some(term => loc.includes(term));
    
    // DEBUG LOG para entender descartes (solo en desarrollo o si hay pocos jobs)
    // console.log(`[GeoCheck] Job: ${job.company} | Loc: ${loc} | User: ${country} | RemoteOnly: ${remoteOnly} -> IsRemote: ${isExplicitlyRemote}`);

    // CASO 1: USUARIO PIDE "SOLO REMOTO"
    if (remoteOnly) {
        return isExplicitlyRemote;
    }

    // CASO 2: USUARIO FLEXIBLE
    
    // Si es remoto, pasa siempre (es accesible desde tu país teóricamente)
    if (isExplicitlyRemote) return true;
    
    // Si NO es remoto, OBLIGATORIAMENTE debe ser en tu país.
    // Aquí es donde "Berlin, Germany" debe fallar si userCountry es "Chile".
    if (loc.includes(country)) return true;

    // Si llegamos aquí, es una oferta PRESENCIAL en OTRO PAÍS.
    // Ej: Location: "Munich", Country: "Chile" -> False.
    // console.log(`[GeoDrop] Descartada por ubicación: ${loc} (Usuario en: ${country})`);
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
            location: (j.remote ? 'Remote, ' : '') + j.location, // Asegurar palabra clave si flag activo
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

async function fetchRemotiveJobs(search) {
    try {
        const res = await axios.get(`${JOB_SOURCES.REMOTIVE}?search=${encodeURIComponent(search)}`);
        return (res.data.jobs||[]).map(j => ({
            id: j.id,
            title: j.title, 
            company: j.company_name,
            location: j.candidate_required_location || 'Remote', // Remotive es remote-first
            url: j.url, 
            description: j.description, 
            date: j.publication_date, 
            source: 'Remotive',
            salary: j.salary || 'No especificado',
            tags: j.tags || []
        }));
    } catch(e) { console.error('Remotive Error:', e.message); return []; }
}

async function fetchWeWorkRemotelyRSS(search) {
    try {
        const feed = await parser.parseURL(JOB_SOURCES.WEWORKREMOTELY_RSS);
        
        // Filtrar localmente por término de búsqueda ya que el RSS es de toda la categoría
        const term = search.toLowerCase();
        
        return feed.items
            .filter(item => item.title.toLowerCase().includes(term) || (item.content||'').toLowerCase().includes(term))
            .map(item => ({
                id: item.guid || item.link,
                title: item.title, 
                company: 'WeWorkRemotely', // A veces el título es "Company: Role", parsearlo es complejo sin split consistente
                location: 'Remote', // WWR es solo remoto
                url: item.link, 
                description: item.content, 
                date: item.pubDate, 
                source: 'WeWorkRemotely',
                tags: []
            }));
    } catch(e) { console.error('WWR RSS Error:', e.message); return []; }
}

async function fetchAdzunaJobs(search, countryCode) {
    try {
        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;
        const url = `${JOB_SOURCES.ADZUNA}/${countryCode}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(search)}`;
        
        const res = await axios.get(url);
        return (res.data.results||[]).map(j => ({
            id: j.id,
            title: j.title, 
            company: j.company.display_name,
            location: j.location.display_name,
            url: j.redirect_url, 
            description: j.description, 
            date: j.created, 
            source: 'Adzuna',
            tags: []
        }));
    } catch(e) { console.error('Adzuna Error:', e.message); return []; }
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
