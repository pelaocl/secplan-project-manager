import { apiService, ApiError } from './apiService';
// Asegúrate que ProjectFormValues (del schema Zod del frontend) sea compatible
// con lo que espera la API (CreateProjectInput del backend Zod schema).
// Podrían necesitarse transformaciones menores si no lo son.
import { Project, ProjectFormValues } from '../types';

// Interfaz para la respuesta paginada (sin cambios)
export interface PaginatedProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
    const data = await apiService.get<PaginatedProjectsResponse>(`/projects${queryString}`);
    return data;
}

async function getProjectById(id: number | string): Promise<Project> {
    console.log(`Workspaceing project with ID: ${id}`);
    // Pide la estructura completa que devuelve el backend controller
    const response = await apiService.get<{ status: string, data: { project: Project } }>(`/projects/${id}`);
    // Verifica y devuelve SOLO el objeto project anidado
    if (response && response.data && response.data.project) {
        return response.data.project;
    } else {
        // Lanza un error si la estructura no es la esperada
        console.error("Respuesta inesperada de API para getProjectById:", response);
        throw new Error(`No se pudo obtener el proyecto con ID ${id} o la respuesta tuvo un formato incorrecto.`);
    }
}

// --- FUNCIÓN NUEVA: Crear Proyecto ---
/**
 * Envía los datos de un nuevo proyecto a la API para crearlo.
 * @param projectData Datos del proyecto validados por el formulario Zod del frontend.
 * @returns El objeto del proyecto recién creado (según lo devuelva la API).
 */
async function createProject(projectData: ProjectFormValues): Promise<Project> {
    console.log("Creating project with data:", projectData);

    // NOTA: Aquí podrías necesitar transformar 'projectData' si los tipos
    // del formulario (ProjectFormValues) no coinciden 100% con lo que
    // espera la API backend (CreateProjectInput).
    // Por ejemplo, asegurar que las fechas sean strings ISO si es necesario.
    // Pero si los schemas Zod (frontend y backend) están bien alineados
    // con las transformaciones/coerciones, puede que no sea necesario.
    const dataToSend = { ...projectData };

    try {
         // Llama al endpoint POST /api/projects
        const newProject = await apiService.post<Project>('/projects', dataToSend);
        console.log("Project created successfully:", newProject);
        return newProject;
    } catch (error) {
        console.error("Error creating project:", error);
        // Re-lanza el error para que el componente lo maneje
        throw error;
    }
}
// --- FIN FUNCIÓN NUEVA ---


// Exporta las funciones de la API de proyectos
export const projectApi = {
    fetchProjects,
    getProjectById,
    createProject, // <-- Exporta la nueva función
    // updateProject, // Añadir después
    // deleteProject, // Añadir después
};