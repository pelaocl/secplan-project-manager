// frontend/src/services/chatMessageApi.ts
import { apiService } from './apiService';
import { ChatMessage, PaginatedChatMessages } from '../types'; // Asegúrate que PaginatedChatMessages esté definida

// Definimos el tipo para el payload de creación de mensaje
interface CreateChatMessagePayload {
    contenido: string; // HTML sanitizado
}

const PROJECT_API_BASE = '/projects';

async function createChatMessage(
    projectId: number,
    taskId: number, 
    data: CreateChatMessagePayload
): Promise<ChatMessage> {
    try {
        const endpoint = `${PROJECT_API_BASE}/${projectId}/tasks/${taskId}/messages`;
        const newMessage = await apiService.post<ChatMessage>(endpoint, data);
        return newMessage;
    } catch (error) {
        console.error(`[chatMessageApi] Error creating message for task ${taskId}:`, error);
        throw error;
    }
}

async function getChatMessagesByTaskId(
    projectId: number,
    taskId: number, 
    page: number = 1, 
    limit: number = 20 // O el default que definiste en el backend
): Promise<PaginatedChatMessages> {
    try {
        // Construir la URL completa anidada
        const endpoint = `${PROJECT_API_BASE}/${projectId}/tasks/${taskId}/messages?page=${page}&limit=${limit}`;
        const response = await apiService.get<PaginatedChatMessages>(endpoint);
        return response;
    } catch (error) {
        console.error(`[chatMessageApi] Error fetching messages for task ${taskId}:`, error);
        throw error;
    }
}


export const chatMessageService = {
    createChatMessage,
    getChatMessagesByTaskId,
};