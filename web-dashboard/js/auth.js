/**
 * Módulo de Autenticación "Mock" para Panoptes
 * Simula que siempre hay un usuario logueado para modo offline/local.
 */

class AuthManager {
    constructor() {
        // Usuario "dummy" por defecto
        this.user = {
            id: 'local-user',
            email: 'user@local.dev'
        };
        this.token = 'mock-token';
    }

    async login(email, password) {
        console.log('🔓 Mock Login:', email);
        return { success: true, user: this.user, token: this.token };
    }

    async register(email, password) {
        console.log('🔓 Mock Register:', email);
        return { success: true, user: this.user, token: this.token };
    }

    logout() {
        console.log('🔓 Mock Logout');
        // No hace nada en realidad porque siempre estamos logueados
        window.location.reload();
    }

    isAuthenticated() {
        return true; // Siempre autenticado
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async fetch(url, options = {}) {
        options.headers = {
            ...this.getHeaders(),
            ...options.headers
        };
        // Pasar las peticiones tal cual, asumiendo que el backend (si existe) 
        // o los mocks locales las manejarán.
        return fetch(url, options);
    }
}

// Inicializar y exponer globalmente
window.auth = new AuthManager();

// Disparar evento de login simulado al cargar para actualizar UI
setTimeout(() => {
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: window.auth.user } }));
}, 100);
