// frontend/src/services/notificationApi.ts
import { apiService } from './apiService';
import { Notificacion } from '../types'; // Asumiendo que tienes el tipo Notificacion en types.ts

export interface NotificationsResponse {
    notifications: Notificacion[];
    unreadCount: number;
}

async function getNotifications(soloNoLeidas?: boolean): Promise<NotificationsResponse> {
    try {
        const endpoint = `/notifications${soloNoLeidas ? '?soloNoLeidas=true' : ''}`;
        const data = await apiService.get<NotificationsResponse>(endpoint);
        return data;
    } catch (error) {
        console.error("[notificationApi] Error fetching notifications:", error);
        throw error;
    }
}

async function markAsRead(notificationId: number): Promise<Notificacion> {
    try {
        const updatedNotification = await apiService.put<Notificacion>(`/notifications/${notificationId}/read`, {});
        return updatedNotification;
    } catch (error) {
        console.error(`[notificationApi] Error marking notification ${notificationId} as read:`, error);
        throw error;
    }
}

async function markAllAsRead(): Promise<{ message: string; count: number }> { // Asumiendo que el backend devuelve count
    try {
        // El backend actualmente devuelve { message: "X notificaciones marcadas como leídas." }
        // Podríamos ajustar el backend para que también devuelva el count si es útil,
        // o simplemente confiar en el mensaje por ahora.
        // Para este ejemplo, asumo que el backend fue ajustado para devolver el count.
        // Si no, el tipo de retorno aquí sería solo { message: string }.
        const response = await apiService.put<{ message: string; count: number }>('/notifications/read-all', {});
        return response;
    } catch (error) {
        console.error("[notificationApi] Error marking all notifications as read:", error);
        throw error;
    }
}

export const notificationApi = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};