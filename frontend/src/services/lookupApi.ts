import { apiService } from './apiService';
import { FormOptionsResponse } from '../types';

async function getFormOptions(): Promise<FormOptionsResponse> {
    console.log("[lookupApi] Fetching form options..."); // Log existente
    try {
        // --- NUEVO LOG ---
        console.log("[lookupApi] Calling apiService.get('/lookups/form-options')...");
        // --- FIN NUEVO LOG ---
        const data = await apiService.get<FormOptionsResponse>('/lookups/form-options');
        console.log("[lookupApi] apiService.get successful."); // Log de éxito
        return data;
    } catch (error) {
        console.error("[lookupApi] Error caught:", error); // Log de error
        throw error; // Re-lanza para que la página lo maneje
    }
}

export const lookupApi = {
    getFormOptions,
};