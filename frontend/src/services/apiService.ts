import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Get from .env or default

interface RequestOptions extends RequestInit {
    // Add any custom options if needed
}

// Custom Error for API responses
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
    const { token } = useAuthStore.getState(); // Get token directly from store state

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

    // Only include body for relevant methods
    if (options.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    } else {
         delete config.body; // Ensure body is not sent for GET/DELETE etc.
    }


    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json(); // Try to parse error body
            } catch (e) {
                errorData = { message: response.statusText }; // Fallback if body is not JSON
            }
            // Use message from backend error response if available
            const errorMessage = errorData?.message || `Error ${response.status}: ${response.statusText}`;
            throw new ApiError(errorMessage, response.status, errorData);
        }

        // Handle No Content response (e.g., for DELETE)
        if (response.status === 204) {
            return undefined as T; // Or null, depending on expected type
        }

        // Try parsing JSON, handle potential empty response for other successful statuses
        const text = await response.text();
        if (!text) {
             return undefined as T; // Or null
        }
        return JSON.parse(text) as T;

    } catch (error) {
        console.error('API Request Error:', error);
        if (error instanceof ApiError) {
             // Handle specific API errors (e.g., 401 Unauthorized -> trigger logout)
             if (error.status === 401) {
                 // Optional: Clear auth state if token is invalid
                 // useAuthStore.getState().actions.logout(); // Be careful with infinite loops if login fails
                 console.warn("Received 401 Unauthorized from API");
             }
             throw error; // Re-throw ApiError
        }
        // Throw generic error for network issues etc.
        throw new Error('Error de conexión con el servidor.');
    }
}

// Export helper functions for common methods
export const apiService = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'POST', body }),
    put: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'PUT', body }),
    delete: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'DELETE' }),
    // Add patch if needed
    // patch: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    //     request<T>(endpoint, { ...options, method: 'PATCH', body }),
};

// Example specific API functions (in separate files like authApi.ts, projectApi.ts)
/*
// --- In projectApi.ts ---
import { apiService } from './apiService';
import { Project } from '../types'; // Assuming Project type definition

export const fetchProjects = (params: URLSearchParams) => {
    return apiService.get<{ projects: Project[]; total: number; /* ... */ }>(`/projects?${params.toString()}`);
}
export const getProjectById = (id: number) => {
    return apiService.get<Project>(`/projects/${id}`);
}
export const createProject = (data: CreateProjectInput) => {
    return apiService.post<Project>('/projects', data);
}
// ... and so on
*/