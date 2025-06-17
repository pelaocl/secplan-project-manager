// frontend/src/services/apiService.ts
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {}

export class ApiError extends Error {
    status: number;
    data: any;
    constructor(message: string, status: number, data: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    let token: string | null = null;
    try {
        token = useAuthStore.getState().token;
    } catch (zustandError) {
         // Mantenemos este error por si falla Zustand
         console.error("[apiService request] Error getting state from Zustand:", zustandError);
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };
    if (token) { headers['Authorization'] = `Bearer ${token}`; }

    const config: RequestInit = { method: options.method || 'GET', ...options, headers };
    if (options.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    } else { delete config.body; }

    const requestUrl = `${API_BASE_URL}${endpoint}`;
    // Quitamos logs de depuración antes de fetch

    try {
        const response = await fetch(requestUrl, config);
        // Quitamos log de respuesta recibida exitosa

        if (!response.ok) {
            let errorData = null;
            try { errorData = await response.json(); } catch (e) { errorData = { message: response.statusText }; }
            const errorMessage = errorData?.message || `Error ${response.status}: ${response.statusText}`;
            // Mantenemos este throw que es parte de la lógica
            throw new ApiError(errorMessage, response.status, errorData);
        }

        if (response.status === 204) { return undefined as T; }

        const text = await response.text();
        if (!text) { return undefined as T; }
        return JSON.parse(text) as T;

    } catch (error) {
        // Mantenemos este log de error general, es útil
        console.error('[apiService request] Error during fetch or processing:', endpoint, error);
        if (error instanceof ApiError) { throw error; } // Re-lanza ApiError
        // Lanza un error genérico si no es ApiError (ej. error de red)
        throw new Error('Error de conexión con el servidor.');
    }
}

// Exporta apiService (sin cambios aquí)
export const apiService = {
    get: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
        request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
        request<T>(endpoint, { ...options, method: 'POST', body }),
    put: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
        request<T>(endpoint, { ...options, method: 'PUT', body }),
    delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
        request<T>(endpoint, { ...options, method: 'DELETE' }),
    patch: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
        request<T>(endpoint, { ...options, method: 'PATCH', body }),
};