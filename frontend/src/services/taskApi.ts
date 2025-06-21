//frontend/src/services/taskApi.ts
import { apiService, ApiError } from './apiService';
import { 
    Task, 
    CreateTaskFrontendInput, 
    UpdateTaskFrontendInput,
} from '../types';

const TASK_API_BASE = '/tasks'; // <-- La nueva ruta base para todas las operaciones de tareas

// Interfaz para los filtros
interface MyTasksFilters {
    projectId?: number | string;
    searchTerm?: string;
}

// --- FUNCIÓN MODIFICADA PARA "MIS TAREAS" ---
async function getMyTasks(): Promise<Task[]> { // Se elimina el argumento 'filters'
    const endpoint = `${TASK_API_BASE}/my-tasks`; // La URL ahora es simple
    try {
        console.log(`[taskApi] Fetching my tasks from: ${endpoint}`);
        const tasks = await apiService.get<Task[]>(endpoint);
        return tasks || [];
    } catch (error) {
        console.error(`[taskApi] Error fetching my tasks:`, error);
        throw error;
    }
}

// Obtener todas las tareas de un proyecto específico
// Llama al endpoint GET /api/tasks/project/:projectId
async function getTasksByProjectId(projectId: number): Promise<Task[]> {
    try {
        const endpoint = `${TASK_API_BASE}/project/${projectId}`; // <-- URL Corregida
        const tasks = await apiService.get<Task[]>(endpoint);
        return tasks || [];
    } catch (error) {
        console.error(`[taskApi] Error fetching tasks for project ${projectId}:`, error);
        throw error;
    }
}

// Crear una nueva tarea para un proyecto
// Llama al endpoint POST /api/tasks/project/:projectId
async function createTask(projectId: number, data: CreateTaskFrontendInput): Promise<Task> {
    try {
        const endpoint = `${TASK_API_BASE}/project/${projectId}`; // <-- URL Corregida
        const newTask = await apiService.post<Task>(endpoint, data);
        return newTask;
    } catch (error) {
        console.error(`[taskApi] Error creating task for project ${projectId}:`, error);
        throw error;
    }
}

// Obtener una tarea específica por su ID
// Llama al endpoint GET /api/tasks/project/:projectId/:taskId
async function getTaskById(projectId: number, taskId: number): Promise<Task> { 
    try {
        const endpoint = `${TASK_API_BASE}/project/${projectId}/${taskId}`; // <-- URL Corregida
        const task = await apiService.get<Task>(endpoint);
        return task;
    } catch (error) {
        console.error(`[taskApi] Error fetching task ${taskId} for project ${projectId}:`, error);
        throw error;
    }
}

// Actualizar una tarea existente
// Llama al endpoint PUT /api/tasks/project/:projectId/:taskId
async function updateTask(projectId: number, taskId: number, data: UpdateTaskFrontendInput): Promise<Task> {
    try {
        const endpoint = `${TASK_API_BASE}/project/${projectId}/${taskId}`; // <-- URL Corregida
        const updatedTask = await apiService.put<Task>(endpoint, data);
        return updatedTask;
    } catch (error) {
        console.error(`[taskApi] Error updating task ${taskId} for project ${projectId}:`, error);
        throw error;
    }
}

// Eliminar una tarea
// Llama al endpoint DELETE /api/tasks/project/:projectId/:taskId
async function deleteTask(projectId: number, taskId: number): Promise<void> { // DELETE usualmente no devuelve contenido
    try {
        const endpoint = `${TASK_API_BASE}/project/${projectId}/${taskId}`; // <-- URL Corregida
        await apiService.delete<void>(endpoint);
    } catch (error) {
        console.error(`[taskApi] Error deleting task ${taskId} for project ${projectId}:`, error);
        throw error;
    }
}

// Marcar el chat de una tarea como visto
// Llama al endpoint PUT /api/tasks/project/:projectId/:taskId/mark-chat-viewed
async function markTaskChatAsViewed(projectId: number, taskId: number): Promise<{ message: string }> {
    try {
        const endpoint = `${TASK_API_BASE}/project/${projectId}/${taskId}/mark-chat-viewed`; // <-- URL Corregida
        const response = await apiService.put<{ message: string }>(endpoint, {}); 
        return response;
    } catch (error) {
        console.error(`[taskApi] Error marking task ${taskId} chat as viewed:`, error);
        throw error;
    }
}

export const taskApi = {
    getMyTasks,
    getTasksByProjectId,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    markTaskChatAsViewed,
};
