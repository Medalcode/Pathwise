/**
 * Step 2 Real-time Validator
 * Validación en tiempo real de campos del Paso 2
 */

const Step2Validator = {
    validationRules: {
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Email inválido'
        },
        phone: {
            pattern: /^[\d\s\-\+\(\)]{8,20}$/,
            message: 'Teléfono inválido (8-20 caracteres)'
        },
        linkedin: {
            pattern: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
            message: 'URL de LinkedIn inválida'
        },
        url: {
            pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            message: 'URL inválida'
        }
    },
    
    requiredFields: ['firstName', 'lastName', 'email'],
    
    /**
     * Inicializar validación en tiempo real
     */
    init() {
        console.log('🔍 Inicializando validación en tiempo real...');
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupValidation());
        } else {
            this.setupValidation();
        }
    },
    
    /**
     * Configurar validación en campos
     */
    setupValidation() {
        // Obtener todos los campos de verificación
        const fields = document.querySelectorAll('[id^="verify-"]');
        
        fields.forEach(field => {
            // Validar al escribir (debounced)
            let timeout;
            field.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.validateField(field);
                    
                    // Actualizar completeness
                    if (window.Step2Completeness) {
                        window.Step2Completeness.update();
                    }
                    
                    // Trigger auto-save
                    if (window.Step2AutoSave) {
                        window.Step2AutoSave.scheduleAutoSave();
                    }
                }, 500);
            });
            
            // Validar al perder foco
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            // Validación inicial
            if (field.value) {
                this.validateField(field);
            }
        });
        
        console.log(`✅ Validación configurada en ${fields.length} campos`);
    },
    
    /**
     * Validar un campo específico
     */
    validateField(field) {
        const fieldId = field.id.replace('verify-', '');
        const value = field.value.trim();
        
        // Limpiar estados previos
        field.classList.remove('valid', 'invalid', 'warning');
        this.removeFieldIcon(field);
        this.removeValidationMessage(field);
        
        // Si está vacío
        if (!value) {
            if (this.requiredFields.includes(fieldId)) {
                this.setFieldState(field, 'invalid', 'Campo requerido');
            }
            return;
        }
        
        // Validar según tipo de campo
        let isValid = true;
        let message = '';
        
        if (fieldId === 'email') {
            isValid = this.validationRules.email.pattern.test(value);
            message = this.validationRules.email.message;
        } else if (fieldId === 'phone') {
            isValid = this.validationRules.phone.pattern.test(value);
            message = this.validationRules.phone.message;
        } else if (fieldId === 'linkedin') {
            isValid = this.validationRules.linkedin.pattern.test(value);
            message = this.validationRules.linkedin.message;
        } else if (fieldId === 'portfolio' || fieldId === 'github') {
            isValid = this.validationRules.url.pattern.test(value);
            message = this.validationRules.url.message;
        }
        
        // Aplicar estado
        if (isValid) {
            this.setFieldState(field, 'valid', '✓ Válido');
        } else {
            this.setFieldState(field, 'invalid', message);
        }
    },
    
    /**
     * Establecer estado del campo
     */
    setFieldState(field, state, message) {
        field.classList.add(state);
        
        // Agregar icono
        this.addFieldIcon(field, state);
        
        // Agregar mensaje si hay error o warning
        if (state === 'invalid' || state === 'warning') {
            this.addValidationMessage(field, message, state);
        }
    },
    
    /**
     * Agregar icono al campo
     */
    addFieldIcon(field, state) {
        // Verificar si el campo ya tiene un icono
        const existingIcon = field.parentElement.querySelector('.field-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        const icon = document.createElement('span');
        icon.className = `field-icon material-symbols-outlined ${state}`;
        
        if (state === 'valid') {
            icon.textContent = 'check_circle';
        } else if (state === 'invalid') {
            icon.textContent = 'error';
        } else if (state === 'warning') {
            icon.textContent = 'warning';
        }
        
        // Asegurar que el parent tenga position relative
        if (field.parentElement.style.position !== 'relative') {
            field.parentElement.style.position = 'relative';
        }
        
        field.parentElement.appendChild(icon);
    },
    
    /**
     * Remover icono del campo
     */
    removeFieldIcon(field) {
        const icon = field.parentElement.querySelector('.field-icon');
        if (icon) {
            icon.remove();
        }
    },
    
    /**
     * Agregar mensaje de validación
     */
    addValidationMessage(field, message, type) {
        const existingMsg = field.parentElement.querySelector('.validation-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `validation-message ${type === 'invalid' ? 'error' : type}`;
        msgDiv.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 14px">${type === 'invalid' ? 'error' : 'warning'}</span>
            <span>${message}</span>
        `;
        
        field.parentElement.appendChild(msgDiv);
    },
    
    /**
     * Remover mensaje de validación
     */
    removeValidationMessage(field) {
        const msg = field.parentElement.querySelector('.validation-message');
        if (msg) {
            msg.remove();
        }
    },
    
    /**
     * Validar todos los campos
     */
    validateAll() {
        const fields = document.querySelectorAll('[id^="verify-"]');
        let isValid = true;
        
        fields.forEach(field => {
            this.validateField(field);
            
            if (field.classList.contains('invalid')) {
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    /**
     * Obtener campos inválidos
     */
    getInvalidFields() {
        const invalidFields = [];
        const fields = document.querySelectorAll('[id^="verify-"].invalid');
        
        fields.forEach(field => {
            invalidFields.push({
                id: field.id,
                name: field.name || field.id.replace('verify-', ''),
                value: field.value
            });
        });
        
        return invalidFields;
    }
};

// Exponer globalmente
window.Step2Validator = Step2Validator;

// Auto-inicializar
Step2Validator.init();
