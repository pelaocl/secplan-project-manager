import { apiService, ApiError } from './apiService';
import { Project, ProjectFormValues } from '../types'; // Asegúrate que ProjectFormValues esté en types si no, importar de schemas

// Interfaz para la respuesta paginada
export interface PaginatedProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  status?: string; // Si el backend lo incluye
}

async function fetchProjects(params?: URLSearchParams | Record<string, any>): Promise<PaginatedProjectsResponse> {
    let queryString = '';
    if (params) {
        if (params instanceof URLSearchParams) { queryString = `?${params.toString()}`; }
        else { queryString = `?${new URLSearchParams(Object.entries(params).filter(([, value]) => value != null && value !== '').map(([key, value]) => [key, String(value)])).toString()}`; }
    }
    // console.log(`Workspaceing projects with query: ${queryString}`); // Eliminado
    try {
        // Asumimos que la respuesta ya tiene el formato PaginatedProjectsResponse (quizás con un {status: 'success', ...})
        // Ajusta el tipo <T> en apiService.get si tu backend envuelve la respuesta de forma diferente
        const response = await apiService.get<PaginatedProjectsResponse>(`/projects${queryString}`);
        // Si el backend envuelve en {status, ...data}, necesitarías extraer data.
        // Ejemplo: const response = await apiService.get<{status: string} & PaginatedProjectsResponse>(`/projects${queryString}`); return response;
        return response; // Devuelve directamente si la estructura coincide
    } catch (error) {
        console.error("[projectApi] Error fetching projects:", error);
        throw error;
    }
}

async function getProjectById(id: number | string): Promise<Project> {
    // console.log(`Workspaceing project with ID: ${id}`); // Eliminado
    try {
        // Asumiendo que la respuesta es { status: 'success', data: { project: Project } }
        const response = await apiService.get<{ status: string, data: { project: Project } }>(`/projects/${id}`);
        if (response?.data?.project) { // Verifica que la estructura exista
            return response.data.project;
        } else {
            console.error("Respuesta inesperada de API para getProjectById:", response);
            throw new Error(`Respuesta inválida al obtener proyecto ${id}.`);
        }
    } catch (error) {
         console.error(`[projectApi] Error fetching project ${id}:`, error);
         throw error;
    }
}

async function createProject(projectData: ProjectFormValues): Promise<Project> {
    // console.log("[projectApi] Creating project with data:", projectData); // Eliminado
    console.log("[projectApi] Creating project..."); // Log más genérico
    try {
         // Asumiendo que la API devuelve { status: 'success', data: { project: Project } }
        const response = await apiService.post<{ status: string, data: { project: Project } }>('/projects', projectData);
        if (response?.data?.project) {
            console.log("[projectApi] Project created successfully:", response.data.project.id);
            return response.data.project;
        } else {
             console.error("Respuesta inesperada de API para createProject:", response);
            throw new Error(`Respuesta inválida al crear proyecto.`);
        }
    } catch (error) {
        console.error("[projectApi] Error creating project:", error);
        throw error;
    }
}

// Placeholder para futuras funciones
// async function updateProject(id: number | string, projectData: Partial<ProjectFormValues>): Promise<Project> { ... }
// async function deleteProject(id: number | string): Promise<void> { ... }

export const projectApi = {
    fetchProjects,
    getProjectById,
    createProject,
    // updateProject,
    // deleteProject,
};