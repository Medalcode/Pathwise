// Intercept Console Logs for On-Screen Debugging
(function() {
    const oldLog = console.log;
    const oldError = console.error;
    const consoleDiv = document.getElementById('debugConsole');

    function appendLog(msg, type) {
        if (!consoleDiv) return;
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        consoleDiv.appendChild(entry);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }

    console.log = function(...args) {
        oldLog.apply(console, args);
        appendLog(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '), 'info');
    };

    console.error = function(...args) {
        oldError.apply(console, args);
        appendLog(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '), 'error');
    };
})();

// AutoApply Dashboard - Main Application

// Detectar si estamos en producción (Cloud Run) o desarrollo local
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

// State
let currentProfile = null;
let skills = [];

// Init
// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('🚀 AutoApply Wizard iniciado');
  
  // Setup Wizard specific listeners
  const fileInput = document.getElementById('cvUpload');
  if (fileInput) { 
      // Reemplazamos el listener original si existiera o agregamos uno nuevo
      // Nota: handleFileUpload es la vieja funcion. Usamos handleFileUploadWizard
      fileInput.addEventListener('change', (e) => handleFileUploadWizard(e.target.files[0]));
  }
  
  // Setup drag and drop for large area
  const dropZone = document.getElementById('uploadArea');
  if (dropZone) {
       dropZone.addEventListener('dragover', (e) => {
           e.preventDefault();
           dropZone.style.borderColor = 'var(--primary-color)';
           dropZone.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
       });
       dropZone.addEventListener('dragleave', (e) => {
           e.preventDefault();
           dropZone.style.borderColor = 'var(--border-color)';
           dropZone.style.backgroundColor = 'var(--bg-secondary)';
       });
       dropZone.addEventListener('drop', (e) => {
           e.preventDefault();
           dropZone.style.borderColor = 'var(--border-color)';
           dropZone.style.backgroundColor = 'var(--bg-secondary)';
           if (e.dataTransfer.files.length) {
               handleFileUploadWizard(e.dataTransfer.files[0]);
           }
       });
  }

  // Setup Profile Logic (Modales, etc. para soporte legacy interno)
  setupProfileForm();
  
  // Check Initial State to decide Step
  try {
    const response = await fetch(`${API_URL}/profile`);
    if (response.ok) {
        const profile = await response.json();
        // Si tiene nombre, asumimos que ya pasó el paso 1
        if (profile && profile.personalInfo && profile.personalInfo.firstName) {
            console.log("Perfil detectado, saltando al paso 3");
            currentProfile = profile;
            
            // Llenar vista previa
            populateForm(profile);
            
            goToStep(3); 
            return;
        }
    }
  } catch (e) {
    console.log("Perfil no encontrado o error", e);
  }
  
  // Default: Paso 1
  goToStep(1);
}

// Navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const actionCards = document.querySelectorAll('.action-card[href]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').substring(1);
      navigateTo(target);
    });
  });
  
  actionCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const target = card.getAttribute('href').substring(1);
      navigateTo(target);
    });
  });
}

function navigateTo(sectionName) {
  // Update nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + sectionName) {
      link.classList.add('active');
    }
  });
  
  // Show section
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });
  
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Upload
function setupUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('cvFile');
  
  // Click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.background = 'var(--primary-light)';
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
}

async function handleFileUpload(file) {
  if (!file.type.includes('pdf')) {
    showToast('Solo se permiten archivos PDF', 'error');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    showToast('El archivo es demasiado grande (máx 10MB)', 'error');
    return;
  }
  
  // Show progress
  document.getElementById('uploadArea').classList.add('hidden');
  document.getElementById('uploadProgress').classList.remove('hidden');
  
  const formData = new FormData();
  formData.append('cv', file);
  
  try {
    // Simulate progress
    animateProgress(0, 30, 500);
    
    const response = await fetch(`${API_URL}/upload/cv`, {
      method: 'POST',
      body: formData
    });
    
    animateProgress(30, 70, 500);
    
    if (!response.ok) {
      throw new Error('Error al procesar el CV');
    }
    
    const result = await response.json();
    
    animateProgress(70, 100, 300);
    
    setTimeout(() => {
      // Hide progress
      document.getElementById('uploadProgress').classList.add('hidden');
      
      // Show extracted data preview
      showExtractedDataPreview(result.data);
      
      // Show success toast
      showToast('CV procesado exitosamente', 'success');
    }, 500);
    
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('uploadArea').classList.remove('hidden');
    showToast('Error al procesar el CV: ' + error.message, 'error');
  }
}

function animateProgress(from, to, duration) {
  const progressFill = document.getElementById('progressFill');
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
}

function countExtractedFields(data) {
  let count = 0;
  
  if (data.personalInfo) {
    count += Object.values(data.personalInfo).filter(v => v && v.length > 0).length;
  }
  if (data.experience) {
    count += data.experience.length * 4;
  }
  if (data.education) {
    count += data.education.length * 3;
  }
  if (data.skills) {
    count += data.skills.length;
  }
  
  return count;
}

// Profile Form
function setupProfileForm() {
  const modalForm = document.getElementById('profileForm');
  const verifyForm = document.getElementById('verificationForm');
  const skillInput = document.getElementById('skillInput');
  const verifySkillInput = document.getElementById('verify-skillInput');
  const resetBtn = document.getElementById('resetForm');
  
  // 1. Skill Management - Modal
  if (skillInput) {
    skillInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const skill = skillInput.value.trim();
        if (skill) {
          addSkill(skill);
          skillInput.value = '';
        }
      }
    });
  }

  // 2. Skill Management - Verify Form (Step 2)
  if (verifySkillInput) {
    verifySkillInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
         e.preventDefault();
         const skill = verifySkillInput.value.trim();
         if (skill) {
           addSkill(skill);
           verifySkillInput.value = '';
         }
      }
    });
    
    // Add Button
    const verifyAddBtn = document.getElementById('verify-addSkillBtn');
    if(verifyAddBtn) {
        verifyAddBtn.addEventListener('click', () => {
             const skill = verifySkillInput.value.trim();
             if (skill) {
               addSkill(skill);
               verifySkillInput.value = '';
             }
        });
    }
  }
  
  // 3. Form Submit - Modal
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProfile('profileForm');
    });
  }

  // 4. Form Submit - Verify Form (Step 2)
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProfile('verificationForm');
    });
  }
  
  // Reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
        if(modalForm) modalForm.reset();
        if(verifyForm) verifyForm.reset();
        skills = [];
        renderSkills();
        showToast('Formulario limpiado', 'warning');
      }
    });
  }
}

function addSkill(skillName) {
  if (!skills.includes(skillName)) {
    skills.push(skillName);
    renderSkills();
  }
}

function removeSkill(skillName) {
  skills = skills.filter(s => s !== skillName);
  renderSkills();
}

function renderSkills() {
  const html = skills.map(skill => `
    <div class="skill-tag">
      <span>${skill}</span>
      <button type="button" onclick="removeSkill('${skill}')">&times;</button>
    </div>
  `).join('');

  // Update Modal
  const modalList = document.getElementById('skillsList');
  if(modalList) modalList.innerHTML = html;
  
  // Update Verify Form
  const verifyList = document.getElementById('verify-skillsTagsContainer');
  if(verifyList) verifyList.innerHTML = html;
}

// Load Profile
async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/profile`);
    
    if (response.ok) {
      const profile = await response.json();
      currentProfile = profile;
      populateForm(profile);
      updateStats(profile);
    } else {
      console.log('No hay perfil guardado');
    }
  } catch (error) {
    console.error('Error cargando perfil:', error);
  }
}

function populateForm(profile) {
  if (!profile) return;

  const { personalInfo, experience, education } = profile;
  
  const setField = (baseId, val) => {
      const v = val || '';
      const el1 = document.getElementById(baseId);
      if(el1) el1.value = v;
      const el2 = document.getElementById('verify-' + baseId);
      if(el2) el2.value = v;
  };
  
  // Personal info
  if (personalInfo) {
      setField('firstName', personalInfo.firstName);
      setField('lastName', personalInfo.lastName);
      setField('email', personalInfo.email);
      setField('phone', personalInfo.phone);
      setField('currentTitle', personalInfo.currentTitle);
      setField('city', personalInfo.city);
      setField('country', personalInfo.country);
      setField('address', personalInfo.address);
      setField('linkedin', personalInfo.linkedin);
      setField('portfolio', personalInfo.portfolio);
      setField('summary', personalInfo.summary);
      
       // Remote preference
      if (personalInfo.remoteOnly) {
         const r1 = document.getElementById('remoteOnlyPref');
         if(r1) r1.checked = true;
         const r2 = document.getElementById('verify-remoteOnlyPref');
         if(r2) r2.checked = true;
      }
  }
  
  // Skills
  skills = profile.skills || [];
  renderSkills();

  // Experience
  const expContainer = document.getElementById('experienceContainer');
  if (expContainer) {
      expContainer.innerHTML = ''; // Limpiar
      if (experience && Array.isArray(experience)) {
          experience.forEach(exp => {
             // Crear campos y llenarlos
             addExperienceField(exp);
          });
      }
  }

  // Education
  const eduContainer = document.getElementById('educationContainer');
  if (eduContainer) {
      eduContainer.innerHTML = ''; // Limpiar
      if (education && Array.isArray(education)) {
          education.forEach(edu => {
             addEducationField(edu);
          });
      }
  }
}

// Helper para crear inputs dinámicos de experiencia
function addExperienceField(data = null) {
    const container = document.getElementById('experienceContainer');
    if (!container) return;

    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const item = document.createElement('div');
    item.className = 'dynamic-item card-nested';
    item.id = `exp-${id}`;
    
    // Valores predeterminados
    const title = data ? data.title || '' : '';
    const company = data ? data.company || '' : '';
    const startDate = data ? data.startDate || '' : '';
    const endDate = data ? data.endDate || '' : '';
    const current = data ? data.current || false : false;
    const desc = data ? data.description || '' : '';

    item.innerHTML = `
        <div class="form-grid mb-2">
            <div class="form-group">
                <label>Cargo</label>
                <input type="text" name="exp_title_${id}" value="${title}" placeholder="Ej: Senior Dev">
            </div>
            <div class="form-group">
                <label>Empresa</label>
                <input type="text" name="exp_company_${id}" value="${company}" placeholder="Ej: Tech Corp">
            </div>
        </div>
        <div class="form-grid mb-2">
             <div class="form-group">
                <label>Desde</label>
                <input type="text" name="exp_start_${id}" value="${startDate}" placeholder="YYYY-MM">
            </div>
            <div class="form-group">
                <label>Hasta</label>
                <input type="text" name="exp_end_${id}" value="${endDate}" placeholder="YYYY-MM" ${current ? 'disabled' : ''}>
                <label class="checkbox-inline mt-1">
                    <input type="checkbox" name="exp_current_${id}" ${current ? 'checked' : ''} onchange="toggleEndDate(this, 'exp_end_${id}')"> Actualmente
                </label>
            </div>
        </div>
        <div class="form-group full-width">
            <label>Descripción</label>
            <textarea name="exp_desc_${id}" rows="2">${desc}</textarea>
        </div>
        <div class="text-right">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeDynamicItem('exp-${id}')">Eliminar</button>
        </div>
    `;
    
    container.appendChild(item);
}

function toggleEndDate(checkbox, targetId) {
    const input = document.querySelector(`input[name="${targetId}"]`);
    if(input) {
        input.disabled = checkbox.checked;
        if(checkbox.checked) input.value = 'Presente';
    }
}

function addEducationField(data = null) {
    const container = document.getElementById('educationContainer');
    if (!container) return;

    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const item = document.createElement('div');
    item.className = 'dynamic-item card-nested';
    item.id = `edu-${id}`;
    
    const degree = data ? data.degree || '' : '';
    const school = data ? data.school || '' : '';
    const start = data ? data.startDate || '' : '';
    const end = data ? data.endDate || '' : '';

    item.innerHTML = `
         <div class="form-grid mb-2">
            <div class="form-group">
                <label>Título / Grado</label>
                <input type="text" name="edu_degree_${id}" value="${degree}">
            </div>
            <div class="form-group">
                <label>Institución</label>
                <input type="text" name="edu_school_${id}" value="${school}">
            </div>
        </div>
        <div class="form-grid">
             <div class="form-group">
                <label>Inicio</label>
                <input type="text" name="edu_start_${id}" value="${start}">
            </div>
            <div class="form-group">
                <label>Fin</label>
                <input type="text" name="edu_end_${id}" value="${end}">
            </div>
        </div>
        <div class="text-right mt-2">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeDynamicItem('edu-${id}')">Eliminar</button>
        </div>
    `;
    container.appendChild(item);
}

function removeDynamicItem(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

// Hacer globales las funciones necesarias para onclick
window.addExperienceField = addExperienceField;
window.addEducationField = addEducationField;
window.removeDynamicItem = removeDynamicItem;
window.toggleEndDate = toggleEndDate;


function updateStats(profile) {
  const completeness = calculateCompleteness(profile);
  const fieldsCount = countExtractedFields(profile);
  
  document.getElementById('profileCompleteness').textContent = completeness + '%';
  document.getElementById('fieldsCount').textContent = fieldsCount;
}

function calculateCompleteness(profile) {
  let total = 0;
  let filled = 0;
  
  const requiredFields = ['firstName', 'lastName', 'email'];
  const optionalFields = ['phone', 'currentTitle', 'city', 'country', 'address', 'linkedin', 'portfolio', 'summary'];
  
  requiredFields.forEach(field => {
    total++;
    if (profile.personalInfo[field]) filled++;
  });
  
  optionalFields.forEach(field => {
    total++;
    if (profile.personalInfo[field]) filled++;
  });
  
  total += 3; // Experience
  if (profile.experience && profile.experience.length > 0) filled += 3;
  
  total += 2; // Education
  if (profile.education && profile.education.length > 0) filled += 2;
  
  total += 2; // Skills  
  if (profile.skills && profile.skills.length >= 3) filled += 2;
  
  return Math.round((filled / total) * 100);
}

// Save Profile
async function saveProfile(formId = 'profileForm') {
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  
  const profileData = {
    personalInfo: {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      currentTitle: formData.get('currentTitle'),
      city: formData.get('city'),
      country: formData.get('country'),
      address: formData.get('address'),
      linkedin: formData.get('linkedin'),
      portfolio: formData.get('portfolio'),
      summary: formData.get('summary')
    },
    skills: skills,
    experience: currentProfile?.experience || [],
    education: currentProfile?.education || []
  };
  
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    if (response.ok) {
      showToast('Perfil guardado exitosamente', 'success');
      currentProfile = profileData;
      updateStats(profileData);
    } else {
      throw new Error('Error al guardar');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al guardar el perfil', 'error');
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#22c55e" stroke-width="2"/><path d="M9 12L11 14L15 10" stroke="#22c55e" stroke-width="2"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/><path d="M15 9L9 15M9 9L15 15" stroke="#ef4444" stroke-width="2"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" stroke-width="2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#3b82f6" stroke-width="2"/><path d="M12 16V12M12 8H12.01" stroke="#3b82f6" stroke-width="2"/></svg>'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });
  
  // Auto remove
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Extension Installation
document.getElementById('installExtension')?.addEventListener('click', () => {
  showToast('Abre chrome://extensions/ y carga la carpeta "extension"', 'info');
});

// Test Extension
document.getElementById('testExtension')?.addEventListener('click', () => {
  window.open('https://docs.google.com/forms/d/e/1FAIpQLSf-test/viewform', '_blank');
  showToast('Abre la extensión en el formulario de prueba', 'success');
});

// Make functions global for inline event handlers
window.navigateTo = navigateTo;
window.removeSkill = removeSkill;

// Extracted Data Preview
let extractedData = null;
let extractedSkills = [];
let editedFields = new Set();

function showExtractedDataPreview(data) {
  extractedData = data;
  extractedSkills = data.skills || [];
  editedFields.clear();
  
  // Show the preview section
  document.getElementById('extractedDataPreview').classList.remove('hidden');
  
  // Populate fields
  const fieldMapping = {
    'firstName': data.personalInfo.firstName,
    'lastName': data.personalInfo.lastName,
    'email': data.personalInfo.email,
    'phone': data.personalInfo.phone,
    'currentTitle': data.personalInfo.currentTitle,
    'city': data.personalInfo.city,
    'country': data.personalInfo.country,
    'linkedin': data.personalInfo.linkedin
  };
  
  Object.entries(fieldMapping).forEach(([key, value]) => {
    const input = document.getElementById(`extracted-${key}`);
    if (input) {
      input.value = value || '';
      if (value) {
        input.classList.add('has-value');
      }
      
      // Track original value
      input.dataset.originalValue = value || '';
      
      // Listen for changes
      input.addEventListener('input', () => {
        if (input.value !== input.dataset.originalValue) {
          input.classList.add('edited');
          input.classList.remove('has-value');
          editedFields.add(key);
        } else {
          input.classList.remove('edited');
          if (input.value) {
            input.classList.add('has-value');
          }
          editedFields.delete(key);
        }
        updateEditedCount();
      });
    }
  });
  
  // Render experience
  renderExtractedExperience();
  
  // Render education
  renderExtractedEducation();
  
  // Render skills
  renderExtractedSkills();
  
  // Update stats
  document.getElementById('fieldsExtracted').textContent = countExtractedFields(data);
  updateEditedCount();
  
  // Setup buttons
  document.getElementById('saveExtractedData').addEventListener('click', saveExtractedData);
  document.getElementById('discardExtraction').addEventListener('click', discardExtraction);
  document.getElementById('addExperience').addEventListener('click', addNewExperience);
  document.getElementById('addEducation').addEventListener('click', addNewEducation);
}

function renderExtractedExperience() {
  const experienceList = document.getElementById('extractedExperienceList');
  
  if (!extractedData.experience || extractedData.experience.length === 0) {
    experienceList.innerHTML = '<div class="empty-list">No se detectó experiencia profesional</div>';
    return;
  }
  
  experienceList.innerHTML = extractedData.experience.map((exp, index) => `
    <div class="experience-item-editable">
      <div class="item-header">
        <strong>Experiencia ${index + 1}</strong>
        <button type="button" class="btn-remove-item" onclick="removeExperience(${index})" title="Eliminar">×</button>
      </div>
      <div class="editable-fields-grid">
        <div class="field-group">
          <label>Título del Puesto</label>
          <input type="text" class="editable-item-field" data-type="experience" data-index="${index}" data-field="title" value="${exp.title || ''}" placeholder="ej: Full Stack Developer">
        </div>
        <div class="field-group">
          <label>Empresa</label>
          <input type="text" class="editable-item-field" data-type="experience" data-index="${index}" data-field="company" value="${exp.company || ''}" placeholder="ej: Tech Corp">
        </div>
        <div class="field-group">
          <label>Año Inicio</label>
          <input type="text" class="editable-item-field" data-type="experience" data-index="${index}" data-field="startDate" value="${exp.startDate || ''}" placeholder="2020">
        </div>
        <div class="field-group">
          <label>Año Fin</label>
          <input type="text" class="editable-item-field" data-type="experience" data-index="${index}" data-field="endDate" value="${exp.endDate || ''}" placeholder="2024 o Presente">
        </div>
        <div class="field-group full-width">
          <label>Descripción (opcional)</label>
          <textarea class="editable-item-field" data-type="experience" data-index="${index}" data-field="description" rows="2" placeholder="Describe tus responsabilidades...">${exp.description || ''}</textarea>
        </div>
      </div>
    </div>
  `).join('');
  
  // Agregar event listeners
  attachItemFieldListeners();
}

function renderExtractedEducation() {
  const educationList = document.getElementById('extractedEducationList');
  
  if (!extractedData.education || extractedData.education.length === 0) {
    educationList.innerHTML = '<div class="empty-list">No se detectó educación</div>';
    return;
  }
  
  educationList.innerHTML = extractedData.education.map((edu, index) => `
    <div class="education-item-editable">
      <div class="item-header">
        <strong>Educación ${index + 1}</strong>
        <button type="button" class="btn-remove-item" onclick="removeEducation(${index})" title="Eliminar">×</button>
      </div>
      <div class="editable-fields-grid">
        <div class="field-group">
          <label>Título/Grado</label>
          <input type="text" class="editable-item-field" data-type="education" data-index="${index}" data-field="degree" value="${edu.degree || ''}" placeholder="ej: Ingeniería Informática">
        </div>
        <div class="field-group">
          <label>Institución</label>
          <input type="text" class="editable-item-field" data-type="education" data-index="${index}" data-field="school" value="${edu.school || ''}" placeholder="ej: Universidad XYZ">
        </div>
        <div class="field-group">
          <label>Año Inicio</label>
          <input type="text" class="editable-item-field" data-type="education" data-index="${index}" data-field="startDate" value="${edu.startDate || ''}" placeholder="2016">
        </div>
        <div class="field-group">
          <label>Año Fin</label>
          <input type="text" class="editable-item-field" data-type="education" data-index="${index}" data-field="endDate" value="${edu.endDate || ''}" placeholder="2020">
        </div>
      </div>
    </div>
  `).join('');
  
  // Agregar event listeners
  attachItemFieldListeners();
}

function attachItemFieldListeners() {
  document.querySelectorAll('.editable-item-field').forEach(field => {
    field.addEventListener('input', (e) => {
      const type = e.target.dataset.type;
      const index = parseInt(e.target.dataset.index);
      const fieldName = e.target.dataset.field;
      const value = e.target.value;
      
      // Actualizar el array de datos
      if (type === 'experience') {
        extractedData.experience[index][fieldName] = value;
      } else if (type === 'education') {
        extractedData.education[index][fieldName] = value;
      }
      
      // Marcar como editado
      e.target.classList.add('edited');
      editedFields.add(`${type}-${index}-${fieldName}`);
      updateEditedCount();
    });
  });
}

function removeExperience(index) {
  extractedData.experience.splice(index, 1);
  renderExtractedExperience();
  showToast('Experiencia eliminada', 'success');
  updateEditedCount();
}

function removeEducation(index) {
  extractedData.education.splice(index, 1);
  renderExtractedEducation();
  showToast('Educación eliminada', 'success');
  updateEditedCount();
}



function renderExtractedSkills() {
  const skillsList = document.getElementById('extractedSkillsList');
  skillsList.innerHTML = extractedSkills.map(skill => `
    <div class="extracted-skill" onclick="removeExtractedSkill('${skill}')">
      <span>${skill}</span>
      <span>×</span>
    </div>
  `).join('');
}

function removeExtractedSkill(skillName) {
  extractedSkills = extractedSkills.filter(s => s !== skillName);
  renderExtractedSkills();
  showToast(`Habilidad "${skillName}" eliminada`, 'info');
}

function updateEditedCount() {
  document.getElementById('fieldsEdited').textContent = editedFields.size;
}

async function saveExtractedData() {
  // Gather edited data
  const profileData = {
    personalInfo: {
      firstName: document.getElementById('extracted-firstName').value,
      lastName: document.getElementById('extracted-lastName').value,
      email: document.getElementById('extracted-email').value,
      phone: document.getElementById('extracted-phone').value,
      currentTitle: document.getElementById('extracted-currentTitle').value,
      city: document.getElementById('extracted-city').value,
      country: document.getElementById('extracted-country').value,
      linkedin: document.getElementById('extracted-linkedin').value,
      address: extractedData.personalInfo.address || '',
      portfolio: extractedData.personalInfo.portfolio || '',
      summary: extractedData.personalInfo.summary || ''
    },
    skills: extractedSkills,
    experience: extractedData.experience || [],
    education: extractedData.education || []
  };
  
  // Validar datos antes de guardar
  if (typeof Validators !== 'undefined') {
    const validation = Validators.validateProfile(profileData);
    
    if (!validation.valid) {
      console.error('❌ Errores de validación:', validation.errors);
      
      // Mostrar errores de información personal
      if (validation.errors.personalInfo && Object.keys(validation.errors.personalInfo).length > 0) {
        const errors = validation.errors.personalInfo;
        let errorMessages = [];
        
        for (const [field, error] of Object.entries(errors)) {
          errorMessages.push(`• ${error}`);
          
          // Marcar campo como inválido
          const fieldElement = document.getElementById(`extracted-${field}`);
          if (fieldElement) {
            fieldElement.classList.add('invalid');
            fieldElement.classList.remove('valid');
          }
        }
        
        showToast(`Errores en información personal:\n${errorMessages.join('\n')}`, 'error');
      }
      
      // Mostrar errores de experiencia
      if (validation.errors.experience && validation.errors.experience.length > 0) {
        const expErrors = validation.errors.experience.filter(e => e && Object.keys(e).length > 0);
        if (expErrors.length > 0) {
          showToast(`Hay ${expErrors.length} experiencia(s) con errores. Por favor revisa las fechas y campos requeridos.`, 'error');
        }
      }
      
      // Mostrar errores de educación
      if (validation.errors.education && validation.errors.education.length > 0) {
        const eduErrors = validation.errors.education.filter(e => e && Object.keys(e).length > 0);
        if (eduErrors.length > 0) {
          showToast(`Hay ${eduErrors.length} educación(es) con errores. Por favor revisa las fechas y campos requeridos.`, 'error');
        }
      }
      
      return; // No guardar si hay errores
    }
    
    console.log('✅ Validación exitosa');
  }
  
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    if (response.ok) {
      showToast('✅ Datos guardados exitosamente', 'success');
      currentProfile = profileData;
      
      // Hide preview
      document.getElementById('extractedDataPreview').classList.add('hidden');
      
      // Reset upload area
      document.getElementById('uploadArea').classList.remove('hidden');
      document.getElementById('cvFile').value = '';
      
      // Update stats
      updateStats(profileData);
      
      // Populate form in profile section
      populateForm(profileData);
      
      // Show navigation hint
      setTimeout(() => {
        showToast('Navega a \"Mi Perfil\" para ver y editar más detalles', 'info');
      }, 2000);
    } else {
      throw new Error('Error al guardar');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('❌ Error al guardar los datos', 'error');
  }
}

function discardExtraction() {
  if (confirm('¿Estás seguro de que quieres descartar estos datos extraídos?')) {
    document.getElementById('extractedDataPreview').classList.add('hidden');
    document.getElementById('uploadArea').classList.remove('hidden');
    document.getElementById('cvFile').value = '';
    extractedData = null;
    extractedSkills = [];
    editedFields.clear();
    showToast('Datos descartados', 'warning');
  }
}

// Add new experience
function addNewExperience() {
  if (!extractedData.experience) {
    extractedData.experience = [];
  }
  
  extractedData.experience.push({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });
  
  renderExtractedExperience();
  showToast('Nueva experiencia agregada', 'success');
  
  // Scroll to the new item
  setTimeout(() => {
    const items = document.querySelectorAll('.experience-item-editable');
    if (items.length > 0) {
      items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

// Add new education
function addNewEducation() {
  if (!extractedData.education) {
    extractedData.education = [];
  }
  
  extractedData.education.push({
    degree: '',
    school: '',
    startDate: '',
    endDate: '',
    current: false
  });
  
  renderExtractedEducation();
  showToast('Nueva educación agregada', 'success');
  
  // Scroll to the new item
  setTimeout(() => {
    const items = document.querySelectorAll('.education-item-editable');
    if (items.length > 0) {
      items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

// Make new functions global
window.removeExtractedSkill = removeExtractedSkill;
window.removeExperience = removeExperience;
window.removeEducation = removeEducation;

console.log('✅ Dashboard listo');



// ========================================
// PROFILES GENERATION WITH GROQ AI
// ========================================

let generatedProfiles = [];
let selectedProfileIndex = null;

// Setup Generate Profiles button
document.getElementById('generateProfiles')?.addEventListener('click', openProfilesModal);

// Setup modal close
document.getElementById('closeProfilesModal')?.addEventListener('click', closeProfilesModal);
document.querySelector('.modal-overlay')?.addEventListener('click', closeProfilesModal);

// Setup retry button (modal version)
document.getElementById('retryGenerateProfilesModal')?.addEventListener('click', generateProfiles);
// Setup config button (modal version) inside error view
document.getElementById('configureApiKeyModalBtn')?.addEventListener('click', openApiKeyModal);


function openProfilesModal() {
  const modal = document.getElementById('profilesModal');
  modal.classList.remove('hidden');
  
  // Reset state
  setLoadingState(true);
  
  // Generate profiles
  generateProfiles();
}

function closeProfilesModal() {
  const modal = document.getElementById('profilesModal');
  modal.classList.add('hidden');
}

function setLoadingState(isLoading, errorMessage = null) {
    // Parent Container in Step 3
    const wizardResultContainer = document.getElementById('wizardProfilesResult'); // Renamed from aiProfilesResult

    // Main Page Elements (Wizard)
    const wizardLoading = document.getElementById('wizardProfilesLoading'); // Renamed
    const wizardGrid = document.getElementById('wizardProfilesGrid'); // Renamed
    const oldMainLoading = document.getElementById('profilesLoadingMain'); // Modal fallback/legacy
    
    // Modal Elements
    const modalLoading = document.getElementById('modalProfilesLoading');
    const modalError = document.getElementById('modalProfilesError');
    const modalGrid = document.getElementById('modalProfilesGrid');
    const modalFooter = document.getElementById('profilesFooter');
    const modalErrorMsg = document.getElementById('modalProfilesErrorMessage');
    
    // Legacy/Main Error
    const mainError = document.getElementById('profilesError');

    if (isLoading) {
        // Show Loading, Hide Results
        if(wizardResultContainer) wizardResultContainer.classList.add('hidden'); // Hide result container while loading
        
        if(wizardLoading) wizardLoading.classList.remove('hidden');
        if(oldMainLoading) oldMainLoading.classList.remove('hidden');
        if(modalLoading) modalLoading.classList.remove('hidden');
        
        if(mainError) mainError.classList.add('hidden');
        if(modalError) modalError.classList.add('hidden');
        
        if(wizardGrid) wizardGrid.classList.add('hidden');
        if(modalGrid) modalGrid.classList.add('hidden');
        if(modalFooter) modalFooter.classList.add('hidden');
    } else {
        // Hide Loading
        if(wizardLoading) wizardLoading.classList.add('hidden');
        if(oldMainLoading) oldMainLoading.classList.add('hidden');
        if(modalLoading) modalLoading.classList.add('hidden');
        
        if (errorMessage) {
            // Error State
            if(wizardResultContainer) wizardResultContainer.classList.add('hidden'); // Hide results on error
            
            if(mainError) mainError.classList.remove('hidden');
            if(modalError) {
                modalError.classList.remove('hidden');
                if(modalErrorMsg) modalErrorMsg.textContent = errorMessage;
            }
        } else {
            // Success State
            if(wizardResultContainer) wizardResultContainer.classList.remove('hidden'); // Show container
            
            if(wizardGrid) wizardGrid.classList.remove('hidden'); // Show grid
            if(modalGrid) modalGrid.classList.remove('hidden');
            if(modalFooter) modalFooter.classList.remove('hidden');
        }
    }
}

async function generateProfiles() {
  try {
    // 1. UI State: Loading
    const intro = document.getElementById('aiIntroContainer');
    if(intro) intro.classList.add('hidden');
    
    setLoadingState(true);
    
    console.log('🤖 Generando perfiles profesionales con Groq AI...');
    
    // Obtener API Key si existe en localStorage
    const savedKey = localStorage.getItem('groqApiKey');
    const headers = { 'Content-Type': 'application/json' };
    if (savedKey) {
        headers['X-Groq-API-Key'] = savedKey;
    }

    const response = await fetch(`${API_URL}/profile/generate-profiles`, {
      method: 'POST',
      headers: headers
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al generar perfiles');
    }
    
    const result = await response.json();
    generatedProfiles = result.data;
    
    console.log('✅ Perfiles generados:', generatedProfiles);
    
    // 2. UI State: Success
    setLoadingState(false);
    
    renderProfiles();
    
    const actions = document.getElementById('finalActions');
    if(actions) actions.classList.remove('hidden');
    
    showToast('Perfiles generados exitosamente', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // UI State: Error
    setLoadingState(false, error.message);
    
    // Si la intro estaba visible, y hubo error, quizás la mostramos de nuevo en main page
    // pero en modal mostramos el error state
    // const intro = document.getElementById('aiIntroContainer');
    // if(intro) intro.classList.remove('hidden');
    
    showToast('Error al generar perfiles: ' + error.message, 'error');
    
    // Si es error de API Key, abrir modal de config
    if (error.message.includes('API key') || error.message.includes('401')) {
        // Delay to allow user to see error msg briefly or click button
        // openApiKeyModal(); 
    }
  }
}

function renderProfiles() {
  const grids = [
    document.getElementById('wizardProfilesGrid'),
    document.getElementById('modalProfilesGrid')
  ];
  
  const content = generatedProfiles.map((profile, index) => `
    <div class="profile-card ${selectedProfileIndex === index ? 'selected' : ''}" data-index="${index}">
      <div class="profile-card-header">
        <span class="profile-number">Perfil ${index + 1}</span>
        <span class="profile-level-badge ${profile.experienceLevel.toLowerCase().replace(' ', '-')}">${profile.experienceLevel}</span>
      </div>
      
      <h3 class="profile-title">${profile.title}</h3>
      
      <p class="profile-description">${profile.description}</p>
      
      <div class="profile-section">
        <h4>🎯 Habilidades Clave</h4>
        <div class="skills-container">
          ${profile.keySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
      
      <div class="profile-section">
        <h4>🔍 Palabras Clave</h4>
        <div class="keywords-container">
          ${profile.searchKeywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
        </div>
      </div>
      
      <div class="profile-section">
        <h4>💼 Roles Objetivo</h4>
        <ul class="roles-list">
          ${profile.targetRoles.map(role => `<li>${role}</li>`).join('')}
        </ul>
      </div>
      
      <div class="profile-actions">
        <button class="btn-select-profile" style="min-width: 40px; padding: 0 10px; margin-right: 8px; background: white; border: 1px solid #e5e7eb; color: #4b5563;" onclick="downloadProfilePDF(${index}); event.stopPropagation();" title="Descargar PDF">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
            </svg>
        </button>
        <button class="btn-select-profile ${selectedProfileIndex === index ? 'selected' : ''}" style="flex: 1;" onclick="selectProfile(${index})">
          ${selectedProfileIndex === index ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2"/>
            </svg>
            Perfil Seleccionado
          ` : 'Usar este perfil'}
        </button>
      </div>
    </div>
  `).join('');

  grids.forEach(grid => {
      if(grid) grid.innerHTML = content;
  });
  
  // grid.classList.remove('hidden'); // Ya no necesario, controlado por contenedor padre
  

  // Add click handlers to cards
  document.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking the button
      if (!e.target.closest('.btn-select-profile')) {
        const index = parseInt(card.dataset.index);
        selectProfile(index);
      }
    });
  });
}

async function downloadProfilePDF(index) {
  const profile = generatedProfiles[index];
  const baseData = currentProfile || {};
  const personalInfo = baseData.personalInfo || {};
  
  showToast('Generando PDF...', 'info');
  
  // Create template
  const element = document.createElement('div');
  element.id = 'cv-template';
  element.style.padding = '40px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.color = '#333';
  element.style.lineHeight = '1.5';
  element.style.background = 'white';
  
  // Helper for dates
  const formatDates = (exp) => {
      if (exp.dates) return exp.dates;
      if (exp.startDate) return `${exp.startDate} - ${exp.endDate || 'Presente'}`;
      return '';
  };
  
  // HTML Content
  element.innerHTML = `
    <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${personalInfo.firstName || ''} ${personalInfo.lastName || ''}</h1>
        <h2 style="margin: 5px 0 0; font-size: 18px; color: #666;">${profile.title}</h2>
        <div style="margin-top: 10px; font-size: 14px; color: #555;">
            ${personalInfo.email ? `<span>📧 ${personalInfo.email}</span>` : ''}
            ${personalInfo.phone ? `<span style="margin-left: 15px;">📱 ${personalInfo.phone}</span>` : ''}
            ${personalInfo.linkedin ? `<span style="margin-left: 15px;">🔗 LinkedIn</span>` : ''}
             ${personalInfo.city ? `<span style="margin-left: 15px;">📍 ${personalInfo.city}</span>` : ''}
        </div>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #333; text-transform: uppercase; font-size: 16px;">Perfil Profesional</h3>
        <p style="text-align: justify; white-space: pre-line;">${profile.description}</p>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #333; text-transform: uppercase; font-size: 16px;">Habilidades Clave</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${profile.keySkills.map(skill => 
                `<span style="background: #f3f4f6; padding: 4px 10px; border-radius: 4px; font-size: 13px;">${skill}</span>`
            ).join('')}
        </div>
    </div>
    
    ${baseData.experience && baseData.experience.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #333; text-transform: uppercase; font-size: 16px;">Experiencia</h3>
        ${baseData.experience.map(exp => `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <h4 style="margin: 0; font-size: 15px; font-weight: bold;">${exp.title}</h4>
                    <span style="font-size: 13px; color: #666;">${formatDates(exp)}</span>
                </div>
                <div style="font-size: 14px; color: #555; margin-bottom: 5px;">${exp.company}</div>
                <p style="margin: 5px 0; font-size: 14px;">${exp.description || ''}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${baseData.education && baseData.education.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #333; text-transform: uppercase; font-size: 16px;">Educación</h3>
        ${baseData.education.map(edu => `
            <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; font-size: 15px;">${edu.degree}</div>
                <div style="font-size: 14px; color: #555;">${edu.school} | ${edu.year || edu.endDate || ''}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
  `;
  
  // Options
  const opt = {
    margin: [10, 15],
    filename: `CV_${personalInfo.firstName || 'Candidato'}_${profile.title.replace(/[^a-z0-9]/gi, '_').substring(0,20)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Generate
  try {
      await html2pdf().from(element).set(opt).save();
      showToast('PDF descargado exitosamente', 'success');
  } catch (err) {
      console.error(err);
      showToast('Error al generar PDF', 'error');
  }
}

function selectProfile(index) {
  selectedProfileIndex = index;
  const selectedProfile = generatedProfiles[index];
  
  console.log('✅ Perfil seleccionado:', selectedProfile);
  
  // Update UI
  renderProfiles();
  
  // Save selected profile to localStorage
  localStorage.setItem('selectedProfile', JSON.stringify(selectedProfile));
  localStorage.setItem('selectedProfileIndex', index);
  
  showToast(`Perfil "${selectedProfile.title}" seleccionado`, 'success');
  
  // Close modal after a short delay
  setTimeout(() => {
    closeProfilesModal();
    
    // Show next steps toast
    setTimeout(() => {
      showToast('Ahora puedes buscar empleos con este perfil', 'info');
    }, 500);
  }, 1000);
}

// Load selected profile on init
function loadSelectedProfile() {
  const savedProfile = localStorage.getItem('selectedProfile');
  const savedIndex = localStorage.getItem('selectedProfileIndex');
  
  if (savedProfile && savedIndex) {
    selectedProfileIndex = parseInt(savedIndex);
    console.log('📌 Perfil guardado cargado:', JSON.parse(savedProfile));
  }
}

// Call on init
loadSelectedProfile();

// Make functions global
window.selectProfile = selectProfile;
window.downloadProfilePDF = downloadProfilePDF;

console.log('✅ Sistema de perfiles profesionales listo');

// ========================================
// API KEY CONFIGURATION
// ========================================

// Setup API Key modal
document.getElementById('configureApiKey')?.addEventListener('click', openApiKeyModal);
document.getElementById('closeApiKeyModal')?.addEventListener('click', closeApiKeyModal);
document.getElementById('cancelApiKey')?.addEventListener('click', closeApiKeyModal);
document.getElementById('saveApiKey')?.addEventListener('click', saveGroqApiKey);
document.getElementById('toggleApiKeyVisibility')?.addEventListener('click', toggleApiKeyVisibility);

function openApiKeyModal() {
  // Close profiles modal
  closeProfilesModal();
  
  // Open API key modal
  const modal = document.getElementById('apiKeyModal');
  modal.classList.remove('hidden');
  
  // Load saved API key if exists
  const savedApiKey = localStorage.getItem('groqApiKey');
  if (savedApiKey) {
    document.getElementById('groqApiKeyInput').value = savedApiKey;
  }
  
  // Focus input
  setTimeout(() => {
    document.getElementById('groqApiKeyInput').focus();
  }, 300);
}

function closeApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  modal.classList.add('hidden');
  
  // Clear input
  document.getElementById('groqApiKeyInput').value = '';
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('groqApiKeyInput');
  const button = document.getElementById('toggleApiKeyVisibility');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  } else {
    input.type = 'password';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  }
}

async function saveGroqApiKey() {
  const apiKey = document.getElementById('groqApiKeyInput').value.trim();
  
  if (!apiKey) {
    showToast('Por favor ingresa una API key', 'warning');
    return;
  }
  
  if (!apiKey.startsWith('gsk_')) {
    showToast('La API key de Groq debe comenzar con "gsk_"', 'warning');
    return;
  }
  
  try {
    // Save to localStorage
    localStorage.setItem('groqApiKey', apiKey);
    
    // Send to backend to save in .env (optional - requires backend endpoint)
    // For now, we'll just use it from localStorage
    
    showToast('✅ API Key guardada exitosamente', 'success');
    
    // Close modal
    closeApiKeyModal();
    
    // Show success message
    setTimeout(() => {
      showToast('Ahora puedes generar perfiles profesionales', 'info');
      
      // Reopen profiles modal and retry
      setTimeout(() => {
        openProfilesModal();
      }, 1000);
    }, 500);
    
  } catch (error) {
    console.error('Error guardando API key:', error);
    showToast('Error al guardar la API key', 'error');
  }
}

// La lógica de API Key ahora está integrada en la función generateProfiles principal.
// Bloque duplicado eliminado.

console.log('✅ Sistema de configuración de API Key listo');

// ==========================================
// JOB SEARCH & MATCHING LOGIC
// ==========================================

async function initJobSearch() {
    // 1. Validar que tengamos un perfil seleccionado del paso 3
    if (selectedProfileIndex === null || !generatedProfiles[selectedProfileIndex]) {
        showToast('Por favor selecciona un Perfil IA primero', 'warning');
        return;
    }

    const profile = generatedProfiles[selectedProfileIndex];
    console.log('🔍 Iniciando búsqueda para perfil:', profile.title);

    // 2. Ir al paso 4
    goToStep(4);
    
    // 3. UI Loading
    const loader = document.getElementById('jobSearchLoader');
    const results = document.getElementById('jobResultsList');
    if (loader) loader.classList.remove('hidden');
    if (results) results.innerHTML = ''; // Limpiar

    // Obtener ubicación y preferencias del usuario desde el formulario del Paso 2
    // Leemos directo del DOM por si el usuario lo editó y no guardamos explícitamente en el objeto
    const countryInput = document.getElementById('country');
    const remoteInput = document.getElementById('remoteOnlyPref');
    
    // Fallback al objeto currentProfile si el input no existe (raro)
    const userCountry = countryInput ? countryInput.value : (currentProfile?.personalInfo?.country || 'Chile');
    const isRemoteOnly = remoteInput ? remoteInput.checked : false;
    
    try {
        const response = await fetch(`${API_URL}/jobs/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                profile,
                preferences: { 
                    location: userCountry,
                    remoteOnly: isRemoteOnly
                }
            })
        });

        if (!response.ok) throw new Error('Error buscando empleos');

        const { data } = await response.json();
        
        // 4. Renderizar
        if (loader) loader.classList.add('hidden');
        renderJobResults(data);

    } catch (error) {
        console.error(error);
        if (loader) loader.classList.add('hidden');
        showToast('Error buscando empleos', 'error');
        if (results) results.innerHTML = `<div class="empty-state-search"><p class="text-danger">Error: ${error.message}</p></div>`;
    }
}

function renderJobResults(jobs) {
    const container = document.getElementById('jobResultsList');
    if (!container) return;

    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state-search">
                <h3>😕 No encontramos ofertas exactas</h3>
                <p>Intenta ajustar las palabras clave de tu perfil o intenta más tarde.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = jobs.map(job => {
        // Determinar clase de badge según score
        let badgeClass = 'low';
        let matchText = 'Match Bajo';
        
        if (job.matchScore >= 70) { 
            badgeClass = 'high'; 
            matchText = '🔥 Super Match';
        } else if (job.matchScore >= 40) { 
            badgeClass = 'medium'; 
            matchText = '✨ Buen Match';
        }

        return `
            <div class="job-card" onclick="window.open('${job.url}', '_blank')">
                <div class="job-header">
                    <div>
                        <div class="job-title">${job.title}</div>
                        <div class="job-company">🏢 ${job.company} • 📍 ${job.location || 'Remoto'}</div>
                    </div>
                    <div class="match-badge ${badgeClass}">
                        ${matchText} ${job.matchScore}%
                    </div>
                </div>
                
                <div class="job-details">
                    <div class="job-detail-item">📅 ${new Date(job.date).toLocaleDateString()}</div>
                    <div class="job-detail-item">💰 ${job.salary || 'N/A'}</div>
                    <div class="job-detail-item">🌐 ${job.source}</div>
                </div>

                <p class="text-sm text-gray-600 mb-3">
                    ${job.description ? stripHtml(job.description).substring(0, 150) + '...' : 'Ver detalles...'}
                </p>

                <div class="job-tags">
                   ${(job.tags || []).slice(0, 5).map(tag => `<span class="job-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function stripHtml(html) {
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

// Exponer globalmente
window.initJobSearch = initJobSearch;

// ==========================================
// WIZARD LOGIC ADDITIONS (Continuación)
// ==========================================

function attemptNavigation(step) {
  // Siempre permitir ir al paso 1
  if (step === 1) {
    goToStep(1);
    return;
  }
  
  // Para avanzar, necesitamos datos
  if (!currentProfile) {
    showToast('⚠️ Primero debes subir un CV para continuar', 'error');
    return;
  }
  
  // Si quiere ir al paso 3 pero no hemos validado (opcional, por ahora permitimos saltar)
  goToStep(step);
}

function goToStep(step) {
  // Ocultar todos los contenidos de paso
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  
  // Mostrar contenido objetivo
  const targetContent = document.getElementById(`step${step}-content`);
  if (targetContent) {
    targetContent.classList.remove('hidden');
  }

  // Actualizar indicadores
  updateStepperIndicators(step);

  // Scroll arriba
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepperIndicators(currentStep) {
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`step${i}-indicator`);
    if (!indicator) continue;

    indicator.classList.remove('active', 'completed');
    
    // Set active class
    if (i === currentStep) {
      indicator.classList.add('active');
    } else if (i < currentStep) {
      indicator.classList.add('completed');
    }
    
    // También pintar el círculo interior si usamos CSS específico
    const circle = indicator.querySelector('.step-counter');
    if (circle) {
        if(i < currentStep) {
            circle.innerText = '✓';
            circle.style.backgroundColor = 'var(--primary-color)';
            circle.style.color = 'white';
        } else {
            circle.innerText = i;
            circle.style.backgroundColor = ''; // reset
            circle.style.color = ''; // reset
        }
    }
  }
}

function resetWizard() {
  if (confirm('¿Estás seguro? Se perderán los datos actuales no guardados.')) {
    goToStep(1);
    const fileInput = document.getElementById('cvUpload');
    if(fileInput) fileInput.value = '';
    
    const preview = document.getElementById('extractedDataPlaceholder');
    if (preview) preview.innerHTML = '';
  }
}

function finishWizard() {
  showToast('¡Proceso completado exitosamente!', 'success');
  // Aquí podríamos redirigir o mostrar confeti
}

// Nueva función unificada de manejo de upload para el wizard
async function handleFileUploadWizard(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        showToast('Solo se permiten archivos PDF', 'error');
        return;
    }

    // UI Loading
    document.getElementById('uploadArea').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    const formData = new FormData();
    formData.append('cv', file);

    try {
        animateProgress(0, 50, 800);
        
        const response = await fetch(`${API_URL}/upload/cv`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Error en carga');

        animateProgress(50, 100, 500);
        const result = await response.json();

        // Delay para UX
        setTimeout(() => {
            document.getElementById('uploadProgress').classList.add('hidden');
            document.getElementById('uploadArea').classList.remove('hidden'); 
            
            // Poblar datos en el formulario existente del paso 2
            populateForm(result.data);
            
            goToStep(2);
            showToast('CV procesado correctamente', 'success');
            
            currentProfile = result.data; 
        }, 1000);

    } catch (error) {
        console.error(error);
        showToast('Error procesando CV', 'error');
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadArea').classList.remove('hidden');
    }
}

// prepareStep2 Eiminada porque el formulario ya es estático en el HTML


// ==========================================
// NEW FEATURES: CERTIFICATIONS, LANGUAGES, PROJECTS & VALIDATION
// ==========================================

// 1. Validaciones
// Validators loaded from js/validators.js

// 2. Nuevas Secciones de Renderizado

// Certificaciones
function renderExtractedCertifications() {
    const list = document.getElementById('extractedCertificationsList');
    if(!list) return; // Si no existe el elemento en HTML aun, salir

    if (!extractedData.certifications || extractedData.certifications.length === 0) {
        list.innerHTML = '<div class="empty-list">No se detectaron certificaciones</div>';
        return;
    }

    list.innerHTML = extractedData.certifications.map((cert, index) => `
        <div class="certification-item-editable">
            <div class="item-header">
                <strong>Certificación ${index + 1}</strong>
                <button type="button" class="btn-remove-item" onclick="removeCertification(${index})" title="Eliminar">×</button>
            </div>
            <div class="editable-fields-grid">
                <div class="field-group">
                    <label>Nombre</label>
                    <input type="text" class="editable-item-field" data-type="certification" data-index="${index}" data-field="name" value="${cert.name || ''}" placeholder="Ej: AWS Certified">
                </div>
                <div class="field-group">
                    <label>Emisor</label>
                    <input type="text" class="editable-item-field" data-type="certification" data-index="${index}" data-field="issuer" value="${cert.issuer || ''}" placeholder="Ej: Amazon">
                </div>
                <div class="field-group">
                    <label>Año</label>
                    <input type="text" class="editable-item-field" data-type="certification" data-index="${index}" data-field="date" value="${cert.date || ''}" placeholder="2023">
                </div>
            </div>
        </div>
    `).join('');
    
    attachItemFieldListeners();
}

function addNewCertification() {
    if (!extractedData.certifications) extractedData.certifications = [];
    extractedData.certifications.push({ name: '', issuer: '', date: '' });
    renderExtractedCertifications();
    showToast('Nueva certificación agregada', 'success');
}

function removeCertification(index) {
    extractedData.certifications.splice(index, 1);
    renderExtractedCertifications();
    showToast('Certificación eliminada', 'success');
    updateEditedCount();
}

// Idiomas
function renderExtractedLanguages() {
    const list = document.getElementById('extractedLanguagesList');
    if(!list) return;

    if (!extractedData.languages || extractedData.languages.length === 0) {
        list.innerHTML = '<div class="empty-list">No se detectaron idiomas</div>';
        return;
    }

    list.innerHTML = extractedData.languages.map((lang, index) => `
        <div class="language-item-editable">
             <div class="item-header">
                <strong>Idioma ${index + 1}</strong>
                <button type="button" class="btn-remove-item" onclick="removeLanguage(${index})" title="Eliminar">×</button>
            </div>
            <div class="editable-fields-grid">
                <div class="field-group">
                    <label>Idioma</label>
                    <input type="text" class="editable-item-field" data-type="language" data-index="${index}" data-field="language" value="${lang.language || ''}" placeholder="Ej: Inglés">
                </div>
                <div class="field-group">
                    <label>Nivel</label>
                    <select class="editable-item-field" data-type="language" data-index="${index}" data-field="level">
                        <option value="Básico" ${lang.level === 'Básico' ? 'selected' : ''}>Básico</option>
                        <option value="Intermedio" ${lang.level === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
                        <option value="Avanzado" ${lang.level === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
                        <option value="Nativo" ${lang.level === 'Nativo' ? 'selected' : ''}>Nativo</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');

    attachItemFieldListeners();
}

function addNewLanguage() {
    if (!extractedData.languages) extractedData.languages = [];
    extractedData.languages.push({ language: '', level: 'Intermedio' });
    renderExtractedLanguages();
    showToast('Nuevo idioma agregado', 'success');
}

function removeLanguage(index) {
    extractedData.languages.splice(index, 1);
    renderExtractedLanguages();
    showToast('Idioma eliminado', 'success');
    updateEditedCount();
}


// Proyectos
function renderExtractedProjects() {
    const list = document.getElementById('extractedProjectsList');
    if(!list) return;

    if (!extractedData.projects || extractedData.projects.length === 0) {
        list.innerHTML = '<div class="empty-list">No se detectaron proyectos</div>';
        return;
    }

    list.innerHTML = extractedData.projects.map((proj, index) => `
        <div class="project-item-editable">
            <div class="item-header">
                <strong>Proyecto ${index + 1}</strong>
                <button type="button" class="btn-remove-item" onclick="removeProject(${index})" title="Eliminar">×</button>
            </div>
            <div class="editable-fields-grid">
                <div class="field-group">
                    <label>Nombre del Proyecto</label>
                    <input type="text" class="editable-item-field" data-type="project" data-index="${index}" data-field="name" value="${proj.name || ''}" placeholder="Ej: App E-commerce">
                </div>
                <div class="field-group">
                    <label>Link (URL)</label>
                    <input type="text" class="editable-item-field" data-type="project" data-index="${index}" data-field="url" value="${proj.url || ''}" placeholder="https://...">
                </div>
                <div class="field-group full-width">
                     <label>Descripción</label>
                     <textarea class="editable-item-field" data-type="project" data-index="${index}" data-field="description" rows="2">${proj.description || ''}</textarea>
                </div>
            </div>
        </div>
    `).join('');

    attachItemFieldListeners();
}

function addNewProject() {
    if (!extractedData.projects) extractedData.projects = [];
    extractedData.projects.push({ name: '', url: '', description: '' });
    renderExtractedProjects();
    showToast('Nuevo proyecto agregado', 'success');
}

function removeProject(index) {
    extractedData.projects.splice(index, 1);
    renderExtractedProjects();
    showToast('Proyecto eliminado', 'success');
    updateEditedCount();
}

// Make globally available
window.addNewCertification = addNewCertification;
window.removeCertification = removeCertification;
window.addNewLanguage = addNewLanguage;
window.removeLanguage = removeLanguage;
window.addNewProject = addNewProject;
window.removeProject = removeProject;
window.Validators = Validators;

// Update Attach Listeners to handle new types
// Se reemplaza la anterior para incluir los nuevos tipos
const originalAttachListeners = attachItemFieldListeners;
attachItemFieldListeners = function() {
    document.querySelectorAll('.editable-item-field').forEach(field => {
        field.addEventListener('input', (e) => {
            const type = e.target.dataset.type;
            const index = parseInt(e.target.dataset.index);
            const fieldName = e.target.dataset.field;
            const value = e.target.value;

            // Handle new types
            if (type === 'certification') extractedData.certifications[index][fieldName] = value;
            else if (type === 'language') extractedData.languages[index][fieldName] = value;
            else if (type === 'project') extractedData.projects[index][fieldName] = value;
            else if (type === 'experience') extractedData.experience[index][fieldName] = value;
            else if (type === 'education') extractedData.education[index][fieldName] = value;

            e.target.classList.add('edited');
            editedFields.add(`${type}-${index}-${fieldName}`);
            updateEditedCount();
        });
    });
};
