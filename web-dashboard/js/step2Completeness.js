/**
 * Step 2 Completeness Tracker
 * Calcula y muestra el score de completitud del perfil en verificación
 */

const Step2Completeness = {
    requiredFields: {
        personalInfo: ['firstName', 'lastName', 'email'],
        experience: ['title', 'company'],
        education: ['degree', 'school']
    },
    
    optionalFields: {
        personalInfo: ['phone', 'currentTitle', 'city', 'country', 'linkedin', 'summary'],
        experience: ['startDate', 'endDate', 'description'],
        education: ['startDate', 'endDate', 'field']
    },
    
    /**
     * Calcular completitud total
     */
    calculateCompleteness() {
        const profile = window.currentProfile || {};
        let totalFields = 0;
        let filledFields = 0;
        
        // Personal Info
        const personalInfo = profile.personalInfo || {};
        this.requiredFields.personalInfo.forEach(field => {
            totalFields += 2; // Required fields count double
            if (personalInfo[field] && personalInfo[field].trim()) {
                filledFields += 2;
            }
        });
        
        this.optionalFields.personalInfo.forEach(field => {
            totalFields += 1;
            if (personalInfo[field] && personalInfo[field].trim()) {
                filledFields += 1;
            }
        });
        
        // Experience
        if (profile.experience && profile.experience.length > 0) {
            filledFields += 5; // Bonus for having experience
            totalFields += 5;
            
            profile.experience.forEach(exp => {
                this.requiredFields.experience.forEach(field => {
                    totalFields += 1;
                    if (exp[field] && exp[field].trim()) {
                        filledFields += 1;
                    }
                });
            });
        } else {
            totalFields += 5;
        }
        
        // Education
        if (profile.education && profile.education.length > 0) {
            filledFields += 3; // Bonus for having education
            totalFields += 3;
            
            profile.education.forEach(edu => {
                this.requiredFields.education.forEach(field => {
                    totalFields += 1;
                    if (edu[field] && edu[field].trim()) {
                        filledFields += 1;
                    }
                });
            });
        } else {
            totalFields += 3;
        }
        
        // Skills
        if (profile.skills && profile.skills.length > 0) {
            const skillScore = Math.min(profile.skills.length, 10);
            filledFields += skillScore;
            totalFields += 10;
        } else {
            totalFields += 10;
        }
        
        const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
        
        return {
            percentage,
            filledFields,
            totalFields,
            sections: this.calculateSectionCompleteness(profile)
        };
    },
    
    /**
     * Calcular completitud por sección
     */
    calculateSectionCompleteness(profile) {
        const sections = {};
        
        // Personal Info
        let personalTotal = 0;
        let personalFilled = 0;
        const personalInfo = profile.personalInfo || {};
        
        [...this.requiredFields.personalInfo, ...this.optionalFields.personalInfo].forEach(field => {
            personalTotal++;
            if (personalInfo[field] && personalInfo[field].trim()) {
                personalFilled++;
            }
        });
        
        sections.personalInfo = {
            percentage: personalTotal > 0 ? Math.round((personalFilled / personalTotal) * 100) : 0,
            filled: personalFilled,
            total: personalTotal
        };
        
        // Experience
        let expTotal = 0;
        let expFilled = 0;
        
        if (profile.experience && profile.experience.length > 0) {
            profile.experience.forEach(exp => {
                [...this.requiredFields.experience, ...this.optionalFields.experience].forEach(field => {
                    expTotal++;
                    if (exp[field] && exp[field].trim()) {
                        expFilled++;
                    }
                });
            });
        }
        
        sections.experience = {
            percentage: expTotal > 0 ? Math.round((expFilled / expTotal) * 100) : 0,
            filled: expFilled,
            total: expTotal,
            count: profile.experience ? profile.experience.length : 0
        };
        
        // Education
        let eduTotal = 0;
        let eduFilled = 0;
        
        if (profile.education && profile.education.length > 0) {
            profile.education.forEach(edu => {
                [...this.requiredFields.education, ...this.optionalFields.education].forEach(field => {
                    eduTotal++;
                    if (edu[field] && edu[field].trim()) {
                        eduFilled++;
                    }
                });
            });
        }
        
        sections.education = {
            percentage: eduTotal > 0 ? Math.round((eduFilled / eduTotal) * 100) : 0,
            filled: eduFilled,
            total: eduTotal,
            count: profile.education ? profile.education.length : 0
        };
        
        // Skills
        const skillsCount = profile.skills ? profile.skills.length : 0;
        sections.skills = {
            percentage: Math.min(skillsCount * 10, 100),
            count: skillsCount
        };
        
        return sections;
    },
    
    /**
     * Renderizar score de completitud
     */
    renderCompletenessScore() {
        const completeness = this.calculateCompleteness();
        let container = document.getElementById('step2CompletenessScore');
        
        if (!container) {
            const step2Content = document.getElementById('step2-content');
            if (!step2Content) return;
            
            container = document.createElement('div');
            container.id = 'step2CompletenessScore';
            container.className = 'mb-6';
            step2Content.insertBefore(container, step2Content.firstChild);
        }
        
        // Determinar color y mensaje
        let statusColor, statusText;
        if (completeness.percentage >= 90) {
            statusColor = 'var(--success-green, #10b981)';
            statusText = '¡Excelente!';
        } else if (completeness.percentage >= 70) {
            statusColor = 'var(--primary, #9359f8)';
            statusText = 'Muy bien';
        } else if (completeness.percentage >= 50) {
            statusColor = 'var(--warning-orange, #fbbf24)';
            statusText = 'Buen progreso';
        } else {
            statusColor = 'var(--danger-red, #ef4444)';
            statusText = 'Necesita más datos';
        }
        
        container.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-white/10">
                <div class="flex items-center gap-8">
                    <div class="completeness-circle" style="--completeness: ${completeness.percentage}">
                        <div class="completeness-value">${completeness.percentage}%</div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-white mb-2">
                            Completitud del Perfil: <span style="color: ${statusColor}">${statusText}</span>
                        </h3>
                        <p class="text-sm text-gray-400 mb-4">
                            ${completeness.filledFields} de ${completeness.totalFields} campos completados
                        </p>
                        ${this.renderSectionProgress(completeness.sections)}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar progreso por sección
     */
    renderSectionProgress(sections) {
        return `
            <div class="space-y-3">
                <div class="section-progress">
                    <span class="text-xs text-gray-400 w-24">Personal</span>
                    <div class="section-progress-bar">
                        <div class="section-progress-fill" style="width: ${sections.personalInfo.percentage}%"></div>
                    </div>
                    <span class="section-progress-text">${sections.personalInfo.filled}/${sections.personalInfo.total}</span>
                </div>
                <div class="section-progress">
                    <span class="text-xs text-gray-400 w-24">Experiencia</span>
                    <div class="section-progress-bar">
                        <div class="section-progress-fill" style="width: ${sections.experience.percentage}%"></div>
                    </div>
                    <span class="section-progress-text">${sections.experience.count} items</span>
                </div>
                <div class="section-progress">
                    <span class="text-xs text-gray-400 w-24">Educación</span>
                    <div class="section-progress-bar">
                        <div class="section-progress-fill" style="width: ${sections.education.percentage}%"></div>
                    </div>
                    <span class="section-progress-text">${sections.education.count} items</span>
                </div>
                <div class="section-progress">
                    <span class="text-xs text-gray-400 w-24">Habilidades</span>
                    <div class="section-progress-bar">
                        <div class="section-progress-fill" style="width: ${sections.skills.percentage}%"></div>
                    </div>
                    <span class="section-progress-text">${sections.skills.count} skills</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Actualizar score (llamar cuando cambian datos)
     */
    update() {
        this.renderCompletenessScore();
    }
};

// Exponer globalmente
window.Step2Completeness = Step2Completeness;
