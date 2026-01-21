/**
 * Auto-Save Manager
 * Maneja el guardado automático y recuperación de borradores
 */

const AutoSaveManager = {
  autoSaveInterval: null,
  autoSaveDelay: 30000, // 30 segundos
  lastSaveTime: null,
  hasUnsavedChanges: false,
  currentData: null,

  /**
   * Inicializar auto-save
   */
  init() {
    console.log('🔄 Inicializando AutoSaveManager...');
    
    // Recuperar borrador al cargar
    this.recoverDraft();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Iniciar auto-save
    this.startAutoSave();
    
    // Guardar antes de salir
    this.setupBeforeUnload();
    
    console.log('✅ AutoSaveManager inicializado');
  },

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Detectar cambios en formularios
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea, select')) {
        this.markAsChanged();
      }
    });

    // Detectar cambios en datos extraídos
    window.addEventListener('profileChanged', () => {
      this.markAsChanged();
    });
  },

  /**
   * Marcar como cambiado
   */
  markAsChanged() {
    this.hasUnsavedChanges = true;
    this.updateSaveIndicator('unsaved');
  },

  /**
   * Iniciar auto-save periódico
   */
  startAutoSave() {
    // Limpiar intervalo existente
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // Crear nuevo intervalo
    this.autoSaveInterval = setInterval(() => {
      if (this.hasUnsavedChanges) {
        this.saveDraft();
      }
    }, this.autoSaveDelay);

    console.log(`✅ Auto-save iniciado (cada ${this.autoSaveDelay / 1000}s)`);
  },

  /**
   * Detener auto-save
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏸️ Auto-save detenido');
    }
  },

  /**
   * Guardar borrador en localStorage
   */
  saveDraft() {
    try {
      const draftData = this.collectCurrentData();
      
      if (!draftData) {
        console.log('⚠️ No hay datos para guardar');
        return;
      }

      // Guardar en localStorage
      const draft = {
        data: draftData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      localStorage.setItem('autoapply_draft', JSON.stringify(draft));
      
      this.hasUnsavedChanges = false;
      this.lastSaveTime = new Date();
      this.updateSaveIndicator('saved');

      console.log('💾 Borrador guardado:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error guardando borrador:', error);
      this.updateSaveIndicator('error');
    }
  },

  /**
   * Recopilar datos actuales del formulario
   */
  collectCurrentData() {
    // Intentar obtener datos de extractedData si existe
    if (typeof window.extractedData !== 'undefined' && window.extractedData) {
      return {
        source: 'extracted',
        data: window.extractedData
      };
    }

    // Intentar obtener datos del perfil actual
    if (typeof currentProfile !== 'undefined' && currentProfile) {
      return {
        source: 'profile',
        data: currentProfile
      };
    }

    // Recopilar datos del formulario visible
    const formData = this.collectFormData();
    if (formData && Object.keys(formData).length > 0) {
      return {
        source: 'form',
        data: formData
      };
    }

    return null;
  },

  /**
   * Recopilar datos del formulario
   */
  collectFormData() {
    const data = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: []
    };

    // Información personal
    const personalFields = [
      'firstName', 'lastName', 'email', 'phone',
      'currentTitle', 'city', 'country', 'linkedin'
    ];

    personalFields.forEach(field => {
      const element = document.getElementById(`extracted-${field}`) || 
                     document.getElementById(field);
      if (element && element.value) {
        data.personalInfo[field] = element.value;
      }
    });

    // Solo retornar si hay datos
    if (Object.keys(data.personalInfo).length === 0) {
      return null;
    }

    return data;
  },

  /**
   * Recuperar borrador de localStorage
   */
  recoverDraft() {
    try {
      const draftStr = localStorage.getItem('autoapply_draft');
      
      if (!draftStr) {
        console.log('ℹ️ No hay borrador guardado');
        return;
      }

      const draft = JSON.parse(draftStr);
      const draftDate = new Date(draft.timestamp);
      const now = new Date();
      const hoursSinceLastSave = (now - draftDate) / (1000 * 60 * 60);

      // Solo recuperar si es reciente (menos de 24 horas)
      if (hoursSinceLastSave > 24) {
        console.log('⚠️ Borrador muy antiguo, ignorando');
        this.clearDraft();
        return;
      }

      // Preguntar al usuario si quiere recuperar
      this.showRecoveryPrompt(draft);

    } catch (error) {
      console.error('❌ Error recuperando borrador:', error);
      this.clearDraft();
    }
  },

  /**
   * Mostrar prompt de recuperación
   */
  showRecoveryPrompt(draft) {
    const draftDate = new Date(draft.timestamp);
    const timeAgo = this.getTimeAgo(draftDate);

    // Crear toast de recuperación
    const recoveryToast = document.createElement('div');
    recoveryToast.className = 'recovery-toast';
    recoveryToast.innerHTML = `
      <div class="recovery-toast-content">
        <h4>📝 Borrador encontrado</h4>
        <p>Hay un borrador guardado hace ${timeAgo}</p>
        <div class="recovery-toast-actions">
          <button class="btn btn-primary" id="recoverDraftBtn">Recuperar</button>
          <button class="btn btn-secondary" id="discardDraftBtn">Descartar</button>
        </div>
      </div>
    `;

    document.body.appendChild(recoveryToast);

    // Event listeners
    document.getElementById('recoverDraftBtn').addEventListener('click', () => {
      this.applyDraft(draft);
      recoveryToast.remove();
    });

    document.getElementById('discardDraftBtn').addEventListener('click', () => {
      this.clearDraft();
      recoveryToast.remove();
    });

    // Auto-cerrar después de 30 segundos
    setTimeout(() => {
      if (document.body.contains(recoveryToast)) {
        recoveryToast.remove();
      }
    }, 30000);
  },

  /**
   * Aplicar borrador recuperado
   */
  applyDraft(draft) {
    try {
      console.log('📥 Aplicando borrador...');
      
      if (draft.data.source === 'extracted' && typeof extractedData !== 'undefined') {
        // Aplicar a datos extraídos
        Object.assign(extractedData, draft.data.data);
        
        // Re-renderizar si la función existe
        if (typeof setupExtractedDataPreview === 'function') {
          setupExtractedDataPreview();
        }
      } else if (draft.data.source === 'profile' && typeof populateForm === 'function') {
        // Aplicar a formulario
        populateForm(draft.data.data);
      }

      showToast('✅ Borrador recuperado exitosamente', 'success');
      console.log('✅ Borrador aplicado');
    } catch (error) {
      console.error('❌ Error aplicando borrador:', error);
      showToast('❌ Error recuperando borrador', 'error');
    }
  },

  /**
   * Limpiar borrador
   */
  clearDraft() {
    localStorage.removeItem('autoapply_draft');
    console.log('🗑️ Borrador eliminado');
  },

  /**
   * Actualizar indicador de guardado
   */
  updateSaveIndicator(status) {
    let indicator = document.getElementById('autoSaveIndicator');
    
    if (!indicator) {
      // Crear indicador si no existe
      indicator = document.createElement('div');
      indicator.id = 'autoSaveIndicator';
      indicator.className = 'auto-save-indicator';
      document.body.appendChild(indicator);
    }

    const icons = {
      'saved': '✓',
      'saving': '⟳',
      'unsaved': '●',
      'error': '✗'
    };

    const messages = {
      'saved': 'Guardado',
      'saving': 'Guardando...',
      'unsaved': 'Sin guardar',
      'error': 'Error al guardar'
    };

    indicator.className = `auto-save-indicator ${status}`;
    indicator.innerHTML = `
      <span class="indicator-icon">${icons[status]}</span>
      <span class="indicator-text">${messages[status]}</span>
      ${this.lastSaveTime ? `<span class="indicator-time">${this.getTimeAgo(this.lastSaveTime)}</span>` : ''}
    `;

    // Auto-ocultar después de 3 segundos si está guardado
    if (status === 'saved') {
      setTimeout(() => {
        indicator.classList.add('hidden');
      }, 3000);
    } else {
      indicator.classList.remove('hidden');
    }
  },

  /**
   * Obtener tiempo relativo
   */
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'hace un momento';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} días`;
  },

  /**
   * Configurar beforeunload
   */
  setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        // Guardar antes de salir
        this.saveDraft();
        
        // Mostrar confirmación
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });
  },

  /**
   * Forzar guardado manual
   */
  forceSave() {
    this.updateSaveIndicator('saving');
    this.saveDraft();
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AutoSaveManager.init();
  });
} else {
  AutoSaveManager.init();
}

// Exponer globalmente para uso manual
window.AutoSaveManager = AutoSaveManager;
