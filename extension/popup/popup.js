// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Estados de la UI
const states = {
  noData: document.getElementById('noDataState'),
  dataLoaded: document.getElementById('dataLoadedState'),
  loading: document.getElementById('loadingState')
};

// Elementos del DOM
const elements = {
  connectionStatus: document.getElementById('connectionStatus'),
  userName: document.getElementById('userName'),
  userTitle: document.getElementById('userTitle'),
  userInitials: document.getElementById('userInitials'),
  profileCompleteness: document.getElementById('profileCompleteness'),
  fieldsDetected: document.getElementById('fieldsDetected'),
  openDashboard: document.getElementById('openDashboard'),
  openDashboardLoaded: document.getElementById('openDashboardLoaded'),
  autofillBtn: document.getElementById('autofillBtn'),
  refreshData: document.getElementById('refreshData')
};

// Estado de conexión
let isConnected = false;
let userData = null;

// Inicializar popup
async function init() {
  console.log('🚀 Inicializando AutoApply...');
  
  // Verificar conexión al backend
  await checkConnection();
  
  // Cargar datos del usuario
  await loadUserData();
  
  // Configurar event listeners
  setupEventListeners();
}

// Verificar conexión al backend
async function checkConnection() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      isConnected = true;
      updateConnectionStatus('connected', 'Conectado');
    } else {
      throw new Error('Backend no disponible');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    isConnected = false;
    updateConnectionStatus('error', 'Sin conexión');
  }
}

// Actualizar estado de conexión
function updateConnectionStatus(status, text) {
  elements.connectionStatus.className = `status ${status}`;
  elements.connectionStatus.querySelector('.status-text').textContent = text;
}

// Cargar datos del usuario
async function loadUserData() {
  if (!isConnected) {
    showState('noData');
    return;
  }

  try {
    // Intentar obtener datos del storage local primero
    const stored = await chrome.storage.local.get(['userData']);
    
    if (stored.userData) {
      userData = stored.userData;
      displayUserData();
      showState('dataLoaded');
    } else {
      // Si no hay datos locales, intentar obtener del backend
      const response = await fetch(`${API_URL}/profile`);
      
      if (response.ok) {
        userData = await response.json();
        
        // Guardar en storage local
        await chrome.storage.local.set({ userData });
        
        displayUserData();
        showState('dataLoaded');
      } else {
        showState('noData');
      }
    }
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    showState('noData');
  }
}

// Mostrar datos del usuario
function displayUserData() {
  if (!userData) return;

  const { personalInfo, experience, education } = userData;
  
  // Nombre y título
  const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
  elements.userName.textContent = fullName;
  elements.userTitle.textContent = personalInfo.currentTitle || 'Sin título';
  
  // Iniciales
  const initials = `${personalInfo.firstName.charAt(0)}${personalInfo.lastName.charAt(0)}`.toUpperCase();
  elements.userInitials.textContent = initials;
  
  // Calcular completitud del perfil
  const completeness = calculateProfileCompleteness(userData);
  elements.profileCompleteness.textContent = `${completeness}%`;
  
  // Contar campos disponibles
  const fieldsCount = countAvailableFields(userData);
  elements.fieldsDetected.textContent = fieldsCount;
}

// Calcular completitud del perfil
function calculateProfileCompleteness(data) {
  let total = 0;
  let filled = 0;
  
  // Personal Info (8 campos)
  const personalFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'country', 'currentTitle'];
  personalFields.forEach(field => {
    total++;
    if (data.personalInfo[field]) filled++;
  });
  
  // Experience (mínimo 1 trabajo)
  total += 3;
  if (data.experience && data.experience.length > 0) filled += 3;
  
  // Education (mínimo 1 estudio)
  total += 2;
  if (data.education && data.education.length > 0) filled += 2;
  
  // Skills (mínimo 3 skills)
  total += 2;
  if (data.skills && data.skills.length >= 3) filled += 2;
  
  return Math.round((filled / total) * 100);
}

// Contar campos disponibles
function countAvailableFields(data) {
  let count = 0;
  
  // Campos personales
  count += Object.keys(data.personalInfo).filter(k => data.personalInfo[k]).length;
  
  // Experiencias
  if (data.experience) count += data.experience.length * 4; // título, empresa, fechas, descripción
  
  // Educación
  if (data.education) count += data.education.length * 3;
  
  // Skills
  if (data.skills) count += data.skills.length;
  
  return count;
}

// Configurar event listeners
function setupEventListeners() {
  // Abrir dashboard
  elements.openDashboard?.addEventListener('click', openDashboard);
  elements.openDashboardLoaded?.addEventListener('click', openDashboard);
  
  // Autocompletar formulario
  elements.autofillBtn?.addEventListener('click', autofillForm);
  
  // Refrescar datos
  elements.refreshData?.addEventListener('click', async () => {
    showState('loading');
    await loadUserData();
  });
}

// Abrir dashboard
function openDashboard() {
  chrome.tabs.create({ url: 'http://localhost:3000' });
}

// Autocompletar formulario
async function autofillForm() {
  if (!userData) {
    showNotification('No hay datos disponibles', 'error');
    return;
  }

  showState('loading');

  try {
    // Obtener la pestaña activa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Enviar mensaje al content script
    await chrome.tabs.sendMessage(tab.id, {
      action: 'autofill',
      data: userData
    });

    showNotification('¡Formulario completado!', 'success');
    
    // Volver al estado normal después de 1.5s
    setTimeout(() => {
      showState('dataLoaded');
    }, 1500);

  } catch (error) {
    console.error('❌ Error autollenando:', error);
    showNotification('Error al llenar el formulario', 'error');
    showState('dataLoaded');
  }
}

// Mostrar estado
function showState(stateName) {
  Object.keys(states).forEach(key => {
    states[key].classList.add('hidden');
  });
  
  if (states[stateName]) {
    states[stateName].classList.remove('hidden');
  }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  // TODO: Implementar sistema de notificaciones visual
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
