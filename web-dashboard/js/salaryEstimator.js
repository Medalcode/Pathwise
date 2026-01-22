/**
 * Salary Estimator Module
 * Estima rangos salariales basados en roles, niveles y ubicación.
 * Datos aproximados para propósitos de demostración y orientación.
 */

const SalaryEstimator = {
    // Base lines (USD Annual)
    baseSalaries: {
        'junior': 45000,
        'mid': 75000,
        'senior': 110000,
        'lead': 140000,
        'manager': 150000,
        'architect': 160000
    },

    // Multiplicadores por Tecnología/Rol (Hot skills bonus)
    roleMultipliers: {
        'developer': 1.0,
        'engineer': 1.1,
        'architect': 1.3,
        'full stack': 1.1,
        'backend': 1.1,
        'frontend': 1.0,
        'devops': 1.25,
        'sre': 1.25,
        'data scientist': 1.3,
        'manager': 1.4,
        'designer': 0.9,
        'product owner': 1.15
    },

    // Multiplicadores por Ubicación (Si se detecta)
    locationMultipliers: {
        'remote': 1.0, // Base global remote (promedio)
        'usa': 1.5,
        'europe': 1.1,
        'latam': 0.6,
        'asia': 0.7
    },

    /**
     * Estimar rango salarial
     * @param {string} title - Título del puesto
     * @param {string} level - Nivel (Junior, Senior, etc)
     * @param {string} location - Ubicación (opcional)
     * @returns {string} Rango formateado (ej: "$100k - $130k")
     */
    estimate(title, level, location = 'remote') {
        let base = this.baseSalaries['mid']; // Default
        const lowerTitle = title.toLowerCase();
        const lowerLevel = level ? level.toLowerCase() : '';

        // Determinar base por nivel
        if (lowerLevel.includes('junior') || lowerLevel.includes('jr') || lowerLevel.includes('entry')) base = this.baseSalaries['junior'];
        else if (lowerLevel.includes('senior') || lowerLevel.includes('sr') || lowerLevel.includes('expert')) base = this.baseSalaries['senior'];
        else if (lowerLevel.includes('lead') || lowerLevel.includes('principal')) base = this.baseSalaries['lead'];
        else if (lowerLevel.includes('manager') || lowerLevel.includes('director')) base = this.baseSalaries['manager'];
        else if (lowerLevel.includes('architect')) base = this.baseSalaries['architect'];
        
        // Ajuste por Rol
        let roleMult = 1.0;
        for (const [key, val] of Object.entries(this.roleMultipliers)) {
            if (lowerTitle.includes(key)) {
                roleMult = Math.max(roleMult, val); // Tomar el mejor multiplicador
            }
        }

        // Ajuste por Ubicación (simple heurística)
        let locMult = this.locationMultipliers['remote'];
        if (location) {
             const lowerLoc = location.toLowerCase();
             if (lowerLoc.includes('usa') || lowerLoc.includes('united states') || lowerLoc.includes('sf') || lowerLoc.includes('ny')) locMult = this.locationMultipliers['usa'];
             else if (lowerLoc.includes('chile') || lowerLoc.includes('argentina') || lowerLoc.includes('colombia') || lowerLoc.includes('mexico')) locMult = this.locationMultipliers['latam'];
             else if (lowerLoc.includes('london') || lowerLoc.includes('berlin') || lowerLoc.includes('uk')) locMult = this.locationMultipliers['europe'];
        }

        // Calcular
        const estimatedBase = base * roleMult * locMult;
        
        // Rango +/- 15%
        const min = Math.round((estimatedBase * 0.85) / 1000) * 1000;
        const max = Math.round((estimatedBase * 1.15) / 1000) * 1000;

        return `$${(min/1000).toFixed(0)}k - $${(max/1000).toFixed(0)}k`;
    }
};

window.SalaryEstimator = SalaryEstimator;
