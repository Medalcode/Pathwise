/**
 * CV History Manager
 * Gestiona el historial de CVs procesados
 */

const CVHistory = {
    MAX_HISTORY: 5,
    STORAGE_KEY: 'panoptes_cv_history',
    
    /**
     * Guardar CV en el historial
     */
    saveToHistory(cvData, fileName) {
        const history = this.getHistory();
        
        const entry = {
            id: 'cv_' + Date.now(),
            fileName: fileName,
            timestamp: new Date().toISOString(),
            data: cvData,
            preview: {
                name: `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`.trim(),
                title: cvData.personalInfo?.currentTitle || 'Sin título',
                email: cvData.personalInfo?.email || '',
                skillsCount: cvData.skills?.length || 0,
                experienceCount: cvData.experience?.length || 0
            }
        };
        
        // Agregar al inicio
        history.unshift(entry);
        
        // Mantener solo los últimos MAX_HISTORY
        if (history.length > this.MAX_HISTORY) {
            history.splice(this.MAX_HISTORY);
        }
        
        // Guardar
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        
        // Actualizar UI
        this.renderHistory();
        
        return entry.id;
    },
    
    /**
     * Obtener historial
     */
    getHistory() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading CV history:', e);
            return [];
        }
    },
    
    /**
     * Cargar CV del historial
     */
    loadFromHistory(entryId) {
        const history = this.getHistory();
        const entry = history.find(e => e.id === entryId);
        
        if (entry && typeof showExtractedDataPreview === 'function') {
            showExtractedDataPreview(entry.data);
            showToast(`CV cargado: ${entry.fileName}`, 'success');
        }
    },
    
    /**
     * Eliminar entrada del historial
     */
    deleteFromHistory(entryId) {
        let history = this.getHistory();
        history = history.filter(e => e.id !== entryId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        this.renderHistory();
        showToast('CV eliminado del historial', 'info');
    },
    
    /**
     * Limpiar todo el historial
     */
    clearHistory() {
        if (confirm('¿Estás seguro de que quieres eliminar todo el historial de CVs?')) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.renderHistory();
            showToast('Historial limpiado', 'info');
        }
    },
    
    /**
     * Renderizar historial en la UI
     */
    renderHistory() {
        const history = this.getHistory();
        let container = document.getElementById('cvHistoryContainer');
        
        if (!container) {
            // Crear contenedor si no existe
            const uploadArea = document.getElementById('uploadArea');
            if (!uploadArea) return;
            
            container = document.createElement('div');
            container.id = 'cvHistoryContainer';
            container.className = 'mt-6';
            uploadArea.parentNode.insertBefore(container, uploadArea.nextSibling);
        }
        
        if (history.length === 0) {
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        container.innerHTML = `
            <div class="glass-panel p-4 rounded-xl border border-white/10">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="text-sm font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">history</span>
                        CVs Recientes
                    </h4>
                    <button onclick="CVHistory.clearHistory()" class="text-xs text-gray-500 hover:text-red-400 transition-colors">
                        Limpiar todo
                    </button>
                </div>
                <div class="space-y-2">
                    ${history.map(entry => `
                        <div class="cv-history-item flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-primary/30 group"
                             onclick="CVHistory.loadFromHistory('${entry.id}')">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <span class="material-symbols-outlined text-primary text-lg">description</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold text-white truncate">
                                    ${entry.preview.name || entry.fileName}
                                </div>
                                <div class="text-xs text-gray-400 truncate">
                                    ${entry.preview.title} • ${entry.preview.skillsCount} skills • ${entry.preview.experienceCount} exp
                                </div>
                                <div class="text-xs text-gray-500">
                                    ${this.formatTimestamp(entry.timestamp)}
                                </div>
                            </div>
                            <button onclick="event.stopPropagation(); CVHistory.deleteFromHistory('${entry.id}')" 
                                    class="flex-shrink-0 w-8 h-8 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Formatear timestamp
     */
    formatTimestamp(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
};

// Exponer globalmente
window.CVHistory = CVHistory;

// Renderizar al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (window.CVHistory) {
        window.CVHistory.renderHistory();
    }
});
