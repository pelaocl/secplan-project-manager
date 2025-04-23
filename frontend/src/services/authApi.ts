import { apiService, ApiError } from './apiService';
import { FrontendLoginInput } from '../schemas/authSchemas'; // Importa el tipo del formulario
import { User } from '../types'; // Importa tu tipo User global si lo tienes

// Define la estructura esperada de la respuesta del backend para /login
interface LoginResponse {
    token: string;
    user: User; // Asume que tienes una interfaz User definida en src/types
}

// Función para realizar el login
async function login(credentials: FrontendLoginInput): Promise<LoginResponse> {
    try {
        // Llama al endpoint POST /api/auth/login usando el apiService base
        const response = await apiService.post<LoginResponse>('/auth/login', credentials);
        // apiService ya maneja errores de red y respuestas !response.ok
        // Si llegamos aquí, la respuesta fue exitosa (ej. 200 OK)
        return response;
    } catch (error) {
        // Re-lanza el error para que el componente que llama lo maneje
        // apiService ya debería haber lanzado un ApiError con status y data
        console.error("Login API error:", error);
        throw error; // El componente LoginPage manejará la visualización del error
    }
}

// Podrías añadir aquí funciones para register, logout (si necesita llamada a API), getMe, etc.
// async function getMe(): Promise<User> { ... }

// Exporta las funciones que necesites
export const authApi = {
    login,
    // getMe, // Descomenta si implementas getMe
};