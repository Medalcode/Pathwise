/**
 * Step 2 Collapsible Sections
 * Gestiona las secciones colapsables del Paso 2
 */

const Step2Sections = {
    /**
     * Inicializar secciones colapsables
     */
    init() {
        console.log('📂 Inicializando secciones colapsables...');
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupSections());
        } else {
            this.setupSections();
        }
    },
    
    /**
     * Configurar secciones
     */
    setupSections() {
        const sections = document.querySelectorAll('.verify-section');
        
        sections.forEach(section => {
            const header = section.querySelector('.verify-section-header');
            if (header) {
                header.addEventListener('click', () => this.toggleSection(section));
            }
        });
        
        console.log(`✅ ${sections.length} secciones configuradas`);
    },
    
    /**
     * Toggle sección
     */
    toggleSection(section) {
        section.classList.toggle('collapsed');
        
        // Guardar estado en localStorage
        const sectionId = section.dataset.section;
        if (sectionId) {
            const collapsed = section.classList.contains('collapsed');
            localStorage.setItem(`step2_section_${sectionId}_collapsed`, collapsed);
        }
    },
    
    /**
     * Expandir todas las secciones
     */
    expandAll() {
        const sections = document.querySelectorAll('.verify-section');
        sections.forEach(section => {
            section.classList.remove('collapsed');
        });
    },
    
    /**
     * Colapsar todas las secciones
     */
    collapseAll() {
        const sections = document.querySelectorAll('.verify-section');
        sections.forEach(section => {
            section.classList.add('collapsed');
        });
    },
    
    /**
     * Restaurar estado guardado
     */
    restoreState() {
        const sections = document.querySelectorAll('.verify-section');
        sections.forEach(section => {
            const sectionId = section.dataset.section;
            if (sectionId) {
                const collapsed = localStorage.getItem(`step2_section_${sectionId}_collapsed`) === 'true';
                if (collapsed) {
                    section.classList.add('collapsed');
                }
            }
        });
    }
};

// Exponer globalmente
window.Step2Sections = Step2Sections;

// Auto-inicializar
Step2Sections.init();
