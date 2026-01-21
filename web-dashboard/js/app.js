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

// Exponer globalmente para validaciones
window.currentProfile = currentProfile;

// Init
// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('🚀 AutoApply Wizard iniciado');
  
  // Setup Auth UI
  setupAuthUI();
  
  // Theme UI
  if(window.UI && window.UI.initTheme) {
      window.UI.initTheme();
  }
  
  // Wait for auth before proceeding
    if (!window.auth.isAuthenticated()) {
        console.log('🔒 Esperando autenticación...');
        return; // Stop init until logged in
    }

  // Setup Wizard specific listeners
  // CV Upload Logic delegated to module
  if(window.CVProcessor) {
      window.CVProcessor.setupUpload();
  }

  // Setup Profile Logic (Modales, etc. para soporte legacy interno)
  setupProfileForm();
  
  // Check Initial State to decide Step
  // Check Initial State to decide Step (Offline Mode)
  try {
    // Usar el ProfilesManager para saber si hay perfil activo
    if (window.ProfilesManager && window.ProfilesManager.currentProfile) {
        // Simular perfil cargado
        const profile = window.ProfilesManager.currentProfile;
        
        // Si tiene nombre (o datos básicos), asumimos que ya pasó el paso 1
        // Nota: En modelo offline, los datos completos pueden estar en 'panoptes_profile_data_[id]'
        const profileData = localStorage.getItem(`panoptes_profile_data_${profile.id}`);
        
        if (profileData) {
            console.log("Perfil detectado (Local), saltando al paso 3");
            const parsedData = JSON.parse(profileData);
            currentProfile = parsedData;
            
            // Llenar vista previa
            populateForm(parsedData);
            
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

function setupAuthUI() {
    const authModal = document.getElementById('authModal');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    const toggleBtn = document.getElementById('toggleAuthMode');
    const submitBtn = document.getElementById('authSubmitBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    let isLoginMode = true;

    // Check auth status
    if (!window.auth.isAuthenticated()) {
        if(authModal) authModal.classList.remove('hidden');
    } else {
        if(logoutBtn) logoutBtn.classList.remove('hidden');
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.auth.logout();
        });
    }

    // Toggle Mode
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
             isLoginMode = !isLoginMode;
             const title = document.getElementById('authTitle');
             const subtitle = document.getElementById('authSubtitle');
             
             if (isLoginMode) {
                 title.textContent = window.t('login');
                 subtitle.textContent = window.t('please_login');
                 submitBtn.textContent = window.t('login_button');
                 toggleBtn.textContent = window.t('need_account');
             } else {
                 title.textContent = window.t('register');
                 subtitle.textContent = window.t('need_account'); // Reusing prompt logic
                 submitBtn.textContent = window.t('register_button');
                 toggleBtn.textContent = window.t('have_account');
             }
             if(authError) authError.classList.add('hidden');
        });
    }

    // Submit
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            
            if(authError) authError.classList.add('hidden');
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<div class="spinner !border-white/20 !w-5 !h-5 !border-l-white inline-block"></div>';

            try {
                if (isLoginMode) {
                    await window.auth.login(email, password);
                    showToast(window.t('login_success'), 'success');
                } else {
                    await window.auth.register(email, password);
                    showToast(window.t('register_success'), 'success');
                }
                
                if(authModal) authModal.classList.add('hidden');
                if(logoutBtn) logoutBtn.classList.remove('hidden');
                
                // Recargar estado
                 window.location.reload();

            } catch (error) {
                console.error(error);
                if(authError) {
                    authError.textContent = error.message;
                    authError.classList.remove('hidden');
                }
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText;
            }
        });
    }
}

// Navigation
// Navigation logic delegated to UI module
if (window.UI) {
    window.UI.setupNavigation();
}

// Upload
// Upload logic moved to js/cvProcessor.js

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
      if (confirm(window.t('confirm_clear_data'))) {
        if(modalForm) modalForm.reset();
        if(verifyForm) verifyForm.reset();
        skills = [];
        renderSkills();
        showToast(window.t('data_cleared'), 'warning');
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
      const el3 = document.getElementById('extracted-' + baseId);
      if(el3) el3.value = v;
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
             if(window.CVProcessor) window.CVProcessor.addExperienceField(exp);
          });
      }
  }

  // Education
  const eduContainer = document.getElementById('educationContainer');
  if (eduContainer) {
      eduContainer.innerHTML = ''; // Limpiar
      if (education && Array.isArray(education)) {
          education.forEach(edu => {
             if(window.CVProcessor) window.CVProcessor.addEducationField(edu);
          });
      }
  }
}

// Helper para crear inputs dinámicos de experiencia (Cyberpunk Style)
// Helper para crear inputs dinámicos de experiencia (Cyberpunk Style)
// Helper functions moved to js/cvProcessor.js


function updateStats(profile) {
  const completeness = calculateCompleteness(profile);
  const fieldsCount = countExtractedFields(profile);
  
  const elCompleteness = document.getElementById('profileCompleteness');
  if(elCompleteness) elCompleteness.textContent = completeness + '%';
  
  const elFields = document.getElementById('fieldsCount');
  if(elFields) elFields.textContent = fieldsCount;
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
      showToast(window.t('profile_saved_success'), 'success');
      currentProfile = profileData;
      updateStats(profileData);
    } else {
      throw new Error('Error al guardar');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast(window.t('error_saving_profile'), 'error');
  }
}

// Toast Notifications


// Extension Installation
document.getElementById('installExtension')?.addEventListener('click', () => {
  showToast(window.t('install_extension_msg'), 'info');
});

// Test Extension
document.getElementById('testExtension')?.addEventListener('click', () => {
  window.open('https://docs.google.com/forms/d/e/1FAIpQLSf-test/viewform', '_blank');
  showToast(window.t('test_extension_msg'), 'success');
});

// Make functions global for inline event handlers

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
  
  // Render quality score
  if (window.CVQualityScore) {
    window.CVQualityScore.renderScore(data);
  }
  
  // Setup buttons
  document.getElementById('saveExtractedData').addEventListener('click', saveExtractedData);
  document.getElementById('discardExtraction').addEventListener('click', discardExtraction);
  document.getElementById('addExperience').addEventListener('click', addNewExperience);
  document.getElementById('addEducation').addEventListener('click', addNewEducation);
  
  // Add edit icons to fields
  addEditIconsToFields();
}

/**
 * Agregar iconos de edición a los campos
 */
function addEditIconsToFields() {
  const fields = document.querySelectorAll('.glass-input, .editable-item-field');
  fields.forEach(field => {
    if (field.parentElement && !field.parentElement.querySelector('.edit-icon')) {
      const icon = document.createElement('span');
      icon.className = 'edit-icon material-symbols-outlined';
      icon.textContent = 'edit';
      icon.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); opacity: 0; transition: opacity 0.2s; color: var(--primary); font-size: 16px; pointer-events: none;';
      
      // Asegurar que el parent tenga position relative
      if (field.parentElement.style.position !== 'relative') {
        field.parentElement.style.position = 'relative';
      }
      
      field.parentElement.appendChild(icon);
      
      // Show icon on hover
      field.parentElement.addEventListener('mouseenter', () => {
        icon.style.opacity = '1';
      });
      
      field.parentElement.addEventListener('mouseleave', () => {
        if (!field.matches(':focus')) {
          icon.style.opacity = '0';
        }
      });
      
      // Keep icon visible when focused
      field.addEventListener('focus', () => {
        icon.style.opacity = '1';
      });
      
      field.addEventListener('blur', () => {
        icon.style.opacity = '0';
      });
    }
  });
}

/**
 * Toggle section collapse/expand
 */
function toggleSection(sectionCard) {
  sectionCard.classList.toggle('collapsed');
}

/**
 * Update section counters
 */
function updateSectionCounters() {
  // Experience count
  const expCount = extractedData.experience ? extractedData.experience.length : 0;
  const expCountEl = document.getElementById('expCount');
  if (expCountEl) expCountEl.textContent = `(${expCount})`;
  
  // Education count
  const eduCount = extractedData.education ? extractedData.education.length : 0;
  const eduCountEl = document.getElementById('eduCount');
  if (eduCountEl) eduCountEl.textContent = `(${eduCount})`;
  
  // Skills count
  const skillsCount = extractedSkills ? extractedSkills.length : 0;
  const skillsCountEl = document.getElementById('skillsCount');
  if (skillsCountEl) skillsCountEl.textContent = `(${skillsCount})`;
}

// Exponer globalmente
window.toggleSection = toggleSection;


function renderExtractedExperience() {
  const experienceList = document.getElementById('extractedExperienceList');
  
  if (!experienceList) return; // Guard clause

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
  
  // Update counter
  updateSectionCounters();
}

function renderExtractedEducation() {
  const educationList = document.getElementById('extractedEducationList');
  
  if (!educationList) return; // Guard clause

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
  showToast(window.t('exp_deleted'), 'success');
  updateEditedCount();
}

function removeEducation(index) {
  extractedData.education.splice(index, 1);
  renderExtractedEducation();
  showToast(window.t('edu_deleted'), 'success');
  updateEditedCount();
}



function renderExtractedSkills() {
  const skillsList = document.getElementById('extractedSkillsList');
  if (!skillsList) return;
  
  if (!extractedSkills || extractedSkills.length === 0) {
      skillsList.innerHTML = '<div class="empty-list">No se detectaron habilidades</div>';
      return;
  }

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
  showToast(window.t('skill_deleted_with_name', {name: skillName}), 'info');
}

function updateEditedCount() {
  const el = document.getElementById('fieldsEdited');
  if(el) el.textContent = editedFields.size;
}

async function saveExtractedData() {
  // Helper
  const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
  };

  // Gather edited data
  const profileData = {
    personalInfo: {
      firstName: getVal('extracted-firstName'),
      lastName: getVal('extracted-lastName'),
      email: getVal('extracted-email'),
      phone: getVal('extracted-phone'),
      currentTitle: getVal('extracted-currentTitle'),
      city: getVal('extracted-city'),
      country: getVal('extracted-country'),
      linkedin: getVal('extracted-linkedin'),
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
        
        showToast(window.t('personal_info_errors') + `:\n${errorMessages.join('\n')}`, 'error');
      }
      
      // Mostrar errores de experiencia
      if (validation.errors.experience && validation.errors.experience.length > 0) {
        const expErrors = validation.errors.experience.filter(e => e && Object.keys(e).length > 0);
        if (expErrors.length > 0) {
          showToast(window.t('validation_errors_exp', {count: expErrors.length}), 'error');
        }
      }
      
      // Mostrar errores de educación
      if (validation.errors.education && validation.errors.education.length > 0) {
        const eduErrors = validation.errors.education.filter(e => e && Object.keys(e).length > 0);
        if (eduErrors.length > 0) {
          showToast(window.t('validation_errors_edu', {count: eduErrors.length}), 'error');
        }
      }
      
      return; // No guardar si hay errores
    }
    
    console.log('✅ Validación exitosa');
  }
  
  // Save Logic (Offline/Mode)
  try {
    console.log('💾 Guardando perfil en modo offline...');
    
    // 1. Guardar en LocalStorage (Persistencia)
    // Si ya existe un perfil cargado, actualizamos ese ID, si no, creamos uno nuevo.
    let profileId;
    if (currentProfile && currentProfile.id) {
        profileId = currentProfile.id;
        // Merge data
        currentProfile = { ...currentProfile, ...profileData };
    } else {
        profileId = 'local_' + Date.now();
        currentProfile = { 
            id: profileId,
            ...profileData,
            createdAt: new Date().toISOString()
        };
    }
    
    // Guardar datos completos del perfil
    localStorage.setItem(`panoptes_profile_data_${profileId}`, JSON.stringify(currentProfile));
    
    // Exponer globalmente
    window.currentProfile = currentProfile;
    
    // Actualizar lista de perfiles si es nuevo
    if (window.ProfilesManager) {
        const profiles = window.ProfilesManager.profiles || [];
        const existingIndex = profiles.findIndex(p => p.id === profileId);
        
        const summaryProfile = {
            id: profileId,
            name: `${profileData.personalInfo.firstName} ${profileData.personalInfo.lastName}`,
            title: profileData.personalInfo.currentTitle,
            isDefault: profiles.length === 0, // Make default if first
            lastUpdated: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            profiles[existingIndex] = { ...profiles[existingIndex], ...summaryProfile };
        } else {
            profiles.push(summaryProfile);
        }
        
        window.ProfilesManager.profiles = profiles;
        window.ProfilesManager.saveProfilesToLocal();
        window.ProfilesManager.currentProfile = summaryProfile;
        window.ProfilesManager.updateProfileUI(); // Update Header UI
    }

    showToast(window.t('data_saved'), 'success');
      
    // Update stats
    updateStats(currentProfile);
      
    // Populate form in profile section (Step 2)
    populateForm(currentProfile);
    
    // AVANZAR AL PASO 2 (Verificación)
    goToStep(2);
      
  } catch (error) {
    console.error('Error:', error);
    showToast(window.t('error_saving_data'), 'error');
  }
}

function discardExtraction() {
  if (confirm(window.t('confirm_discard_extracted'))) {
    document.getElementById('extractedDataPreview').classList.add('hidden');
    document.getElementById('uploadArea').classList.remove('hidden');
    document.getElementById('cvFile').value = '';
    extractedData = null;
    extractedSkills = [];
    editedFields.clear();
    showToast(window.t('data_discarded'), 'warning');
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
  showToast(window.t('new_exp_added'), 'success');
  
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
  showToast(window.t('new_edu_added'), 'success');
  
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
  if (modal) modal.classList.add('hidden');
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
    
    console.log('🤖 Generando perfiles profesionales...');
    
    // Obtener API Key si existe en localStorage
    const savedKey = localStorage.getItem('groqApiKey');
    
    // MODO OFFLINE: Si no hay API key, generar perfiles mock
    if (!savedKey) {
      console.log('⚠️ No hay API Key configurada, generando perfiles mock...');
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar perfiles mock basados en currentProfile
      const baseProfile = window.currentProfile || {};
      const personalInfo = baseProfile.personalInfo || {};
      const skills = baseProfile.skills || ['JavaScript', 'React', 'Node.js'];
      
      generatedProfiles = [
        {
          title: `${personalInfo.currentTitle || 'Full Stack Developer'} - Tech Innovator`,
          experienceLevel: 'Senior',
          description: 'Perfil optimizado para startups tecnológicas y empresas innovadoras. Énfasis en stack moderno y metodologías ágiles.',
          keySkills: skills.slice(0, 5),
          summary: `Profesional con experiencia en desarrollo full-stack, especializado en tecnologías modernas y arquitecturas escalables.`,
          ...baseProfile
        },
        {
          title: `${personalInfo.currentTitle || 'Software Engineer'} - Enterprise Specialist`,
          experienceLevel: 'Mid-Senior',
          description: 'Perfil enfocado en grandes corporaciones. Destaca experiencia en sistemas enterprise y trabajo en equipo.',
          keySkills: [...skills.slice(0, 3), 'Teamwork', 'Agile'],
          summary: `Ingeniero de software con sólida experiencia en entornos corporativos y desarrollo de soluciones empresariales.`,
          ...baseProfile
        },
        {
          title: `${personalInfo.currentTitle || 'Tech Lead'} - Remote Expert`,
          experienceLevel: 'Senior',
          description: 'Perfil optimizado para trabajo remoto. Resalta habilidades de comunicación y autonomía.',
          keySkills: [...skills.slice(0, 3), 'Remote Work', 'Communication'],
          summary: `Líder técnico con amplia experiencia en equipos distribuidos y gestión remota de proyectos.`,
          ...baseProfile
        }
      ];
      
      console.log('✅ Perfiles mock generados:', generatedProfiles);
      
      // 2. UI State: Success
      setLoadingState(false);
      renderProfiles();
      
      const actions = document.getElementById('finalActions');
      if(actions) actions.classList.remove('hidden');
      
      showToast('Perfiles generados (Modo Offline)', 'success');
      
      return;
    }
    
    // MODO ONLINE: Llamar al backend con API Key
    const headers = { 
      'Content-Type': 'application/json',
      'X-Groq-API-Key': savedKey
    };

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
    
    showToast(window.t('profiles_generated'), 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // UI State: Error
    setLoadingState(false, error.message);
    
    showToast(window.t('error_generating_profiles') + ': ' + error.message, 'error');
    
    // Si es error de API Key, sugerir configuración
    if (error.message.includes('API key') || error.message.includes('401')) {
        setTimeout(() => {
          showToast('Configura tu API Key de Groq para usar IA', 'info');
        }, 2000);
    }
  }
}

function renderProfiles() {
  const grids = [
    document.getElementById('wizardProfilesGrid'),
    document.getElementById('modalProfilesGrid')
  ];
  
  const content = generatedProfiles.map((profile, index) => `
    <div class="holographic-border rounded-xl group relative p-[1px] cursor-pointer profile-card" data-index="${index}">
        <div class="holographic-inner bg-[#131118]/80 backdrop-blur-md h-full rounded-xl p-5 flex flex-col gap-4 border border-white/10 hover:border-primary/50 transition-colors ${selectedProfileIndex === index ? 'border-primary bg-primary/5' : ''}">
            <div class="flex justify-between items-start">
                 <div class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-gray-400 uppercase tracking-wider font-bold">ID-${index+1}</div>
                 <span class="px-2 py-0.5 rounded text-[10px] bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 font-bold uppercase tracking-wide">${profile.experienceLevel}</span>
            </div>
            <div>
                <h3 class="text-xl font-bold text-white">${profile.title}</h3>
                <p class="text-sm text-gray-400 mt-2 line-clamp-3">${profile.description}</p>
            </div>
            <div class="flex flex-wrap gap-2 mt-auto pt-2">
                ${profile.keySkills.slice(0,3).map(skill => `<span class="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-gray-300">${skill}</span>`).join('')}
            </div>
            
            <div class="flex gap-2 mt-2">
                 <button class="btn-select-profile flex-1 h-10 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/50 hover:border-primary transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold shadow-[0_0_10px_rgba(147,89,248,0.1)] hover:shadow-glow-primary group-hover:translate-y-[-2px]" onclick="selectProfile(${index})">
                    ${selectedProfileIndex === index ? '<span class="material-symbols-outlined text-[16px]">check_circle</span> SELECTED' : 'SELECT TARGET'}
                </button>
                <button class="w-10 h-10 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors" onclick="downloadProfilePDF(${index}); event.stopPropagation();" title="Download Resume PDF">
                    <span class="material-symbols-outlined text-[18px]">download</span>
                </button>
            </div>
        </div>
    </div>
  `).join('');

  grids.forEach(grid => {
      if(grid) grid.innerHTML = content;
  });
  
  // Add click handlers to cards
  document.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking the button directly (managed by inline onclick)
      // But we leave this here for card-area clicks if we want
      if (!e.target.closest('button')) {
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
  
  showToast(window.t('generating_pdf'), 'info');
  
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
      showToast(window.t('pdf_downloaded'), 'success');
  } catch (err) {
      console.error(err);
      showToast(window.t('error_generating_pdf'), 'error');
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
  
  showToast(window.t('profile_selected_with_name', {title: selectedProfile.title}), 'success');
  
  // Close modal after a short delay
  setTimeout(() => {
    closeProfilesModal();
    
    // Show next steps toast
    setTimeout(() => {
      showToast(window.t('now_search_jobs'), 'info');
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

// Exponer globalmente
window.openApiKeyModal = openApiKeyModal;

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
    showToast(window.t('enter_api_key'), 'warning');
    return;
  }
  
  if (!apiKey.startsWith('gsk_')) {
    showToast(window.t('api_key_format'), 'warning');
    return;
  }
  
  try {
    // Save to localStorage
    localStorage.setItem('groqApiKey', apiKey);
    
    // Send to backend to save in .env (optional - requires backend endpoint)
    // For now, we'll just use it from localStorage
    
    showToast(window.t('api_key_saved'), 'success');
    
    // Close modal
    closeApiKeyModal();
    
    // Show success message
    setTimeout(() => {
      showToast(window.t('now_generate_profiles'), 'info');
      
      // Reopen profiles modal and retry
      setTimeout(() => {
        openProfilesModal();
      }, 1000);
    }, 500);
    
  } catch (error) {
    console.error('Error guardando API key:', error);
    showToast(window.t('error_saving_api_key'), 'error');
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
        showToast(window.t('select_ai_profile_first'), 'warning');
        return;
    }

    const profile = generatedProfiles[selectedProfileIndex];
    
    // 2. Ir al paso 4
    goToStep(4);
    
    // 3. Delegar al módulo
    if (window.JobSearch) {
        window.JobSearch.init(profile);
    } else {
        console.error("JobSearch module not loaded");
    }
}



// Exponer globalmente
window.initJobSearch = initJobSearch;

// ==========================================
// WIZARD LOGIC ADDITIONS (Continuación)
// ==========================================



const STATE_KEY = 'panoptes_state_v2';

function saveState(step) {
    const state = {
        currentProfile: window.currentProfile || null,
        generatedProfiles: window.generatedProfiles || [],
        extractedData: window.extractedData || {}, 
        selectedProfileIndex: window.selectedProfileIndex || -1,
        step: step || 1,
        timestamp: Date.now()
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    if (!saved) return;
    
    try {
        const state = JSON.parse(saved);
        // Expiry check (4 hours)
        if (Date.now() - state.timestamp > 14400000) {
            localStorage.removeItem(STATE_KEY);
            return;
        }

        if (state.currentProfile) window.currentProfile = state.currentProfile;
        if (state.generatedProfiles) window.generatedProfiles = state.generatedProfiles;
        if (state.extractedData) window.extractedData = state.extractedData;
        if (state.selectedProfileIndex) window.selectedProfileIndex = state.selectedProfileIndex;

        // Restore UI based on state
        if (state.currentProfile) {
            document.getElementById('uploadArea').classList.add('hidden');
            // If Step 1, show extracted preview
            if (state.step === 1) {
                 document.getElementById('extractedDataPreview').classList.remove('hidden');
                 populateForm(state.currentProfile); // Populates preview inputs
            }
             // Always populate Step 2 form just in case
            populateForm(state.currentProfile);
        }

        if (state.generatedProfiles && state.generatedProfiles.length > 0) {
             renderProfiles();
             document.getElementById('aiIntroContainer').classList.add('hidden');
             document.getElementById('wizardProfilesResult').classList.remove('hidden');
        }

        if (state.step > 1) {
            console.log('Restoring step:', state.step);
            goToStep(state.step);
        }

    } catch (e) {
        console.error('Error loading state:', e);
        localStorage.removeItem(STATE_KEY);
    }
}



// Auto-load on init
document.addEventListener('DOMContentLoaded', loadState);

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
  if (confirm(window.t('confirm_discard_unsaved'))) {
    goToStep(1);
    const fileInput = document.getElementById('cvUpload');
    if(fileInput) fileInput.value = '';
    
    const preview = document.getElementById('extractedDataPlaceholder');
    if (preview) preview.innerHTML = '';
  }
}

function finishWizard() {
  showToast(window.t('process_completed'), 'success');
  // Aquí podríamos redirigir o mostrar confeti
}

// Nueva función unificada de manejo de upload para el wizard
async function handleFileUploadWizard(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        showToast(window.t('only_pdf_allowed'), 'error');
        return;
    }

    // UI Loading
    document.getElementById('uploadArea').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    const formData = new FormData();
    formData.append('cv', file);
    
    // Enviar API Key si existe localmente para habilitar parsing con IA
    const storedApiKey = localStorage.getItem('groqApiKey');
    if (storedApiKey) {
        formData.append('groqApiKey', storedApiKey);
    }

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
            showToast(window.t('cv_processed_correctly'), 'success');
            
            currentProfile = result.data; 
        }, 1000);

    } catch (error) {
        console.error(error);
        showToast(window.t('error_processing_cv_short'), 'error');
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
    showToast(window.t('new_cert_added'), 'success');
}

function removeCertification(index) {
    extractedData.certifications.splice(index, 1);
    renderExtractedCertifications();
    showToast(window.t('cert_deleted'), 'success');
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
    showToast(window.t('new_lang_added'), 'success');
}

function removeLanguage(index) {
    extractedData.languages.splice(index, 1);
    renderExtractedLanguages();
    showToast(window.t('lang_deleted'), 'success');
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
    showToast(window.t('new_project_added'), 'success');
}

function removeProject(index) {
    extractedData.projects.splice(index, 1);
    renderExtractedProjects();
    showToast(window.t('project_deleted'), 'success');
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
