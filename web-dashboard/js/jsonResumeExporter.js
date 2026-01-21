/**
 * JSON Resume Exporter
 * Exporta datos del CV al formato estándar JSON Resume
 * Spec: https://jsonresume.org/schema/
 */

const JSONResumeExporter = {
    /**
     * Convertir datos de Panoptes a JSON Resume format
     */
    convertToJSONResume(profileData) {
        const resume = {
            "$schema": "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
            "basics": {},
            "work": [],
            "education": [],
            "skills": [],
            "languages": [],
            "meta": {
                "canonical": "https://panoptes.app",
                "version": "v1.0.0",
                "lastModified": new Date().toISOString()
            }
        };
        
        // Basics (Personal Info)
        if (profileData.personalInfo) {
            const pi = profileData.personalInfo;
            resume.basics = {
                name: `${pi.firstName || ''} ${pi.lastName || ''}`.trim(),
                label: pi.currentTitle || '',
                email: pi.email || '',
                phone: pi.phone || '',
                summary: pi.summary || '',
                location: {
                    city: pi.city || '',
                    countryCode: this.getCountryCode(pi.country || ''),
                    region: pi.country || ''
                },
                profiles: []
            };
            
            // LinkedIn
            if (pi.linkedin) {
                resume.basics.profiles.push({
                    network: "LinkedIn",
                    username: this.extractUsername(pi.linkedin, 'linkedin'),
                    url: pi.linkedin
                });
            }
            
            // GitHub
            if (pi.github) {
                resume.basics.profiles.push({
                    network: "GitHub",
                    username: this.extractUsername(pi.github, 'github'),
                    url: pi.github
                });
            }
            
            // Portfolio
            if (pi.portfolio) {
                resume.basics.url = pi.portfolio;
            }
        }
        
        // Work (Experience)
        if (profileData.experience && Array.isArray(profileData.experience)) {
            resume.work = profileData.experience.map(exp => ({
                name: exp.company || '',
                position: exp.title || '',
                startDate: this.formatDate(exp.startDate),
                endDate: exp.current ? '' : this.formatDate(exp.endDate),
                summary: exp.description || '',
                highlights: exp.highlights || []
            }));
        }
        
        // Education
        if (profileData.education && Array.isArray(profileData.education)) {
            resume.education = profileData.education.map(edu => ({
                institution: edu.school || '',
                area: edu.field || '',
                studyType: edu.degree || '',
                startDate: this.formatDate(edu.startDate),
                endDate: edu.current ? '' : this.formatDate(edu.endDate),
                score: edu.gpa || '',
                courses: edu.courses || []
            }));
        }
        
        // Skills
        if (profileData.skills && Array.isArray(profileData.skills)) {
            // Agrupar skills por categoría (si es posible)
            const skillGroups = this.categorizeSkills(profileData.skills);
            
            resume.skills = Object.entries(skillGroups).map(([category, skills]) => ({
                name: category,
                level: '',
                keywords: skills
            }));
        }
        
        return resume;
    },
    
    /**
     * Categorizar skills por tipo
     */
    categorizeSkills(skills) {
        const categories = {
            'Programming Languages': [],
            'Frontend': [],
            'Backend': [],
            'Database': [],
            'DevOps & Cloud': [],
            'Tools & Others': []
        };
        
        const categoryMap = {
            'JavaScript': 'Programming Languages',
            'TypeScript': 'Programming Languages',
            'Python': 'Programming Languages',
            'Java': 'Programming Languages',
            'C#': 'Programming Languages',
            'PHP': 'Programming Languages',
            'Ruby': 'Programming Languages',
            'Go': 'Programming Languages',
            
            'React': 'Frontend',
            'Vue': 'Frontend',
            'Angular': 'Frontend',
            'Next.js': 'Frontend',
            'HTML': 'Frontend',
            'CSS': 'Frontend',
            'Tailwind': 'Frontend',
            
            'Node.js': 'Backend',
            'Express': 'Backend',
            'Django': 'Backend',
            'Flask': 'Backend',
            'Spring': 'Backend',
            'Laravel': 'Backend',
            
            'MongoDB': 'Database',
            'PostgreSQL': 'Database',
            'MySQL': 'Database',
            'Redis': 'Database',
            'Firebase': 'Database',
            
            'Docker': 'DevOps & Cloud',
            'Kubernetes': 'DevOps & Cloud',
            'AWS': 'DevOps & Cloud',
            'Azure': 'DevOps & Cloud',
            'GCP': 'DevOps & Cloud',
            'CI/CD': 'DevOps & Cloud',
            'Git': 'DevOps & Cloud'
        };
        
        skills.forEach(skill => {
            const category = categoryMap[skill] || 'Tools & Others';
            categories[category].push(skill);
        });
        
        // Filtrar categorías vacías
        return Object.fromEntries(
            Object.entries(categories).filter(([_, skills]) => skills.length > 0)
        );
    },
    
    /**
     * Formatear fecha a ISO (YYYY-MM-DD)
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        
        // Si es solo año
        if (/^\d{4}$/.test(dateStr)) {
            return `${dateStr}-01-01`;
        }
        
        // Si ya está en formato ISO
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        
        return '';
    },
    
    /**
     * Extraer username de URL
     */
    extractUsername(url, network) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            
            if (network === 'linkedin' && pathParts[0] === 'in') {
                return pathParts[1];
            }
            
            if (network === 'github') {
                return pathParts[0];
            }
            
            return pathParts[pathParts.length - 1] || '';
        } catch {
            return '';
        }
    },
    
    /**
     * Obtener código de país (ISO 3166-1 alpha-2)
     */
    getCountryCode(country) {
        const countryMap = {
            'Chile': 'CL',
            'Argentina': 'AR',
            'México': 'MX',
            'Mexico': 'MX',
            'España': 'ES',
            'Spain': 'ES',
            'Colombia': 'CO',
            'Perú': 'PE',
            'Peru': 'PE',
            'United States': 'US',
            'Estados Unidos': 'US',
            'Brazil': 'BR',
            'Brasil': 'BR'
        };
        
        return countryMap[country] || '';
    },
    
    /**
     * Exportar como archivo JSON
     */
    exportAsFile(profileData, fileName = 'resume.json') {
        const resume = this.convertToJSONResume(profileData);
        const jsonStr = JSON.stringify(resume, null, 2);
        
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        URL.revokeObjectURL(url);
        
        showToast('✓ CV exportado en formato JSON Resume', 'success');
    },
    
    /**
     * Copiar JSON al portapapeles
     */
    async copyToClipboard(profileData) {
        const resume = this.convertToJSONResume(profileData);
        const jsonStr = JSON.stringify(resume, null, 2);
        
        try {
            await navigator.clipboard.writeText(jsonStr);
            showToast('✓ JSON copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            showToast('Error al copiar al portapapeles', 'error');
        }
    },
    
    /**
     * Renderizar botón de exportación en la UI
     */
    renderExportButton() {
        // Buscar o crear contenedor
        let container = document.getElementById('exportButtonContainer');
        
        if (!container) {
            const preview = document.getElementById('extractedDataPreview');
            if (!preview) return;
            
            // Buscar el div de botones (Save & Discard)
            const buttonsDiv = preview.querySelector('.flex.justify-between');
            if (!buttonsDiv) return;
            
            container = document.createElement('div');
            container.id = 'exportButtonContainer';
            container.className = 'mt-4 pt-4 border-t border-white/10';
            
            buttonsDiv.parentNode.insertBefore(container, buttonsDiv);
        }
        
        container.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500 uppercase">Exportar CV</span>
                <div class="flex gap-2">
                    <button onclick="JSONResumeExporter.exportAsFile(window.extractedData || window.currentProfile)" 
                            class="px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary/50 text-xs text-gray-300 hover:text-white transition-all flex items-center gap-2"
                            title="Descargar como JSON Resume">
                        <span class="material-symbols-outlined text-sm">download</span>
                        JSON Resume
                    </button>
                    <button onclick="JSONResumeExporter.copyToClipboard(window.extractedData || window.currentProfile)" 
                            class="px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary/50 text-xs text-gray-300 hover:text-white transition-all flex items-center gap-2"
                            title="Copiar JSON al portapapeles">
                        <span class="material-symbols-outlined text-sm">content_copy</span>
                        Copiar JSON
                    </button>
                </div>
            </div>
        `;
    }
};

// Exponer globalmente
window.JSONResumeExporter = JSONResumeExporter;
