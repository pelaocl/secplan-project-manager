// backend/src/controllers/notificationController.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserPayload } from '../types/express';
import { notificationService } from '../services/notificationService';
import { GetNotificationsQuery } from '../schemas/notificationSchemas';
import { BadRequestError } from '../utils/errors';
import { CategoriaNotificacion } from '@prisma/client';

export const getNotificationsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userPayload = req.user as UserPayload;
        if (!userPayload) {
            res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
            return;
        }
        
        const query = req.validatedQuery as GetNotificationsQuery;

        // --- INICIO DE MODIFICACIÓN: Leer y validar la categoría del query ---
        const categoriaQuery = req.query.categoria as string;
        let categoria: CategoriaNotificacion | undefined;

        if (categoriaQuery) {
            if (Object.values(CategoriaNotificacion).includes(categoriaQuery.toUpperCase() as CategoriaNotificacion)) {
                categoria = categoriaQuery.toUpperCase() as CategoriaNotificacion;
            } else {
                throw new BadRequestError("Valor de 'categoria' inválido. Debe ser 'SISTEMA' o 'CHAT'.");
            }
        }

        // Pasar la categoría al servicio
        const notifications = await notificationService.getNotificationsForUser(userPayload.id, query.soloNoLeidas, categoria);
        
        // El conteo de no leídas ahora viene por socket, esta respuesta es principalmente para la lista
        const unreadCount = notifications.filter(n => !n.leida).length; 
        // --- FIN DE MODIFICACIÓN ---

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

export const markAsReadHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userPayload = req.user as UserPayload;
        const notificationId = parseInt(req.params.notificationId, 10);

        if (!userPayload) {
            res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
            return;
        }
        if (isNaN(notificationId)) {
            throw new BadRequestError("ID de notificación inválido.");
        }

        const updatedNotification = await notificationService.markNotificationAsRead(notificationId, userPayload.id);
        if (!updatedNotification) {
            // Esto podría significar que la notificación no existe o no pertenece al usuario
            res.status(404).json({ message: "Notificación no encontrada o no tienes permiso." });
            return;
        }
        res.status(200).json(updatedNotification);
    } catch (error) {
        next(error);
    }
};

export const markAllAsReadHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userPayload = req.user as UserPayload;
        if (!userPayload) {
            res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
            return;
        }

        // --- INICIO DE MODIFICACIÓN: Leer y validar la categoría del query ---
        const categoriaQuery = req.query.categoria as string;
        let categoria: CategoriaNotificacion | undefined;

        if (categoriaQuery) {
            if (Object.values(CategoriaNotificacion).includes(categoriaQuery.toUpperCase() as CategoriaNotificacion)) {
                categoria = categoriaQuery.toUpperCase() as CategoriaNotificacion;
            } else {
                throw new BadRequestError("Valor de 'categoria' inválido. Debe ser 'SISTEMA' o 'CHAT'.");
            }
        }

        // Pasar la categoría al servicio. Si no se provee, marca todas.
        const result = await notificationService.markAllNotificationsAsReadForUser(userPayload.id, categoria);
        // --- FIN DE MODIFICACIÓN ---

        res.status(200).json({ message: `${result.count} notificaciones marcadas como leídas.` });
    } catch (error) {
        next(error);
    }
};

export const markTaskChatAsReadHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userPayload = req.user as UserPayload;
        const taskIdString = req.params.taskId; // Asumimos que taskId vendrá como parámetro de la URL

        if (!userPayload) {
            res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
            return;
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