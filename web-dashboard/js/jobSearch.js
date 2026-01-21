/**
 * Módulo de Búsqueda de Empleos
 * Gestiona la búsqueda, renderizado y filtrado de ofertas laborales
 */

const JobSearch = {
    // Referencia al perfil seleccionado (set desde app.js)
    selectedProfile: null,

    /**
     * Iniciar búsqueda de empleos
     */
    async init(profile) {
        this.selectedProfile = profile;
        
        if (!this.selectedProfile) {
            showToast(window.t('select_ai_profile_first'), 'warning');
            return;
        }

        console.log('🔍 Iniciando búsqueda para perfil:', this.selectedProfile.title);

        // UI Loading
        const loader = document.getElementById('jobSearchLoader');
        const results = document.getElementById('jobResultsList');
        
        if (loader) loader.classList.remove('hidden');
        if (results) results.innerHTML = ''; // Limpiar

        // Obtener preferencias del usuario
        // Nota: Asegurarse de que los IDs coincidan con el HTML (verify-country, verify-remoteOnlyPref)
        // En step 2 los IDs son verify-country y verify-remoteOnlyPref
        // En step 4 hay un botón remoto que podría ser un filtro visual
        
        const countryInput = document.getElementById('verify-country');
        const remoteInput = document.getElementById('verify-remoteOnlyPref');
        
        // Fallback al profile si existen los datos
        const userCountry = countryInput ? countryInput.value : 'Chile';
        const isRemoteOnly = remoteInput ? remoteInput.checked : false;

        try {
            // Usar auth fetch para seguridad
            const response = await window.auth.fetch('/api/jobs/search', {
                method: 'POST',
                body: JSON.stringify({ 
                    profile: this.selectedProfile,
                    preferences: { 
                        location: userCountry,
                        remoteOnly: isRemoteOnly
                    }
                })
            });

            const { data } = await response.json();
            
            // Renderizar
            if (loader) loader.classList.add('hidden');
            this.renderResults(data);

        } catch (error) {
            console.error('Error searching jobs:', error);
            if (loader) loader.classList.add('hidden');
            showToast(window.t('error_searching_jobs'), 'error');
            
            if (results) {
                results.innerHTML = `
                    <div class="glass-panel p-8 text-center rounded-xl border border-red-500/30">
                        <p class="text-red-400">Error: ${error.message}</p>
                    </div>
                `;
            }
        }
    },

    /**
     * Renderizar lista de resultados
     */
    renderResults(jobs) {
        const container = document.getElementById('jobResultsList');
        if (!container) return;

        if (!jobs || jobs.length === 0) {
            container.innerHTML = `
                <div class="glass-panel p-8 text-center rounded-xl">
                    <h3 class="text-xl font-bold text-white mb-2">😕 No matches found</h3>
                    <p class="text-gray-400">Try adjusting your profile keywords or search later.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = jobs.map(job => {
            // Calcular score visual
            let badgeClass = 'bg-gray-500';
            let scoreColor = 'text-gray-400';
            
            if (job.matchScore >= 80) {
                badgeClass = 'bg-success-green';
                scoreColor = 'text-success-green';
            } else if (job.matchScore >= 60) {
                badgeClass = 'bg-yellow-500';
                scoreColor = 'text-yellow-500';
            }

            return `
                <div class="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white group-hover:text-primary transition-colors">${job.title}</h3>
                            <p class="text-sm text-gray-400 font-mono">${job.company} • ${job.location}</p>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-2xl font-bold ${scoreColor}">${job.matchScore}%</span>
                            <span class="text-[10px] uppercase tracking-widest text-gray-500">Match</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mb-4">
                        ${job.remote ? '<span class="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">Remote</span>' : ''}
                        <span class="px-2 py-1 rounded bg-white/5 text-gray-300 text-xs border border-white/10">${job.source || 'LinkedIn'}</span>
                        <span class="px-2 py-1 rounded bg-white/5 text-gray-300 text-xs border border-white/10">${new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>

                    <p class="text-sm text-gray-300 mb-4 line-clamp-3">${job.description}</p>

                    <div class="flex justify-between items-center pt-4 border-t border-white/5">
                        <button class="text-xs text-gray-500 hover:text-white flex items-center gap-1" onclick="JobSearch.toggleDetails('${job.id}')">
                            <span class="material-symbols-outlined text-sm">expand_more</span>
                            Show Details
                        </button>
                        <a href="${job.url}" target="_blank" class="px-4 py-2 rounded-lg bg-white/5 hover:bg-primary hover:text-white text-gray-300 transition-all border border-white/10 text-sm font-bold flex items-center gap-2">
                            Apply Now
                            <span class="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Mostrar detalles de un trabajo (placeholder por ahora)
     */
    toggleDetails(jobId) {
        // En el futuro, esto podría expandir la tarjeta
        console.log('Toggle details for', jobId);
        showToast('Feature coming soon: Full Job Details', 'info');
    }
};

// Exponer globalmente
window.JobSearch = JobSearch;
