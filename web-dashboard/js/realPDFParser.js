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
     * Parsear información personal del texto
     */
    parsePersonalInfo(text) {
        const info = {};
        
        // Email (regex mejorado)
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) info.email = emailMatch[1];
        
        // Teléfono (múltiples formatos)
        const phoneMatch = text.match(/(?:\+?[\d]{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/);
        if (phoneMatch) info.phone = phoneMatch[0].trim();
        
        // LinkedIn
        const linkedinMatch = text.match(/(?:linkedin\.com\/in\/)([\w-]+)/i);
        if (linkedinMatch) info.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
        
        // GitHub
        const githubMatch = text.match(/(?:github\.com\/)([\w-]+)/i);
        if (githubMatch) info.github = `https://github.com/${githubMatch[1]}`;
        
        // Nombre (primera línea significativa, generalmente)
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Si la primera línea parece un nombre (2-4 palabras, sin números)
            if (firstLine.split(' ').length <= 4 && !/\d/.test(firstLine)) {
                const nameParts = firstLine.split(' ');
                info.firstName = nameParts[0];
                info.lastName = nameParts.slice(1).join(' ');
            }
        }
        
        // Título profesional (buscar patrones comunes)
        const titlePatterns = [
            /(?:desarrollador|developer|ingeniero|engineer|programador|programmer|analista|analyst|diseñador|designer|arquitecto|architect)\s+(?:de\s+)?(?:software|web|frontend|backend|full\s*stack|mobile|datos|data|sistemas)/i,
            /(?:senior|junior|mid|lead|principal|staff)\s+(?:developer|engineer|programmer)/i
        ];
        
        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match) {
                info.currentTitle = match[0];
                break;
            }
        }
        
        return info;
    },
    
    /**
     * Parsear experiencia laboral
     */
    parseExperience(text) {
        const experiences = [];
        
        // Buscar secciones de experiencia
        const expSectionMatch = text.match(/(?:experiencia|experience|trabajo|work\s+experience)[^\n]*\n([\s\S]*?)(?=\n(?:educaci[oó]n|education|habilidades|skills|certificaciones|certifications)|$)/i);
        
        if (!expSectionMatch) return experiences;
        
        const expSection = expSectionMatch[1];
        
        // Patrones para detectar entradas de experiencia
        // Formato: "Título en Empresa (Año - Año)"
        const expPattern = /([^\n]+?)\s+(?:en|at|@)\s+([^\n]+?)\s+(?:\(|•|-)?\s*(\d{4})\s*[-–]\s*(\d{4}|presente|present|actual|current)/gi;
        
        let match;
        while ((match = expPattern.exec(expSection)) !== null) {
            experiences.push({
                title: match[1].trim(),
                company: match[2].trim(),
                startDate: match[3],
                endDate: match[4].toLowerCase().includes('present') || 
                         match[4].toLowerCase().includes('actual') || 
                         match[4].toLowerCase().includes('current') ? 'Presente' : match[4],
                current: match[4].toLowerCase().includes('present') || 
                        match[4].toLowerCase().includes('actual') ||
                        match[4].toLowerCase().includes('current'),
                description: ''
            });
        }
        
        return experiences;
    },
    
    /**
     * Parsear educación
     */
    parseEducation(text) {
        const education = [];
        
        // Buscar sección de educación
        const eduSectionMatch = text.match(/(?:educaci[oó]n|education|formaci[oó]n|academic)[^\n]*\n([\s\S]*?)(?=\n(?:experiencia|experience|habilidades|skills|certificaciones|certifications)|$)/i);
        
        if (!eduSectionMatch) return education;
        
        const eduSection = eduSectionMatch[1];
        
        // Patrones para detectar entradas de educación
        const eduPattern = /([^\n]+?)\s+(?:en|at|@|-)\s+([^\n]+?)\s+(?:\(|•|-)?\s*(\d{4})\s*[-–]\s*(\d{4}|presente|present|actual|current)/gi;
        
        let match;
        while ((match = eduPattern.exec(eduSection)) !== null) {
            education.push({
                degree: match[1].trim(),
                school: match[2].trim(),
                startDate: match[3],
                endDate: match[4].toLowerCase().includes('present') || 
                        match[4].toLowerCase().includes('actual') ? 'Presente' : match[4],
                current: match[4].toLowerCase().includes('present') || 
                        match[4].toLowerCase().includes('actual')
            });
        }
        
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
