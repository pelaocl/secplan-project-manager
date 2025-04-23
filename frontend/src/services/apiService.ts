import { useAuthStore } from '../store/authStore'; // Importa tu store de Zustand

// Lee la URL base de la API desde las variables de entorno de Vite
// o usa /api si usas el proxy de Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Opciones adicionales que se pueden pasar a la función request
interface RequestOptions extends RequestInit {
    // Podrías añadir opciones personalizadas aquí si las necesitas
}

// Clase de Error personalizada para respuestas de API no exitosas
export class ApiError extends Error {
    status: number; // Código de estado HTTP (ej. 400, 401, 404, 500)
    data: any; // Cuerpo de la respuesta de error del backend (si existe)

    constructor(message: string, status: number, data: any) {
        super(message); // Mensaje de error
        this.name = 'ApiError';
        this.status = status;
        this.data = data; // Puede contener { status: 'fail', message: '...', details: ... }
    }
}

/**
 * Función genérica para realizar peticiones a la API.
 * Maneja la adición del token JWT y errores comunes.
 * @param endpoint La ruta API (ej. '/projects', '/auth/login')
 * @param options Opciones de Fetch API (method, headers, body, etc.)
 * @returns Promise<T> - Promesa que resuelve con los datos parseados (JSON) del tipo T.
 * @throws {ApiError} - Si la respuesta de la API no es ok (status >= 400).
 * @throws {Error} - Si ocurre un error de red u otro inesperado.
 */
async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    // Obtiene el token directamente del estado de Zustand (sin necesitar hooks)
    const { token } = useAuthStore.getState();

    // Configura las cabeceras por defecto
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        // Fusiona con cabeceras personalizadas pasadas en options
        ...options.headers,
    };

    // Añade el token de autorización si existe
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Configuración final para la llamada fetch
    const config: RequestInit = {
        method: options.method || 'GET', // GET por defecto
        ...options, // Incluye otras opciones como signal (para abortar), cache, etc.
        headers, // Usa las cabeceras combinadas
    };

    // Solo incluye 'body' para métodos que lo soportan
    // y asegúrate que sea un JSON string si es un objeto
    if (options.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    } else {
         // Elimina explícitamente el body para GET/DELETE etc.
         delete config.body;
    }

    try {
        // Realiza la petición fetch
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Verifica si la respuesta NO fue exitosa (status 4xx o 5xx)
        if (!response.ok) {
            let errorData = null;
            try {
                // Intenta parsear el cuerpo de la respuesta de error (puede ser JSON)
                errorData = await response.json();
            } catch (e) {
                // Si el cuerpo no es JSON o está vacío, usa el texto de estado
                errorData = { message: response.statusText };
            }
            // Extrae el mensaje de error (prioriza el del backend)
            const errorMessage = errorData?.message || `Error ${response.status}: ${response.statusText}`;
            // Lanza un error personalizado con status y data
            throw new ApiError(errorMessage, response.status, errorData);
        }

        // Maneja respuestas sin contenido (ej. 204 No Content para DELETE)
        if (response.status === 204) {
            // Devuelve undefined o null casteado al tipo esperado T
            return undefined as T;
        }

        // Intenta parsear la respuesta como JSON
        // Necesario porque response.json() puede fallar si el cuerpo está vacío
        const text = await response.text();
        if (!text) {
            // Devuelve undefined/null si el cuerpo está vacío pero el status es exitoso
             return undefined as T;
        }
        // Parsea el texto como JSON y castea al tipo esperado T
        return JSON.parse(text) as T;

    } catch (error) {
        // Loguea errores para depuración
        console.error('API Request Error:', endpoint, error);

        // Si ya es un ApiError (lanzado arriba), re-lánzalo
        if (error instanceof ApiError) {
             // Opcional: Podrías manejar el 401 aquí globalmente (ej. hacer logout)
             // if (error.status === 401 && endpoint !== '/auth/login') {
             //   useAuthStore.getState().actions.logout();
             // }
             throw error;
        }

        // Si es otro tipo de error (ej. de red), lanza un error genérico
        // Podrías intentar detectar errores de red específicos si quieres
        // if (error instanceof TypeError && error.message === 'Failed to fetch') { ... }
        throw new Error('Error de conexión con el servidor. Verifica tu conexión a internet.');
    }
}

// Exporta un objeto con métodos helper para los verbos HTTP comunes
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

// --- NO DEBE HABER NINGUNA OTRA FUNCIÓN O EXPORTACIÓN DESPUÉS DE ESTO ---