/**
 * CV Processor Module
 * Maneja la lógica de carga, parseo y manipulación de datos del CV
 */

const CVProcessor = {
    /**
     * Inicializar listeners de carga
     */
    setupUpload() {
      // Configurar vista partida dinámica para PDF
      this.setupSplitView();

      const uploadArea = document.getElementById('uploadArea');
      const fileInput = document.getElementById('cvFile');
      
      if(!uploadArea || !fileInput) return;
      
      // ... resto del código sin cambios ...
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
     * Configurar Split View (Dynamic DOM Injection)
     */
    setupSplitView() {
        const step1Content = document.getElementById('step1-content');
        if (!step1Content || document.getElementById('step1-grid-wrapper')) return;

        console.log('🏗️ Configurando Split View Layout...');

        // 1. Crear contenedores
        const gridWrapper = document.createElement('div');
        gridWrapper.id = 'step1-grid-wrapper';
        gridWrapper.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-500';
        
        const leftCol = document.createElement('div');
        leftCol.id = 'step1-left-col';
        leftCol.className = 'flex flex-col gap-6';
        
        const rightCol = document.createElement('div');
        rightCol.id = 'step1-right-col';
        rightCol.className = 'hidden lg:block h-[calc(100vh-140px)] sticky top-24 opacity-0 scale-95 transition-all duration-500';

        // 2. Mover contenido existente a leftCol
        while (step1Content.firstChild) {
            leftCol.appendChild(step1Content.firstChild);
        }

        // 3. Construir Visor PDF en rightCol
        rightCol.innerHTML = `
            <div class="glass-panel w-full h-full p-0 rounded-xl overflow-hidden flex flex-col border border-white/10 shadow-2xl bg-[#1e1e1e]">
                <!-- Toolbar -->
                <div class="flex justify-between items-center p-3 bg-black/20 backdrop-blur border-b border-white/5 z-10">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-sm">picture_as_pdf</span>
                        <span class="text-xs font-bold text-gray-300 uppercase tracking-widest">Document Source</span>
                    </div>
                    <div class="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                        <button onclick="CVProcessor.changePage(-1)" class="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <span id="pdf-page-num" class="text-xs font-mono text-white min-w-[20px] text-center">1</span>
                        <span class="text-xs text-gray-600">/</span>
                        <span id="pdf-page-count" class="text-xs font-mono text-gray-500">?</span>
                        <button onclick="CVProcessor.changePage(1)" class="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="CVProcessor.zoomPDF(0.1)" class="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                            <span class="material-symbols-outlined text-sm">add</span>
                        </button>
                         <button onclick="CVProcessor.zoomPDF(-0.1)" class="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                            <span class="material-symbols-outlined text-sm">remove</span>
                        </button>
                    </div>
                </div>
                
                <!-- Viewer Canvas Area -->
                <div class="flex-1 overflow-auto bg-[#0f0f0f] relative custom-scrollbar flex justify-center p-6" id="pdf-canvas-container">
                    <canvas id="the-canvas" class="shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform origin-top"></canvas>
                    <div id="pdf-loader" class="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20 hidden">
                         <div class="loading-spinner w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        `;

        // 4. Reensamblar DOM
        gridWrapper.appendChild(leftCol);
        gridWrapper.appendChild(rightCol);
        step1Content.appendChild(gridWrapper);
        
        // Inicializar estado PDF
        this.pdfState = {
            pdfDoc: null,
            pageNum: 1,
            pageRendering: false,
            pageNumPending: null,
            scale: 1.0,
            canvas: null,
            ctx: null
        };
    },

    /**
     * Renderizar PDF en el visor
     */
    async renderPDFPreview(file) {
        const rightCol = document.getElementById('step1-right-col');
        if (!rightCol) return;

        // Mostrar columna
        rightCol.classList.remove('opacity-0', 'scale-95');
        
        if (typeof pdfjsLib === 'undefined') return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            this.pdfState.pdfDoc = await loadingTask.promise;
            
            document.getElementById('pdf-page-count').textContent = this.pdfState.pdfDoc.numPages;
            this.pdfState.pageNum = 1;
            
            this.renderPage(this.pdfState.pageNum);
            
            // Ajustar layout de Upload Hero para ser más compacto ahora que está en columna
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                // Hacer el hero más pequeño si ya se cargó
                // uploadArea.classList.add('compact-mode'); 
                // O mejor, ocultarlo completamente como ya hacemos
            }
            
        } catch (error) {
            console.error('Error rendering PDF preview:', error);
        }
    },
    
    /**
     * Renderizar página específica del PDF
     */
    async renderPage(num) {
        const state = this.pdfState;
        state.pageRendering = true;
        
        // Show loader
        const loader = document.getElementById('pdf-loader');
        if(loader) loader.classList.remove('hidden');

        try {
            const page = await state.pdfDoc.getPage(num);
            
            const container = document.getElementById('pdf-canvas-container');
            const canvas = document.getElementById('the-canvas');
            const ctx = canvas.getContext('2d');
            state.canvas = canvas;
            state.ctx = ctx;

            // Calcular escala para ajustar al ancho del contenedor
            const containerWidth = container.clientWidth - 48; // padding
            const viewport = page.getViewport({ scale: 1.0 });
            const scale = containerWidth / viewport.width;
            state.scale = scale;
            
            const scaledViewport = page.getViewport({ scale: scale });

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };
            
            const renderTask = page.render(renderContext);

            await renderTask.promise;
            state.pageRendering = false;
            
            if (state.pageNumPending !== null) {
                this.renderPage(state.pageNumPending);
                state.pageNumPending = null;
            }
            
            // Update UI count
            document.getElementById('pdf-page-num').textContent = num;
            if(loader) loader.classList.add('hidden');
            
        } catch (err) {
            console.error(err);
             state.pageRendering = false;
             if(loader) loader.classList.add('hidden');
        }
    },

    /**
     * Paginación PDF
     */
    queueRenderPage(num) {
        if (this.pdfState.pageRendering) {
            this.pdfState.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    },

    changePage(offset) {
        if (!this.pdfState.pdfDoc) return;
        const newNum = this.pdfState.pageNum + offset;
        if (newNum >= 1 && newNum <= this.pdfState.pdfDoc.numPages) {
            this.pdfState.pageNum = newNum;
            this.queueRenderPage(this.pdfState.pageNum);
        }
    },
    
    zoomPDF(delta) {
         // Implementación futura de zoom
         // Por ahora solo ajusta al ancho automáticamente
         console.log('Zoom placeholder', delta);
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

      // Render PDF Preview (Split View)
      this.renderPDFPreview(file);
      
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

          // Mostrar Feedback ATS si existe
          if (result.data && result.data.atsAnalysis) {
              this.renderATSFeedback(result.data.atsAnalysis);
          }
        }, 500);
        
      } catch (error) {
        console.error('Error:', error);
        if(uploadProgress) uploadProgress.classList.add('hidden');
        if(uploadArea) uploadArea.classList.remove('hidden');
        showToast(window.t('error_processing_cv'), 'error');
      }
    },

    /**
     * Renderizar tarjeta de feedback ATS
     */
    renderATSFeedback(analysis) {
        const container = document.getElementById('step1'); // Asumiendo que estamos en step1
        let feedbackPanel = document.getElementById('atsFeedbackPanel');
        
        if (!feedbackPanel) {
            feedbackPanel = document.createElement('div');
            feedbackPanel.id = 'atsFeedbackPanel';
            feedbackPanel.className = 'mt-6 animate-fade-in-up';
            // Insertar después del área de carga
            const uploadSection = document.getElementById('uploadArea').parentElement;
            uploadSection.appendChild(feedbackPanel);
        }

        const scoreColor = analysis.score >= 80 ? 'text-green-400' : (analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400');
        const scoreBg = analysis.score >= 80 ? 'bg-green-400/10 border-green-400/30' : (analysis.score >= 50 ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-red-400/10 border-red-400/30');

        feedbackPanel.innerHTML = `
            <div class="glass-panel p-5 rounded-xl border border-white/10 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full ${analysis.score >= 80 ? 'bg-green-500' : (analysis.score >= 50 ? 'bg-yellow-500' : 'bg-red-500')}"></div>
                
                <div class="flex flex-col md:flex-row gap-6 items-center">
                    <!-- Score Circle -->
                    <div class="relative w-24 h-24 flex items-center justify-center shrink-0">
                        <svg class="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" class="text-white/5" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" 
                                    stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * analysis.score / 100)}" 
                                    class="${scoreColor} transition-all duration-1000 ease-out" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center flex-col">
                            <span class="text-2xl font-bold ${scoreColor}">${analysis.score}</span>
                            <span class="text-[10px] text-gray-400 uppercase">ATS Score</span>
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="flex-1 w-full">
                        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <span class="material-symbols-outlined ${scoreColor}">analytics</span>
                            Análisis de Legibilidad ATS
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${analysis.details.map(detail => `
                                <div class="flex items-start gap-2 text-sm bg-white/5 p-2 rounded border ${detail.passed ? 'border-green-500/20' : 'border-red-500/20'}">
                                    <span class="material-symbols-outlined text-base ${detail.passed ? 'text-green-400' : 'text-red-400'} mt-0.5">
                                        ${detail.passed ? 'check_circle' : 'warning'}
                                    </span>
                                    <span class="text-gray-300">${detail.msg}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
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
