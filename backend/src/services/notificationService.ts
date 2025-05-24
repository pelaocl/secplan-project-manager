// backend/src/services/notificationService.ts
import prisma from '../config/prismaClient';
import { Notificacion, TipoNotificacion, TipoRecursoNotificacion } from '@prisma/client';
// Asumimos que tendrás un CreateNotificationInput, ya sea inferido de Zod o definido manualmente
// Si usas Zod, importa el tipo:
import { CreateNotificationInput } from '../schemas/notificationSchemas';
import { emitToUser } from '../socketManager';

export const createDBNotification = async (
    data: CreateNotificationInput
): Promise<Notificacion> => {
    try {
        const notification = await prisma.notificacion.create({
            data: {
                usuarioId: data.usuarioId,
                tipo: data.tipo,
                mensaje: data.mensaje,
                urlDestino: data.urlDestino,
                recursoId: data.recursoId,
                recursoTipo: data.recursoTipo,
                // 'leida' es false por defecto según el schema
                // 'fechaCreacion' es default(now()) según el schema
            },
        });
        console.log(`[NotificationService] Notificación creada en DB para usuario ${data.usuarioId}, tipo ${data.tipo}`);
        
        // --- NUEVO: Obtener y emitir el nuevo conteo de no leídas ---
        if (notification) {
            const unreadCount = await prisma.notificacion.count({
                where: {
                    usuarioId: data.usuarioId,
                    leida: false,
                },
            });
            // Emitir el evento al usuario específico
            emitToUser(data.usuarioId.toString(), 'unread_count_updated', { count: unreadCount });
            console.log(`[NotificationService] Emitido 'unread_count_updated' para usuario ${data.usuarioId} con count: ${unreadCount}`);
        }
        // --- FIN NUEVO ---
        
        return notification;
    } catch (error) {
        console.error("[NotificationService] Error creando notificación en DB:", error);
        // Decide si quieres relanzar el error o manejarlo aquí.
        // Por ahora, lo relanzamos para que el servicio que llama se entere.
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

// Exporta un objeto con las funciones para que el import sea más limpio
export const notificationService = {
    createDBNotification,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsReadForUser,
};