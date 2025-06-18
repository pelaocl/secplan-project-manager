import { apiService } from '../services/apiService';
import { Filters } from '../components/dashboard/DashboardFilters'; // Importamos el tipo Filters

// Interfaz para datos de gráficos simples
export interface ChartDataPoint {
  name: string;
  value: number;
}

// Interfaz para datos de superficie
export interface SuperficiePorTipologia {
  name: string;
  terreno: number;
  edificacion: number;
}

// Interfaz para la respuesta completa del dashboard
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
    superficiePorTipologia: SuperficiePorTipologia[];
  };
}

/**
 * Llama al endpoint del backend para obtener los datos del dashboard,
 * aplicando los filtros proporcionados.
 */
async function getDashboardData(filters: Filters): Promise<DashboardData> {
  // Construir la query string a partir de los filtros
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  const endpoint = `/stats/dashboard${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiService.get<{ data: DashboardData }>(endpoint);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error("La respuesta de la API de estadísticas no tiene el formato esperado.");
    }
  } catch (error) {
    console.error("Error al obtener los datos del dashboard:", error);
    throw error;
  }
}

export const statsApi = {
    getDashboardData,
};
