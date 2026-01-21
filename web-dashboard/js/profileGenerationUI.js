/**
 * Profile Generation UI Manager
 * Maneja animaciones y preview de generación de perfiles
 */

const ProfileGenerationUI = {
    /**
     * Mostrar animación de generación
     */
    showGenerating(profileType) {
        const container = document.getElementById('profileGenerationContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="generating-container">
                <div class="generating-animation">
                    <div class="generating-circle"></div>
                    <div class="generating-particles">
                        <div class="particle"></div>
                        <div class="particle"></div>
                        <div class="particle"></div>
                        <div class="particle"></div>
                    </div>
                </div>
                
                <div class="generating-text">Generando Perfil ${profileType}</div>
                <div class="generating-subtext">Optimizando tu CV con IA...</div>
                
                <div class="generating-progress">
                    <div class="generating-progress-bar"></div>
                </div>
                
                <div class="generating-stats">
                    <span id="generatingTokens">0 tokens</span>
                    <span>•</span>
                    <span id="generatingTime">0s</span>
                </div>
            </div>
        `;
        
        // Animar estadísticas
        this.animateStats();
    },
    
    /**
     * Animar estadísticas de generación
     */
    animateStats() {
        let tokens = 0;
        let seconds = 0;
        
        const tokenInterval = setInterval(() => {
            tokens += Math.floor(Math.random() * 50) + 10;
            const tokensEl = document.getElementById('generatingTokens');
            if (tokensEl) {
                tokensEl.textContent = `${tokens} tokens`;
            } else {
                clearInterval(tokenInterval);
            }
        }, 200);
        
        const timeInterval = setInterval(() => {
            seconds++;
            const timeEl = document.getElementById('generatingTime');
            if (timeEl) {
                timeEl.textContent = `${seconds}s`;
            } else {
                clearInterval(timeInterval);
            }
        }, 1000);
        
        // Guardar para limpiar después
        this.intervals = { tokenInterval, timeInterval };
    },
    
    /**
     * Limpiar intervalos
     */
    clearIntervals() {
        if (this.intervals) {
            clearInterval(this.intervals.tokenInterval);
            clearInterval(this.intervals.timeInterval);
        }
    },
    
    /**
     * Mostrar preview del perfil generado
     */
    showPreview(profile, profileType, fromCache = false) {
        this.clearIntervals();
        
        const container = document.getElementById('profileGenerationContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="preview-panel">
                <div class="preview-header">
                    <div class="preview-title">
                        <span class="material-symbols-outlined">visibility</span>
                        Preview: ${profileType}
                        ${fromCache ? '<span class="cache-indicator"><span class="material-symbols-outlined">bolt</span>Desde caché</span>' : ''}
                    </div>
                    <div class="preview-actions">
                        <button class="preview-action-btn" onclick="ProfileGenerationUI.copyToClipboard()">
                            <span class="material-symbols-outlined" style="font-size: 14px">content_copy</span>
                            Copiar
                        </button>
                        <button class="preview-action-btn" onclick="ProfileGenerationUI.regenerate()">
                            <span class="material-symbols-outlined" style="font-size: 14px">refresh</span>
                            Regenerar
                        </button>
                    </div>
                </div>
                
                <div class="preview-content">
                    ${this.renderProfileContent(profile)}
                </div>
                
                <div class="mt-4 flex justify-end gap-3">
                    <button onclick="ProfileGenerationUI.closePreview()" class="px-4 py-2 rounded-lg border border-white/10 hover:border-primary/50 text-white transition-all">
                        Cancelar
                    </button>
                    <button onclick="ProfileGenerationUI.applyProfile()" class="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-[0_0_15px_rgba(147,89,248,0.4)] transition-all">
                        Aplicar Perfil
                    </button>
                </div>
            </div>
        `;
        
        // Guardar perfil actual para aplicar
        this.currentProfile = profile;
        this.currentProfileType = profileType;
    },
    
    /**
     * Renderizar contenido del perfil
     */
    renderProfileContent(profile) {
        let html = '';
        
        if (profile.title) {
            html += `
                <div class="preview-section">
                    <div class="preview-section-title">Título Profesional</div>
                    <div class="preview-section-content">${profile.title}</div>
                </div>
            `;
        }
        
        if (profile.summary) {
            html += `
                <div class="preview-section">
                    <div class="preview-section-title">Resumen</div>
                    <div class="preview-section-content">${profile.summary}</div>
                </div>
            `;
        }
        
        if (profile.keySkills && profile.keySkills.length > 0) {
            html += `
                <div class="preview-section">
                    <div class="preview-section-title">Habilidades Clave</div>
                    <div class="preview-section-content">
                        <div class="flex flex-wrap gap-2">
                            ${profile.keySkills.map(skill => `
                                <span class="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm border border-primary/30">
                                    ${skill}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (profile.description) {
            html += `
                <div class="preview-section">
                    <div class="preview-section-title">Descripción</div>
                    <div class="preview-section-content">${profile.description}</div>
                </div>
            `;
        }
        
        return html || '<p class="text-gray-400">No hay contenido para mostrar</p>';
    },
    
    /**
     * Copiar al portapapeles
     */
    async copyToClipboard() {
        if (!this.currentProfile) return;
        
        const text = `
${this.currentProfile.title || ''}

${this.currentProfile.summary || ''}

Habilidades Clave:
${(this.currentProfile.keySkills || []).join(', ')}

${this.currentProfile.description || ''}
        `.trim();
        
        try {
            await navigator.clipboard.writeText(text);
            showToast('✓ Perfil copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Error copying:', error);
            showToast('Error al copiar', 'error');
        }
    },
    
    /**
     * Regenerar perfil
     */
    regenerate() {
        if (!this.currentProfileType) return;
        
        // Limpiar caché para este perfil
        if (window.currentProfile && window.ProfileCache) {
            window.ProfileCache.delete(window.currentProfile, this.currentProfileType);
        }
        
        // Regenerar
        if (typeof generateProfile === 'function') {
            generateProfile(this.currentProfileType);
        }
    },
    
    /**
     * Aplicar perfil
     */
    applyProfile() {
        if (!this.currentProfile) return;
        
        // Aplicar el perfil al currentProfile
        if (window.currentProfile) {
            window.currentProfile.personalInfo = window.currentProfile.personalInfo || {};
            
            if (this.currentProfile.title) {
                window.currentProfile.personalInfo.currentTitle = this.currentProfile.title;
            }
            
            if (this.currentProfile.summary) {
                window.currentProfile.personalInfo.summary = this.currentProfile.summary;
            }
            
            // Guardar
            const profileId = window.currentProfile.id || 'default';
            localStorage.setItem(`panoptes_profile_data_${profileId}`, JSON.stringify(window.currentProfile));
            
            showToast('✓ Perfil aplicado correctamente', 'success');
            
            // Cerrar preview
            this.closePreview();
            
            // Avanzar al siguiente paso
            if (typeof goToStep === 'function') {
                goToStep(4);
            }
        }
    },
    
    /**
     * Cerrar preview
     */
    closePreview() {
        this.clearIntervals();
        const container = document.getElementById('profileGenerationContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.currentProfile = null;
        this.currentProfileType = null;
    },
    
    /**
     * Mostrar comparación
     */
    showComparison(original, generated) {
        const container = document.getElementById('profileComparisonContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="comparison-view">
                <div class="comparison-column">
                    <div class="comparison-column-header">Original</div>
                    <div class="preview-content">
                        ${this.renderProfileContent(original)}
                    </div>
                </div>
                <div class="comparison-column">
                    <div class="comparison-column-header">Generado</div>
                    <div class="preview-content">
                        ${this.renderProfileContent(generated)}
                    </div>
                </div>
            </div>
        `;
    }
};

// Exponer globalmente
window.ProfileGenerationUI = ProfileGenerationUI;
