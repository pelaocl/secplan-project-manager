// frontend/src/services/taskApi.ts
import { apiService, ApiError } from './apiService'; // Asumiendo que apiService está configurado
import { 
    Task, 
    CreateTaskFrontendInput, 
    UpdateTaskFrontendInput,
    PaginatedChatMessages // Importa si la API de mensajes devuelve este tipo
} from '../types';

const TASK_API_BASE = '/projects'; // Las rutas de tareas están anidadas bajo /projects/:projectId/tasks

// Obtener todas las tareas de un proyecto específico
async function getTasksByProjectId(projectId: number): Promise<Task[]> {
    try {
        const endpoint = `/projects/${projectId}/tasks`; // Asegúrate que la ruta sea correcta
        // console.log(`[taskApi] Fetching tasks from: ${endpoint}`); // Log de URL opcional
        const tasks = await apiService.get<Task[]>(endpoint);
        return tasks;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido obteniendo tareas.";
        // --- MODIFICACIÓN DEL CONSOLE.ERROR ---
        console.error(`[taskApi] Error fetching tasks for project ${projectId} (mensaje):`, errorMessage);
        if (error instanceof ApiError && error.data) {
            console.error(`[taskApi] ApiError data for tasks (project ${projectId}):`, JSON.stringify(error.data, null, 2));
        }
        // --- FIN MODIFICACIÓN ---
        throw error; // Re-lanza para que el componente que llama pueda manejarlo
    }
}

// Crear una nueva tarea para un proyecto
async function createTask(projectId: number, data: CreateTaskFrontendInput): Promise<Task> {
    try {
        const newTask = await apiService.post<Task>(`${TASK_API_BASE}/${projectId}/tasks`, data);
        return newTask;
    } catch (error) {
        console.error(`[taskApi] Error creating task for project ${projectId}:`, error);
        throw error;
    }
}

// Obtener una tarea específica por su ID
// La respuesta del backend para esta ruta incluye los mensajes
async function getTaskById(projectId: number, taskId: number): Promise<Task> { 
    try {
        const task = await apiService.get<Task>(`${TASK_API_BASE}/${projectId}/tasks/${taskId}`);
        return task; // Task ya debería tener el campo 'mensajes' según la interfaz
    } catch (error) {
        console.error(`[taskApi] Error fetching task ${taskId} for project ${projectId}:`, error);
        throw error;
    }
}

// Actualizar una tarea existente
async function updateTask(projectId: number, taskId: number, data: UpdateTaskFrontendInput): Promise<Task> {
    try {
        const updatedTask = await apiService.put<Task>(`${TASK_API_BASE}/${projectId}/tasks/${taskId}`, data);
        return updatedTask;
    } catch (error) {
        console.error(`[taskApi] Error updating task ${taskId} for project ${projectId}:`, error);
        throw error;
    }
}

// Eliminar una tarea
async function deleteTask(projectId: number, taskId: number): Promise<{ message: string }> { // El backend devuelve { message: string }
    try {
        const response = await apiService.delete<{ message: string }>(`${TASK_API_BASE}/${projectId}/tasks/${taskId}`);
        return response;
    } catch (error) {
        console.error(`[taskApi] Error deleting task ${taskId} for project ${projectId}:`, error);
        throw error;
    }
}

export const taskApi = {
    getTasksByProjectId,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
};