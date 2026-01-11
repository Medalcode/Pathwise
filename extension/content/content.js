// Content Script - Se ejecuta en todas las páginas
console.log('🤖 AutoApply Content Script cargado');

// Configuración de mapeo de campos
const FIELD_MAPPING = {
  // Nombre
  firstName: ['first-name', 'firstname', 'fname', 'given-name', 'forename', 'nombre'],
  lastName: ['last-name', 'lastname', 'lname', 'surname', 'family-name', 'apellido'],
  fullName: ['name', 'full-name', 'fullname', 'nombre-completo'],
  
  // Contacto
  email: ['email', 'e-mail', 'mail', 'correo'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'telefono', 'celular'],
  
  // Ubicación
  address: ['address', 'street', 'direccion', 'calle'],
  city: ['city', 'ciudad', 'locality'],
  country: ['country', 'pais', 'nation'],
  postalCode: ['postal', 'zip', 'codigo-postal', 'zipcode'],
  
  // Profesional
  currentTitle: ['title', 'job-title', 'position', 'cargo', 'puesto'],
  company: ['company', 'employer', 'empresa', 'organization'],
  linkedin: ['linkedin', 'linkedin-url', 'linkedin-profile'],
  portfolio: ['portfolio', 'website', 'web', 'sitio-web'],
  
  // Educación
  degree: ['degree', 'education', 'titulo', 'grado'],
  school: ['school', 'university', 'college', 'universidad', 'institucion'],
  
  // Otros
  summary: ['summary', 'about', 'bio', 'description', 'resumen', 'sobre-mi'],
  experience: ['experience', 'work-experience', 'experiencia'],
  skills: ['skills', 'habilidades', 'competencias']
};

// Escuchar mensajes desde el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill') {
    console.log('📝 Iniciando autollenado con datos:', request.data);
    autofillForm(request.data);
    sendResponse({ success: true });
  }
  return true;
});

// Función principal de autollenado
function autofillForm(userData) {
  const { personalInfo, experience, education, skills } = userData;
  
  // Encontrar todos los inputs, textareas y selects
  const formElements = document.querySelectorAll('input, textarea, select');
  let fieldsFilledCount = 0;
  
  formElements.forEach(element => {
    // Saltar elementos ocultos o deshabilitados
    if (element.type === 'hidden' || element.disabled) return;
    
    // Obtener identificadores del campo
    const identifiers = getFieldIdentifiers(element);
    
    // Intentar llenar el campo
    const filled = fillField(element, identifiers, userData);
    if (filled) {
      fieldsFilledCount++;
      highlightField(element);
    }
  });
  
  console.log(`✅ ${fieldsFilledCount} campos rellenados`);
  showSuccessMessage(fieldsFilledCount);
}

// Obtener identificadores del campo
function getFieldIdentifiers(element) {
  const identifiers = [];
  
  // ID
  if (element.id) identifiers.push(element.id.toLowerCase());
  
  // Name
  if (element.name) identifiers.push(element.name.toLowerCase());
  
  // Placeholder
  if (element.placeholder) identifiers.push(element.placeholder.toLowerCase());
  
  // Aria-label
  if (element.getAttribute('aria-label')) {
    identifiers.push(element.getAttribute('aria-label').toLowerCase());
  }
  
  // Autocomplete
  if (element.autocomplete) identifiers.push(element.autocomplete.toLowerCase());
  
  // Label asociado
  const label = findAssociatedLabel(element);
  if (label) identifiers.push(label.toLowerCase());
  
  return identifiers;
}

// Buscar label asociado
function findAssociatedLabel(element) {
  // Por atributo 'for'
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent;
  }
  
  // Por parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent;
  
  // Por label anterior
  const prevLabel = element.previousElementSibling;
  if (prevLabel && prevLabel.tagName === 'LABEL') {
    return prevLabel.textContent;
  }
  
  return null;
}

// Llenar campo
function fillField(element, identifiers, userData) {
  const { personalInfo, experience, education, skills } = userData;
  
  // Intentar mapear cada identificador
  for (const identifier of identifiers) {
    // Personal Info
    if (matchesAny(identifier, FIELD_MAPPING.firstName) && personalInfo.firstName) {
      setValue(element, personalInfo.firstName);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.lastName) && personalInfo.lastName) {
      setValue(element, personalInfo.lastName);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.fullName)) {
      setValue(element, `${personalInfo.firstName} ${personalInfo.lastName}`);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.email) && personalInfo.email) {
      setValue(element, personalInfo.email);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.phone) && personalInfo.phone) {
      setValue(element, personalInfo.phone);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.address) && personalInfo.address) {
      setValue(element, personalInfo.address);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.city) && personalInfo.city) {
      setValue(element, personalInfo.city);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.country) && personalInfo.country) {
      setValue(element, personalInfo.country);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.currentTitle) && personalInfo.currentTitle) {
      setValue(element, personalInfo.currentTitle);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.linkedin) && personalInfo.linkedin) {
      setValue(element, personalInfo.linkedin);
      return true;
    }
    if (matchesAny(identifier, FIELD_MAPPING.portfolio) && personalInfo.portfolio) {
      setValue(element, personalInfo.portfolio);
      return true;
    }
    
    // Summary/Bio
    if (matchesAny(identifier, FIELD_MAPPING.summary) && personalInfo.summary) {
      setValue(element, personalInfo.summary);
      return true;
    }
    
    // Skills (si es textarea o input grande)
    if (matchesAny(identifier, FIELD_MAPPING.skills) && skills && skills.length > 0) {
      setValue(element, skills.join(', '));
      return true;
    }
  }
  
  return false;
}

// Verificar si coincide con algún patrón
function matchesAny(identifier, patterns) {
  return patterns.some(pattern => 
    identifier.includes(pattern) || pattern.includes(identifier)
  );
}

// Establecer valor del campo
function setValue(element, value) {
  if (element.tagName === 'SELECT') {
    // Para selects, buscar la opción que coincida
    const options = Array.from(element.options);
    const matchingOption = options.find(opt => 
      opt.value.toLowerCase().includes(value.toLowerCase()) ||
      opt.text.toLowerCase().includes(value.toLowerCase())
    );
    if (matchingOption) {
      element.value = matchingOption.value;
    }
  } else {
    // Para inputs y textareas
    element.value = value;
  }
  
  // Disparar eventos para que los frameworks detecten el cambio
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// Resaltar campo rellenado
function highlightField(element) {
  const originalBorder = element.style.border;
  const originalBackground = element.style.background;
  
  element.style.border = '2px solid #4285f4';
  element.style.background = 'rgba(66, 133, 244, 0.05)';
  element.style.transition = 'all 0.3s ease';
  
  setTimeout(() => {
    element.style.border = originalBorder;
    element.style.background = originalBackground;
  }, 2000);
}

// Mostrar mensaje de éxito
function showSuccessMessage(count) {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.id = 'autoapply-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4285f4 0%, #5a94f7 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span>✅ ${count} campos rellenados automáticamente</span>
    </div>
  `;
  
  // Agregar estilos de animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remover después de 4 segundos
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
