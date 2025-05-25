// frontend/src/services/taskApi.ts
import { apiService, ApiError } from './apiService';
import { 
    Task, 
    CreateTaskFrontendInput, 
    UpdateTaskFrontendInput,
    // PaginatedChatMessages // No se usa directamente en este archivo
} from '../types';

const TASK_API_BASE = '/projects'; // Correcto: /api/projects/:projectId/tasks/...

// Obtener todas las tareas de un proyecto específico
async function getTasksByProjectId(projectId: number): Promise<Task[]> {
    try {
        const endpoint = `${TASK_API_BASE}/${projectId}/tasks`;
        // console.log(`[taskApi] Fetching tasks from: ${endpoint}`);
        const tasks = await apiService.get<Task[]>(endpoint);
        return tasks;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido obteniendo tareas.";
        console.error(`[taskApi] Error fetching tasks for project ${projectId} (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for tasks (project ${projectId}):`, JSON.stringify(error.data, null, 2));
        }
        throw error;
    }
}

// Crear una nueva tarea para un proyecto
async function createTask(projectId: number, data: CreateTaskFrontendInput): Promise<Task> {
    try {
        const newTask = await apiService.post<Task>(`${TASK_API_BASE}/${projectId}/tasks`, data);
        return newTask;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido creando tarea.";
        console.error(`[taskApi] Error creating task for project ${projectId} (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for createTask (project ${projectId}):`, JSON.stringify(error.data, null, 2));
        }
        throw error;
    }
}

// Obtener una tarea específica por su ID
async function getTaskById(projectId: number, taskId: number): Promise<Task> { 
    try {
        const task = await apiService.get<Task>(`${TASK_API_BASE}/${projectId}/tasks/${taskId}`);
        return task;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido obteniendo tarea por ID.";
        console.error(`[taskApi] Error fetching task ${taskId} for project ${projectId} (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for getTaskById (project ${projectId}, task ${taskId}):`, JSON.stringify(error.data, null, 2));
        }
        throw error;
    }
}

// Actualizar una tarea existente
async function updateTask(projectId: number, taskId: number, data: UpdateTaskFrontendInput): Promise<Task> {
    try {
        const updatedTask = await apiService.put<Task>(`${TASK_API_BASE}/${projectId}/tasks/${taskId}`, data);
        return updatedTask;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido actualizando tarea.";
        console.error(`[taskApi] Error updating task ${taskId} for project ${projectId} (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for updateTask (project ${projectId}, task ${taskId}):`, JSON.stringify(error.data, null, 2));
        }
        throw error;
    }
}

// Eliminar una tarea
async function deleteTask(projectId: number, taskId: number): Promise<{ message: string }> {
    try {
        const response = await apiService.delete<{ message: string }>(`${TASK_API_BASE}/${projectId}/tasks/${taskId}`);
        return response;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido eliminando tarea.";
        console.error(`[taskApi] Error deleting task ${taskId} for project ${projectId} (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for deleteTask (project ${projectId}, task ${taskId}):`, JSON.stringify(error.data, null, 2));
        }
        throw error;
    }
}

// --- NUEVA FUNCIÓN AÑADIDA ---
// Marcar el chat de una tarea como visto por el usuario actual
async function markTaskChatAsViewed(projectId: number, taskId: number): Promise<{ message: string }> {
    try {
        // La ruta del backend que definimos para esto fue /api/projects/:projectId/tasks/:taskId/mark-chat-viewed
        // y es llamada por taskController.markTaskChatAsViewedHandler
        const endpoint = `${TASK_API_BASE}/${projectId}/tasks/${taskId}/mark-chat-viewed`;
        console.log(`[taskApi] PUT para marcar chat como visto: ${endpoint}`);
        // Esta solicitud PUT no necesita enviar un cuerpo, pero apiService.put puede requerir un objeto vacío.
        const response = await apiService.put<{ message: string }>(endpoint, {}); 
        return response;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al marcar chat como visto.";
        console.error(`[taskApi] Error marking task ${taskId} (project ${projectId}) chat as viewed (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for markTaskChatAsViewed (project ${projectId}, task ${taskId}):`, JSON.stringify(error.data, null, 2));
        }
        throw error;
    }
}
// --- FIN NUEVA FUNCIÓN ---

export const taskApi = {
    getTasksByProjectId,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    markTaskChatAsViewed, // <-- AÑADIR A LA EXPORTACIÓN
};