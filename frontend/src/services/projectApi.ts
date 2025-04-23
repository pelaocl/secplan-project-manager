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
 * @param params Opcional: Objeto URLSearchParams o un objeto simple para filtros y paginación (ej. { page: 1, limit: 10, estadoId: 3 })
 */
async function fetchProjects(params?: URLSearchParams | Record<string, any>): Promise<PaginatedProjectsResponse> {
    let queryString = '';
    if (params) {
        if (params instanceof URLSearchParams) {
            queryString = `?${params.toString()}`;
        } else {
            // Convierte un objeto simple a query string si es necesario
            queryString = `?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => [key, String(value)])).toString()}`;
        }
    }

    console.log(`Workspaceing projects with query: ${queryString}`); // Log para depuración

    // Llama al método get del apiService, especificando el tipo de respuesta esperado
    // apiService añadirá automáticamente el token si el usuario está logueado
    const data = await apiService.get<PaginatedProjectsResponse>(`/projects${queryString}`);

    // Devuelve los datos recibidos (ya parseados por apiService)
    return data;
}

/**
 * Obtiene un único proyecto por su ID.
 * @param id El ID del proyecto a obtener.
 */
async function getProjectById(id: number | string): Promise<Project> {
    console.log(`Workspaceing project with ID: ${id}`);
    const data = await apiService.get<Project>(`/projects/${id}`);
    return data;
}


// Exporta las funciones de la API de proyectos
export const projectApi = {
    fetchProjects,
    getProjectById,
    // Aquí añadirías createProject, updateProject, deleteProject después
};