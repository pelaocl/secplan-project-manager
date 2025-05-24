// backend/src/controllers/chatMessageController.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserPayload } from '../types/express';
import { CreateChatMessageInput } from '../schemas/chatMessageSchemas';
import { chatMessageService } from '../services/chatMessageService'; // Asumiendo que exportas un objeto
import { BadRequestError } from '../utils/errors';

export const createMessageHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const taskIdString = req.params.taskId; // taskId vendrá de la ruta /tasks/:taskId/messages
        const remitentePayload = req.user as UserPayload;
        const data = req.validatedBody as CreateChatMessageInput; // Del middleware de validación

        if (!remitentePayload) {
            // Aunque authenticateToken debería manejar esto, una doble verificación.
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }

        if (!taskIdString) {
            throw new BadRequestError("El ID de la tarea es requerido en la URL.");
        }
        const taskId = parseInt(taskIdString, 10);
        if (isNaN(taskId)) {
            throw new BadRequestError("El ID de la tarea proporcionado es inválido.");
        }

        const nuevoMensaje = await chatMessageService.createChatMessage(taskId, remitentePayload, data);
        
        res.status(201).json(nuevoMensaje);
    } catch (error) {
        next(error);
    }
};

export const getMessagesByTaskHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const taskIdString = req.params.taskId;
        const remitentePayload = req.user as UserPayload; // Usuario que solicita los mensajes
        const queryParams = req.validatedQuery as GetChatMessagesQuery; // Validado por middleware

        if (!remitentePayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (!taskIdString) {
            throw new BadRequestError("El ID de la tarea es requerido en la URL.");
        }
        const taskId = parseInt(taskIdString, 10);
        if (isNaN(taskId)) {
            throw new BadRequestError("El ID de la tarea proporcionado es inválido.");
        }

        const result = await chatMessageService.getChatMessagesByTaskId(taskId, remitentePayload, queryParams);
        
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// export const getMessagesByTaskHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => { ... }