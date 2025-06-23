import { apiService } from './apiService';
// --- INICIO DE MODIFICACIÓN: Importar el tipo CategoriaNotificacion ---
import { Notificacion, CategoriaNotificacion } from '../types';
// --- FIN DE MODIFICACIÓN ---

export interface NotificationsResponse {
    notifications: Notificacion[];
    unreadCount: number;
}

// --- INICIO DE MODIFICACIÓN: La función ahora acepta 'categoria' ---
async function getNotifications(
    soloNoLeidas?: boolean, 
    categoria?: CategoriaNotificacion
): Promise<NotificationsResponse> {
    try {
        const params = new URLSearchParams();
        if (soloNoLeidas) {
            params.append('soloNoLeidas', 'true');
        }
        if (categoria) {
            params.append('categoria', categoria);
        }
        
        const queryString = params.toString();
        const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
        
        const data = await apiService.get<NotificationsResponse>(endpoint);
        return data;
    } catch (error) {
        console.error("[notificationApi] Error fetching notifications:", error);
        throw error;
    }
}
// --- FIN DE MODIFICACIÓN ---

async function markAsRead(notificationId: number): Promise<Notificacion> {
    try {
        const updatedNotification = await apiService.put<Notificacion>(`/notifications/${notificationId}/read`, {});
        return updatedNotification;
    } catch (error) {
        console.error(`[notificationApi] Error marking notification ${notificationId} as read:`, error);
        throw error;
    }
}

// --- INICIO DE MODIFICACIÓN: La función ahora acepta 'categoria' ---
async function markAllAsRead(
    categoria?: CategoriaNotificacion
): Promise<{ message: string; count: number }> {
    try {
        const params = new URLSearchParams();
        if (categoria) {
            params.append('categoria', categoria);
        }

        const queryString = params.toString();
        const endpoint = `/notifications/read-all${queryString ? `?${queryString}` : ''}`;

        const response = await apiService.put<{ message: string; count: number }>(endpoint, {});
        return response;
    } catch (error) {
        console.error("[notificationApi] Error marking all notifications as read:", error);
        throw error;
    }
}
// --- FIN DE MODIFICACIÓN ---


async function markTaskChatNotificationsAsRead(taskId: number): Promise<{ message: string; count: number }> {
    try {
        const response = await apiService.put<{ message: string; count: number }>(`/notifications/task-chat/${taskId}/read-all`, {});
        console.log(`[notificationApi] Marcadas como leídas notificaciones de chat para tarea ${taskId}, actualizadas: ${response.count}`);
        return response;
    } catch (error) {
        console.error(`[notificationApi] Error marcando notificaciones de chat para tarea ${taskId} como leídas:`, error);
        throw error;
    }
}

export const notificationApi = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    markTaskChatNotificationsAsRead,
};
