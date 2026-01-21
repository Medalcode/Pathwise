/**
 * Real PDF Parser with AI
 * Extrae texto real de PDFs usando PDF.js y lo parsea con IA/regex
 */

const RealPDFParser = {
    /**
     * Extraer texto completo del PDF
     */
    async extractTextFromPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            const totalPages = pdf.numPages;
            
            console.log(`📄 Procesando PDF de ${totalPages} páginas...`);
            
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const items = textContent.items;
                
                if (!items || items.length === 0) continue;

                // Ordenar items: Primero Y (arriba a abajo), luego X (izquierda a derecha)
                items.sort((a, b) => {
                    const yA = a.transform[5];
                    const yB = b.transform[5];
                    // Tolerancia de 5px para considerar misma línea
                    if (Math.abs(yA - yB) > 5) { 
                        return yB - yA; // Orden descendente en Y (PDF coord system)
                    }
                    return a.transform[4] - b.transform[4]; // Orden ascendente en X
                });

                let pageLines = [];
                let currentLineItems = [];
                let currentY = items[0].transform[5];

                for (const item of items) {
                    const y = item.transform[5];
                    
                    if (Math.abs(y - currentY) > 5) {
                        // Nueva línea detectada (cambio significativo en Y)
                        if (currentLineItems.length > 0) {
                            // Unir items de la línea anterior con espacios
                            pageLines.push(currentLineItems.map(i => i.str).join(' '));
                        }
                        currentLineItems = [];
                        currentY = y;
                    }
                    currentLineItems.push(item);
                }
                
                // Agregar la última línea del loop
                if (currentLineItems.length > 0) {
                    pageLines.push(currentLineItems.map(i => i.str).join(' '));
                }

                // Unir líneas con \n
                fullText += pageLines.join('\n') + '\n';
            }
            
            console.log(`✅ Extracción robusta completada. ${fullText.split('\n').length} líneas detectadas.`);
            
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
                     const datePattern = /(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}/i;
                     
                     for(let i=0; i<lines.length; i++) {
                         // Si la línea tiene fecha y no está dentro de la sección de educación...
                         if (datePattern.test(lines[i])) {
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
     * Parsear experiencia laboral (MEJORADO v3)
     */
    parseExperience(text) {
        const experiences = [];
        console.log('💼 Parseando experiencia laboral...');
        
        const expSection = this.extractSectionText(text, 'experience');
        
        if (!expSection || expSection.length < 20) {
            console.log('ℹ️ Texto de experiencia vacío o muy corto');
            return experiences;
        }
        
        console.log('Sección de experiencia extraída:', expSection.substring(0, 200));

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
            
            while ((match = pattern.exec(expSection)) !== null) {
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
            console.log('⚠️ Intentando fallback simple para experiencia...');
            const lines = expSection.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Busca línea que tenga formato de fecha "Mar 2023 - Dic 2024"
                if (/\b(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\s*[–-]/i.test(line)) {
                     // Asumir que la línea anterior o la misma tiene la empresa/título
                    const parts = line.split(/[•,]/); // Intentar dividir por punto o coma
                    if (parts.length >= 2) {
                        experiences.push({
                            company: parts[0].trim(),
                            title: parts[1].split(/\d/)[0].trim().replace(/[.,]*$/, ''), // Quitar fecha del titulo si se pegó
                            startDate: 'Date Found',
                            endDate: '',
                            current: false
                        });
                    } else if (i > 0) {
                        // Mirar línea anterior
                         experiences.push({
                            company: lines[i-1].trim(),
                            title: 'Unknown Role', // Difícil saber qué es qué sin formato claro
                            startDate: 'Date Found',
                            endDate: '',
                            current: false
                        });
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
        
        if (!eduSection || eduSection.length < 20) {
             console.log('ℹ️ Texto de educación vacío o muy corto');
            return education;
        }

        console.log('Sección de educación extraída:', eduSection.substring(0, 200));

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
            while ((match = pattern.exec(eduSection)) !== null) {
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
     * Parsear CV completo
     */
    async parseCV(file) {
        try {
            // Extraer texto
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
            
            // Extraer resumen (primeros párrafos después del nombre)
            const summaryMatch = text.match(/(?:resumen|summary|perfil|profile)[^\n]*\n([\s\S]{100,500}?)(?=\n\n|\n(?:experiencia|experience|educaci[oó]n|education))/i);
            if (summaryMatch) {
                personalInfo.summary = summaryMatch[1].trim();
            }
            
            return {
                personalInfo,
                experience,
                education,
                skills,
                metadata: {
                    pageCount,
                    textLength: text.length,
                    processingMethod: 'pdf.js + AI parsing v2'
                }
            };
            
        } catch (error) {
            console.error('Error parsing CV:', error);
            throw error;
        }
    }
};

// Exponer globalmente
window.RealPDFParser = RealPDFParser;
