/**
 * Job Search Data Generator
 * Genera ofertas de trabajo realistas basadas en el perfil, simulando una API de búsqueda.
 */

const JobSearchData = {
    companies: [
        { name: 'TechFlow', logo: 'rocket_launch' },
        { name: 'DataSphere', logo: 'database' },
        { name: 'CloudPeak', logo: 'cloud' },
        { name: 'Nebula AI', logo: 'smart_toy' },
        { name: 'CyberShield', logo: 'security' },
        { name: 'QuantumSoft', logo: 'memory' },
        { name: 'EcoSystems', logo: 'eco' },
        { name: 'GlobalFintech', logo: 'payments' }
    ],

    locations: ['Remote', 'San Francisco, CA', 'New York, NY', 'Berlin, Germany', 'London, UK', 'Toronto, Canada', 'Santiago, Chile'],

    /**
     * Generar ofertas basadas en el perfil
     */
    generateJobs(profile, count = 10) {
        if (!profile) return [];
        
        const jobs = [];
        const skills = profile.keySkills || [];
        const title = profile.title.split('-')[0].trim(); // "Full Stack Developer"
        
        for (let i = 0; i < count; i++) {
            const company = this.companies[Math.floor(Math.random() * this.companies.length)];
            const isRemote = Math.random() > 0.3; // 70% remote chance
            const matchScore = Math.floor(Math.random() * (99 - 65) + 65); // Random score between 65-99
            
            // Variaciones del título para realismo
            const titleVariations = [
                title,
                `Senior ${title}`,
                `Lead ${title}`,
                `${title} (Remote)`,
                `${title} - high growth startup`
            ];
            
            const jobTitle = titleVariations[Math.floor(Math.random() * titleVariations.length)];
            
            // Generate description highlighting matching skills
            const relevantSkills = skills.slice(0, 3).join(', ');
            
            jobs.push({
                id: `job-${Date.now()}-${i}`,
                title: jobTitle,
                company: company.name,
                companyLogo: company.logo,
                location: isRemote ? 'Remote' : this.locations[Math.floor(Math.random() * this.locations.length)],
                remote: isRemote,
                type: 'Full-time',
                salary: '$80k - $120k',
                postedDate: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString(),
                matchScore: matchScore,
                source: Math.random() > 0.5 ? 'LinkedIn' : 'Indeed',
                url: '#',
                skills: skills.slice(0, 4), // Matching skills
                description: `We are looking for a talented ${title} to join our team at ${company.name}. You will work with technologies like ${relevantSkills}. We offer competitive salary, flexible hours, and great culture. Apply now if you are passionate about building scalable solutions.`
            });
        }
        
        // Ordenar por match score
        return jobs.sort((a, b) => b.matchScore - a.matchScore);
    },
    
    /**
     * Simular análisis de match
     */
    analyzeMatch(job, profile) {
        // En una implementación real, esto compararía textos
        // Aquí devolvemos datos simulados para la UI
        const skills = profile.keySkills || [];
        return {
            missingSkills: ['Kubernetes', 'AWS'], // Ejemplo
            matchingSkills: skills.slice(0, 3),
            cultureFit: 85,
            technicalFit: job.matchScore
        };
    }
};

window.JobSearchData = JobSearchData;
