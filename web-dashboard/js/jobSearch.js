/**
 * Módulo de Búsqueda de Empleos
 * Gestiona la búsqueda, renderizado y filtrado de ofertas laborales
 */

const JobSearch = {
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

        const loader = document.getElementById('jobSearchLoader');
        const results = document.getElementById('jobResultsList');
        
        if (loader) loader.classList.remove('hidden');
        if (results) results.innerHTML = ''; 

        // Simular delay de red para realismo
        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
            
            // Usar el generador de datos inteligente (Mock o Real en futuro)
            const jobs = window.JobSearchData ? window.JobSearchData.generateJobs(this.selectedProfile) : [];
            this.renderResults(jobs);
            
            showToast(`Encontrados ${jobs.length} empleos compatibles`, 'success');
            
        }, 1500);
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
            let scoreColor = 'text-gray-400';
            if (job.matchScore >= 80) scoreColor = 'text-success-green';
            else if (job.matchScore >= 60) scoreColor = 'text-yellow-500';

            // Escapar JSON para el onclick
            const jobJson = JSON.stringify(job).replace(/"/g, '&quot;');
            // Obtener perfil actual escapado también si es necesario, o pasarlo globalmente
            
            return `
                <div class="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-primary/30" 
                     onclick='JobSearch.openDetails(${JSON.stringify(job)})'>
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex gap-4">
                             <div class="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white shrink-0">
                                <span class="material-symbols-outlined text-2xl">${job.companyLogo || 'business'}</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">${job.title}</h3>
                                <p class="text-sm text-gray-400 font-mono flex items-center gap-2">
                                    ${job.company} 
                                    <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                                    ${job.location}
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xl font-bold ${scoreColor}">${job.matchScore}%</span>
                            <span class="text-[10px] uppercase tracking-widest text-gray-500">Match</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mb-4 flex-wrap">
                        ${job.remote ? '<span class="px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20 font-medium">Remote</span>' : ''}
                        <span class="px-2 py-1 rounded bg-white/5 text-gray-300 text-xs border border-white/10">${job.type}</span>
                        <span class="px-2 py-1 rounded bg-white/5 text-green-300 text-xs border border-white/10 font-mono">${job.salary}</span>
                    </div>

                    <p class="text-sm text-gray-300 mb-4 line-clamp-2 text-ellipsis">${job.description}</p>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${(job.skills || []).slice(0,3).map(skill => 
                            `<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300 border border-white/5">${skill}</span>`
                        ).join('')}
                    </div>

                    <div class="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                        <span class="text-xs text-gray-500 flex items-center gap-1">
                             <span class="material-symbols-outlined text-sm">schedule</span>
                             Posted ${new Date(job.postedDate).toLocaleDateString()}
                        </span>
                        <span class="px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all">
                            View Details
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Abrir detalles usando el UI Manager
     * NOTA: Hay que tener cuidado pasando objetos complejos por HTML onclick
     * Una mejor manera sería guardar los jobs en memoria por ID
     */
    openDetails(job) {
        if (window.JobApplicationUI) {
            window.JobApplicationUI.showJobDetails(job, this.selectedProfile);
        } else {
            console.error('JobApplicationUI not found');
        }
    }
};

window.JobSearch = JobSearch;
