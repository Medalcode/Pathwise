/**
 * Career Timeline Visualizer component
 * Genera una línea de tiempo visual de la experiencia laboral y detecta huecos (gaps)
 */

const CareerTimeline = {
    containerId: 'careerTimelineContainer',
    
    /**
     * Inicializar o actualizar el timeline
     * @param {Array} experiences - Lista de objetos de experiencia { company, title, startDate, endDate, current }
     */
    render(experiences) {
        const container = document.getElementById(this.containerId);
        if (!container) return; // Si no existe el contenedor, no hacemos nada (se debe crear en el HTML)

        if (!experiences || experiences.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-24 text-gray-500 text-sm border-2 border-dashed border-white/10 rounded-xl">
                    <span class="material-symbols-outlined mr-2">timeline</span>
                    Añade experiencia para visualizar tu línea de tiempo
                </div>
            `;
            return;
        }

        // 1. Procesar Fechas y Normalizar
        const items = this.processData(experiences);
        if (items.length === 0) return;

        // 2. Calcular rango total
        const minDate = Math.min(...items.map(i => i.start.getTime()));
        const maxDate = new Date().getTime(); // Siempre hasta hoy para contexto
        const totalDuration = maxDate - minDate;
        
        // Si la duración es muy corta (menos de 6 meses), forzar un año
        const effectiveDuration = Math.max(totalDuration, 1000 * 60 * 60 * 24 * 180); 

        // 3. Renderizar SVG
        const height = items.length * 40 + 50; // Altura dinámica
        container.innerHTML = `
            <div class="glass-panel p-4 rounded-xl border border-white/10 mb-6 animate-fade-in-up">
                <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                    <h4 class="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">history_edu</span>
                        Career Timeline
                    </h4>
                    <span class="text-xs text-gray-500">${items.length} positions mapped</span>
                </div>
                
                <div class="relative w-full overflow-hidden">
                    <svg width="100%" height="${height}" class="w-full">
                        <!-- Grid Lines (Years) -->
                        ${this.renderGridLines(minDate, maxDate, height)}
                        
                        <!-- Experience Bars -->
                        ${items.map((item, index) => this.renderBar(item, index, minDate, effectiveDuration)).join('')}
                        
                        <!-- Gaps Warning -->
                        ${this.renderGaps(items, minDate, effectiveDuration)}
                    </svg>
                </div>
                
                <div class="flex gap-4 mt-2 text-xs text-gray-400 justify-end">
                    <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary"></span> Work</div>
                     <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500/50"></span> Gap (>3mo)</div>
                </div>
            </div>
        `;
    },

    /**
     * Procesar datos crudos a objetos Date
     */
    processData(rawExps) {
        return rawExps.map(exp => {
            // Asumir formato "YYYY-MM" o intentar parsear
            const start = this.parseDate(exp.startDate);
            const end = exp.current ? new Date() : (this.parseDate(exp.endDate) || new Date());
            
            return {
                company: exp.company || 'Unknown',
                title: exp.title || 'Role',
                start,
                end,
                original: exp
            };
        }).filter(item => item.start && item.end)
          .sort((a, b) => b.start - a.start); // Ordenar más reciente arriba
    },

    parseDate(dateStr) {
        if (!dateStr) return null;
        // Intentar parsear "YYYY-MM"
        const parts = dateStr.split('-');
        if (parts.length === 2) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        }
        // Intentar texto libre (parseo simple en inglés/español)
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    },

    /**
     * Renderizar líneas de años verticales
     */
    renderGridLines(min, max, height) {
        const minYear = new Date(min).getFullYear();
        const maxYear = new Date(max).getFullYear();
        const years = [];
        const totalMs = max - min;

        for (let y = minYear; y <= maxYear; y++) {
            const date = new Date(y, 0, 1).getTime();
            if (date < min) continue;
            
            const posPercent = ((date - min) / totalMs) * 100;
            years.push(`
                <line x1="${posPercent}%" y1="0" x2="${posPercent}%" y2="${height}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4" />
                <text x="${posPercent}%" y="${height - 5}" fill="rgba(255,255,255,0.2)" font-size="10" text-anchor="middle">${y}</text>
            `);
        }
        return years.join('');
    },

    /**
     * Renderizar una barra de experiencia
     */
    renderBar(item, index, min, totalDuration) {
        const startPercent = ((item.start.getTime() - min) / totalDuration) * 100;
        const durationPercent = ((item.end.getTime() - item.start.getTime()) / totalDuration) * 100;
        
        // Clampeamos para asegurar visibilidad mínima (min 1% width)
        const width = Math.max(durationPercent, 0.5);
        const y = index * 40; // 40px por fila

        return `
            <g transform="translate(0, ${y})">
                <!-- Bar Background -->
                <rect x="${startPercent}%" y="5" width="${width}%" height="20" rx="4" fill="rgba(147, 89, 248, 0.6)" class="transition-all hover:fill-primary cursor-pointer">
                    <title>${item.title} at ${item.company} (${item.start.getFullYear()} - ${item.end.getFullYear()})</title>
                </rect>
                
                <!-- Label (Left side if early, Right side if late) -->
                <text x="${Math.max(0, startPercent)}%" y="38" fill="white" font-size="10" font-weight="bold">
                    ${item.company.substring(0, 15)}${item.company.length>15 ? '...' : ''}
                </text>
                 <text x="${Math.max(0, startPercent)}%" y="40" fill="gray" font-size="9" dy="1.1em">
                    ${item.title.substring(0, 20)}${item.title.length>20 ? '...' : ''}
                </text>
            </g>
        `;
    },

    /**
     * Analizar y renderizar huecos (Gaps)
     */
    renderGaps(items, min, totalDuration) {
        // Ordenar cronológicamente para detectar huecos
        const sorted = [...items].sort((a, b) => a.start - b.start);
        const gaps = [];
        
        for (let i = 0; i < sorted.length - 1; i++) {
            const currentEnd = sorted[i].end;
            const nextStart = sorted[i+1].start;
            
            // Si hay hueco > 3 meses (aprox 7.8M ms)
            const diff = nextStart - currentEnd;
            if (diff > 7884000000) { // ~3 months
                const startPercent = ((currentEnd.getTime() - min) / totalDuration) * 100;
                const widthPercent = (diff / totalDuration) * 100;
                
                gaps.push(`
                    <rect x="${startPercent}%" y="0" width="${widthPercent}%" height="100%" fill="url(#gapPattern)" opacity="0.3">
                        <title>Gap de inactividad detectado (> 3 meses)</title>
                    </rect>
                `);
            }
        }

        // Definición de patrón rayado para los gaps
        const defs = `
            <defs>
                <pattern id="gapPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="red" stroke-width="1" />
                </pattern>
            </defs>
        `;

        return defs + gaps.join('');
    },

    /**
     * Lógica de Auto-Inicialización y Listeners
     */
    init() {
        // 1. Hook into navigation to detect Step 2 activation
        this.setupNavigationObserver();
        
        // 2. Setup live update listeners for dynamic inputs
        this.setupInputListeners();
    },

    setupNavigationObserver() {
        // Observar cambios en la clase del step2-content para saber cuando se muestra
        const targetNode = document.getElementById('step2-content');
        if (!targetNode) return;

        const config = { attributes: true, attributeFilter: ['class'] };
        
        const callback = (mutationsList) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!targetNode.classList.contains('hidden')) {
                         console.log('👁️ Step 2 visible: Renderizando Timeline');
                         this.updateFromDOM();
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    },

    setupInputListeners() {
        // Listener delegado para detectar cambios en inputs de experiencia dinámicos
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[name^="exp_start_"], input[name^="exp_end_"], input[name^="exp_company_"], input[name^="exp_title_"]')) {
                // Debounce simple
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.updateFromDOM(), 500);
            }
        });
        
        // Listener para cambios en checkbox "Currently"
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name^="exp_current_"]')) {
                this.updateFromDOM();
            }
        });
    },

    updateFromDOM() {
        // Extraer datos actuales directamente de los inputs del DOM
        const experiences = [];
        
        // Buscar todos los containers de experiencia (agregados por CVProcessor)
        // Patrón de IDs: exp-12345
        const expItems = document.querySelectorAll('[id^="exp-"]');
        
        expItems.forEach(item => {
            const id = item.id.replace('exp-', '');
            const company = item.querySelector(`input[name="exp_company_${id}"]`)?.value || '';
            const title = item.querySelector(`input[name="exp_title_${id}"]`)?.value || '';
            const start = item.querySelector(`input[name="exp_start_${id}"]`)?.value || '';
            const end = item.querySelector(`input[name="exp_end_${id}"]`)?.value || '';
            const current = item.querySelector(`input[name="exp_current_${id}"]`)?.checked || false;

            if (company || title) { // Solo añadir si tiene contenido mínimo
                experiences.push({
                    company, title, startDate: start, endDate: end, current
                });
            }
        });

        // Si no hay experiencia en el DOM (quizás es la carga inicial desde objeto)
        // Intentar leer de window.currentProfile si existe
        if (experiences.length === 0 && window.currentProfile && window.currentProfile.experience) {
             console.log('📥 Cargando timeline desde currentProfile (Initial Load)');
             this.render(window.currentProfile.experience);
        } else {
             this.render(experiences);
        }
    }
};

window.CareerTimeline = CareerTimeline;

// Auto-start una vez cargado el DOM
document.addEventListener('DOMContentLoaded', () => {
    CareerTimeline.init();
});
