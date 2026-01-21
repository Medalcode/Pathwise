/**
 * Step 2 Auto-Save Manager
 * Guardado automático de cambios en el Paso 2
 */

const Step2AutoSave = {
    saveInterval: 30000, // 30 segundos
    debounceDelay: 3000, // 3 segundos después del último cambio
    autoSaveTimer: null,
    debounceTimer: null,
    lastSavedData: null,
    isSaving: false,
    
    /**
     * Inicializar auto-save
     */
    init() {
        console.log('💾 Inicializando auto-save para Paso 2...');
        
        // Guardar datos iniciales
        this.lastSavedData = this.getCurrentData();
        
        // Iniciar timer de auto-save periódico
        this.startPeriodicAutoSave();
        
        // Mostrar indicador
        this.renderIndicator();
        
        console.log(`✅ Auto-save configurado (cada ${this.saveInterval / 1000}s)`);
    },
    
    /**
     * Iniciar auto-save periódico
     */
    startPeriodicAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.performAutoSave();
        }, this.saveInterval);
    },
    
    /**
     * Programar auto-save (debounced)
     */
    scheduleAutoSave() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.performAutoSave();
        }, this.debounceDelay);
    },
    
    /**
     * Realizar auto-save
     */
    async performAutoSave() {
        const currentData = this.getCurrentData();
        
        // Verificar si hay cambios
        if (JSON.stringify(currentData) === JSON.stringify(this.lastSavedData)) {
            console.log('💾 No hay cambios para guardar');
            return;
        }
        
        // Mostrar indicador de guardando
        this.updateIndicator('saving');
        this.isSaving = true;
        
        try {
            // Guardar en localStorage
            if (window.currentProfile) {
                window.currentProfile = {
                    ...window.currentProfile,
                    ...currentData,
                    lastModified: new Date().toISOString()
                };
                
                const profileId = window.currentProfile.id || 'default';
                localStorage.setItem(`panoptes_profile_data_${profileId}`, JSON.stringify(window.currentProfile));
                
                // Actualizar ProfilesManager si existe
                if (window.ProfilesManager) {
                    window.ProfilesManager.updateProfileUI();
                }
            }
            
            // Actualizar último guardado
            this.lastSavedData = currentData;
            
            // Mostrar indicador de guardado
            this.updateIndicator('saved');
            
            console.log('✅ Auto-save completado');
            
            // Volver a estado normal después de 2s
            setTimeout(() => {
                this.updateIndicator('idle');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error en auto-save:', error);
            this.updateIndicator('error');
            
            setTimeout(() => {
                this.updateIndicator('idle');
            }, 3000);
        } finally {
            this.isSaving = false;
        }
    },
    
    /**
     * Obtener datos actuales del formulario
     */
    getCurrentData() {
        const data = {
            personalInfo: {},
            experience: [],
            education: [],
            skills: []
        };
        
        // Personal Info
        const personalFields = document.querySelectorAll('[id^="verify-"]');
        personalFields.forEach(field => {
            const fieldName = field.id.replace('verify-', '');
            if (field.value && field.value.trim()) {
                data.personalInfo[fieldName] = field.value.trim();
            }
        });
        
        // Experience (si existe en currentProfile)
        if (window.currentProfile && window.currentProfile.experience) {
            data.experience = window.currentProfile.experience;
        }
        
        // Education (si existe en currentProfile)
        if (window.currentProfile && window.currentProfile.education) {
            data.education = window.currentProfile.education;
        }
        
        // Skills (si existe en currentProfile)
        if (window.currentProfile && window.currentProfile.skills) {
            data.skills = window.currentProfile.skills;
        }
        
        return data;
    },
    
    /**
     * Renderizar indicador de auto-save
     */
    renderIndicator() {
        let indicator = document.getElementById('autoSaveIndicator');
        
        if (!indicator) {
            const step2Content = document.getElementById('step2-content');
            if (!step2Content) return;
            
            // Buscar el header o crear uno
            let header = step2Content.querySelector('.flex.justify-between');
            if (!header) {
                header = document.createElement('div');
                header.className = 'flex justify-between items-center mb-4';
                step2Content.insertBefore(header, step2Content.firstChild);
            }
            
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.className = 'auto-save-indicator';
            header.appendChild(indicator);
        }
        
        this.updateIndicator('idle');
    },
    
    /**
     * Actualizar indicador
     */
    updateIndicator(state) {
        const indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) return;
        
        indicator.className = 'auto-save-indicator';
        
        if (state === 'saving') {
            indicator.classList.add('saving');
            indicator.innerHTML = `
                <div class="spinner"></div>
                <span>Guardando...</span>
            `;
        } else if (state === 'saved') {
            indicator.classList.add('saved');
            indicator.innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 14px">check_circle</span>
                <span>Guardado</span>
            `;
        } else if (state === 'error') {
            indicator.innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 14px">error</span>
                <span>Error al guardar</span>
            `;
        } else {
            indicator.innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 14px">cloud</span>
                <span>Auto-save activo</span>
            `;
        }
    },
    
    /**
     * Forzar guardado manual
     */
    forceSave() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.performAutoSave();
    },
    
    /**
     * Detener auto-save
     */
    stop() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        console.log('💾 Auto-save detenido');
    }
};

// Exponer globalmente
window.Step2AutoSave = Step2AutoSave;
