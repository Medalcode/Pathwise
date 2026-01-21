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
            
            // Extraer texto de todas las páginas
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            return {
                text: fullText,
                pageCount: totalPages
            };
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            throw new Error('No se pudo extraer el texto del PDF');
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
     * Identificar secciones en el texto (Nuevo Helper)
     */
    identifySections(text) {
        // Mapa de secciones y sus posibles cabeceras
        const sectionHeaders = {
            experience: ['experiencia', 'experience', 'trabajo', 'work', 'historial', 'trayectoria'],
            education: ['educación', 'education', 'formación', 'academic', 'estudios', 'antecedentes'],
            skills: ['habilidades', 'skills', 'competencias', 'tecnologías', 'technologies', 'conocimientos'],
            certifications: ['certificaciones', 'certifications', 'diplomas', 'cursos'],
            projects: ['proyectos', 'projects', 'portafolio'],
            languages: ['idiomas', 'languages'],
            summary: ['resumen', 'summary', 'perfil', 'profile', 'sobre mí', 'about']
        };

        const foundSections = [];
        const lines = text.split('\n');
        
        // Recorrer líneas buscando cabeceras
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toLowerCase();
            // Criterios para ser cabecera: corta (<40 chars), sin números al inicio (excepto bullet points)
            if (line.length < 40 && line.length > 3 && !/^\d/.test(line)) {
                
                // Chequear contra cada tipo
                for (const [type, keywords] of Object.entries(sectionHeaders)) {
                    if (keywords.some(k => line.includes(k))) {
                        // Verificar que no sea parte de una oración larga
                         if (keywords.some(k => line === k || line.startsWith(k + ' ') || line.endsWith(' ' + k) || line.includes(' ' + k + ' '))) {
                            foundSections.push({ type, lineIndex: i, text: lines[i] });
                            break; // Una línea solo puede ser un tipo de sección
                         }
                    }
                }
            }
        }
        
        // Ordenar por aparición
        return foundSections.sort((a, b) => a.lineIndex - b.lineIndex);
    },

    /**
     * Extraer texto de una sección específica
     */
    extractSectionText(text, sectionType) {
        const sections = this.identifySections(text);
        const targetSection = sections.find(s => s.type === sectionType);
        
        if (!targetSection) {
            console.log(`ℹ️ Sección '${sectionType}' no identificada explícitamente.`);
            // Fallback: usar regex simple si la detección por líneas falla
            if (sectionType === 'experience') {
                 const match = text.match(/(?:experiencia|experience|trabajo)[^\n]*\n([\s\S]*?)(?=\n\s*(?:educaci|education|habilidad|skill|certific|projects)|$)/i);
                 return match ? match[1] : '';
            }
            if (sectionType === 'education') {
                 const match = text.match(/(?:educaci|education|formaci)[^\n]*\n([\s\S]*?)(?=\n\s*(?:experiencia|experience|trabajo|habilidad|skill|certific|projects)|$)/i);
                 return match ? match[1] : '';
            }
            return '';
        }
        
        const lines = text.split('\n');
        const startIdx = targetSection.lineIndex + 1;
        
        // Encontrar dónde termina: siguiente sección o fin del texto
        let endIdx = lines.length;
        const nextSection = sections.find(s => s.lineIndex > targetSection.lineIndex);
        if (nextSection) {
            endIdx = nextSection.lineIndex;
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
     * Parsear CV completo
     */
    async parseCV(file) {
        try {
            // Extraer texto
            const { text, pageCount } = await this.extractTextFromPDF(file);
            
            if (!text || text.trim().length < 100) {
                throw new Error('El PDF no contiene suficiente texto. Puede ser una imagen escaneada.');
            }
            
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
                    processingMethod: 'pdf.js + AI parsing'
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
