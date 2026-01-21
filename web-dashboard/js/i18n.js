class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('panoptes_lang') || 'es'; // Default to Spanish
        this.translations = window.translations;
        
        // Wait for DOM content to be loaded if not already
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.renderLanguageSelector();
        this.applyTranslations();
        
        // Expose helper globally
        window.t = (key) => this.t(key);
    }

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('panoptes_lang', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            value = value?.[k];
        }
        
        if (!value) return key;

        // Param interpolation {min}, {max}, etc.
        Object.keys(params).forEach(param => {
            value = value.replace(`{${param}}`, params[param]);
        });
        
        return value;
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.getAttribute('placeholder')) {
                    el.setAttribute('placeholder', translation);
                }
            } else {
                el.textContent = translation;
            }
        });

        // Also update placeholders specifically marked
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            el.setAttribute('placeholder', translation);
        });
    }

    renderLanguageSelector() {
        const header = document.querySelector('header');
        if (!header) return;

        // Check if selector already exists
        if (document.getElementById('language-selector')) return;
        
        const container = document.createElement('div');
        container.id = 'language-selector';
        container.className = 'absolute top-6 right-64 mr-4 flex gap-2'; // Adjust position near header
        
        // We might want to inject it inside the header for better layout stability
        const headerContent = header.querySelector('.flex.items-center.gap-2');
        if(headerContent) {
           headerContent.parentElement.insertBefore(container, headerContent.nextSibling);
           container.className = 'flex gap-2 ml-auto mr-4';
        }

        container.innerHTML = `
            <button class="lang-btn ${this.currentLang === 'en' ? 'text-white font-bold' : 'text-gray-500'} hover:text-white transition-colors text-xs" data-lang="en">EN</button>
            <span class="text-gray-600">|</span>
            <button class="lang-btn ${this.currentLang === 'es' ? 'text-white font-bold' : 'text-gray-500'} hover:text-white transition-colors text-xs" data-lang="es">ES</button>
        `;

        container.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.setLanguage(lang);
                
                // Update UI active state
                container.querySelectorAll('.lang-btn').forEach(b => {
                    b.classList.remove('text-white', 'font-bold');
                    b.classList.add('text-gray-500');
                });
                e.target.classList.remove('text-gray-500');
                e.target.classList.add('text-white', 'font-bold');
            });
        });
    }
}

// Initialize when scripts load
window.i18n = new I18n();
