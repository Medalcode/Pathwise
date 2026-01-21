/**
 * Módulo de Autenticación para Panoptes
 * Gestiona login, registro y tokens JWT
 */

const AUTH_KEY = 'panoptes_auth_token';
const USER_KEY = 'panoptes_user';
// Detectar entorno (Docker vs Local)
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : '/api';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem(AUTH_KEY);
        this.user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    }

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en login');
            }

            this._setSession(data.token, data.user);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async register(email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en registro');
            }

            this._setSession(data.token, data.user);
            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    /**
     * Cerrar sesión
     */
    logout() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(USER_KEY);
        this.token = null;
        this.user = null;
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        // Recargar página para limpiar estado
        window.location.reload();
    }

    /**
     * Guardar sesión localmente
     */
    _setSession(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem(AUTH_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Obtener headers autorizados para peticiones fetch
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Wrapper para fetch autenticado
     */
    async fetch(url, options = {}) {
        // Asegurar headers
        options.headers = {
            ...this.getHeaders(),
            ...options.headers
        };

        const response = await fetch(url, options);

        // Manejar 401 (Token expirado)
        if (response.status === 401) {
            this.logout();
            throw new Error('Sesión expirada');
        }

        return response;
    }
}

// Inicializar y exponer globalmente
window.auth = new AuthManager();
