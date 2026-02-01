const axios = require('axios');
const cheerio = require('cheerio');
const userAgents = require('user-agent-array');

const BASE_URL = 'https://www.chiletrabajos.cl';

async function scanChileTrabajos(query, location = '') {
  try {
    // Normalizar query
    const searchQuery = encodeURIComponent(query);
    // URL de búsqueda básica
    let searchUrl = `${BASE_URL}/encuentra-un-empleo?2=${searchQuery}&8=&13=`;
    
    // Simular un navegador real
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

    console.log(`🕵️‍♂️ Scrapeando ChileTrabajos: ${query}`);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': ua,
        'Referer': 'https://www.chiletrabajos.cl/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Validación básica de integridad: si no hay body, probablemente fuimos bloqueados o el sitio cayó
    if ($('body').length === 0) {
      throw new Error('Respuesta inválida: HTML sin body (Posible bloqueo WAF)');
    }

    const jobs = [];

    // Iterar sobre los resultados. 
    // Selector típico: .job-item (esto puede variar, inspeccionando estructura común)
    // En ChileTrabajos suelen estar en div.job-item o similar dentro de .job-list
    
    // NOTA: Los selectores dependen del HTML actual. 
    // Asumiremos estructura estándar de items en lista.
    $('.job-item').each((i, el) => {
      try {
        const titleEl = $(el).find('.title a'); // Título suele ser link
        const title = titleEl.text().trim();
        const urlRel = titleEl.attr('href');
        const url = urlRel ? (urlRel.startsWith('http') ? urlRel : `${BASE_URL}${urlRel}`) : null;
        
        const company = $(el).find('.meta .company').text().trim() || 'Empresa Confidencial';
        const locationText = $(el).find('.meta .location').text().trim() || 'Chile';
        const date = $(el).find('.meta .date').text().trim();
        const description = $(el).find('.description').text().trim();

        if (title && url) {
          jobs.push({
            id: url.split('/').pop(),
            title,
            company,
            location: locationText,
            url,
            description,
            date,
            source: 'ChileTrabajos',
            tags: []
          });
        }
      } catch (err) {
        // Ignorar items mal formados
      }
    });

    // Si selector .job-item falla (cambio de diseño), intentamos otro común
    if (jobs.length === 0) {
       // Alternate strategy: Buscar cualquier <a> dentro de listados que parezca oferta
       $('div.job_list div.item').each((i, el) => {
           const title = $(el).find('h2.title a').text().trim();
           const url = $(el).find('h2.title a').attr('href');
           const company = $(el).find('.campo_empresa a').text().trim();
           const loc = $(el).find('.campo_ubicacion a').text().trim();
           
           if(title && url) {
               jobs.push({
                   id: Math.random().toString(36),
                   title,
                   company: company || 'Confidencial',
                   location: loc || 'Chile',
                   url: url,
                   description: '',
                   date: new Date().toISOString(),
                   source: 'ChileTrabajos'
               });
           }
       });
    }

    console.log(`✅ ChileTrabajos: ${jobs.length} ofertas encontradas`);
    return jobs;

  } catch (error) {
    console.error(`❌ Error ChileTrabajos Scanner: ${error.message}`);
    return [];
  }
}

module.exports = { scanChileTrabajos };
