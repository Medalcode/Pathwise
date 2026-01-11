// AutoApply Dashboard - Main Application

const API_URL = 'http://localhost:3000/api';

// State
let currentProfile = null;
let skills = [];

// Init
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('🚀 AutoApply Dashboard iniciado');
  
  setupNavigation();
  setupUpload();
  setupProfileForm();
  loadProfile();
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
  const form = document.getElementById('profileForm');
  const skillInput = document.getElementById('skillInput');
  const resetBtn = document.getElementById('resetForm');
  
  // Skill management
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
  
  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProfile();
  });
  
  // Reset
  resetBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
      form.reset();
      skills = [];
      renderSkills();
      showToast('Formulario limpiado', 'warning');
    }
  });
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
  const skillsList = document.getElementById('skillsList');
  skillsList.innerHTML = skills.map(skill => `
    <div class="skill-tag">
      <span>${skill}</span>
      <button type="button" onclick="removeSkill('${skill}')">&times;</button>
    </div>
  `).join('');
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
  const { personalInfo } = profile;
  
  // Personal info
  document.getElementById('firstName').value = personalInfo.firstName || '';
  document.getElementById('lastName').value = personalInfo.lastName || '';
  document.getElementById('email').value = personalInfo.email || '';
  document.getElementById('phone').value = personalInfo.phone || '';
  document.getElementById('currentTitle').value = personalInfo.currentTitle || '';
  document.getElementById('city').value = personalInfo.city || '';
  document.getElementById('country').value = personalInfo.country || '';
  document.getElementById('address').value = personalInfo.address || '';
  document.getElementById('linkedin').value = personalInfo.linkedin || '';
  document.getElementById('portfolio').value = personalInfo.portfolio || '';
  document.getElementById('summary').value = personalInfo.summary || '';
  
  // Skills
  skills = profile.skills || [];
  renderSkills();
}

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
async function saveProfile() {
  const form = document.getElementById('profileForm');
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
}

function renderExtractedExperience() {
  const experienceList = document.getElementById('extractedExperienceList');
  
  if (!extractedData.experience || extractedData.experience.length === 0) {
    experienceList.innerHTML = '<div class="empty-list">No se detectó experiencia profesional</div>';
    return;
  }
  
  experienceList.innerHTML = extractedData.experience.map((exp, index) => `
    <div class="experience-item">
      <div class="experience-header">
        <div class="experience-title">${exp.title || 'Sin título'}</div>
        <div class="experience-company">${exp.company || 'Sin empresa'}</div>
        <div class="experience-dates">
          ${exp.startDate || ''}${exp.startDate && exp.endDate ? ' - ' : ''}${exp.endDate || ''}
          ${exp.current ? ' (Actual)' : ''}
        </div>
      </div>
      ${exp.description ? `<div class="experience-description">${exp.description}</div>` : ''}
    </div>
  `).join('');
}

function renderExtractedEducation() {
  const educationList = document.getElementById('extractedEducationList');
  
  if (!extractedData.education || extractedData.education.length === 0) {
    educationList.innerHTML = '<div class="empty-list">No se detectó educación</div>';
    return;
  }
  
  educationList.innerHTML = extractedData.education.map((edu, index) => `
    <div class="education-item">
      <div class="education-header">
        <div class="education-title">${edu.degree || 'Sin título'}</div>
        <div class="education-school">${edu.school || 'Sin institución'}</div>
        <div class="education-dates">
          ${edu.startDate || ''}${edu.startDate && edu.endDate ? ' - ' : ''}${edu.endDate || ''}
          ${edu.current ? ' (En curso)' : ''}
        </div>
      </div>
    </div>
  `).join('');
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
        showToast('Navega a "Mi Perfil" para ver y editar más detalles', 'info');
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

// Make new functions global
window.removeExtractedSkill = removeExtractedSkill;

console.log('✅ Dashboard listo');

