import { apiService } from './apiService';
import { FormOptionsResponse } from '../types';

/**
 * Obtiene todas las opciones necesarias para los formularios de proyecto
 * desde el endpoint protegido del backend.
 */
async function getFormOptions(): Promise<FormOptionsResponse> {
    // console.log("[lookupApi] Fetching form options..."); // Eliminado
    // console.log("[lookupApi] Calling apiService.get('/lookups/form-options')..."); // Eliminado
    try {
        const data = await apiService.get<FormOptionsResponse>('/lookups/form-options');
        // console.log("[lookupApi] apiService.get successful."); // Eliminado
        return data;
    } catch (error) {
        // Mantenemos log de error, es útil
        console.error("[lookupApi] Error caught fetching form options:", error);
        throw error; // Re-lanza para que la página lo maneje
    }
}

export const lookupApi = {
    getFormOptions,
};