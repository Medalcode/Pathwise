/**
 * Real PDF Parser with AI
 * Extrae texto real de PDFs usando PDF.js y lo parsea con IA/regex
 */

const RealPDFParser = {
    /**
     * Extraer texto completo del PDF
     */
    /**
     * Extraer texto del PDF con detección inteligente de Columnas (Layout Aware)
     */
    async extractTextFromPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            const totalPages = pdf.numPages;
            
            console.log(`📄 Procesando PDF de ${totalPages} páginas con Layout Aware Engine...`);
            
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                const textContent = await page.getTextContent();
                const items = textContent.items;
                
                if (!items || items.length === 0) continue;

                // 1. Detectar si la página tiene dos columnas
                // Estrategia: Buscar si hay una zona central "vacía" de texto consistente
                const pageWidth = viewport.width;
                const centerZoneStart = pageWidth * 0.4;
                const centerZoneEnd = pageWidth * 0.6;
                
                // Contar cuántos items cruzan la zona central
                const itemsCrossingCenter = items.filter(item => {
                    const x = item.transform[4];
                    const width = item.width || 0;
                    // Si el item empieza antes del centro y termina después del centro
                    return (x < centerZoneStart && (x + width) > centerZoneEnd) ||
                           (x > centerZoneStart && x < centerZoneEnd); 
                });

                // Si menos del 10% de los items cruzan el centro, probablemente es 2 columnas
                const isTwoColumn = items.length > 20 && (itemsCrossingCenter.length / items.length) < 0.15;
                
                console.log(`Página ${pageNum}: ${isTwoColumn ? 'DETECTADO 2 COLUMNAS ║' : 'Detectado 1 Columna 📄'}`);

                let pageText = '';

                if (isTwoColumn) {
                    // Estrategia 2 columnas: Dividir items y procesar Left -> Right
                    const leftItems = items.filter(i => i.transform[4] < pageWidth / 2);
                    const rightItems = items.filter(i => i.transform[4] >= pageWidth / 2);
                    
                    const leftText = this.processItemsToText(leftItems);
                    const rightText = this.processItemsToText(rightItems);
                    
                    // Unir con doble salto para separar lógicamente
                    pageText = leftText + '\n\n' + rightText;
                } else {
                    // Estrategia 1 columna: Procesamiento estándar robusto
                    pageText = this.processItemsToText(items);
                }

                fullText += pageText + '\n';
            }
            
            console.log(`✅ Extracción Layout-Aware completada.`);
            return {
                text: fullText,
                pageCount: totalPages
            };
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            throw new Error('No se pudo extraer el texto del PDF: ' + error.message);
        }
    },

    /**
     * Helper: Convertir items de PDF.js a texto ordenado visualmente
     */
    processItemsToText(items) {
        if (!items || items.length === 0) return '';
        
        // Ordenar principalmente por Y (descendente), luego por X (ascendente)
        items.sort((a, b) => {
            const yA = a.transform[5];
            const yB = b.transform[5];
            if (Math.abs(yA - yB) > 5) { 
                return yB - yA; // Orden Y (arriba hacia abajo)
            }
            return a.transform[4] - b.transform[4]; // Orden X
        });

        let lines = [];
        let currentLine = [];
        let currentY = items[0].transform[5];

        for (const item of items) {
            const y = item.transform[5];
            
            if (Math.abs(y - currentY) > 5) {
                if (currentLine.length > 0) {
                    lines.push(currentLine.map(i => i.str).join(' '));
                }
                currentLine = [];
                currentY = y;
            }
            currentLine.push(item);
        }
        if (currentLine.length > 0) lines.push(currentLine.map(i => i.str).join(' '));

        return lines.join('\n');
    },
    
    
    /**
     * Parsear información personal del texto (MEJORADO)
     */
    parsePersonalInfo(text) {
        const info = {};
        
        console.log('📝 Parseando información personal...');
        console.log('Texto extraído (primeros 500 chars):', text.substring(0, 500));
        
        // Email (regex mejorado)
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) {
            info.email = emailMatch[1];
            console.log('✓ Email encontrado:', info.email);
        }
        
        // Teléfono (múltiples formatos)
        const phonePatterns = [
            /(?:\+?[\d]{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?[\d]{3,4}[-.\s]?[\d]{3,4}/,
            /\+[\d\s\-()]{10,}/,
            /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
        ];
        
        for (const pattern of phonePatterns) {
            const phoneMatch = text.match(pattern);
            if (phoneMatch) {
                info.phone = phoneMatch[0].trim();
                console.log('✓ Teléfono encontrado:', info.phone);
                break;
            }
        }
        
        // LinkedIn
        const linkedinMatch = text.match(/(?:linkedin\.com\/in\/)([\w-]+)/i);
        if (linkedinMatch) {
            info.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
            console.log('✓ LinkedIn encontrado:', info.linkedin);
        }
        
        // GitHub
        const githubMatch = text.match(/(?:github\.com\/)([\w-]+)/i);
        if (githubMatch) {
            info.github = `https://github.com/${githubMatch[1]}`;
            console.log('✓ GitHub encontrado:', info.github);
        }
        
        // Ciudad y País
        const locationMatch = text.match(/(?:ubicación|location|ciudad|city)[:\s]*([^,\n]+),?\s*([^\n]+)/i);
        if (locationMatch) {
            info.city = locationMatch[1].trim();
            info.country = locationMatch[2].trim();
            console.log('✓ Ubicación encontrada:', info.city, info.country);
        }
        
        // NOMBRE - Múltiples estrategias
        const nameResult = this.extractName(text);
        if (nameResult.firstName) {
            info.firstName = nameResult.firstName;
            info.lastName = nameResult.lastName || '';
            console.log('✓ Nombre encontrado:', info.firstName, info.lastName);
        }
        
        // Título profesional (buscar patrones comunes)
        const titlePatterns = [
            // Español
            /(?:desarrollador|ingeniero|programador|analista|diseñador|arquitecto|consultor|especialista|líder|gerente|director)\s+(?:de\s+)?(?:software|web|frontend|backend|full\s*stack|mobile|datos|data|sistemas|ti|it|tecnología|aplicaciones|soluciones)/i,
            /(?:senior|junior|mid|semi\s*senior|ssr|jr|sr)\s+(?:desarrollador|developer|engineer|ingeniero|programmer|programador)/i,
            // Inglés
            /(?:software|web|frontend|backend|full\s*stack|mobile|data|systems)\s+(?:developer|engineer|programmer|analyst|designer|architect)/i,
            /(?:senior|junior|mid|lead|principal|staff|chief)\s+(?:developer|engineer|programmer|architect|designer)/i,
            // Títulos específicos
            /(?:tech\s+lead|team\s+lead|scrum\s+master|product\s+owner|devops\s+engineer|qa\s+engineer|ux\/ui\s+designer)/i
        ];
        
        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match) {
                info.currentTitle = match[0];
                console.log('✓ Título encontrado:', info.currentTitle);
                break;
            }
        }
        
        console.log('📊 Información personal parseada:', info);
        return info;
    },
    
    /**
     * Extraer nombre con múltiples estrategias
     */
    extractName(text) {
        const result = { firstName: '', lastName: '' };
        
        // Estrategia 1: Primera línea (más común)
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            
            // Verificar que parece un nombre (2-4 palabras, sin números, sin símbolos raros)
            const words = firstLine.split(/\s+/);
            if (words.length >= 2 && words.length <= 4 && 
                !/\d/.test(firstLine) && 
                !/[@#$%^&*()_+=\[\]{}|\\:;"'<>,.?\/]/.test(firstLine)) {
                
                result.firstName = words[0];
                result.lastName = words.slice(1).join(' ');
                console.log('Estrategia 1 (primera línea):', result);
                return result;
            }
        }
        
        // Estrategia 2: Buscar patrón "Nombre: X" o "Name: X"
        const namePatternMatch = text.match(/(?:nombre|name|full\s+name)[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/i);
        if (namePatternMatch) {
            const fullName = namePatternMatch[1].trim();
            const words = fullName.split(/\s+/);
            result.firstName = words[0];
            result.lastName = words.slice(1).join(' ');
            console.log('Estrategia 2 (patrón "Nombre:"):', result);
            return result;
        }
        
        // Estrategia 3: Buscar nombres propios (2-3 palabras capitalizadas seguidas)
        const properNameMatch = text.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})?)\b/);
        if (properNameMatch) {
            result.firstName = properNameMatch[1];
            result.lastName = properNameMatch[2];
            console.log('Estrategia 3 (nombres propios):', result);
            return result;
        }
        
        // Estrategia 4: Buscar antes del email (común en CVs)
        const emailMatch = text.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)\s+[a-zA-Z0-9._-]+@/);
        if (emailMatch) {
            const fullName = emailMatch[1].trim();
            const words = fullName.split(/\s+/);
            result.firstName = words[0];
            result.lastName = words.slice(1).join(' ');
            console.log('Estrategia 4 (antes del email):', result);
            return result;
        }
        
        // Estrategia 5: Buscar en las primeras 5 líneas
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            const words = line.split(/\s+/);
            
            // Si tiene 2-3 palabras, todas capitalizadas, sin números
            if (words.length >= 2 && words.length <= 3 &&
                words.every(w => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(w))) {
                
                result.firstName = words[0];
                result.lastName = words.slice(1).join(' ');
                console.log(`Estrategia 5 (línea ${i + 1}):`, result);
                return result;
            }
        }
        
        console.warn('⚠️ No se pudo detectar el nombre con ninguna estrategia');
        return result;
    },
    
    /**
     * Identificar secciones en el texto (Nuevo Helper v3)
     */
    identifySections(text) {
        // Mapa de secciones
        const sectionHeaders = {
            experience: ['experiencia', 'experience', 'trabajo', 'work', 'historial', 'trayectoria', 'employment', 'history', 'laboral'],
            education: ['educacion', 'education', 'formacion', 'academic', 'estudios', 'antecedentes', 'títulos', 'degrees'],
            skills: ['habilidades', 'skills', 'competencias', 'tecnologias', 'technologies', 'conocimientos', 'apto', 'stack'],
            certifications: ['certificaciones', 'certifications', 'diplomas', 'cursos', 'licencias'],
            projects: ['proyectos', 'projects', 'portafolio'],
            languages: ['idiomas', 'languages'],
            summary: ['resumen', 'summary', 'perfil', 'profile', 'sobre', 'about']
        };

        const foundSections = [];
        const lines = text.split('\n');
        
        console.log(`🔍 Analizando ${lines.length} líneas para estructura...`);
        
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        
        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const line = normalize(rawLine);
            const isUpperCase = rawLine.trim() === rawLine.trim().toUpperCase() && rawLine.trim().length > 3;
            
            // Criterios relajados: Si la línea EMPIEZA con una keyword, es header
            // Incluso si tiene texto después (ej: "Educación Instituto Profesional...")
            if (line.length > 2 && !/^\d{4}/.test(line)) {
                
                for (const [type, keywords] of Object.entries(sectionHeaders)) {
                    // Check keyword al inicio
                    const startsWithKeyword = keywords.some(k => line.startsWith(k + ' ') || line.startsWith(k + ':') || line === k);
                    const containsIsolated = keywords.some(k => line.includes(' ' + k + ' ') || line.endsWith(' ' + k));
                    
                    if (startsWithKeyword || containsIsolated || (isUpperCase && keywords.some(k => line.includes(k)))) {
                         console.log(`📌 Cabecera detectada (${type}): "${rawLine}" (Línea ${i})`);
                         foundSections.push({ type, lineIndex: i, text: rawLine });
                         break;
                    }
                }
            }
        }
        
        // Deduplicar
        const uniqueSections = [];
        foundSections.forEach(section => {
            const prev = uniqueSections[uniqueSections.length - 1];
            if (!prev || prev.type !== section.type || section.lineIndex - prev.lineIndex > 5) {
                uniqueSections.push(section);
            }
        });
        
        return uniqueSections.sort((a, b) => a.lineIndex - b.lineIndex);
    },

    /**
     * Extraer texto de una sección específica
     */
    extractSectionText(text, sectionType) {
        const sections = this.identifySections(text);
        const targetSection = sections.find(s => s.type === sectionType);
        const lines = text.split('\n');

        // FALLBACKS
        if (!targetSection) {
            console.log(`ℹ️ Sección '${sectionType}' no identificada explícitamente.`);
            
            // Si educación fue encontrada pero experiencia no, asumir que todo lo que no es educación/skills/etc podría ser experiencia si tiene fechas
            if (sectionType === 'experience') {
                 // Buscar cualquier bloque de texto que tenga formato de fecha "Mes Año - Mes Año" y que NO esté en educación
                 const eduSection = sections.find(s => s.type === 'education');
                 if (eduSection) {
                     // Buscar ANTES o DESPUÉS de educación
                     // Estrategia: Buscar patrón de fecha fuerte
                     
                     for(let i=0; i<lines.length; i++) {
                         // Si la línea tiene fecha y no está dentro de la sección de educación...
                         if (this.extractDateRange(lines[i])) {
                             const isInEdu = i >= eduSection.lineIndex && (sections.find(s => s.lineIndex > eduSection.lineIndex)?.lineIndex || Infinity) > i;
                             if (!isInEdu) {
                                 console.log(`⚠️ Posible experiencia detectada por fecha fuera de rango en línea ${i}`);
                                 // Devolver un trozo grande de texto alrededor de esta línea
                                 return lines.slice(Math.max(0, i-5), Math.min(lines.length, i+15)).join('\n');
                             }
                         }
                     }
                 }
            }
            return '';
        }
        
        // Lógica normal de extracción
        // IMPORTANTE: Incluir la misma línea del header porque a veces tiene contenido pegado
        // Ej: "Educación Instituto Profesional INACAP" -> Queremos "Instituto Profesional INACAP"
        const startIdx = targetSection.lineIndex; 
        
        let endIdx = lines.length;
        const nextSections = sections.filter(s => s.lineIndex > targetSection.lineIndex);
        if (nextSections.length > 0) {
            endIdx = nextSections[0].lineIndex;
        }
        
        return lines.slice(startIdx, endIdx).join('\n');
    },

    /**
     * Limpiar línea (quitar bullets y espacios extra)
     */
    cleanLine(line) {
        if (!line) return '';
        return line.replace(/^[-•·\u2022]+\s*/, '').replace(/\s+/g, ' ').trim();
    },

    /**
     * Extraer rango de fechas desde una línea (mes/año o solo años)
     */
    extractDateRange(line) {
        if (!line) return null;
        const month = '(?:ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-záéíóúñ]*';
        const year = '(?:19|20)\\d{2}';
        const monthYear = `${month}\\.?\\s+${year}`;
        const current = '(?:presente|present|actual(?:idad)?|current|hoy)';
        const rangeRegex = new RegExp(`(${monthYear}|${year})\\s*(?:–|—|-|/|a|al|hasta|to)\\s*(${monthYear}|${year}|${current})`, 'i');
        const match = line.match(rangeRegex);
        if (!match) return null;
        const matchIndex = typeof match.index === 'number' ? match.index : line.indexOf(match[0]);
        return {
            start: match[1].trim(),
            end: match[2].trim(),
            match,
            index: matchIndex
        };
    },

    /**
     * Parsear experiencia laboral (MEJORADO v3)
     */
    parseExperience(text) {
        const experiences = [];
        console.log('💼 Parseando experiencia laboral...');
        const expSection = this.extractSectionText(text, 'experience');

        let expSource = expSection;
        if (!expSource || expSource.length < 20) {
            console.log('ℹ️ Texto de experiencia vacío o muy corto, buscando por heurísticas...');
            const jobKeywords = /(developer|engineer|ingenier|analista|consultor|gerente|director|jefe|líder|lead|specialist|especialista|arquitecto|diseñador|programador|full\s*stack|frontend|backend|devops|qa|soporte|support|administrador|sysadmin)/i;
            const dateLines = text.split('\n').filter(l => this.extractDateRange(l) || jobKeywords.test(l));
            expSource = dateLines.join('\n');
        }

        if (!expSource || expSource.length < 20) {
            console.log('ℹ️ Texto de experiencia vacío o muy corto');
            return experiences;
        }

        console.log('Sección de experiencia extraída:', expSource.substring(0, 200));

        // Patrones mejorados
        const patterns = [
             // 1. "Empresa • Título ... Mes Año - Mes Año" (Tu formato actual limpio)
            /([^\n•]+?)\s*•\s*([^\n.]+)(?:\.|,)\s*([A-Z][a-z]{2,8})\.?\s+(\d{4})\s*[–-]\s*([A-Z][a-z]{2,8})\.?\s+(\d{4}|presente|present|actual)/gi,
            
             // 2. "Empresa , Título ... Mes Año - Mes Año" (Lo que se vio en los logs: VTR , Ejecutivo...)
            /([^\n,]+?)\s*,\s*([^\n.]+?)\s*(?:•|-|\n)\s*.*?([A-Z][a-z]{2,8})\.?\s+(\d{4})\s*[–-]\s*([A-Z][a-z]{2,8})\.?\s+(\d{4}|presente|present|actual)/gsi,

            // 3. Formato estándar con fechas al final de la línea
            /([^\n]+?)\n([^\n]+?)\n.*?((?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\s*[–-]\s*(?:presente|actual|present|\w+\.?\s+\d{4}))/gi
        ];

        // Intentar patrones
        for (const pattern of patterns) {
            let match;
            // Reiniciar lastIndex para regex global
            pattern.lastIndex = 0; 
            
            while ((match = pattern.exec(expSource)) !== null) {
                // Manejar diferentes grupos de captura según el patrón
                let company, title, start, end;
                
                if (match.length >= 7) { 
                    // Patrones 1 y 2
                    company = match[1].trim();
                    title = match[2].trim();
                     // Limpiar título de posibles puntos o caracteres extra al final
                    title = title.replace(/[.,]*$/, '');
                    start = `${match[3]} ${match[4]}`;
                    end = match[6] || match[5];
                } else if (match.length === 4) {
                    // Patrón 3 (Multilínea)
                    company = match[1].trim();
                    title = match[2].trim();
                    const dates = match[3]; // Necesitaría parsear las fechas de este string
                    start = dates.split(/[–-]/)[0].trim();
                    end = dates.split(/[–-]/)[1].trim();
                }

                if (company && title && company.length > 2) {
                     // Evitar duplicados simples
                    if (!experiences.some(e => e.company === company && e.title === title)) {
                        experiences.push({
                            company,
                            title,
                            startDate: start,
                            endDate: end,
                            current: /presente|present|actual/i.test(end),
                            description: ''
                        });
                        console.log(`✓ Experiencia detectada: ${title} en ${company}`);
                    }
                }
            }
            // Si funciona uno, asumimos que es el formato del CV
            if (experiences.length > 0) break;
        }

        // Si no encontró nada con regex complejos, intentar búsqueda simple de líneas con fechas
        if (experiences.length === 0) {
            console.log('⚠️ Intentando fallback heurístico para experiencia...');
            const linesRaw = expSource.split('\n');
            const lines = linesRaw.map(l => this.cleanLine(l)).filter(Boolean);
            const headerLine = /^(experiencia|experience|historial|trayectoria|trabajo|laboral)/i;
            const filtered = lines.filter(l => !headerLine.test(l));
            const jobKeywords = /(developer|engineer|ingenier|analista|consultor|gerente|director|jefe|líder|lead|specialist|especialista|arquitecto|diseñador|programador|full\s*stack|frontend|backend|devops|qa|soporte|support|administrador|sysadmin)/i;
            const companyHints = /(s\.a\.|s\.a|spa|srl|ltda|ltd|inc|corp|company|co\.|llc|gmbh|group|grupo|solutions|consulting|servicios|tecnolog[ií]a|tech)/i;

            const decideFromParts = (a, b) => {
                const aHasJob = jobKeywords.test(a);
                const bHasJob = jobKeywords.test(b);
                const aHasCompany = companyHints.test(a);
                const bHasCompany = companyHints.test(b);
                const aUpper = a === a.toUpperCase() && a.length <= 40;
                const bUpper = b === b.toUpperCase() && b.length <= 40;
                if ((aHasCompany && !bHasCompany) || (bHasJob && !aHasJob)) return { company: a, title: b };
                if ((bHasCompany && !aHasCompany) || (aHasJob && !bHasJob)) return { company: b, title: a };
                if (aUpper && !bUpper) return { company: a, title: b };
                if (bUpper && !aUpper) return { company: b, title: a };
                return { company: a, title: b };
            };

            const splitExperienceHeader = (primary, secondary) => {
                const p = this.cleanLine(primary);
                const s = this.cleanLine(secondary);
                if (!p && s) return splitExperienceHeader(s, '');
                if (!p) return { title: '', company: '' };

                const enMatch = p.match(/(.+?)\s+(?:en|at|@)\s+(.+)/i);
                if (enMatch) return { title: enMatch[1].trim(), company: enMatch[2].trim() };

                const parts = p.split(/\s*[•·|\|]\s*/).filter(Boolean);
                if (parts.length >= 2) return decideFromParts(parts[0], parts[1]);

                const dashParts = p.split(/\s+[–—-]\s+/).filter(Boolean);
                if (dashParts.length >= 2) return decideFromParts(dashParts[0], dashParts[1]);

                if (s) return decideFromParts(p, s);
                return { title: p, company: '' };
            };

            const seen = new Set();
            for (let i = 0; i < filtered.length; i++) {
                const line = filtered[i];
                const dateInfo = this.extractDateRange(line);
                if (!dateInfo) continue;

                const pre = line.slice(0, dateInfo.index).trim();
                const post = line.slice(dateInfo.index + dateInfo.match[0].length).trim();
                const header = pre || post || filtered[i - 1] || '';
                const secondary = pre || post ? (filtered[i - 1] || '') : (filtered[i - 2] || '');
                const { title, company } = splitExperienceHeader(header, secondary);
                if (!title && !company) continue;

                const key = `${company}|${title}|${dateInfo.start}|${dateInfo.end}`;
                if (seen.has(key)) continue;
                seen.add(key);

                experiences.push({
                    company,
                    title,
                    startDate: dateInfo.start,
                    endDate: dateInfo.end,
                    current: /presente|present|actual|current/i.test(dateInfo.end),
                    description: ''
                });
            }

            // Fallback sin fechas: pares título/empresa
            if (experiences.length === 0) {
                for (let i = 0; i < filtered.length - 1; i++) {
                    const line = filtered[i];
                    const next = filtered[i + 1];
                    const looksTitle = jobKeywords.test(line);
                    const looksCompany = companyHints.test(next) || (next === next.toUpperCase() && next.length <= 40);
                    const looksTitleNext = jobKeywords.test(next);
                    const looksCompanyLine = companyHints.test(line) || (line === line.toUpperCase() && line.length <= 40);
                    if (looksTitle && looksCompany) {
                        experiences.push({ company: next, title: line, startDate: '', endDate: '', current: false, description: '' });
                    } else if (looksCompanyLine && looksTitleNext) {
                        experiences.push({ company: line, title: next, startDate: '', endDate: '', current: false, description: '' });
                    }
                }
            }
        }

        console.log(`📊 Total experiencias encontradas: ${experiences.length}`);
        return experiences;
    },

    /**
     * Parsear educación (MEJORADO v3)
     */
    parseEducation(text) {
        const education = [];
        console.log('🎓 Parseando educación...');
        
        const eduSection = this.extractSectionText(text, 'education');

        let eduSource = eduSection;
        if (!eduSource || eduSource.length < 20) {
            console.log('ℹ️ Texto de educación vacío o muy corto, buscando por heurísticas...');
            const degreeKeywords = /(ingenier|licenci|mag[ií]ster|master|mba|doctor|phd|t[eé]cnico|tecnicatura|diplom|curso|bootcamp|certific|bachelor|degree|diploma|especializ|formaci[oó]n|arquitectura|administraci[oó]n)/i;
            const schoolHints = /(universidad|instituto|college|academy|inacap|duoc|udp|puc|usach|utem|ust|ucn|institute|school|politecnico|politécnico|tecnol[oó]gico|tec|\buc\b|\bu\.?c\.?\b)/i;
            const dateLines = text.split('\n').filter(l => this.extractDateRange(l) || degreeKeywords.test(l) || schoolHints.test(l));
            eduSource = dateLines.join('\n');
        }

        if (!eduSource || eduSource.length < 20) {
            console.log('ℹ️ Texto de educación vacío o muy corto');
            return education;
        }

        console.log('Sección de educación extraída:', eduSource.substring(0, 200));

        // Patrones mejorados (Similares a experiencia pero adaptados)
        const patterns = [
             // 1. "Institución • Título ... Mes Año - Mes Año"
            /([^\n•]+?)\s*•\s*([^\n.]+)(?:\.|,)\s*([A-Z][a-z]{2,8})\.?\s+(\d{4})\s*[–-]\s*([A-Z][a-z]{2,8})\.?\s+(\d{4}|presente|present|actual)/gi,
             // 2. "Institución , Título ... Mes Año - Mes Año"
            /([^\n,]+?)\s*,\s*([^\n.]+?)\s*(?:•|-|\n)\s*.*?([A-Z][a-z]{2,8})\.?\s+(\d{4})\s*[–-]\s*([A-Z][a-z]{2,8})\.?\s+(\d{4}|presente|present|actual)/gsi
        ];

        for (const pattern of patterns) {
            let match;
             pattern.lastIndex = 0;
            while ((match = pattern.exec(eduSource)) !== null) {
                const school = match[1].trim();
                const degree = match[2].trim().replace(/[.,]*$/, '');
                
                if (school.length > 2 && degree.length > 2) {
                     if (!education.some(e => e.school === school && e.degree === degree)) {
                        education.push({
                            school,
                            degree,
                            startDate: `${match[3]} ${match[4]}`,
                            endDate: match[6] || match[5],
                            current: /presente|present|actual/i.test(match[6] || match[5]),
                            field: ''
                        });
                        console.log(`✓ Educación detectada: ${degree} en ${school}`);
                    }
                }
            }
            if (education.length > 0) break;
        }

        if (education.length === 0) {
            console.log('⚠️ Intentando fallback heurístico para educación...');
            const linesRaw = eduSource.split('\n');
            const lines = linesRaw.map(l => this.cleanLine(l)).filter(Boolean);
            const headerLine = /^(educaci[oó]n|education|formaci[oó]n|estudios|academic)/i;
            const filtered = lines.filter(l => !headerLine.test(l));
            const degreeKeywords = /(ingenier|licenci|mag[ií]ster|master|mba|doctor|phd|t[eé]cnico|tecnicatura|diplom|curso|bootcamp|certific|bachelor|degree|diploma|especializ|formaci[oó]n|arquitectura|administraci[oó]n)/i;
            const schoolHints = /(universidad|instituto|college|academy|inacap|duoc|udp|puc|usach|utem|ust|ucn|institute|school|politecnico|politécnico|tecnol[oó]gico|tec|\buc\b|\bu\.?c\.?\b)/i;

            const decideFromParts = (a, b) => {
                const aHasDegree = degreeKeywords.test(a);
                const bHasDegree = degreeKeywords.test(b);
                const aHasSchool = schoolHints.test(a);
                const bHasSchool = schoolHints.test(b);
                const aUpper = a === a.toUpperCase() && a.length <= 50;
                const bUpper = b === b.toUpperCase() && b.length <= 50;
                if ((aHasSchool && !bHasSchool) || (bHasDegree && !aHasDegree)) return { school: a, degree: b };
                if ((bHasSchool && !aHasSchool) || (aHasDegree && !bHasDegree)) return { school: b, degree: a };
                if (aUpper && !bUpper) return { school: a, degree: b };
                if (bUpper && !aUpper) return { school: b, degree: a };
                return { school: a, degree: b };
            };

            const splitEducationHeader = (primary, secondary) => {
                const p = this.cleanLine(primary);
                const s = this.cleanLine(secondary);
                if (!p && s) return splitEducationHeader(s, '');
                if (!p) return { school: '', degree: '' };

                const parts = p.split(/\s*[•·|\|]\s*/).filter(Boolean);
                if (parts.length >= 2) return decideFromParts(parts[0], parts[1]);

                const dashParts = p.split(/\s+[–—-]\s+/).filter(Boolean);
                if (dashParts.length >= 2) return decideFromParts(dashParts[0], dashParts[1]);

                if (s) return decideFromParts(p, s);
                return {
                    school: schoolHints.test(p) ? p : '',
                    degree: degreeKeywords.test(p) ? p : ''
                };
            };

            const seen = new Set();
            for (let i = 0; i < filtered.length; i++) {
                const line = filtered[i];
                const dateInfo = this.extractDateRange(line);
                if (!dateInfo) continue;

                const pre = line.slice(0, dateInfo.index).trim();
                const post = line.slice(dateInfo.index + dateInfo.match[0].length).trim();
                const header = pre || post || filtered[i - 1] || '';
                const secondary = pre || post ? (filtered[i - 1] || '') : (filtered[i - 2] || '');
                const { school, degree } = splitEducationHeader(header, secondary);
                if (!school && !degree) continue;

                const key = `${school}|${degree}|${dateInfo.start}|${dateInfo.end}`;
                if (seen.has(key)) continue;
                seen.add(key);

                education.push({
                    school,
                    degree,
                    startDate: dateInfo.start,
                    endDate: dateInfo.end,
                    current: /presente|present|actual|current/i.test(dateInfo.end),
                    field: ''
                });
            }

            // Fallback sin fechas: pares institución/título
            if (education.length === 0) {
                for (let i = 0; i < filtered.length - 1; i++) {
                    const line = filtered[i];
                    const next = filtered[i + 1];
                    const looksSchool = schoolHints.test(line) || (line === line.toUpperCase() && line.length <= 50);
                    const looksDegree = degreeKeywords.test(next);
                    const looksSchoolNext = schoolHints.test(next) || (next === next.toUpperCase() && next.length <= 50);
                    const looksDegreeLine = degreeKeywords.test(line);
                    if (looksSchool && looksDegree) {
                        education.push({ school: line, degree: next, startDate: '', endDate: '', current: false, field: '' });
                    } else if (looksSchoolNext && looksDegreeLine) {
                        education.push({ school: next, degree: line, startDate: '', endDate: '', current: false, field: '' });
                    }
                }
            }
        }
        
        console.log(`📊 Total educación encontrada: ${education.length}`);
        return education;
    },
    
    /**
     * Parsear habilidades
     */
    parseSkills(text) {
        const skills = new Set();
        
        // Lista de tecnologías/habilidades comunes
        const commonSkills = [
            // Programming Languages
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
            // Frontend
            'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'HTML', 'CSS', 'Sass', 'Tailwind',
            // Backend
            'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails', 'FastAPI',
            // Databases
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
            // Cloud & DevOps
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab',
            // Tools
            'Figma', 'Photoshop', 'Illustrator', 'Jira', 'Trello',
            // Soft Skills
            'Agile', 'Scrum', 'Leadership', 'Communication', 'Teamwork', 'Problem Solving'
        ];
        
        // Buscar cada skill en el texto (case insensitive)
        const lowerText = text.toLowerCase();
        commonSkills.forEach(skill => {
            if (lowerText.includes(skill.toLowerCase())) {
                skills.add(skill);
            }
        });
        
        // Buscar sección de habilidades específica
        const skillsSectionMatch = text.match(/(?:habilidades|skills|tecnolog[ií]as|technologies)[^\n]*\n([\s\S]*?)(?=\n(?:experiencia|experience|educaci[oó]n|education|certificaciones|certifications)|$)/i);
        
        if (skillsSectionMatch) {
            const skillsSection = skillsSectionMatch[1];
            // Extraer palabras que parezcan tecnologías (capitalizadas, sin espacios)
            const techPattern = /\b([A-Z][a-zA-Z0-9+#.]*)\b/g;
            let match;
            while ((match = techPattern.exec(skillsSection)) !== null) {
                if (match[1].length > 2) { // Evitar siglas muy cortas
                    skills.add(match[1]);
                }
            }
        }
        
        return Array.from(skills).slice(0, 20); // Limitar a 20 skills
    },
    
    /**
     * Preprocesar texto para arreglar saltos de línea faltantes
     */
    preprocessText(text) {
        if (!text) return '';
        
        let processed = text;
        
        // 1. Insertar newlines antes de headers de sección comunes si no los tienen
        const sections = [
            'Educación', 'Experiencia', 'Experience', 'Education', 
            'Habilidades', 'Skills', 'Certificaciones', 'Certifications',
            'Proyectos', 'Projects', 'Idiomas', 'Languages', 'Resumen', 'Summary'
        ];
        
        sections.forEach(sec => {
            // Regex que busca la sección que NO esté precedida por newline
            // Usamos replace con función para preservar el case original
            const regex = new RegExp(`([^\\n])\\s+(${sec})`, 'g');
            processed = processed.replace(regex, '$1\n$2');
        });
        
        // 2. Insertar newlines después de patrones que sugieren fin de bloque
        // Fechas al final de experiencia (ej: "Dic 2024 ") -> "Dic 2024 \n"
        processed = processed.replace(/((?:19|20)\d{2})\s+([A-ZÁÉÍÓÚÑ])/g, '$1\n$2');
        
        // Emails
        processed = processed.replace(/(\.com|\.org|\.net|\.cl)\s+([A-Z])/g, '$1\n$2');
        
        // Teléfonos
        processed = processed.replace(/(\d{8,})\s+([A-Z])/g, '$1\n$2');

        // Bullet points que quedaron pegados
        processed = processed.replace(/([^\n])\s•\s/g, '$1\n• ');
        
        // 3. Normalizar espacios múltiples
        processed = processed.replace(/[ \t]+/g, ' ');
        
        return processed;
    },

    /**
     * Calcular Score de Compatibilidad ATS (Application Tracking System)
     */
    calculateATSScore(text, sections) {
        let score = 0;
        const details = [];

        // 1. Longitud de Texto (Base Score: 30 pts)
        if (text.length > 500) {
            score += 30;
            details.push({ passed: true, msg: "Longitud de texto adecuada (>500 chars)" });
        } else {
            const partial = Math.floor((text.length / 500) * 30);
            score += partial;
            details.push({ passed: false, msg: `Texto demasiado corto (${text.length} chars). Podría ser una imagen.` });
        }

        // 2. Estructura de Secciones (Base Score: 40 pts)
        const requiredSections = ['experience', 'education', 'skills'];
        let sectionsFound = 0;
        
        // Verificar si las secciones tienen contenido real
        if (sections.experience && sections.experience.length > 0) sectionsFound++;
        if (sections.education && sections.education.length > 0) sectionsFound++;
        if (sections.skills && sections.skills.length > 0) sectionsFound++;

        if (sectionsFound === 3) {
            score += 40;
            details.push({ passed: true, msg: "Estructura completa detectada (Exp, Edu, Skills)" });
        } else {
            const partial = Math.floor((sectionsFound / 3) * 40);
            score += partial;
            details.push({ passed: false, msg: `Estructura incompleta. Detectado: ${sectionsFound}/3 secciones principales.` });
        }

        // 3. Formato de Contacto (Base Score: 15 pts)
        if (sections.personalInfo.email && sections.personalInfo.phone) {
            score += 15;
            details.push({ passed: true, msg: "Datos de contacto legibles" });
        } else {
            details.push({ passed: false, msg: "Faltan datos de contacto claros (Email/Tel)" });
        }
        
        // 4. Legibilidad / Noise Ratio (Base Score: 15 pts)
        // Check si hay demasiados caracteres raros o líneas muy cortas (indicador de mal parsing)
        const lines = text.split('\n');
        const avgLineLength = text.length / (lines.length || 1);
        
        if (avgLineLength > 20) {
            score += 15;
            details.push({ passed: true, msg: "Formato de texto limpio y legible" });
        } else {
             details.push({ passed: false, msg: "Posibles problemas de formato (líneas rotas)" });
        }

        return {
            score: Math.min(100, score),
            details
        };
    },
    
    /**
     * Parsear CV completo
     */
    async parseCV(file) {
        try {
            // Extraer texto (Layout Aware)
            const { text: rawText, pageCount } = await this.extractTextFromPDF(file);
            
            if (!rawText || rawText.trim().length < 100) {
                throw new Error('El PDF no contiene suficiente texto. Puede ser una imagen escaneada.');
            }
            
            // PREPROCESAR TEXTO (CRÍTICO)
            const text = this.preprocessText(rawText);
            console.log('📄 Texto preprocesado length:', text.length);
            
            // Parsear cada sección
            const personalInfo = this.parsePersonalInfo(text);
            const experience = this.parseExperience(text);
            const education = this.parseEducation(text);
            const skills = this.parseSkills(text);
            
            // Extraer resumen
            const summaryMatch = text.match(/(?:resumen|summary|perfil|profile)[^\n]*\n([\s\S]{100,500}?)(?=\n\n|\n(?:experiencia|experience|educaci[oó]n|education))/i);
            if (summaryMatch) {
                personalInfo.summary = summaryMatch[1].trim();
            }

            const parsedData = {
                personalInfo,
                experience,
                education,
                skills,
                metadata: {
                    pageCount,
                    textLength: text.length,
                    processingMethod: 'pdf.js + LayoutAware AI'
                }
            };

            // Calcular ATS Score en el mismo ciclo
            parsedData.atsAnalysis = this.calculateATSScore(text, parsedData);

            return parsedData;
            
        } catch (error) {
            console.error('Error parsing CV:', error);
            throw error;
        }
    }
};

// Exponer globalmente
window.RealPDFParser = RealPDFParser;
