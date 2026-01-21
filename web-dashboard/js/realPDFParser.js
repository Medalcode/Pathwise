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
     * Parsear experiencia laboral (MEJORADO)
     */
    parseExperience(text) {
        const experiences = [];
        
        console.log('💼 Parseando experiencia laboral...');
        
        // Buscar sección de experiencia
        const expSectionMatch = text.match(/(?:experiencia|experience|trabajo|work\s+experience|historial\s+laboral)[^\n]*\n([\s\S]*?)(?=\n(?:educaci[oó]n|education|habilidades|skills|certificaciones|certifications|proyectos|projects)|$)/i);
        
        if (!expSectionMatch) {
            console.log('ℹ️ No se encontró sección de experiencia');
            return experiences;
        }
        
        const expSection = expSectionMatch[1];
        console.log('Sección de experiencia encontrada:', expSection.substring(0, 200));
        
        // Múltiples patrones para diferentes formatos
        const patterns = [
            // Patrón 1: "Empresa • Título. Mes Año – Mes Año"
            /([^\n•]+?)\s*•\s*([^\n.]+)\.\s*([A-Z][a-z]{2,3})\s+(\d{4})\s*[–-]\s*([A-Z][a-z]{2,3})\s+(\d{4}|presente|present|actual)/gi,
            
            // Patrón 2: "Título en/at Empresa (Año - Año)"
            /([^\n]+?)\s+(?:en|at|@)\s+([^\n(]+?)\s*(?:\(|•|-)?\s*(\d{4})\s*[-–]\s*(\d{4}|presente|present|actual|current)/gi,
            
            // Patrón 3: "Empresa - Título - Mes Año - Mes Año"
            /([^\n-]+?)\s*-\s*([^\n-]+?)\s*-\s*([A-Z][a-z]{2,3})\s+(\d{4})\s*-\s*([A-Z][a-z]{2,3})\s+(\d{4}|presente|present)/gi,
            
            // Patrón 4: Solo con años "Título, Empresa, Año-Año"
            /([^,\n]+?),\s*([^,\n]+?),\s*(\d{4})\s*[-–]\s*(\d{4}|presente|present|actual)/gi
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(expSection)) !== null) {
                let exp;
                
                // Determinar qué patrón coincidió y extraer datos accordingly
                if (match[0].includes('•')) {
                    // Patrón 1: Empresa • Título
                    exp = {
                        company: match[1].trim(),
                        title: match[2].trim(),
                        startDate: `${match[3]} ${match[4]}`,
                        endDate: match[6] || match[5],
                        current: /presente|present|actual/i.test(match[6] || match[5]),
                        description: ''
                    };
                } else if (match[0].includes(' en ') || match[0].includes(' at ')) {
                    // Patrón 2: Título en Empresa
                    exp = {
                        title: match[1].trim(),
                        company: match[2].trim(),
                        startDate: match[3],
                        endDate: match[4],
                        current: /presente|present|actual|current/i.test(match[4]),
                        description: ''
                    };
                } else {
                    // Otros patrones
                    exp = {
                        company: match[2]?.trim() || match[1].trim(),
                        title: match[1]?.trim() || match[2].trim(),
                        startDate: match[3],
                        endDate: match[4] || match[6],
                        current: /presente|present|actual/i.test(match[4] || match[6]),
                        description: ''
                    };
                }
                
                // Validar que tenga datos mínimos
                if (exp.company && exp.title) {
                    experiences.push(exp);
                    console.log(`✓ Experiencia encontrada: ${exp.title} en ${exp.company} (${exp.startDate} - ${exp.endDate})`);
                }
            }
            
            // Si encontramos experiencias, no seguir probando patrones
            if (experiences.length > 0) break;
        }
        
        console.log(`📊 Total experiencias encontradas: ${experiences.length}`);
        return experiences;
    },
    
    /**
     * Parsear educación (MEJORADO)
     */
    parseEducation(text) {
        const education = [];
        
        console.log('🎓 Parseando educación...');
        
        // Buscar sección de educación
        const eduSectionMatch = text.match(/(?:educaci[oó]n|education|formaci[oó]n|academic|estudios)[^\n]*\n([\s\S]*?)(?=\n(?:experiencia|experience|habilidades|skills|certificaciones|certifications|proyectos|projects)|$)/i);
        
        if (!eduSectionMatch) {
            console.log('ℹ️ No se encontró sección de educación');
            return education;
        }
        
        const eduSection = eduSectionMatch[1];
        console.log('Sección de educación encontrada:', eduSection.substring(0, 200));
        
        // Múltiples patrones para diferentes formatos
        const patterns = [
            // Patrón 1: "Institución • Título. Mes Año – Mes Año"
            /([^\n•]+?)\s*•\s*([^\n.]+)\.\s*([A-Z][a-z]{2,3})\s+(\d{4})\s*[–-]\s*([A-Z][a-z]{2,3})\s+(\d{4}|presente|present|actual)/gi,
            
            // Patrón 2: "Título en/at Institución (Año - Año)"
            /([^\n]+?)\s+(?:en|at|@)\s+([^\n(]+?)\s*(?:\(|•|-)?\s*(\d{4})\s*[-–]\s*(\d{4}|presente|present|actual|current)/gi,
            
            // Patrón 3: "Institución - Título - Mes Año - Mes Año"
            /([^\n-]+?)\s*-\s*([^\n-]+?)\s*-\s*([A-Z][a-z]{2,3})\s+(\d{4})\s*-\s*([A-Z][a-z]{2,3})\s+(\d{4}|presente|present)/gi,
            
            // Patrón 4: Solo con años "Título, Institución, Año-Año"
            /([^,\n]+?),\s*([^,\n]+?),\s*(\d{4})\s*[-–]\s*(\d{4}|presente|present|actual)/gi
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(eduSection)) !== null) {
                let edu;
                
                // Determinar qué patrón coincidió
                if (match[0].includes('•')) {
                    // Patrón 1: Institución • Título
                    edu = {
                        school: match[1].trim(),
                        degree: match[2].trim(),
                        startDate: `${match[3]} ${match[4]}`,
                        endDate: match[6] || match[5],
                        current: /presente|present|actual/i.test(match[6] || match[5]),
                        field: ''
                    };
                } else if (match[0].includes(' en ') || match[0].includes(' at ')) {
                    // Patrón 2: Título en Institución
                    edu = {
                        degree: match[1].trim(),
                        school: match[2].trim(),
                        startDate: match[3],
                        endDate: match[4],
                        current: /presente|present|actual|current/i.test(match[4]),
                        field: ''
                    };
                } else {
                    // Otros patrones
                    edu = {
                        school: match[2]?.trim() || match[1].trim(),
                        degree: match[1]?.trim() || match[2].trim(),
                        startDate: match[3],
                        endDate: match[4] || match[6],
                        current: /presente|present|actual/i.test(match[4] || match[6]),
                        field: ''
                    };
                }
                
                // Validar que tenga datos mínimos
                if (edu.school && edu.degree) {
                    education.push(edu);
                    console.log(`✓ Educación encontrada: ${edu.degree} en ${edu.school} (${edu.startDate} - ${edu.endDate})`);
                }
            }
            
            // Si encontramos educación, no seguir probando patrones
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
