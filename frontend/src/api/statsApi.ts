import { apiService } from '../services/apiService';

// Define la estructura de la data que esperas para un gráfico
// (Coincide con lo que devuelve tu backend para montoPorTipologia)
export interface ChartDataPoint {
name: string;
value: number;
}
  
export interface SuperficiePorTipologia {
name: string;
terreno: number;
edificacion: number;
}

// Define la estructura completa de la respuesta del dashboard
export interface DashboardData {
    financiero: {
      montoPorTipologia: ChartDataPoint[];
      inversionPorPrograma: ChartDataPoint[];
    };
    personas: {
      tareasActivasPorUsuario: ChartDataPoint[];
      proyectosPorUnidad: ChartDataPoint[];
    };
    geografico: {
      proyectosPorSector: ChartDataPoint[];
      superficiePorTipologia: SuperficiePorTipologia[]; // Usa la nueva interfaz aquí
    };
  }

/**
 * Llama al endpoint del backend para obtener los datos del dashboard.
 */
async function getDashboardData(): Promise<DashboardData> {
    try {
        // El tipo genérico aquí espera que tu apiService.get devuelva un objeto
        // con la forma { status: 'success', data: DashboardData }
        const response = await apiService.get<{ data: DashboardData }>('/stats/dashboard');

        if (response && response.data) {
            return response.data;
        } else {
            throw new Error("La respuesta de la API de estadísticas no tiene el formato esperado.");
        }
    } catch (error) {
        console.error("Error al obtener los datos del dashboard:", error);
        // Re-lanza el error para que el componente que llama pueda manejarlo
        throw error;
    }
}

export const statsApi = {
    getDashboardData,
};