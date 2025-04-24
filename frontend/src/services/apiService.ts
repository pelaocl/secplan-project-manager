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
    // --- NUEVO LOG ---
    console.log(`[apiService request] Initiated for endpoint: ${endpoint}`, options);

    let token: string | null = null;
    try {
        // --- NUEVO LOG ---
        console.log("[apiService request] Attempting to get token from Zustand...");
        token = useAuthStore.getState().token;
        console.log(`[apiService request] Token found: ${token ? 'Yes' : 'No'}`);
    } catch (zustandError) {
         console.error("[apiService request] Error getting state from Zustand:", zustandError);
         // Decide cómo manejar esto, ¿continuar sin token o lanzar error?
         // Por ahora, continuará sin token.
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method: options.method || 'GET',
        ...options,
        headers,
    };
    if (options.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    } else {
         delete config.body;
    }

    const requestUrl = `${API_BASE_URL}${endpoint}`;
    // --- NUEVO LOG ---
    console.log(`[apiService request] Making fetch call to: ${requestUrl}`, config);

    try {
        const response = await fetch(requestUrl, config);
        // --- NUEVO LOG ---
        console.log(`[apiService request] Fetch response received for ${endpoint}: Status ${response.status}`);

        if (!response.ok) {
            let errorData = null;
            try { errorData = await response.json(); } catch (e) { errorData = { message: response.statusText }; }
            const errorMessage = errorData?.message || `Error ${response.status}: ${response.statusText}`;
            throw new ApiError(errorMessage, response.status, errorData);
        }

        if (response.status === 204) { return undefined as T; }

        const text = await response.text();
        if (!text) { return undefined as T; }
        return JSON.parse(text) as T;

    } catch (error) {
        console.error('[apiService request] Error during fetch or processing:', endpoint, error);
        if (error instanceof ApiError) { throw error; }
        throw new Error('Error de conexión con el servidor. Verifica tu conexión a internet.');
    }
}

// Exporta el objeto apiService (sin cambios aquí)
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