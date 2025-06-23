//backend/src/services/notificationService.ts
import prisma from '../config/prismaClient';
import { 
    Notificacion, 
    TipoNotificacion, 
    TipoRecursoNotificacion,
    CategoriaNotificacion
} from '@prisma/client';
import { CreateNotificationInput } from '../schemas/notificationSchemas';
import { emitToUser } from '../socketManager';

// Helper para determinar la categoría. Esta lógica es clave.
const getCategoryForType = (tipo: TipoNotificacion): CategoriaNotificacion => {
    switch (tipo) {
        case TipoNotificacion.NUEVO_MENSAJE_TAREA:
        case TipoNotificacion.MENCION_EN_TAREA:
            return CategoriaNotificacion.CHAT;
        
        // El resto se considera de SISTEMA por defecto
        case TipoNotificacion.NUEVA_TAREA_ASIGNADA:
        case TipoNotificacion.TAREA_ACTUALIZADA_ESTADO:
        case TipoNotificacion.TAREA_ACTUALIZADA_INFO:
        case TipoNotificacion.TAREA_COMPLETADA:
        case TipoNotificacion.TAREA_VENCIMIENTO_PROXIMO:
        default:
            return CategoriaNotificacion.SISTEMA;
    }
};

export const createDBNotification = async (
    data: CreateNotificationInput
): Promise<Notificacion> => {
    try {
        const categoria = getCategoryForType(data.tipo);

        const notification = await prisma.notificacion.create({
            data: {
                usuarioId: data.usuarioId,
                tipo: data.tipo,
                mensaje: data.mensaje,
                urlDestino: data.urlDestino,
                recursoId: data.recursoId,
                recursoTipo: data.recursoTipo,
                categoria: categoria, // Se asigna la categoría correcta aquí
            },
        });
        console.log(`[NotificationService] Notificación creada en DB para usuario ${data.usuarioId}, tipo ${data.tipo}, categoria ${categoria}`);

        const [systemCount, chatCount] = await Promise.all([
            prisma.notificacion.count({ where: { usuarioId: data.usuarioId, leida: false, categoria: CategoriaNotificacion.SISTEMA } }),
            prisma.notificacion.count({ where: { usuarioId: data.usuarioId, leida: false, categoria: CategoriaNotificacion.CHAT } })
        ]);

        emitToUser(data.usuarioId.toString(), 'unread_count_updated', { systemCount, chatCount });
        console.log(`[NotificationService] Emitido 'unread_count_updated' para usuario ${data.usuarioId} con counts: System=${systemCount}, Chat=${chatCount}`);
        
        return notification;
    } catch (error) {
        console.error("[NotificationService] Error creando notificación en DB:", error);
        throw error; 
    }
};

export const getNotificationsForUser = async (
    userId: number, 
    soloNoLeidas?: boolean,
    categoria?: CategoriaNotificacion
): Promise<Notificacion[]> => {
    return prisma.notificacion.findMany({
        where: {
            usuarioId: userId,
            ...(soloNoLeidas && { leida: false }),
            ...(categoria && { categoria: categoria }),
        },
        orderBy: { fechaCreacion: 'desc' },
        take: 50,
    });
};

export const markNotificationAsRead = async (
    notificationId: number,
    userId: number
): Promise<Notificacion | null> => {
    const notification = await prisma.notificacion.findFirst({
        where: { id: notificationId, usuarioId: userId }
    });

    if (!notification) {
        console.warn(`[NotificationService] Intento de marcar como leída notificación ${notificationId} por usuario ${userId} falló: No encontrada o sin permiso.`);
        return null; 
    }

    if (notification.leida) {
        return notification;
    }

    const updatedNotification = await prisma.notificacion.update({
        where: { id: notificationId },
        data: { leida: true },
    });

    const [systemCount, chatCount] = await Promise.all([
        prisma.notificacion.count({ where: { usuarioId: userId, leida: false, categoria: CategoriaNotificacion.SISTEMA } }),
        prisma.notificacion.count({ where: { usuarioId: userId, leida: false, categoria: CategoriaNotificacion.CHAT } })
    ]);
    emitToUser(userId.toString(), 'unread_count_updated', { systemCount, chatCount });

    return updatedNotification;
};

export const markAllNotificationsAsReadForUser = async (
    userId: number,
    categoria?: CategoriaNotificacion
): Promise<{ count: number }> => {
    const whereClause: any = { usuarioId: userId, leida: false };
    if (categoria) {
        whereClause.categoria = categoria;
    }
    const result = await prisma.notificacion.updateMany({
        where: whereClause,
        data: { leida: true },
    });
    if (result.count > 0) {
        const [systemCount, chatCount] = await Promise.all([
            prisma.notificacion.count({ where: { usuarioId: userId, leida: false, categoria: CategoriaNotificacion.SISTEMA } }),
            prisma.notificacion.count({ where: { usuarioId: userId, leida: false, categoria: CategoriaNotificacion.CHAT } })
        ]);
        emitToUser(userId.toString(), 'unread_count_updated', { systemCount, chatCount });
    }
    return { count: result.count };
};

export const markTaskChatNotificationsAsRead = async (
    userId: number,
    taskId: number
): Promise<{ count: number }> => {
    console.log(`[NotificationService - STEP 3] markTaskChatNotificationsAsRead llamado para userId: ${userId}, taskId: ${taskId}`);
    const targetUrlPart = `/tasks/${taskId}`; 
    const result = await prisma.notificacion.updateMany({
        where: {
            usuarioId: userId,
            tipo: { in: [TipoNotificacion.NUEVO_MENSAJE_TAREA, TipoNotificacion.MENCION_EN_TAREA] },
            urlDestino: { contains: targetUrlPart },
            leida: false,
        },
        data: { leida: true },
    });
    console.log(`[NotificationService - STEP 4] Notificaciones de chat (que contienen '${targetUrlPart}') actualizadas a leida=true: ${result.count} para usuario ${userId}.`);

    if (result.count > 0) { 
        const [systemCount, chatCount] = await Promise.all([
            prisma.notificacion.count({ where: { usuarioId: userId, leida: false, categoria: CategoriaNotificacion.SISTEMA } }),
            prisma.notificacion.count({ where: { usuarioId: userId, leida: false, categoria: CategoriaNotificacion.CHAT } })
        ]);
        console.log(`[NotificationService - STEP 5] Nuevo conteo total de no leídas para usuario ${userId} es ${systemCount + chatCount}. Emitiendo 'unread_count_updated'.`);
        emitToUser(userId.toString(), 'unread_count_updated', { systemCount, chatCount });
    } else {
        console.log(`[NotificationService - STEP 5] No se actualizaron notificaciones, no se emite 'unread_count_updated' por esta acción.`);
    }
    return { count: result.count };
};

export const notificationService = {
    createDBNotification,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsReadForUser,
    markTaskChatNotificationsAsRead,
};
