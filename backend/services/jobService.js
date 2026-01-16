const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

// ==========================================
// MÓDULO DE SCRAPERS (PLUGINS)
// ==========================================
const SCRAPERS_DIR = path.join(__dirname, 'scrapers');

// Carga dinámica de scrapers
function loadScrapers() {
    const scrapers = {};
    if (fs.existsSync(SCRAPERS_DIR)) {
        const files = fs.readdirSync(SCRAPERS_DIR).filter(file => file.endsWith('.js'));
        files.forEach(file => {
            const scraperModule = require(path.join(SCRAPERS_DIR, file));
            // Asumimos que cada scraper exporta una función que empieza con 'scan'
            const scraperName = Object.keys(scraperModule)[0];
            if (typeof scraperModule[scraperName] === 'function') {
                scrapers[file.replace('.js', '')] = scraperModule[scraperName];
            }
        });
    }
    return scrapers;
}

const availableScrapers = loadScrapers();

/**
 * Servicio para buscar empleos con arquitectura modular
 */

async function searchJobsForProfile(profile, userLocation = 'Chile', remoteOnly = false) {
  try {
    const keywords = profile.searchKeywords || [];
    const role = profile.title || '';
    const mainTerm = keywords.length > 0 ? keywords[0] : role;
    
    console.log(`🔍 [JobService] Buscando: "${mainTerm}" en ${userLocation} (Remoto: ${remoteOnly})`);

    // 1. Ejecutar todos los scrapers disponibles en paralelo
    const scraperPromises = Object.entries(availableScrapers).map(async ([name, scanFunction]) => {
        try {
            // Anti-Bot: Delay aleatorio inicial (100ms - 2000ms)
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 100));
            
            console.log(`🔌 Ejecutando scraper: ${name}`);
            const jobs = await scanFunction(mainTerm, userLocation);
            return jobs.map(j => ({ ...j, sourcePlugin: name })); // Taggear origen
        } catch (err) {
            console.error(`❌ Falló scraper ${name}:`, err.message);
            return [];
        }
    });

    const results = await Promise.all(scraperPromises);
    let allJobs = results.flat();

    console.log(`📊 Total ofertas brutas: ${allJobs.length}`);

    // 2. Filtrado y Limpieza
    let processedJobs = allJobs
        .filter(job => isLocationValid(job, userLocation, remoteOnly))
        .map(job => normalizeJobData(job));

    // 3. Deduplicación Inteligente
    processedJobs = removeDuplicates(processedJobs);
    console.log(`✨ Ofertas únicas post-deduplicación: ${processedJobs.length}`);

    // 4. Advanced Matching (Híbrido: Keywords + IA Light)
    // Para no gastar muchos tokens, usamos heurística avanzada primero.
    // Solo si el usuario lo pide o en batch pequeños usaríamos IA full.
    const scoredJobs = await calculateAdvancedMatchScores(processedJobs, profile);

    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error('Error crítico en búsqueda de empleos:', error);
    throw error;
  }
}

// ==========================================
// HELPERS LÓGICOS
// ==========================================

function normalizeJobData(job) {
    return {
        ...job,
        title: job.title.trim(),
        company: (job.company || 'Confidencial').trim(),
        salary: normalizeSalary(job.salary), // TODO: Implementar parser de salario
        date: job.date || new Date(),
        description: (job.description || '').substring(0, 500) // Truncar para manejo ligero
    };
}

function normalizeSalary(salaryRaw) {
    if (!salaryRaw) return null;
    // Lógica futura: Convertir "1.000.000 - 1.200.000 CLP" a objeto { min: 1000000, max: 1200000, currency: 'CLP' }
    return salaryRaw;
}

function removeDuplicates(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
        // Clave única: Título + Empresa (normalizados)
        const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function isLocationValid(job, userCountry, remoteOnly) {
    const loc = (job.location || '').toLowerCase();
    let country = (userCountry || 'chile').toLowerCase();

    const REMOTE_TERMS = ['remote', 'remoto', 'teletrabajo', 'home office', 'anywhere', 'latam', 'global'];
    const isExplicitlyRemote = REMOTE_TERMS.some(term => loc.includes(term));

    if (remoteOnly) return isExplicitlyRemote;
    if (isExplicitlyRemote) return true;
    
    // Permitir si contiene el país O si la ciudad es conocida (lógica simple)
    return loc.includes(country) || loc.includes('santiago'); // Ejemplo específico para Chile
}

async function calculateAdvancedMatchScores(jobs, profile) {
    // Perfil Vectorizado (Simulado con Set de Keywords Ponderadas)
    const profileVectors = {
        role: profile.title.toLowerCase().split(' '),
        skills: (profile.keySkills || []).map(s => s.toLowerCase()),
        keywords: (profile.searchKeywords || []).map(k => k.toLowerCase())
    };

    return jobs.map(job => {
        let score = 0;
        const textLower = `${job.title} ${job.description} ${job.tags?.join(' ')}`.toLowerCase();
        const matched = [];

        // 1. Title Match (Peso: 40%)
        // Si el título del trabajo contiene palabras clave del título del perfil
        const titleMatches = profileVectors.role.filter(word => job.title.toLowerCase().includes(word));
        if (titleMatches.length > 0) {
            score += (titleMatches.length / profileVectors.role.length) * 40;
        }

        // 2. Skills Match (Peso: 40%)
        profileVectors.skills.forEach(skill => {
            if (textLower.includes(skill)) {
                score += 5; // Cada skill suma puntos
                matched.push(skill);
            }
        });
        
        // Cap skill score at 40
        score = Math.min(score, 80); // Title + Skills portion

        // 3. Keyword Match (Peso: 20%)
        profileVectors.keywords.forEach(kw => {
             if (textLower.includes(kw) && !matched.includes(kw)) {
                score += 2;
                matched.push(kw);
            }
        });

        // Penalizaciones
        // Si es Junior y piden Senior
        if (profile.experienceLevel === 'Junior' && (job.title.toLowerCase().includes('senior') || job.title.toLowerCase().includes('lead'))) {
            score -= 30;
        }

        return {
            ...job,
            matchScore: Math.min(100, Math.round(score)),
            matchedKeywords: [...new Set(matched)].slice(0, 5) // Top 5 matches
        };
    });
}

module.exports = {
    searchJobsForProfile
};
