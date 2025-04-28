// frontend/src/services/userAdminApi.ts
import { apiService, ApiError } from './apiService';
// Importa el tipo User (que ahora debería incluir etiquetas)
import { User } from '../types';

// Tipo esperado para la respuesta de GET /api/admin/users
// Asumiendo la estructura { status, results, data: { users: [] } }
interface FetchUsersResponse {
    status: string;
    results?: number;
    data: {
        users: User[]; // Espera que los usuarios vengan con sus etiquetas
    };
}

/**
 * Obtiene todos los usuarios del backend (para Admin).
 * Incluye las etiquetas asignadas a cada usuario.
 */
async function fetchAllUsers(): Promise<User[]> {
    console.log("[userAdminApi] Fetching all users...");
    try {
        const response = await apiService.get<FetchUsersResponse>('/admin/users');

        if (response && response.data && Array.isArray(response.data.users)) {
            console.log(`[userAdminApi] Found ${response.data.users.length} users.`);
            // Devuelve el array de usuarios (que deben incluir el campo 'etiquetas')
            return response.data.users;
        } else {
            console.error("[userAdminApi] Unexpected response structure for fetchAllUsers:", response);
            throw new Error('Respuesta inválida al obtener usuarios.');
        }
    } catch (error) {
        console.error("[userAdminApi] Error fetching users:", error);
        throw error;
    }
}

// --- CREAR USUARIOS ---
/**
 * Crea un nuevo usuario en el backend.
 */
async function createUser(data: CreateUserFormValues): Promise<User> {
    console.log("[userAdminApi] Creating user:", data);
    try {
        // Excluimos passwordConfirmation antes de enviar a la API
        const { passwordConfirmation, ...apiData } = data;
        const response = await apiService.post<MutateUserResponse>('/admin/users', apiData);

        if (response && response.data && response.data.user) {
            console.log("[userAdminApi] User created successfully:", response.data.user.id);
            return response.data.user; // Devuelve el usuario creado (sin contraseña)
        } else {
            console.error("[userAdminApi] Unexpected response structure for createUser:", response);
            throw new Error('Respuesta inválida al crear usuario.');
        }
    } catch (error) {
        console.error("[userAdminApi] Error creating user:", error);
        // Relanza para que la página maneje el error (ej. email duplicado)
        throw error;
    }
}
// --- FIN CREAR USUARIOS ---

// TODO: Añadir updateUser, deleteUser

export const userAdminApi = {
    fetchAllUsers,
    createUser,
    // updateUser,
    // deleteUser,
};