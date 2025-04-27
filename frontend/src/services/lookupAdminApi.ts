// frontend/src/services/lookupAdminApi.ts
import { apiService, ApiError } from './apiService';
// Importa tipos genéricos o específicos si los tienes.
// Por ahora, usaremos 'any' para simplificar, pero idealmente definirías interfaces
// para Estado, Unidad, Tipologia, etc., o un tipo unión.
// import { LookupType } from '../schemas/lookupAdminSchemas'; // Si exportaste el tipo desde backend schemas

// Definimos los tipos de lookup válidos en el frontend también
export const validLookupTypes = [
    'estados', 'unidades', 'tipologias', 'sectores', 'lineas', 'programas', 'etapas'
] as const;
export type LookupType = typeof validLookupTypes[number]; // Tipo 'estados' | 'unidades' | ...

// Tipo genérico para la respuesta de la lista
// Asume que el backend devuelve { data: { [lookupType]: [...] } }
interface FetchLookupResponse<T> {
    status: string;
    results?: number;
    data: {
        [key: string]: T[]; // Clave dinámica, ej: 'estados', 'unidades'
    };
}

/**
 * Obtiene todos los registros para un tipo de lookup específico.
 */
async function fetchAll(lookupType: LookupType): Promise<any[]> { // Devuelve any[] por ahora
    console.log(`[lookupAdminApi] Fetching all for type: ${lookupType}...`);
    if (!validLookupTypes.includes(lookupType)) {
        console.error(`[lookupAdminApi] Invalid lookup type requested: ${lookupType}`);
        throw new Error(`Tipo de lookup inválido: ${lookupType}`);
    }
    try {
        // Llama al endpoint genérico del backend
        const response = await apiService.get<FetchLookupResponse<any>>(`/admin/lookups/${lookupType}`);

        // Extrae la lista de la clave dinámica
        if (response && response.data && Array.isArray(response.data[lookupType])) {
            console.log(`[lookupAdminApi] Found ${response.data[lookupType].length} records for ${lookupType}.`);
            return response.data[lookupType];
        } else {
            console.error(`[lookupAdminApi] Unexpected response structure for fetchAll(${lookupType}):`, response);
            throw new Error(`Respuesta inválida al obtener ${lookupType}.`);
        }
    } catch (error) {
        console.error(`[lookupAdminApi] Error fetching ${lookupType}:`, error);
        throw error;
    }
}

// --- CREA REGISTRO ---
/**
 * Crea un nuevo registro para un tipo de lookup específico.
 */
async function create(lookupType: LookupType, data: AnyLookupFormValues): Promise<any> { // Devuelve any por ahora
    console.log(`[lookupAdminApi] Creating ${lookupType}:`, data);
    if (!validLookupTypes.includes(lookupType)) { throw new Error(`Tipo de lookup inválido: ${lookupType}`); }
    try {
        // Llama al endpoint POST genérico
        const response = await apiService.post<MutateLookupResponse<any>>(`/admin/lookups/${lookupType}`, data);

        // La respuesta debería tener una clave singular (ej. 'estado') dentro de 'data'
        const singularKey = lookupType.endsWith('s') ? lookupType.slice(0, -1) : lookupType;

        if (response && response.data && response.data[singularKey]) {
            console.log(`[lookupAdminApi] Record for ${lookupType} created successfully:`, response.data[singularKey].id);
            return response.data[singularKey]; // Devuelve el objeto creado
        } else {
            console.error(`[lookupAdminApi] Unexpected response structure for create(${lookupType}):`, response);
            throw new Error(`Respuesta inválida al crear ${lookupType}.`);
        }
    } catch (error) {
        console.error(`[lookupAdminApi] Error creating ${lookupType}:`, error);
        // Podríamos relanzar errores específicos aquí si ApiError los proporciona
        throw error;
    }
}
// --- FIN CREA REGISTRO ---

// --- EDITAR REGISTRO ---
/**
 * Actualiza un registro de lookup existente por ID y tipo.
 */
async function update(lookupType: LookupType, id: number, data: AnyUpdateLookupFormValues): Promise<any> {
    console.log(`[lookupAdminApi] Updating ${lookupType} ID ${id}:`, data);
    if (!validLookupTypes.includes(lookupType)) { throw new Error(`Tipo de lookup inválido: ${lookupType}`); }
    try {
        // Llama al endpoint PUT genérico
        const response = await apiService.put<MutateLookupResponse<any>>(`/admin/lookups/${lookupType}/${id}`, data);

        const singularKey = lookupType.endsWith('s') ? lookupType.slice(0, -1) : lookupType;
        if (response && response.data && response.data[singularKey]) {
            console.log(`[lookupAdminApi] Record ${id} for ${lookupType} updated successfully.`);
            return response.data[singularKey]; // Devuelve el objeto actualizado
        } else {
            console.error(`[lookupAdminApi] Unexpected response structure for update(${lookupType}, ${id}):`, response);
            throw new Error(`Respuesta inválida al actualizar ${lookupType}.`);
        }
    } catch (error) {
        console.error(`[lookupAdminApi] Error updating ${lookupType} ID ${id}:`, error);
        throw error; // Relanza para que la página lo maneje
    }
}
// --- FIN EDITAR REGISTRO ---


// --- ELIMINAR REGISTRO ---
/**
 * Elimina un registro de lookup por ID y tipo.
 */
async function deleteRecord(lookupType: LookupType, id: number): Promise<void> {
    console.log(`[lookupAdminApi] Deleting ${lookupType} ID ${id}...`);
    if (!validLookupTypes.includes(lookupType)) { throw new Error(`Tipo de lookup inválido: ${lookupType}`); }
    try {
        // Llama al endpoint DELETE genérico
        await apiService.delete(`/admin/lookups/${lookupType}/${id}`);
        console.log(`[lookupAdminApi] Record ${id} for ${lookupType} delete request sent.`);
    } catch (error) {
        console.error(`[lookupAdminApi] Error deleting ${lookupType} ID ${id}:`, error);
        // Relanza errores específicos si es posible
        if (error instanceof ApiError) {
            if (error.status === 400) { // Backend devuelve 400 si está en uso
                 throw new Error(error.body?.message || 'No se puede eliminar porque está en uso.');
            }
            if (error.status === 404) {
                 throw new Error(`Registro no encontrado para eliminar.`);
            }
        }
        throw error;
    }
}
// --- FIN ELIMINAR REGISTRO ---

export const lookupAdminApi = {
    fetchAll,
    create,
    update,
    deleteRecord,
};