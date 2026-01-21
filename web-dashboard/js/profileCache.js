/**
 * Profile Generation Cache Manager
 * Cachea perfiles generados para evitar regeneraciones innecesarias
 */

const ProfileCache = {
    STORAGE_KEY: 'panoptes_profile_cache',
    MAX_CACHE_SIZE: 10,
    CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días
    
    /**
     * Generar hash del CV para usar como key
     */
    generateCVHash(cvData) {
        const str = JSON.stringify({
            personalInfo: cvData.personalInfo,
            experience: cvData.experience,
            education: cvData.education,
            skills: cvData.skills
        });
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    },
    
    /**
     * Obtener perfil del caché
     */
    get(cvData, profileType) {
        try {
            const cache = this.getCache();
            const cvHash = this.generateCVHash(cvData);
            const key = `${cvHash}_${profileType}`;
            
            const cached = cache[key];
            
            if (!cached) {
                console.log(`📦 Cache miss para ${profileType}`);
                return null;
            }
            
            // Verificar si expiró
            const now = Date.now();
            if (now - cached.timestamp > this.CACHE_DURATION) {
                console.log(`⏰ Cache expirado para ${profileType}`);
                this.delete(cvData, profileType);
                return null;
            }
            
            console.log(`✅ Cache hit para ${profileType} (guardado hace ${this.formatTimeSince(cached.timestamp)})`);
            return cached.profile;
            
        } catch (error) {
            console.error('Error getting from cache:', error);
            return null;
        }
    },
    
    /**
     * Guardar perfil en caché
     */
    set(cvData, profileType, profile) {
        try {
            const cache = this.getCache();
            const cvHash = this.generateCVHash(cvData);
            const key = `${cvHash}_${profileType}`;
            
            cache[key] = {
                profile,
                timestamp: Date.now(),
                cvHash,
                profileType
            };
            
            // Limpiar caché si es muy grande
            this.cleanupCache(cache);
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
            console.log(`💾 Perfil ${profileType} guardado en caché`);
            
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    },
    
    /**
     * Eliminar perfil del caché
     */
    delete(cvData, profileType) {
        try {
            const cache = this.getCache();
            const cvHash = this.generateCVHash(cvData);
            const key = `${cvHash}_${profileType}`;
            
            delete cache[key];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
            
        } catch (error) {
            console.error('Error deleting from cache:', error);
        }
    },
    
    /**
     * Obtener todo el caché
     */
    getCache() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error reading cache:', error);
            return {};
        }
    },
    
    /**
     * Limpiar caché antiguo
     */
    cleanupCache(cache) {
        const entries = Object.entries(cache);
        
        // Si hay más de MAX_CACHE_SIZE, eliminar los más antiguos
        if (entries.length > this.MAX_CACHE_SIZE) {
            const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toDelete = sorted.slice(0, entries.length - this.MAX_CACHE_SIZE);
            
            toDelete.forEach(([key]) => {
                delete cache[key];
                console.log(`🗑️ Eliminado del caché: ${key}`);
            });
        }
        
        // Eliminar entradas expiradas
        const now = Date.now();
        Object.keys(cache).forEach(key => {
            if (now - cache[key].timestamp > this.CACHE_DURATION) {
                delete cache[key];
                console.log(`⏰ Eliminado del caché (expirado): ${key}`);
            }
        });
    },
    
    /**
     * Limpiar todo el caché
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('🗑️ Caché limpiado completamente');
    },
    
    /**
     * Obtener estadísticas del caché
     */
    getStats() {
        const cache = this.getCache();
        const entries = Object.values(cache);
        
        return {
            total: entries.length,
            size: new Blob([JSON.stringify(cache)]).size,
            oldest: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
            newest: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
        };
    },
    
    /**
     * Formatear tiempo desde timestamp
     */
    formatTimeSince(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    },
    
    /**
     * Verificar si hay caché disponible
     */
    hasCache(cvData, profileType) {
        return this.get(cvData, profileType) !== null;
    }
};

// Exponer globalmente
window.ProfileCache = ProfileCache;
