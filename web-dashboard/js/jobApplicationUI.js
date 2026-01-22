/**
 * Job Application UI Manager
 * Gestiona detalles de empleo, generador de cover letter y kanban
 */

const JobApplicationUI = {
    
    /**
     * Mostrar modal de detalles de empleo
     */
    showJobDetails(job, profile) {
        // Guardar referencia
        this.currentJob = job;

        // Crear modal dinámicamente si no existe
        let modal = document.getElementById('jobDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'jobDetailsModal';
            modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4';
            document.body.appendChild(modal);
        }
        
        const matchAnalysis = window.JobSearchData ? window.JobSearchData.analyzeMatch(job, profile) : { matchingSkills: [] };
        
        modal.innerHTML = `
            <div class="bg-[#1a1625] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[fadeIn_0.3s]">
                
                <!-- Header -->
                <div class="p-8 border-b border-white/10 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-8 opacity-10">
                        <span class="material-symbols-outlined text-9xl">${job.companyLogo || 'business'}</span>
                    </div>
                    
                    <button onclick="document.getElementById('jobDetailsModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    
                    <div class="flex gap-4 items-start relative z-10">
                        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white shadow-lg">
                            <span class="material-symbols-outlined text-3xl">${job.companyLogo || 'business'}</span>
                        </div>
                        <div>
                            <h2 class="text-3xl font-bold text-white mb-2">${job.title}</h2>
                            <div class="flex items-center gap-3 text-gray-300">
                                <span class="font-bold text-lg">${job.company}</span>
                                <span>•</span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">location_on</span> ${job.location}</span>
                                <span>•</span>
                                <span class="px-2 py-0.5 rounded bg-white/10 text-xs">${job.type}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-8 flex gap-6">
                        <div class="bg-white/5 rounded-lg p-3 px-4 border border-white/10">
                            <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Match Score</div>
                            <div class="text-2xl font-bold text-success-green flex items-center gap-2">
                                ${job.matchScore || 85}% 
                                <span class="material-symbols-outlined">verified</span>
                            </div>
                        </div>
                        <div class="bg-white/5 rounded-lg p-3 px-4 border border-white/10">
                            <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Salary Est.</div>
                            <div class="text-2xl font-bold text-white">${job.salary}</div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[400px]">
                    <!-- Main Content -->
                    <div class="lg:col-span-2 p-8 border-r border-white/10">
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">description</span>
                            Job Description
                        </h3>
                        <p class="text-gray-300 leading-relaxed mb-6">
                            ${job.description}
                        </p>
                        <p class="text-gray-300 leading-relaxed mb-6">
                            Key responsibilities include designing scalable systems, collaborating with cross-functional teams, and mentoring junior developers. Requires strong problem-solving skills and experience with cloud infrastructure.
                        </p>
                        
                        <h3 class="text-lg font-bold text-white mb-4 mt-8 flex items-center gap-2">
                            <span class="material-symbols-outlined text-accent-cyan">psychology</span>
                            AI Match Analysis
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <div class="text-sm text-gray-400 mb-2">Matching Skills</div>
                                <div class="flex flex-wrap gap-2">
                                    ${matchAnalysis.matchingSkills.map(s => `<span class="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs border border-green-500/30 font-mono">✓ ${s}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sidebar Actions -->
                    <div class="p-8 bg-black/20 flex flex-col gap-4">
                        <button onclick="JobApplicationUI.generateCoverLetter('${job.id}', '${job.company}')" class="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan hover:shadow-glow-primary text-white font-bold flex items-center justify-center gap-2 transition-all transform hover:translate-y-[-2px]">
                            <span class="material-symbols-outlined">auto_fix_high</span>
                            Generate Cover Letter
                        </button>
                        
                        <button onclick="window.ApplicationKanban.addApplication(window.JobApplicationUI.currentJob, 'saved')" class="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold flex items-center justify-center gap-2 transition-all">
                            <span class="material-symbols-outlined">bookmark_border</span>
                            Save for Later
                        </button>
                        
                        <a href="${job.url}" target="_blank" 
                           onclick="window.ApplicationKanban.addApplication(window.JobApplicationUI.currentJob, 'applied')"
                           class="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold flex items-center justify-center gap-2 transition-all">
                            <span class="material-symbols-outlined">open_in_new</span>
                            Apply on Website
                        </a>
                        
                        <div class="mt-auto pt-6 border-t border-white/10">
                            <div class="text-xs text-center text-gray-500 mb-4">Powered by Panoptes AI</div>
                            <div class="flex justify-center gap-3">
                                <span title="Remote Friendly" class="p-2 rounded-lg bg-white/5 text-gray-400"><span class="material-symbols-outlined">public</span></span>
                                <span title="Verified Company" class="p-2 rounded-lg bg-white/5 text-gray-400"><span class="material-symbols-outlined">verified_user</span></span>
                                <span title="Fast Response" class="p-2 rounded-lg bg-white/5 text-gray-400"><span class="material-symbols-outlined">bolt</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    },
    
    /**
     * Generar y copiar Cover Letter
     */
    async generateCoverLetter(jobId, companyName) {
        showToast('Generando carta de presentación personalizada...', 'info');
        
        // Simular generación por ahora
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const letter = `Dear Hiring Team at ${companyName},

I am writing to express my strong interest in the open position. As a developed professional with experience in the required technologies, I believe I can make a significant contribution to your team.

My background matches well with the requirements for this role...

[This is a generated draft. AI generation would create a full custom letter here based on your profile]`;

        navigator.clipboard.writeText(letter);
        showToast('Carta generada y copiada al portapapeles! 📋', 'success');
    }
};

window.JobApplicationUI = JobApplicationUI;
