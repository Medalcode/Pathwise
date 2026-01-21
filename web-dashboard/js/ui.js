/**
 * UI Utilities Module
 * Maneja lógica común de interfaz y navegación
 */

// Importante: No importar showToast aquí si se usa como global en index.html,
// pero definiremos una versión local si no existe.

const UI = {
    /**
     * Mostrar notificación Toast
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} glass-panel p-4 mb-3 rounded-lg flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]`;
        toast.style.minWidth = '300px';
        toast.style.borderLeft = `4px solid ${this.getTypeColor(type)}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';
        if (type === 'warning') icon = 'warning';

        toast.innerHTML = `
            <span class="material-symbols-outlined" style="color: ${this.getTypeColor(type)}">${icon}</span>
            <span class="text-sm font-medium text-white">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-24 right-8 z-[100] flex flex-col items-end pointer-events-none';
        document.body.appendChild(container); // Append to body
        // Habilitar pointer events en los hijos
        const style = document.createElement('style');
        style.innerHTML = '#toast-container > * { pointer-events: auto; }';
        document.head.appendChild(style);
        return container;
    },

    getTypeColor(type) {
        const colors = {
            'info': '#3b82f6',    // blue-500
            'success': '#10b981', // emerald-500
            'error': '#ef4444',   // red-500
            'warning': '#f59e0b'  // amber-500
        };
        return colors[type] || colors['info'];
    },

    /**
     * Navegación entre pasos del Wizard
     */
    goToStep(step) {
        // Ocultar todos los contenidos
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        
        // Mostrar objetivo
        const targetContent = document.getElementById(`step${step}-content`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            targetContent.classList.remove('animate-[fadeIn_0.5s]');
            void targetContent.offsetWidth; // Trigger reflow
            targetContent.classList.add('animate-[fadeIn_0.5s]');
        }

        // Actualizar indicadores
        for(let i=1; i<=4; i++) {
            const el = document.getElementById(`stepIndicator${i}`);
            if(el) {
                if(i === step) {
                    el.classList.remove('text-gray-500');
                    el.classList.add('text-primary');
                } else {
                    el.classList.add('text-gray-500');
                    el.classList.remove('text-primary');
                }
            }
        }

        // Persistir estado si existe el objeto state
        if (typeof saveState === 'function') {
            saveState(step);
        }
    },

    /**
     * Intentar navegación validando requisitos
     */
    attemptNavigation(step) {
        // Siempre permitir ir atrás o al paso 1
        if (step === 1) {
            this.goToStep(1);
            return;
        }

        // Verificar auth
        if (window.auth && !window.auth.isAuthenticated()) {
            this.showToast(window.t('auth_required'), 'error');
            return;
        }
        
        // Validaciones específicas
        if (step > 1 && !this.checkProfileExists()) {
             this.showToast(window.t('upload_cv_first'), 'error');
             return;
        }
        
        this.goToStep(step);
    },

    checkProfileExists() {
        // Check window.currentProfile first
        if (window.currentProfile) return true;
        
        // Fallback: Check if there's any profile data in localStorage
        const keys = Object.keys(localStorage);
        const hasProfileData = keys.some(key => key.startsWith('panoptes_profile_data_'));
        
        if (hasProfileData) {
            // Try to load the first profile found
            const profileKey = keys.find(k => k.startsWith('panoptes_profile_data_'));
            try {
                const profileData = JSON.parse(localStorage.getItem(profileKey));
                window.currentProfile = profileData;
                return true;
            } catch (e) {
                console.error('Error loading profile from localStorage:', e);
            }
        }
        
        return false;
    },

    /**
     * Setup de navegación global (Links y Botones)
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const actionCards = document.querySelectorAll('.action-card[href]');
        
        const handleNav = (e, el) => {
             e.preventDefault();
             const target = el.getAttribute('href').substring(1);
             // Lógica custom o simple scroll
             const section = document.getElementById(target);
             if (section) section.scrollIntoView({behavior: 'smooth'});
        };

        navLinks.forEach(link => link.addEventListener('click', (e) => handleNav(e, link)));
        actionCards.forEach(card => card.addEventListener('click', (e) => handleNav(e, card)));
    },

    /**
     * Gestión de Temas (Dark/Light)
     */
    theme: 'dark', // default

    initTheme() {
        // Check saved theme or system preference
        const saved = localStorage.getItem('theme');
        if (saved) {
            this.theme = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.theme = 'light';
        }

        this.applyTheme();

        // Listener for toggle button (assumed id="themeToggle")
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggleTheme());
        }
    },

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    },

    applyTheme() {
        const html = document.documentElement;
        const icon = document.querySelector('#themeToggle span');
        
        if (this.theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
            if(icon) icon.textContent = 'light_mode';
        } else {
            html.classList.remove('dark');
            html.classList.add('light'); // Tailwind darkMode: 'class' needs 'dark' class only, but good for custom CSS
            if(icon) icon.textContent = 'dark_mode';
        }
    },

    /**
     * Utilidad para limpiar HTML
     */
    stripHtml(html) {
       let tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }
};

// Exponer globalmente
window.UI = UI;
window.showToast = UI.showToast.bind(UI);
window.goToStep = UI.goToStep.bind(UI);
window.attemptNavigation = UI.attemptNavigation.bind(UI);
