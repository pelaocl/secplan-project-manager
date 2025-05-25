// backend/src/controllers/notificationController.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserPayload } from '../types/express';
import { notificationService } from '../services/notificationService';
import { GetNotificationsQuery } from '../schemas/notificationSchemas';
import { BadRequestError } from '../utils/errors';


export const getNotificationsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userPayload = req.user as UserPayload;
        if (!userPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        
        const query = req.validatedQuery as GetNotificationsQuery;

        const notifications = await notificationService.getNotificationsForUser(userPayload.id, query.soloNoLeidas);
        const unreadCount = notifications.filter(n => !n.leida).length; // O calcula esto en el servicio

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

export const markAsReadHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userPayload = req.user as UserPayload;
        const notificationId = parseInt(req.params.notificationId, 10);

        if (!userPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (isNaN(notificationId)) {
            throw new BadRequestError("ID de notificación inválido.");
        }

        const updatedNotification = await notificationService.markNotificationAsRead(notificationId, userPayload.id);
        if (!updatedNotification) {
            // Esto podría significar que la notificación no existe o no pertenece al usuario
            return res.status(404).json({ message: "Notificación no encontrada o no tienes permiso." });
        }
        res.status(200).json(updatedNotification);
    } catch (error) {
        next(error);
    }
};

export const markAllAsReadHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userPayload = req.user as UserPayload;
        if (!userPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }

        const result = await notificationService.markAllNotificationsAsReadForUser(userPayload.id);
        res.status(200).json({ message: `${result.count} notificaciones marcadas como leídas.` });
    } catch (error) {
        next(error);
    }
};

export const markTaskChatAsReadHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userPayload = req.user as UserPayload;
        const taskIdString = req.params.taskId; // Asumimos que taskId vendrá como parámetro de la URL

        if (!userPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (!taskIdString) {
            throw new BadRequestError("El ID de la tarea es requerido en la URL.");
        }
        const taskId = parseInt(taskIdString, 10);
        if (isNaN(taskId)) {
            throw new BadRequestError("El ID de la tarea proporcionado es inválido.");
        }

        const result = await notificationService.markTaskChatNotificationsAsRead(userPayload.id, taskId);
        res.status(200).json({ 
            message: `${result.count} notificaciones de chat para la tarea ${taskId} marcadas como leídas.`, 
            updatedCount: result.count 
        });
    } catch (error) {
        next(error);
    }
};