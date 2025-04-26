// ========================================================================
// INICIO: Contenido COMPLETO y CORREGIDO para frontend/src/services/projectApi.ts
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================

import { apiService, ApiError } from './apiService';
import { Project } from '../types';
import { ProjectFormSchemaType } from '../schemas/projectFormSchema';

// --- Tipos de Respuesta del Backend (Ajustados según el log) ---

// Estructura REAL devuelta por GET /projects (basado en tu log)
interface BackendListResponse {
    status: string;
    projects: Project[];
    pagination: { // Asumiendo que pagination SÍ viene anidado desde el backend
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
    // Si tu backend devuelve total, page, limit, totalPages planos (no dentro de pagination),
    // necesitarías ajustar esta interfaz y la lógica de abajo.
}

// Estructura para respuestas de GET por ID, POST, PUT (asume anidamiento en 'data')
interface ApiSuccessDataWrapper<T> {
    status: string;
    data: T;
}

// Tipo que las páginas/componentes esperan recibir para la lista paginada
// Mantenemos esta estructura anidada para el frontend si es conveniente
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

// GET /projects (Listar con paginación/filtros) - CORREGIDO
async function fetchProjects(params?: URLSearchParams | Record<string, any>): Promise<PaginatedProjectsResponse> {
    let queryString = '';
    if (params) {
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
    console.log(`[projectApi] Fetching projects with query: ${queryString}`); // Log útil

    try {
        // Llama a la API esperando la estructura REAL del backend (BackendListResponse)
        const response = await apiService.get<BackendListResponse>(`/projects${queryString}`);

        // Verifica si la respuesta tiene la estructura esperada del backend
        if (response && response.status === 'success' && response.projects && response.pagination) {
            // La estructura ya coincide con PaginatedProjectsResponse (si pagination viene anidado)
            // Solo necesitamos devolver la parte relevante (projects y pagination)
            console.log("[projectApi] fetchProjects response OK, structure matches."); // Log de éxito
            return {
                projects: response.projects,
                pagination: response.pagination
            };
        }
        // SI EL BACKEND DEVOLVIERA PAGINACIÓN PLANA:
        // else if (response && response.status === 'success' && response.projects && response.page !== undefined) {
        //     console.log("[projectApi] fetchProjects response OK, adapting flat pagination."); // Log de éxito
        //     return {
        //         projects: response.projects,
        //         pagination: {
        //              totalItems: response.total,
        //              totalPages: response.totalPages,
        //              currentPage: response.page,
        //              pageSize: response.limit,
        //         }
        //     };
        // }
        else {
            // Si la estructura sigue sin coincidir
            console.error("[projectApi] Unexpected response structure received from backend:", response);
            throw new Error(`Respuesta inválida del backend al obtener lista de proyectos.`);
        }

    } catch (error) {
        console.error("[projectApi] Error during fetchProjects API call:", error);
        if (error instanceof Error && error.message.startsWith('Respuesta inválida')) {
             throw error;
        }
        throw new Error(`Error de red o del servidor al obtener proyectos.`);
    }
}


// GET /projects/:id (Obtener uno) - Sin cambios, asume wrapper 'data'
async function getProjectById(id: number | string): Promise<Project> {
    console.log(`[projectApi] Fetching project with ID: ${id}`);
    try {
        const response = await apiService.get<ApiSuccessDataWrapper<{ project: Project }>>(`/projects/${id}`);
        if (response?.data?.project) {
            return response.data.project;
        } else {
            console.error("[projectApi] Unexpected response structure for getProjectById:", response);
            throw new Error(`Respuesta inválida al obtener proyecto ${id}.`);
        }
    } catch (error) {
         console.error(`[projectApi] Error fetching project ${id}:`, error);
         if (error instanceof ApiError && error.status === 404) {
             throw new Error(`Proyecto con ID ${id} no encontrado.`);
         }
         throw error;
    }
}

// POST /projects (Crear) - Sin cambios, asume wrapper 'data'
async function createProject(projectData: ProjectFormSchemaType): Promise<Project> {
    console.log("[projectApi] Creating project...");
    try {
        const response = await apiService.post<ApiSuccessDataWrapper<{ project: Project }>>('/projects', projectData);
        if (response?.data?.project) {
            console.log("[projectApi] Project created successfully:", response.data.project.id);
            return response.data.project;
        } else {
             console.error("[projectApi] Unexpected response structure for createProject:", response);
             throw new Error(`Respuesta inválida al crear proyecto.`);
        }
    } catch (error) {
        console.error("[projectApi] Error creating project:", error);
         if (error instanceof ApiError && error.status === 400) {
            const message = error.body?.message || 'Datos inválidos al crear proyecto.';
             throw new Error(message);
         }
        throw error;
    }
}

// PUT /projects/:id (Actualizar) - Sin cambios, asume wrapper 'data'
async function updateProject(id: number | string, projectData: Partial<ProjectFormSchemaType>): Promise<Project> {
    console.log(`[projectApi] Updating project ${id}...`);
    try {
        const response = await apiService.put<ApiSuccessDataWrapper<{ project: Project }>>(`/projects/${id}`, projectData);
        if (response?.data?.project) {
            console.log(`[projectApi] Project ${id} updated successfully.`);
            return response.data.project;
        } else {
            console.error(`[projectApi] Unexpected response structure for updateProject ${id}:`, response);
            throw new Error(`Respuesta inválida al actualizar proyecto ${id}.`);
        }
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

// DELETE /projects/:id (Eliminar - opcional añadirla)
// ... (código de deleteProject sin cambios) ...


// Exporta todas las funciones como un objeto
export const projectApi = {
    fetchProjects,
    getProjectById,
    createProject,
    updateProject,
    // deleteProject,
};

// ========================================================================
// FIN: Contenido COMPLETO y CORREGIDO para frontend/src/services/projectApi.ts
// ========================================================================