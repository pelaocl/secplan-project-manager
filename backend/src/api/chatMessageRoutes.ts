// backend/src/api/chatMessageRoutes.ts
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { createChatMessageSchema, getChatMessagesSchema } // Asegúrate que getChatMessagesSchema exista
    from '../schemas/chatMessageSchemas'; 
import { taskIdParamSchema } from '../schemas/taskSchemas'; // Reutilizamos taskIdParamSchema
import * as chatMessageController from '../controllers/chatMessageController';

// { mergeParams: true } es crucial para que este router pueda acceder a los parámetros
// de la ruta padre (como :taskId si se monta bajo /tasks/:taskId)
const router = express.Router({ mergeParams: true });

// Crear un nuevo mensaje en el chat de una tarea
// POST /api/tasks/:taskId/messages
router.post(
    '/',
    authenticateToken,
    // No necesitamos validar taskId aquí con validateRequest({ params: taskIdParamSchema })
    // porque el router ya está montado bajo /:taskId y el controlador lo extrae de req.params.
    // La validación (isNaN) de taskId se hace en el controlador.
    // Si quisieras validar el formato de taskId con Zod antes de llegar al controlador,
    // necesitarías asegurar que taskIdParamSchema defina {taskId: ...} y que el router
    // principal que monta esto lo capture como "taskId".
    validateRequest({ body: createChatMessageSchema }),
    chatMessageController.createMessageHandler
);

// Obtener todos los mensajes de un chat de tarea (con paginación)
// GET /api/tasks/:taskId/messages  (o /api/projects/:projectId/tasks/:taskId/messages si se anida en taskRoutes)
router.get(
    '/',
    authenticateToken,
    validateRequest({ query: getChatMessagesSchema }), // Valida los query params de paginación
    chatMessageController.getMessagesByTaskHandler
);

export default router;