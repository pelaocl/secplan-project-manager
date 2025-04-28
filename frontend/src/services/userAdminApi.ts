// ========================================================================
// INICIO: Contenido COMPLETO y CORREGIDO v3 para userAdminApi.ts (CRUD Completo)
// ========================================================================
import { apiService, ApiError } from './apiService';
import { User } from '../types';
import { CreateUserFormValues, UpdateUserFormValues } from '../schemas/adminUserFormSchema';

// Tipos Respuesta (sin cambios)
interface FetchUsersResponse { status: string; results?: number; data: { users: User[]; }; }
interface MutateUserResponse { status: string; data: { user: User; }; }

/** Obtiene todos los usuarios */
async function fetchAllUsers(): Promise<User[]> { /* ... sin cambios ... */
    console.log("[userAdminApi] Fetching all users..."); try { const response = await apiService.get<FetchUsersResponse>('/admin/users'); if (response && response.data && Array.isArray(response.data.users)) { return response.data.users; } else { console.error("[userAdminApi] Unexpected response structure for fetchAllUsers:", response); throw new Error('Respuesta inválida al obtener usuarios.'); } } catch (error) { console.error("[userAdminApi] Error fetching users:", error); throw error; }
}
/** Crea un nuevo usuario */
async function createUser(data: CreateUserFormValues): Promise<User> { /* ... sin cambios ... */
    console.log("[userAdminApi] Creating user:", data); try { const { passwordConfirmation, ...apiData } = data; const response = await apiService.post<MutateUserResponse>('/admin/users', apiData); if (response && response.data && response.data.user) { return response.data.user; } else { console.error("[userAdminApi] Unexpected response structure for createUser:", response); throw new Error('Respuesta inválida al crear usuario.'); } } catch (error) { console.error("[userAdminApi] Error creating user:", error); throw error; }
}
/** Actualiza un usuario existente */
async function updateUser(id: number, data: UpdateUserFormValues): Promise<User> { /* ... sin cambios ... */
    console.log(`[userAdminApi] Updating user ${id}:`, data); try { const { passwordConfirmation, password, ...restData } = data; const dataToSend: Record<string, any> = { ...restData }; if (password) { dataToSend.password = password; } const response = await apiService.put<MutateUserResponse>(`/admin/users/${id}`, dataToSend); if (response && response.data && response.data.user) { return response.data.user; } else { console.error(`[userAdminApi] Unexpected response structure for updateUser ${id}:`, response); throw new Error(`Respuesta inválida al actualizar usuario ${id}.`); } } catch (error) { console.error(`[userAdminApi] Error updating user ${id}:`, error); throw error; }
}

// --- FUNCIÓN DELETE USER (RESTAURADA) ---
/**
 * Elimina un usuario existente en el backend.
 */
async function deleteUser(id: number): Promise<void> {
    console.log(`[userAdminApi] Deleting user ${id}...`);
    try {
        // Llama al endpoint DELETE. No esperamos contenido en la respuesta (204)
        await apiService.delete(`/admin/users/${id}`);
        console.log(`[userAdminApi] User ${id} delete request sent successfully.`);
    } catch (error) {
        console.error(`[userAdminApi] Error deleting user ${id}:`, error);
        // Relanza errores específicos si la API los proporciona
        if (error instanceof ApiError) {
            // El backend debería devolver 400 si no se puede borrar por dependencias
            if (error.status === 400) {
                throw new Error(error.body?.message || 'No se puede eliminar el usuario (puede tener proyectos/tareas asociadas).');
            }
            if (error.status === 404) {
                throw new Error(`Usuario no encontrado para eliminar.`);
            }
        }
        throw error; // Relanza otros errores
    }
}
// --- FIN FUNCIÓN DELETE USER ---


export const userAdminApi = {
    fetchAllUsers,
    create: createUser,
    update: updateUser,
    deleteUserFn: deleteUser, // <-- Ahora 'deleteUser' existe y se exporta aquí
};
// ========================================================================
// FIN: Contenido COMPLETO y CORREGIDO v3 para userAdminApi.ts (CRUD Completo)
// ========================================================================