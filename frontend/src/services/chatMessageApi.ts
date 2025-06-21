import { apiService } from './apiService';
import { ChatMessage, PaginatedChatMessages } from '../types';

interface CreateChatMessagePayload {
    contenido: string; // HTML sanitizado
}

const TASK_API_BASE = '/tasks'; // La ruta base correcta para las tareas

async function createChatMessage(
    projectId: number, // Mantenemos projectId por si es necesario en el futuro
    taskId: number, 
    data: CreateChatMessagePayload
): Promise<ChatMessage> {
    try {
        // Se usan backticks (`) para una correcta interpolación de variables
        // y se construye la URL simplificada que definimos en el backend.
        const endpoint = `${TASK_API_BASE}/${taskId}/messages`;

        console.log(`[chatMessageApi] POSTing to new endpoint: ${endpoint}`);
        const response = await apiService.post<{ data: ChatMessage }>(endpoint, data);
        return response.data;
    } catch (error) {
        console.error(`[chatMessageApi] Error creating message for task ${taskId}:`, error);
        throw error;
    }
}

async function getChatMessagesByTaskId(
    projectId: number,
    taskId: number, 
    page: number = 1, 
    limit: number = 20
): Promise<PaginatedChatMessages> {
    try {
        // Se actualiza la URL para que coincida con la nueva estructura de rutas.
        const endpoint = `${TASK_API_BASE}/${taskId}/messages?page=${page}&limit=${limit}`;

        // La respuesta del backend para esto probablemente esté envuelta en un objeto { data: ... }
        const response = await apiService.get<{ data: PaginatedChatMessages }>(endpoint);
        return response.data;
    } catch (error) {
        console.error(`[chatMessageApi] Error fetching messages for task ${taskId}:`, error);
        throw error;
    }
}

export const chatMessageService = {
    createChatMessage,
    getChatMessagesByTaskId,
};
