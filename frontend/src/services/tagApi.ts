// frontend/src/services/tagApi.ts
import { apiService, ApiError } from './apiService'; // Asume que apiService maneja errores y token
import { Etiqueta } from '../types'; // Importa el tipo Etiqueta
import { TagFormValues } from '../schemas/tagFormSchema';

// Tipo esperado para la respuesta de GET /api/admin/tags
// Asumiendo que el backend envuelve la respuesta como hicimos antes
interface FetchTagsResponse {
    status: string;
    results?: number; // Opcional
    data: {
        tags: Etiqueta[];
    };
}

/**
 * Obtiene todas las etiquetas del backend.
 * Requiere permisos de Admin (gestionado por el backend).
 */
async function fetchAllTags(): Promise<Etiqueta[]> {
    console.log("[tagApi] Fetching all tags...");
    try {
        // Llama al endpoint protegido del backend
        const response = await apiService.get<FetchTagsResponse>('/admin/tags'); // Llama a /api/admin/tags

        // Verifica y devuelve la lista de etiquetas
        if (response && response.data && Array.isArray(response.data.tags)) {
            console.log(`[tagApi] Found ${response.data.tags.length} tags.`);
            return response.data.tags;
        } else {
            console.error("[tagApi] Unexpected response structure for fetchAllTags:", response);
            throw new Error('Respuesta inválida al obtener etiquetas.');
        }
    } catch (error) {
        console.error("[tagApi] Error fetching tags:", error);
        // Puedes relanzar el error original o uno más específico
        throw error;
    }
}

// --- CREAR NUEVA ETIQUETA ---
async function createTag(data: TagFormValues): Promise<Etiqueta> {
    console.log("[tagApi] Creating tag:", data);
    try {
        // Llama al endpoint POST del backend
        const response = await apiService.post<MutateTagResponse>('/admin/tags', data);

        // Verifica y devuelve la etiqueta creada
        if (response && response.data && response.data.tag) {
            console.log("[tagApi] Tag created successfully:", response.data.tag.id);
            return response.data.tag;
        } else {
            console.error("[tagApi] Unexpected response structure for createTag:", response);
            throw new Error('Respuesta inválida al crear etiqueta.');
        }
    } catch (error) {
        console.error("[tagApi] Error creating tag:", error);
        // Si apiService lanza errores con detalles (ej. ApiError con status 400),
        // podríamos relanzar un error más específico aquí.
        // Ejemplo: if (error instanceof ApiError && error.status === 400) throw new Error(error.body?.message || 'Error de validación');
        throw error; // Relanza el error para que la página lo maneje
    }
}
// --- FIN CREAR NUEVA ETIQUETA ---

// --- ACTUALIZAR ETIQUETA ---
async function updateTag(id: number, data: Partial<TagFormValues>): Promise<Etiqueta> {
    // Nota: Pasamos Partial<TagFormValues> porque al editar podrías querer
    // permitir enviar solo el campo que cambió, aunque nuestro form actual
    // probablemente siempre envíe ambos (nombre y color). El backend maneja esto.
    console.log(`[tagApi] Updating tag ${id}:`, data);
    try {
        // Llama al endpoint PUT del backend
        const response = await apiService.put<MutateTagResponse>(`/admin/tags/${id}`, data);

        // Verifica y devuelve la etiqueta actualizada
        if (response && response.data && response.data.tag) {
            console.log(`[tagApi] Tag ${id} updated successfully.`);
            return response.data.tag;
        } else {
            console.error(`[tagApi] Unexpected response structure for updateTag ${id}:`, response);
            throw new Error(`Respuesta inválida al actualizar etiqueta ${id}.`);
        }
    } catch (error) {
        console.error(`[tagApi] Error updating tag ${id}:`, error);
        // Puedes añadir manejo específico para 400 (BadRequest), 404 (NotFound) si es necesario
        // if (error instanceof ApiError && error.status === 400) throw new Error(error.body?.message || 'Error de validación al actualizar');
        // if (error instanceof ApiError && error.status === 404) throw new Error(`Etiqueta ${id} no encontrada`);
        throw error; // Relanza para que la página lo maneje
    }
}
// --- FIN ACTUALIZAR ETIQUETA ---


// --- ELIMINAR ETIQUETA ---
async function deleteTag(id: number): Promise<void> {
    console.log(`[tagApi] Deleting tag ${id}...`);
    try {
        // Llama al endpoint DELETE. No esperamos contenido en la respuesta (204)
        await apiService.delete(`/admin/tags/${id}`);
        console.log(`[tagApi] Tag ${id} delete request sent successfully.`);
    } catch (error) {
        console.error(`[tagApi] Error deleting tag ${id}:`, error);
        // Si apiService lanza ApiError, podemos obtener más detalles
        if (error instanceof ApiError) {
            // El backend debería devolver 400 si la etiqueta está en uso
            if (error.status === 400) {
                throw new Error(error.body?.message || 'No se puede eliminar la etiqueta porque está en uso.');
            }
            if (error.status === 404) {
                throw new Error(`Etiqueta ${id} no encontrada para eliminar.`);
            }
        }
        // Relanza otros errores
        throw error;
    }
}
// --- FIN ELIMINAR ETIQUETA ---

// Exporta las funciones para ser usadas por las páginas/componentes
export const tagApi = {
    fetchAllTags,
    createTag,
    updateTag,
    deleteTag,
};