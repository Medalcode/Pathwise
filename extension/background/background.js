// Background Service Worker
console.log('🔧 AutoApply Background Service Worker iniciado');

// Eventos de instalación
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✨ AutoApply instalado por primera vez');
    // Abrir página de bienvenida
    chrome.tabs.create({ url: 'http://localhost:3000' });
  } else if (details.reason === 'update') {
    console.log('🔄 AutoApply actualizado');
  }
});

// Escuchar mensajes desde content scripts o popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Mensaje recibido:', request);
  
  if (request.action === 'getData') {
    // Obtener datos del storage
    chrome.storage.local.get(['userData'], (result) => {
      sendResponse({ data: result.userData || null });
    });
    return true; // Mantener el canal abierto para respuesta asíncrona
  }
  
  if (request.action === 'saveData') {
    // Guardar datos en storage
    chrome.storage.local.set({ userData: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'clearData') {
    // Limpiar datos
    chrome.storage.local.remove(['userData'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Crear menú contextual
chrome.contextMenus.create({
  id: 'autoapply-fill',
  title: 'Llenar con AutoApply',
  contexts: ['editable']
});

// Manejar click en menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'autoapply-fill') {
    // Enviar mensaje al content script para autollenar
    chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
  }
});

// Sincronización periódica (opcional)
chrome.alarms.create('syncData', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncData') {
    console.log('🔄 Sincronizando datos...');
    syncDataWithBackend();
  }
});

// Sincronizar con backend
async function syncDataWithBackend() {
  try {
    const response = await fetch('http://localhost:3000/api/profile');
    if (response.ok) {
      const userData = await response.json();
      await chrome.storage.local.set({ userData });
      console.log('✅ Datos sincronizados');
    }
  } catch (error) {
    console.error('❌ Error sincronizando:', error);
  }
}
