import { apiService } from './apiService';
import { Project } from '../types'; // Importa tu interfaz Project

// Define la estructura esperada de la respuesta paginada de la API /api/projects
export interface PaginatedProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Obtiene una lista paginada de proyectos desde la API.
 * @param params Opcional: Objeto URLSearchParams o un objeto simple para filtros y paginación
 */
async function fetchProjects(params?: URLSearchParams | Record<string, any>): Promise<PaginatedProjectsResponse> {
    let queryString = '';
    if (params) {
        if (params instanceof URLSearchParams) {
            queryString = `?${params.toString()}`;
        } else {
            queryString = `?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => [key, String(value)])).toString()}`;
        }
    }
    console.log(`Workspaceing projects with query: ${queryString}`);
    // apiService añade el token si el usuario está logueado
    const data = await apiService.get<PaginatedProjectsResponse>(`/projects${queryString}`);
    return data;
}

/**
 * Obtiene un único proyecto por su ID.
 * @param id El ID del proyecto a obtener.
 */
// --- FUNCIÓN NUEVA ---
async function getProjectById(id: number | string): Promise<Project> {
    console.log(`Workspaceing project with ID: ${id}`);
    // apiService añade el token si el usuario está logueado, obteniendo datos completos si es posible
    const data = await apiService.get<Project>(`/projects/${id}`);
    // apiService lanzará ApiError si no se encuentra (404) o hay otro error
    return data;
}
// --- FIN FUNCIÓN NUEVA ---


// Exporta las funciones de la API de proyectos
export const projectApi = {
    fetchProjects,
    getProjectById, // <-- Exporta la nueva función
    // Aquí añadirías createProject, updateProject, deleteProject después
};