import { apiService } from '../services/apiService';

// Interfaces para las opciones de los filtros
export interface LookupOption {
    id: number;
    nombre: string;
}

export interface UnidadMunicipalOption extends LookupOption {
    abreviacion: string;
}

export interface TipologiaOption extends LookupOption {
    abreviacion: string;
    colorChip: string;
}

// Interfaz para la respuesta completa del endpoint de lookups
export interface LookupDataResponse {
    estados: LookupOption[];
    unidades: UnidadMunicipalOption[];
    tipologias: TipologiaOption[];
    sectores: LookupOption[];
    lineas: LookupOption[];
    programas: { id: number; nombre: string; lineaFinanciamientoId: number }[];
    etapas: LookupOption[];
    usuarios: { id: number; name: string | null; email: string }[];
}

/**
 * Llama al endpoint del backend para obtener todas las listas de opciones
 * necesarias para los formularios y filtros.
 */
async function getLookupData(): Promise<LookupDataResponse> {
    try {
        const response = await apiService.get<LookupDataResponse>('/lookups/form-options');

        if (response) {
            return response;
        } else {
            throw new Error("La respuesta de la API de lookups no tiene el formato esperado.");
        }
    } catch (error) {
        console.error("Error al obtener los datos de lookup:", error);
        // Re-lanza el error para que el componente que llama pueda manejarlo
        throw error;
    }
}

export const lookupApi = {
    getLookupData,
};
