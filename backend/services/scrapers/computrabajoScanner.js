const axios = require('axios');
const cheerio = require('cheerio');
const userAgents = require('user-agent-array'); // Lista de User-Agents reales

/**
 * Scraper para CompuTrabajo Chile (cl.computrabajo.com)
 */

const BASE_URL = 'https://cl.computrabajo.com';

async function scanCompuTrabajo(query, location = '') {
  try {
    // Normalizar query para URL: "full stack developer" -> "full-stack-developer"
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, '-');
    let searchUrl = `${BASE_URL}/trabajo-de-${normalizedQuery}`;
    
    // Si hay ubicación, CompuTrabajo la suele poner en la URL también, pero es complejo parsear 
    // todas las combinaciones. Por ahora buscaremos en todo Chile o usaremos query params si soporta.
    // URL pattern: /trabajo-de-[cargo]-en-[lugar]
    if (location && location.toLowerCase() !== 'remoto') {
        const normLoc = location.toLowerCase().trim().replace(/\s+/g, '-');
        searchUrl += `-en-${normLoc}`;
    }

    // Seleccionar User-Agent aleatorio
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

    console.log(`🕵️‍♂️ Scrapeando CompuTrabajo: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 8000 // 8 segundos timeout
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // Selectores actualizados (esto puede cambiar si el sitio se actualiza)
    // Usualmente son articles dentro de una lista
    $('article.box_offer').each((i, el) => {
      try {
        const titleEl = $(el).find('h2.fs18 a'); // Título suele estar en h1 o h2 con link
        const title = titleEl.text().trim();
        const urlRel = titleEl.attr('href');
        const url = urlRel ? (urlRel.startsWith('http') ? urlRel : `${BASE_URL}${urlRel}`) : null;
        
        // Empresa
        // A veces es un link, a veces texto plano
        let company = $(el).find('.fs16.fc_base.mt5 a').text().trim(); 
        if (!company) company = $(el).find('.fs16.fc_base.mt5').first().contents().filter(function() {
            return this.type === 'text';
        }).text().trim();
        
        // Ubicación
        const locationText = $(el).find('.fs16.fc_base.mt5 span.mr10').text().trim() || 
                             $(el).find('p.fs13.fc_base span.mr10').text().trim();

        // Descripción
        const description = $(el).find('p.fs13.fc_aux').text().trim() || 
                            $(el).find('.w100.fs13.fc_aux').text().trim();

        // Fecha
        const date = $(el).find('.fs13.fc_aux.mt15 span').first().text().trim();

        if (title && url) {
          jobs.push({
            id: url.split('/').pop(), // ID básico desde URL
            title,
            company: company || 'Empresa Confidencial',
            location: locationText || 'Chile',
            url,
            description,
            date,
            source: 'CompuTrabajo',
            tags: [] // No siempre hay tags fáciles
          });
        }
      } catch (innerErr) {
        console.warn('Error parseando elemento CompuTrabajo:', innerErr.message);
      }
    });

    console.log(`✅ CompuTrabajo: ${jobs.length} ofertas encontradas`);
    return jobs;

  } catch (error) {
    console.error(`❌ Error CompuTrabajo Scanner: ${error.message}`);
    // Si es 403, es bloqueo anti-bot
    if (error.response && error.response.status === 403) {
      console.error('⚠️ Bloqueo Anti-Bot detectado (403 Forbidden)');
    }
    return []; // Retornar vacío para no romper el flujo global
  }
}

module.exports = { scanCompuTrabajo };
