// ========================================================================
// INICIO: Contenido COMPLETO y MODIFICADO para projectApi.ts (AÑADE DELETE)
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================
import { apiService, ApiError } from './apiService';
import { Project } from '../types';
import { ProjectFormSchemaType } from '../schemas/projectFormSchema';

// --- Tipos de Respuesta del Backend ---
interface BackendListResponse {
    status: string;
    projects: Project[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
}
interface ApiSuccessDataWrapper<T> {
    status: string;
    data: T;
}
export interface PaginatedProjectsResponse {
    projects: Project[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
}

// --- Funciones API ---

// GET /projects (Listar) - CORREGIDO
async function fetchProjects(params?: URLSearchParams | Record<string, any>): Promise<PaginatedProjectsResponse> {
    let queryString = '';
    if (params) { /* ... código para construir query string ... */
        const searchParams = new URLSearchParams();
        if (params instanceof URLSearchParams) {
            params.forEach((value, key) => {
                if (value != null && value !== '') { searchParams.append(key, value); }
            });
        } else {
            Object.entries(params).forEach(([key, value]) => {
                if (value != null && value !== '') { searchParams.append(key, String(value)); }
            });
        }
        queryString = `?${searchParams.toString()}`;
     }
    console.log(`[projectApi] Fetching projects with query: ${queryString}`);

    try {
        const response = await apiService.get<BackendListResponse>(`/projects${queryString}`);
        if (response && response.status === 'success' && response.projects && response.pagination) {
            console.log("[projectApi] fetchProjects response OK.");
            return { projects: response.projects, pagination: response.pagination };
        } else {
            console.error("[projectApi] Unexpected response structure received from backend:", response);
            throw new Error(`Respuesta inválida del backend al obtener lista de proyectos.`);
        }
    } catch (error) {
        console.error("[projectApi] Error during fetchProjects API call:", error);
        if (error instanceof Error && error.message.startsWith('Respuesta inválida')) { throw error; }
        throw new Error(`Error de red o del servidor al obtener proyectos.`);
    }
}


// GET /projects/:id (Obtener uno) - Sin cambios
async function getProjectById(id: number | string): Promise<Project> {
    console.log(`[projectApi] Fetching project with ID: ${id}`);
    try {
        const response = await apiService.get<ApiSuccessDataWrapper<{ project: Project }>>(`/projects/${id}`);
        if (response?.data?.project) { return response.data.project; }
        else { throw new Error(`Respuesta inválida al obtener proyecto ${id}.`); }
    } catch (error) {
         console.error(`[projectApi] Error fetching project ${id}:`, error);
         if (error instanceof ApiError && error.status === 404) { throw new Error(`Proyecto con ID ${id} no encontrado.`); }
         throw error;
    }
}

// POST /projects (Crear) - Sin cambios
async function createProject(projectData: ProjectFormSchemaType): Promise<Project> {
    console.log("[projectApi] Creating project...");
    try {
        const response = await apiService.post<ApiSuccessDataWrapper<{ project: Project }>>('/projects', projectData);
        if (response?.data?.project) { return response.data.project; }
        else { throw new Error(`Respuesta inválida al crear proyecto.`); }
    } catch (error) {
        console.error("[projectApi] Error creating project:", error);
         if (error instanceof ApiError && error.status === 400) { throw new Error(error.body?.message || 'Datos inválidos al crear proyecto.'); }
        throw error;
    }
}

// PUT /projects/:id (Actualizar) - Sin cambios
async function updateProject(id: number | string, projectData: Partial<ProjectFormSchemaType>): Promise<Project> {
    console.log(`[projectApi] Updating project ${id}...`);
    try {
        const response = await apiService.put<ApiSuccessDataWrapper<{ project: Project }>>(`/projects/${id}`, projectData);
        if (response?.data?.project) { return response.data.project; }
        else { throw new Error(`Respuesta inválida al actualizar proyecto ${id}.`); }
    } catch (error) {
        console.error(`[projectApi] Error updating project ${id}:`, error);
        if (error instanceof ApiError) {
            if (error.status === 404) throw new Error(`Proyecto con ID ${id} no encontrado para actualizar.`);
            if (error.status === 400) throw new Error(error.body?.message || `Datos inválidos al actualizar proyecto ${id}.`);
            if (error.status === 403) throw new Error(`No tienes permiso para actualizar el proyecto ${id}.`);
        }
        throw error;
    }
}

// DELETE /projects/:id (Eliminar)
// =============== NUEVA FUNCION ===============
async function deleteProject(id: number | string): Promise<void> {
   console.log(`[projectApi] Deleting project ${id}...`);
   try {
       // DELETE no suele devolver contenido útil, solo un status 204 (No Content)
       // apiService.delete puede que no necesite un tipo genérico o devuelva algo simple
       await apiService.delete(`/projects/${id}`);
       console.log(`[projectApi] Project ${id} deleted request sent successfully.`);
       // No devolvemos nada en caso de éxito
   } catch (error) {
       console.error(`[projectApi] Error deleting project ${id}:`, error);
       if (error instanceof ApiError) {
           if (error.status === 404) throw new Error(`Proyecto con ID ${id} no encontrado para eliminar.`);
           if (error.status === 403) throw new Error(`No tienes permiso para eliminar el proyecto ${id}.`);
           // Manejar 400 si hay dependencias que impiden borrar (backend debe informar)
           if (error.status === 400) throw new Error(error.body?.message || `No se pudo eliminar el proyecto ${id} (posiblemente tiene datos asociados).`);
       }
       throw error; // Relanza otros errores (ej. de red)
   }
}
// =============== FIN NUEVA FUNCION ===============


// Exporta todas las funciones como un objeto
export const projectApi = {
    fetchProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject, // <-- Añadida la nueva función
};

// ========================================================================
// FIN: Contenido COMPLETO y MODIFICADO para projectApi.ts (AÑADE DELETE)
// ========================================================================