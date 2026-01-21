/**
 * CV Quality Score Calculator
 * Calcula y muestra el score de calidad del CV extraído
 */

const CVQualityScore = {
    /**
     * Calcular score de calidad del perfil
     */
    calculateScore(profileData) {
        if (!profileData) return 0;
        
        let score = 0;
        let maxScore = 100;
        const weights = {
            personalInfo: 30,
            experience: 25,
            education: 20,
            skills: 15,
            completeness: 10
        };
        
        // 1. Personal Info (30 puntos)
        if (profileData.personalInfo) {
            const pi = profileData.personalInfo;
            const requiredFields = ['firstName', 'lastName', 'email'];
            const optionalFields = ['phone', 'currentTitle', 'city', 'country', 'linkedin', 'summary'];
            
            // Required fields (15 pts)
            const requiredFilled = requiredFields.filter(f => pi[f] && pi[f].trim()).length;
            score += (requiredFilled / requiredFields.length) * 15;
            
            // Optional fields (15 pts)
            const optionalFilled = optionalFields.filter(f => pi[f] && pi[f].trim()).length;
            score += (optionalFilled / optionalFields.length) * 15;
        }
        
        // 2. Experience (25 puntos)
        if (profileData.experience && profileData.experience.length > 0) {
            const expCount = Math.min(profileData.experience.length, 3);
            score += (expCount / 3) * 15; // Hasta 3 experiencias
            
            // Quality of experience entries (10 pts)
            const avgQuality = profileData.experience.reduce((acc, exp) => {
                let quality = 0;
                if (exp.title) quality += 0.25;
                if (exp.company) quality += 0.25;
                if (exp.startDate) quality += 0.25;
                if (exp.description && exp.description.length > 50) quality += 0.25;
                return acc + quality;
            }, 0) / profileData.experience.length;
            
            score += avgQuality * 10;
        }
        
        // 3. Education (20 puntos)
        if (profileData.education && profileData.education.length > 0) {
            const eduCount = Math.min(profileData.education.length, 2);
            score += (eduCount / 2) * 10; // Hasta 2 educaciones
            
            // Quality of education entries (10 pts)
            const avgQuality = profileData.education.reduce((acc, edu) => {
                let quality = 0;
                if (edu.degree) quality += 0.33;
                if (edu.school) quality += 0.33;
                if (edu.startDate) quality += 0.34;
                return acc + quality;
            }, 0) / profileData.education.length;
            
            score += avgQuality * 10;
        }
        
        // 4. Skills (15 puntos)
        if (profileData.skills && profileData.skills.length > 0) {
            const skillCount = Math.min(profileData.skills.length, 10);
            score += (skillCount / 10) * 15;
        }
        
        // 5. Completeness bonus (10 puntos)
        const hasAllSections = 
            profileData.personalInfo &&
            profileData.experience && profileData.experience.length > 0 &&
            profileData.education && profileData.education.length > 0 &&
            profileData.skills && profileData.skills.length > 0;
        
        if (hasAllSections) score += 10;
        
        return Math.round(score);
    },
    
    /**
     * Obtener sugerencias basadas en el score
     */
    getSuggestions(profileData, score) {
        const suggestions = [];
        
        if (!profileData) return suggestions;
        
        // Personal Info
        if (!profileData.personalInfo?.phone) {
            suggestions.push({ 
                type: 'warning', 
                text: 'Agrega tu número de teléfono',
                icon: '📱'
            });
        }
        
        if (!profileData.personalInfo?.linkedin) {
            suggestions.push({ 
                type: 'info', 
                text: 'Incluye tu perfil de LinkedIn',
                icon: '💼'
            });
        }
        
        if (!profileData.personalInfo?.summary || profileData.personalInfo.summary.length < 100) {
            suggestions.push({ 
                type: 'warning', 
                text: 'Escribe un resumen profesional más detallado (min. 100 caracteres)',
                icon: '📝'
            });
        }
        
        // Experience
        if (!profileData.experience || profileData.experience.length === 0) {
            suggestions.push({ 
                type: 'error', 
                text: 'Agrega al menos una experiencia laboral',
                icon: '💼'
            });
        } else if (profileData.experience.length < 2) {
            suggestions.push({ 
                type: 'info', 
                text: 'Agrega más experiencias laborales (recomendado: 2-3)',
                icon: '📈'
            });
        }
        
        // Education
        if (!profileData.education || profileData.education.length === 0) {
            suggestions.push({ 
                type: 'error', 
                text: 'Agrega tu formación académica',
                icon: '🎓'
            });
        }
        
        // Skills
        if (!profileData.skills || profileData.skills.length < 5) {
            suggestions.push({ 
                type: 'warning', 
                text: `Agrega más habilidades (tienes ${profileData.skills?.length || 0}, recomendado: 5-10)`,
                icon: '⚡'
            });
        }
        
        return suggestions;
    },
    
    /**
     * Renderizar el score en la UI
     */
    renderScore(profileData) {
        const score = this.calculateScore(profileData);
        const suggestions = this.getSuggestions(profileData, score);
        
        // Buscar o crear contenedor
        let container = document.getElementById('cvQualityScore');
        
        if (!container) {
            // Crear e insertar antes de la vista previa
            const preview = document.getElementById('extractedDataPreview');
            if (!preview) return;
            
            container = document.createElement('div');
            container.id = 'cvQualityScore';
            container.className = 'w-full max-w-4xl mx-auto mb-6 hidden';
            preview.parentNode.insertBefore(container, preview);
        }
        
        // Determinar color y mensaje según score
        let scoreColor, scoreLabel, scoreMessage;
        if (score >= 80) {
            scoreColor = 'var(--success-green, #10b981)';
            scoreLabel = 'Excelente';
            scoreMessage = '¡Tu CV está muy completo!';
        } else if (score >= 60) {
            scoreColor = 'var(--primary, #9359f8)';
            scoreLabel = 'Bueno';
            scoreMessage = 'Tu CV está bien, pero puede mejorar';
        } else if (score >= 40) {
            scoreColor = 'var(--warning-orange, #fbbf24)';
            scoreLabel = 'Regular';
            scoreMessage = 'Completa más información para destacar';
        } else {
            scoreColor = 'var(--danger-red, #ef4444)';
            scoreLabel = 'Incompleto';
            scoreMessage = 'Tu CV necesita más información';
        }
        
        // Renderizar HTML
        container.innerHTML = `
            <div class="quality-score glass-panel p-6 rounded-2xl border border-white/10">
                <div class="flex items-center gap-6 mb-4">
                    <div class="score-circle" style="--score: ${score}">
                        <div class="score-value">${score}</div>
                    </div>
                    <div class="flex-1">
                        <h5 class="text-lg font-bold text-white mb-1">
                            Score de Calidad: <span style="color: ${scoreColor}">${scoreLabel}</span>
                        </h5>
                        <p class="text-sm text-gray-400">${scoreMessage}</p>
                    </div>
                </div>
                
                ${suggestions.length > 0 ? `
                    <div class="suggestions-list mt-4 pt-4 border-t border-white/10">
                        <h6 class="text-xs font-bold text-gray-400 uppercase mb-3">Sugerencias para mejorar:</h6>
                        <div class="space-y-2">
                            ${suggestions.map(s => `
                                <div class="flex items-start gap-3 text-sm">
                                    <span class="text-lg">${s.icon}</span>
                                    <span class="text-gray-300">${s.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Mostrar
        container.classList.remove('hidden');
        
        return score;
    }
};

// Exponer globalmente
window.CVQualityScore = CVQualityScore;
