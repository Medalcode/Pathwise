/**
 * Application Kanban Board Manager
 * Gestiona el tablero de seguimiento de postulaciones
 */

const ApplicationKanban = {
    // Definición de columnas y estados
    columns: [
        { id: 'kanban-saved', title: 'Saved', status: 'saved', icon: 'bookmark', color: 'text-gray-400' },
        { id: 'kanban-applied', title: 'Applied', status: 'applied', icon: 'send', color: 'text-blue-400' },
        { id: 'kanban-interview', title: 'Interview', status: 'interview', icon: 'groups', color: 'text-yellow-400' },
        { id: 'kanban-offer', title: 'Offer', status: 'offer', icon: 'celebration', color: 'text-green-400' },
        { id: 'kanban-rejected', title: 'Rejected', status: 'rejected', icon: 'thumb_down', color: 'text-red-400' }
    ],

    applications: [],

    init() {
        this.loadApplications();
        this.renderBoard();
    },

    loadApplications() {
        const saved = localStorage.getItem('panoptes_applications');
        if (saved) {
            this.applications = JSON.parse(saved);
        } else {
            // Datos de prueba iniciales si está vacío
            this.applications = [];
        }
    },

    saveApplications() {
        localStorage.setItem('panoptes_applications', JSON.stringify(this.applications));
        this.renderBoard(); // Re-render simple
    },

    /**
     * Añadir nuevo trabajo al tablero
     */
    addApplication(job, status = 'saved') {
        const existing = this.applications.find(a => a.id === job.id || (a.company === job.company && a.title === job.title));
        
        if (existing) {
            showToast('This job is already in your board!', 'warning');
            return;
        }

        const app = {
            id: job.id || Date.now().toString(),
            company: job.company,
            title: job.title,
            logo: job.companyLogo || 'business',
            status: status,
            dateAdded: new Date().toISOString(),
            salary: job.salary,
            location: job.location,
            matchScore: job.matchScore
        };

        this.applications.push(app);
        this.saveApplications();
        showToast('Job added to Kanban board!', 'success');
        
        // Auto-switch to Kanban view (optional)
        // this.showBoard();
    },

    /**
     * Mover tarjeta a otro estado
     */
    moveCard(appId, newStatus) {
        const app = this.applications.find(a => a.id === appId);
        if (app) {
            app.status = newStatus;
            app.dateUpdated = new Date().toISOString();
            this.saveApplications();
        }
    },
    
    /**
     * Eliminar tarjeta
     */
    deleteCard(appId) {
        if(confirm('Delete this application from tracking?')) {
            this.applications = this.applications.filter(a => a.id !== appId);
            this.saveApplications();
        }
    },

    /**
     * Renderizar el tablero completo
     */
    renderBoard() {
        const container = document.getElementById('kanbanBoardContainer');
        if (!container) return;

        // Limpiar
        container.innerHTML = '';
        
        // Crear columnas
        this.columns.forEach(col => {
            const colApps = this.applications.filter(a => a.status === col.status);
            
            const colDiv = document.createElement('div');
            colDiv.className = 'kanban-column flex flex-col gap-4 min-w-[280px] w-full md:w-1/5 bg-white/5 rounded-xl p-4 border border-white/5 h-full';
            colDiv.setAttribute('data-status', col.status);
            
            // Header
            colDiv.innerHTML = `
                <div class="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined ${col.color} text-sm">${col.icon}</span>
                        <h4 class="font-bold text-gray-300 text-sm uppercase">${col.title}</h4>
                    </div>
                    <span class="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">${colApps.length}</span>
                </div>
                <div class="kanban-cards-container flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[100px]" id="${col.id}">
                    <!-- Cards will be injected here -->
                </div>
            `;
            
            container.appendChild(colDiv);
            
            // Render Cards
            const cardsContainer = colDiv.querySelector('.kanban-cards-container');
            
            colApps.forEach(app => {
                const card = document.createElement('div');
                card.className = 'kanban-card glass-panel p-3 rounded-lg border border-white/10 cursor-move hover:border-primary/50 transition-all group relative';
                card.draggable = true;
                card.dataset.id = app.id;
                
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white text-xs">
                             <span class="material-symbols-outlined text-base">${app.logo}</span>
                        </div>
                        ${app.matchScore ? `<span class="text-[10px] ${app.matchScore >= 80 ? 'text-green-400' : 'text-yellow-400'} font-bold">${app.matchScore}%</span>` : ''}
                    </div>
                    <h5 class="font-bold text-white text-sm line-clamp-2 leading-tight mb-1">${app.title}</h5>
                    <p class="text-xs text-gray-400 mb-2">${app.company}</p>
                    
                    <div class="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                        <span class="text-[10px] text-gray-500">${new Date(app.dateAdded).toLocaleDateString()}</span>
                        <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/5 transition-all" onclick="ApplicationKanban.deleteCard('${app.id}')">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                `;
                
                // Drag Events
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', app.id);
                    card.classList.add('opacity-50');
                });
                
                card.addEventListener('dragend', () => {
                    card.classList.remove('opacity-50');
                });
                
                cardsContainer.appendChild(card);
            });
            
            // Drop Zone Events
            cardsContainer.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
                cardsContainer.classList.add('bg-white/5');
            });
            
            cardsContainer.addEventListener('dragleave', () => {
                cardsContainer.classList.remove('bg-white/5');
            });
            
            cardsContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                cardsContainer.classList.remove('bg-white/5');
                const id = e.dataTransfer.getData('text/plain');
                this.moveCard(id, col.status);
            });
        });
    },

    /**
     * Alternar vistas
     */
    showBoard() {
        document.getElementById('jobSearchResultsView')?.classList.add('hidden');
        document.getElementById('kanbanBoardView')?.classList.remove('hidden');
        
        // Update Tabs UI
        document.getElementById('tab-search')?.classList.remove('text-primary', 'border-b-2', 'border-primary');
        document.getElementById('tab-search')?.classList.add('text-gray-400');
        
        document.getElementById('tab-kanban')?.classList.add('text-primary', 'border-b-2', 'border-primary');
        document.getElementById('tab-kanban')?.classList.remove('text-gray-400');
        
        this.renderBoard();
    },

    showSearch() {
        document.getElementById('kanbanBoardView')?.classList.add('hidden');
        document.getElementById('jobSearchResultsView')?.classList.remove('hidden');

         // Update Tabs UI
        document.getElementById('tab-kanban')?.classList.remove('text-primary', 'border-b-2', 'border-primary');
        document.getElementById('tab-kanban')?.classList.add('text-gray-400');
        
        document.getElementById('tab-search')?.classList.add('text-primary', 'border-b-2', 'border-primary');
        document.getElementById('tab-search')?.classList.remove('text-gray-400');
    }
};

window.ApplicationKanban = ApplicationKanban;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    ApplicationKanban.init();
});
