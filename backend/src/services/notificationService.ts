// backend/src/services/notificationService.ts
import prisma from '../config/prismaClient';
import { Notificacion, TipoNotificacion,TipoRecursoNotificacion } from '@prisma/client';
// Asumimos que tendrás un CreateNotificationInput, ya sea inferido de Zod o definido manualmente
// Si usas Zod, importa el tipo:
import { CreateNotificationInput } from '../schemas/notificationSchemas';
import { emitToUser } from '../socketManager';

// Así debe comenzar tu función:
export const createDBNotification = async (
    data: CreateNotificationInput // Este es el único parámetro
): Promise<Notificacion> => {    // Esta es la línea 11 o cercana
    try {
        const notification = await prisma.notificacion.create({
            data: {
                usuarioId: data.usuarioId,
                tipo: data.tipo,
                mensaje: data.mensaje,
                urlDestino: data.urlDestino,
                recursoId: data.recursoId,
                recursoTipo: data.recursoTipo,
            },
        });
        console.log(`[NotificationService] Notificación creada en DB para usuario ${data.usuarioId}, tipo ${data.tipo}`);

        // Lógica para emitir el conteo de no leídas
        const unreadCount = await prisma.notificacion.count({
            where: {
                usuarioId: data.usuarioId,
                leida: false,
            },
        });
        emitToUser(data.usuarioId.toString(), 'unread_count_updated', { count: unreadCount });
        console.log(`[NotificationService] Emitido 'unread_count_updated' para usuario ${data.usuarioId} con count: ${unreadCount}`);
        
        return notification;
    } catch (error) {
        console.error("[NotificationService] Error creando notificación en DB:", error);
        throw error; 
    }
};

export const getNotificationsForUser = async (
    userId: number, 
    soloNoLeidas?: boolean
): Promise<Notificacion[]> => {
    return prisma.notificacion.findMany({
        where: {
            usuarioId: userId,
            ...(soloNoLeidas && { leida: false }), // Añade filtro si soloNoLeidas es true
        },
        orderBy: {
            fechaCreacion: 'desc',
        },
        take: 50, // Limita la cantidad de notificaciones devueltas
    });
};

export const markNotificationAsRead = async (
    notificationId: number,
    userId: number // Para asegurar que el usuario solo marque sus propias notificaciones
): Promise<Notificacion | null> => {
    // Verifica que la notificación pertenezca al usuario antes de marcarla como leída
    const notification = await prisma.notificacion.findFirst({
        where: {
            id: notificationId,
            usuarioId: userId,
        }
    });

    if (!notification) {
        // No encontrado o no pertenece al usuario, no hacer nada o lanzar error
        console.warn(`[NotificationService] Intento de marcar como leída notificación ${notificationId} por usuario ${userId} falló: No encontrada o sin permiso.`);
        return null; 
    }

    if (notification.leida) {
        return notification; // Ya está leída
    }

    return prisma.notificacion.update({
        where: { id: notificationId },
        data: { leida: true },
    });
};

export const markAllNotificationsAsReadForUser = async (
    userId: number
): Promise<{ count: number }> => {
    const result = await prisma.notificacion.updateMany({
        where: {
            usuarioId: userId,
            leida: false,
        },
        data: {
            leida: true,
        },
    });
    return { count: result.count }; // Devuelve el número de notificaciones actualizadas
};

export const markTaskChatNotificationsAsRead = async (
    userId: number,
    taskId: number
): Promise<{ count: number }> => {
    console.log(`[NotificationService - STEP 3] markTaskChatNotificationsAsRead llamado para userId: ${userId}, taskId: ${taskId}`);
    const result = await prisma.notificacion.updateMany({
        where: {
            usuarioId: userId,
            tipo: TipoNotificacion.NUEVO_MENSAJE_TAREA,
            recursoId: taskId,
            recursoTipo: TipoRecursoNotificacion.MENSAJE_CHAT_TAREA,
            leida: false,
        },
        data: {
            leida: true,
        },
    });
    console.log(`[NotificationService - STEP 4] Notificaciones de chat actualizadas a leida=true: ${result.count} para tarea ${taskId}, usuario ${userId}.`);

    // La variable unreadCount solo se define y usa si result.count > 0
    if (result.count > 0) { 
        const unreadCount = await prisma.notificacion.count({ // 'unreadCount' se define aquí
            where: { usuarioId: userId, leida: false }
        });
        // La línea 129 (o similar) debería ser esta o la de emitToUser:
        console.log(`[NotificationService - STEP 5] Nuevo conteo total de no leídas para usuario ${userId} es ${unreadCount}. Emitiendo 'unread_count_updated'.`);
        emitToUser(userId.toString(), 'unread_count_updated', { count: unreadCount });
    } else {
        // Este console.log NO debe intentar usar 'unreadCount' ya que no está definido en este scope
        console.log(`[NotificationService - STEP 5] No se actualizaron notificaciones (quizás ya estaban leídas o no habían), no se emite 'unread_count_updated' por esta acción.`);
    }
    return { count: result.count };
};

// Exporta un objeto con las funciones para que el import sea más limpio
export const notificationService = {
    createDBNotification,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsReadForUser,
    markTaskChatNotificationsAsRead,
};