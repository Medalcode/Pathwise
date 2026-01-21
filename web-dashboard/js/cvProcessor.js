/**
 * CV Processor Module
 * Maneja la lógica de carga, parseo y manipulación de datos del CV
 */

const CVProcessor = {
    /**
     * Inicializar listeners de carga
     */
    setupUpload() {
      const uploadArea = document.getElementById('uploadArea');
      const fileInput = document.getElementById('cvFile');
      
      if(!uploadArea || !fileInput) return;

      // Click to upload
      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });
      
      // Drag and drop with enhanced visual feedback
      let dragCounter = 0;
      
      uploadArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        uploadArea.classList.add('drag-active');
      });
      
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });
      
      uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
          uploadArea.classList.remove('drag-active');
        }
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        uploadArea.classList.remove('drag-active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileUpload(files[0]);
        }
      });
      
      // File input change
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    },

    /**
     * Manejar la subida de un archivo
     */
    async handleFileUpload(file) {
      if (!file.type.includes('pdf')) {
        showToast(window.t('only_pdf_allowed'), 'error');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showToast(window.t('file_too_large'), 'error');
        return;
      }
      
      // Validate PDF content
      if (window.PDFValidator) {
        showToast('Validando PDF...', 'info');
        const validation = await window.PDFValidator.validatePDFContent(file);
        
        if (!window.PDFValidator.showValidationResults(validation)) {
          return; // Stop if validation failed
        }
        
        // Store validation info for later use
        this.lastValidation = validation;
      }
      
      // Show progress
      const uploadArea = document.getElementById('uploadArea');
      const uploadProgress = document.getElementById('uploadProgress');
      
      if(uploadArea) uploadArea.classList.add('hidden');
      if(uploadProgress) uploadProgress.classList.remove('hidden');
      
      try {
        // Processing steps with visual feedback
        const steps = [
          { name: 'Leyendo PDF', progress: 0, duration: 500 },
          { name: 'Extrayendo texto', progress: 33, duration: 600 },
          { name: 'Analizando estructura', progress: 66, duration: 400 },
          { name: 'Completando datos', progress: 100, duration: 500 }
        ];
        
        // Update progress text element if exists
        const progressText = document.querySelector('#uploadProgress p');
        
        for (const step of steps) {
          if (progressText) {
            progressText.textContent = step.name + '...';
            progressText.classList.add('animate-pulse');
          }
          
          this.animateProgress(step.progress, step.progress + 25, step.duration);
          await new Promise(resolve => setTimeout(resolve, step.duration));
          
          if (progressText) {
            progressText.classList.remove('animate-pulse');
          }
        }
        
        // REAL PDF PROCESSING con PDF.js
        let result;
        
        if (window.RealPDFParser && typeof pdfjsLib !== 'undefined') {
          try {
            console.log('🤖 Procesando PDF con IA real...');
            const parsedData = await window.RealPDFParser.parseCV(file);
            
            result = {
              data: parsedData,
              method: 'real'
            };
            
            console.log('✅ PDF procesado con éxito:', parsedData);
          } catch (error) {
            console.warn('⚠️ Error en procesamiento real, usando fallback:', error);
            // Fallback a mock si falla
            result = this.getMockResult();
            result.method = 'mock';
          }
        } else {
          console.log('📝 Usando modo mock (PDF.js no disponible)');
          result = this.getMockResult();
          result.method = 'mock';
        }
        
        setTimeout(() => {
          // Hide progress
          if(uploadProgress) uploadProgress.classList.add('hidden');
          
          // Show extracted data preview
          if(typeof showExtractedDataPreview === 'function') {
             showExtractedDataPreview(result.data);
          }
          
          const methodMsg = result.method === 'real' ? 
            '(Procesado con IA)' : '(Modo Offline - Mock)';
          showToast(window.t('cv_processed_success') + ' ' + methodMsg, 'success');
        }, 500);
        
      } catch (error) {
        console.error('Error:', error);
        if(uploadProgress) uploadProgress.classList.add('hidden');
        if(uploadArea) uploadArea.classList.remove('hidden');
        showToast(window.t('error_processing_cv'), 'error');
      }
    },

    animateProgress(from, to, duration) {
      const progressFill = document.getElementById('progressFill');
      if(!progressFill) return;

      const startTime = Date.now();
      
      function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = from + (to - from) * progress;
        
        progressFill.style.width = current + '%';
        
        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }
      
      update();
    },

    /**
     * Obtener resultado mock (fallback)
     */
    getMockResult() {
      return {
        data: {
          personalInfo: {
            firstName: "Usuario",
            lastName: "Demo",
            email: "usuario@demo.local",
            phone: "+56912345678",
            currentTitle: "Desarrollador Full Stack",
            city: "Santiago",
            country: "Chile",
            linkedin: "",
            summary: "Perfil generado en modo demo sin procesamiento real."
          },
          experience: [],
          education: [],
          skills: ["JavaScript", "React", "Node.js"]
        }
      };
    },

    /**
     * Renderiza un campo de experiencia dinámico
     */
    addExperienceField(data = null) {
        const container = document.getElementById('experienceContainer');
        if (!container) return;
    
        const id = Date.now() + Math.random().toString(36).substr(2, 5);
        const item = document.createElement('div');
        item.className = 'glass-panel p-4 rounded-lg mb-4 border border-white/10 relative group';
        item.id = `exp-${id}`;
        
        // Valores predeterminados
        const title = data ? data.title || '' : '';
        const company = data ? data.company || '' : '';
        const startDate = data ? data.startDate || '' : '';
        const endDate = data ? data.endDate || '' : '';
        const current = data ? data.current || false : false;
        const desc = data ? data.description || '' : '';
    
        const t = window.t || (k => k); // Fallback
    
        item.innerHTML = `
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" class="text-red-400 hover:text-red-300" onclick="CVProcessor.removeDynamicItem('exp-${id}')">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-xs text-gray-500 uppercase">${t('job_title')}</label>
                    <input type="text" name="exp_title_${id}" value="${title}" placeholder="Ej: Senior Dev" class="glass-input">
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase">${t('company')}</label>
                    <input type="text" name="exp_company_${id}" value="${company}" placeholder="Ej: Tech Corp" class="glass-input">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label class="text-xs text-gray-500 uppercase">${t('start_date')}</label>
                    <input type="text" name="exp_start_${id}" value="${startDate}" placeholder="YYYY-MM" class="glass-input">
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase">${t('end_date')}</label>
                    <div class="flex flex-col gap-2">
                        <input type="text" name="exp_end_${id}" value="${endDate}" placeholder="YYYY-MM" class="glass-input" ${current ? 'disabled' : ''}>
                        <label class="flex items-center gap-2 text-xs text-gray-400">
                            <input type="checkbox" name="exp_current_${id}" ${current ? 'checked' : ''} onchange="CVProcessor.toggleEndDate(this, 'exp_end_${id}')" class="rounded bg-gray-700 border-gray-600">
                            ${t('currently')}
                        </label>
                    </div>
                </div>
            </div>
            <div>
                <label class="text-xs text-gray-500 uppercase">${t('description')}</label>
                <textarea name="exp_desc_${id}" rows="2" class="glass-input">${desc}</textarea>
            </div>
        `;
        
        container.appendChild(item);
    },

    addEducationField(data = null) {
        const container = document.getElementById('educationContainer');
        if (!container) return;
    
        const id = Date.now() + Math.random().toString(36).substr(2, 5);
        const item = document.createElement('div');
        item.className = 'glass-panel p-4 rounded-lg mb-4 border border-white/10 relative group';
        item.id = `edu-${id}`;
        
        const degree = data ? data.degree || '' : '';
        const school = data ? data.school || '' : '';
        const start = data ? data.startDate || '' : '';
        const end = data ? data.endDate || '' : '';
    
        const t = window.t || (k => k);
    
        item.innerHTML = `
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" class="text-red-400 hover:text-red-300" onclick="CVProcessor.removeDynamicItem('edu-${id}')">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-xs text-gray-500 uppercase">${t('degree')}</label>
                    <input type="text" name="edu_degree_${id}" value="${degree}" class="glass-input">
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase">${t('institution')}</label>
                    <input type="text" name="edu_school_${id}" value="${school}" class="glass-input">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="text-xs text-gray-500 uppercase">${t('start_date')}</label>
                    <input type="text" name="edu_start_${id}" value="${start}" class="glass-input">
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase">${t('end_date')}</label>
                    <input type="text" name="edu_end_${id}" value="${end}" class="glass-input">
                </div>
            </div>
        `;
        container.appendChild(item);
    },

    removeDynamicItem(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    },

    toggleEndDate(checkbox, targetId) {
        const input = document.querySelector(`input[name="${targetId}"]`);
        if(input) {
        input.disabled = checkbox.checked;
            if(checkbox.checked) input.value = 'Presente';
        }
    }
};

// Exponer globalmente
window.CVProcessor = CVProcessor;
