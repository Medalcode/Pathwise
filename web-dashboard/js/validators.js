/**
 * Validators Module
 * Validación de datos del CV y perfil
 */

const Validators = {
  /**
   * Valida un email
   * @param {string} email
   * @returns {Object} {valid: boolean, error: string}
   */
  validateEmail(email) {
    if (!email || email.trim() === '') {
      return { valid: false, error: window.t('email_required') };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: window.t('email_invalid') };
    }
    
    return { valid: true, error: null };
  },

  /**
   * Valida un teléfono (múltiples formatos internacionales)
   * @param {string} phone
   * @returns {Object} {valid: boolean, error: string}
   */
  validatePhone(phone) {
    if (!phone || phone.trim() === '') {
      return { valid: true, error: null }; // Opcional
    }
    
    // Acepta: +56912345678, +1-234-567-8900, (123) 456-7890, etc.
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { valid: false, error: window.t('phone_format_invalid') };
    }
    
    return { valid: true, error: null };
  },

  /**
   * Valida una URL (LinkedIn, GitHub, Portfolio)
   * @param {string} url
   * @param {string} type - 'linkedin', 'github', 'portfolio'
   * @returns {Object} {valid: boolean, error: string}
   */
  validateURL(url, type = 'general') {
    if (!url || url.trim() === '') {
      return { valid: true, error: null }; // Opcional
    }
    
    try {
      const urlObj = new URL(url);
      
      if (type === 'linkedin') {
        if (!urlObj.hostname.includes('linkedin.com')) {
          return { valid: false, error: window.t('url_linkedin_invalid') };
        }
      } else if (type === 'github') {
        if (!urlObj.hostname.includes('github.com')) {
          return { valid: false, error: window.t('url_github_invalid') };
        }
      }
      
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: window.t('url_invalid') };
    }
  },

  /**
   * Valida un año (4 dígitos, no futuro)
   * @param {string|number} year
   * @param {boolean} allowFuture
   * @returns {Object} {valid: boolean, error: string}
   */
  validateYear(year, allowFuture = false) {
    if (!year || year === '') {
      return { valid: true, error: null }; // Opcional
    }
    
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(yearNum)) {
      return { valid: false, error: window.t('year_invalid') };
    }
    
    if (yearNum < 1950 || yearNum > 2100) {
      return { valid: false, error: window.t('year_range_invalid') };
    }
    
    if (!allowFuture && yearNum > currentYear) {
      return { valid: false, error: window.t('year_future_invalid') };
    }
    
    return { valid: true, error: null };
  },

  /**
   * Valida un rango de fechas (inicio < fin)
   * @param {string} startYear
   * @param {string} endYear
   * @param {boolean} current - Si es trabajo/estudio actual
   * @returns {Object} {valid: boolean, error: string}
   */
  validateDateRange(startYear, endYear, current = false) {
    if (current) {
      // Si es actual, solo validar año de inicio
      return this.validateYear(startYear, false);
    }
    
    const startValidation = this.validateYear(startYear, false);
    if (!startValidation.valid) {
      return { valid: false, error: `Año inicio: ${startValidation.error}` };
    }
    
    const endValidation = this.validateYear(endYear, true);
    if (!endValidation.valid) {
      return { valid: false, error: `Año fin: ${endValidation.error}` };
    }
    
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    if (start > end) {
      return { valid: false, error: window.t('start_year_greater') };
    }
    
    return { valid: true, error: null };
  },

  /**
   * Valida un campo de texto requerido
   * @param {string} value
   * @param {string} fieldName
   * @param {number} minLength
   * @param {number} maxLength
   * @returns {Object} {valid: boolean, error: string}
   */
  validateText(value, fieldName, minLength = 1, maxLength = 500) {
    if (!value || value.trim() === '') {
      return { valid: false, error: `${fieldName} ${window.t('is_required')}` };
    }
    
    if (value.length < minLength) {
      return { valid: false, error: `${fieldName} ${window.t('min_length', {min: minLength})}` };
    }
    
    if (value.length > maxLength) {
      return { valid: false, error: `${fieldName} ${window.t('max_length', {max: maxLength})}` };
    }
    
    return { valid: true, error: null };
  },

  /**
   * Valida información personal completa
   * @param {Object} personalInfo
   * @returns {Object} {valid: boolean, errors: Object}
   */
  validatePersonalInfo(personalInfo) {
    const errors = {};
    let isValid = true;
    
    // Nombre (requerido)
    const firstNameValidation = this.validateText(personalInfo.firstName, 'Nombre', 2, 50);
    if (!firstNameValidation.valid) {
      errors.firstName = firstNameValidation.error;
      isValid = false;
    }
    
    // Apellido (requerido)
    const lastNameValidation = this.validateText(personalInfo.lastName, 'Apellido', 2, 50);
    if (!lastNameValidation.valid) {
      errors.lastName = lastNameValidation.error;
      isValid = false;
    }
    
    // Email (requerido)
    const emailValidation = this.validateEmail(personalInfo.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
      isValid = false;
    }
    
    // Teléfono (opcional pero validado si existe)
    if (personalInfo.phone) {
      const phoneValidation = this.validatePhone(personalInfo.phone);
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error;
        isValid = false;
      }
    }
    
    // LinkedIn (opcional pero validado si existe)
    if (personalInfo.linkedin) {
      const linkedinValidation = this.validateURL(personalInfo.linkedin, 'linkedin');
      if (!linkedinValidation.valid) {
        errors.linkedin = linkedinValidation.error;
        isValid = false;
      }
    }
    
    // GitHub (opcional pero validado si existe)
    if (personalInfo.github) {
      const githubValidation = this.validateURL(personalInfo.github, 'github');
      if (!githubValidation.valid) {
        errors.github = githubValidation.error;
        isValid = false;
      }
    }
    
    return { valid: isValid, errors };
  },

  /**
   * Valida una entrada de experiencia
   * @param {Object} experience
   * @returns {Object} {valid: boolean, errors: Object}
   */
  validateExperience(experience) {
    const errors = {};
    let isValid = true;
    
    // Título (requerido)
    const titleValidation = this.validateText(experience.title, 'Título del puesto', 2, 100);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error;
      isValid = false;
    }
    
    // Empresa (requerido)
    const companyValidation = this.validateText(experience.company, 'Empresa', 2, 100);
    if (!companyValidation.valid) {
      errors.company = companyValidation.error;
      isValid = false;
    }
    
    // Fechas
    const dateValidation = this.validateDateRange(
      experience.startDate,
      experience.endDate,
      experience.current
    );
    if (!dateValidation.valid) {
      errors.dates = dateValidation.error;
      isValid = false;
    }
    
    return { valid: isValid, errors };
  },

  /**
   * Valida una entrada de educación
   * @param {Object} education
   * @returns {Object} {valid: boolean, errors: Object}
   */
  validateEducation(education) {
    const errors = {};
    let isValid = true;
    
    // Título/Grado (requerido)
    const degreeValidation = this.validateText(education.degree, 'Título/Grado', 2, 100);
    if (!degreeValidation.valid) {
      errors.degree = degreeValidation.error;
      isValid = false;
    }
    
    // Institución (requerido)
    const schoolValidation = this.validateText(education.school, 'Institución', 2, 100);
    if (!schoolValidation.valid) {
      errors.school = schoolValidation.error;
      isValid = false;
    }
    
    // Fechas
    const dateValidation = this.validateDateRange(
      education.startDate,
      education.endDate,
      education.current
    );
    if (!dateValidation.valid) {
      errors.dates = dateValidation.error;
      isValid = false;
    }
    
    return { valid: isValid, errors };
  },

  /**
   * Valida un perfil completo
   * @param {Object} profile
   * @returns {Object} {valid: boolean, errors: Object}
   */
  validateProfile(profile) {
    const errors = {
      personalInfo: {},
      experience: [],
      education: []
    };
    let isValid = true;
    
    // Validar información personal
    const personalValidation = this.validatePersonalInfo(profile.personalInfo || {});
    if (!personalValidation.valid) {
      errors.personalInfo = personalValidation.errors;
      isValid = false;
    }
    
    // Validar experiencias
    if (profile.experience && profile.experience.length > 0) {
      profile.experience.forEach((exp, index) => {
        const expValidation = this.validateExperience(exp);
        if (!expValidation.valid) {
          errors.experience[index] = expValidation.errors;
          isValid = false;
        }
      });
    }
    
    // Validar educación
    if (profile.education && profile.education.length > 0) {
      profile.education.forEach((edu, index) => {
        const eduValidation = this.validateEducation(edu);
        if (!eduValidation.valid) {
          errors.education[index] = eduValidation.errors;
          isValid = false;
        }
      });
    }
    
    return { valid: isValid, errors };
  }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validators;
}
