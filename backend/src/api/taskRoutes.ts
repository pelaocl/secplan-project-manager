//backend/src/api/taskRoutes.ts
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { createTaskSchema, projectIdSchema, taskIdSchema, updateTaskSchema, myTasksQuerySchema } from '../schemas/taskSchemas';
import * as taskController from '../controllers/taskController';
import chatMessageRoutes from './chatMessageRoutes';

// El router ahora NO necesita mergeParams, ya que todas las rutas se definen aquí
const router = express.Router();

// --- RUTA INDEPENDIENTE PARA "MIS TAREAS" ---
// GET /api/tasks/my-tasks
router.get(
    '/my-tasks',
    authenticateToken,
    validateRequest({ query: myTasksQuerySchema }),
    taskController.getMyTasksHandler
);


// --- RUTAS DE TAREAS ANIDADAS DENTRO DE UN PROYECTO ---

// Crear una tarea para un proyecto específico
// POST /api/tasks/project/:projectId
router.post(
    '/project/:projectId',
    authenticateToken,
    validateRequest({ body: createTaskSchema, params: projectIdSchema }),
    taskController.createTaskHandler
);

// Obtener todas las tareas de un proyecto específico
// GET /api/tasks/project/:projectId
router.get(
    '/project/:projectId',
    authenticateToken,
    validateRequest({ params: projectIdSchema }),
    taskController.getTasksByProjectHandler
);

// --- Rutas que operan sobre UNA tarea específica, incluyendo projectId para contexto y seguridad ---

// GET /api/tasks/project/:projectId/:taskId
router.get(
    '/project/:projectId/:taskId',
    authenticateToken,
    validateRequest({ params: projectIdSchema.merge(taskIdSchema) }),
    taskController.getTaskByIdHandler
);

// PUT /api/tasks/project/:projectId/:taskId
router.put(
    '/project/:projectId/:taskId',
    authenticateToken,
    validateRequest({ 
        params: projectIdSchema.merge(taskIdSchema),
        body: updateTaskSchema
    }),
    taskController.updateTaskHandler
);

// DELETE /api/tasks/project/:projectId/:taskId
router.delete(
    '/project/:projectId/:taskId',
    authenticateToken,
    validateRequest({ params: projectIdSchema.merge(taskIdSchema) }),
    taskController.deleteTaskHandler
);

// PUT /api/tasks/project/:projectId/:taskId/mark-chat-viewed
router.put(
    '/project/:projectId/:taskId/mark-chat-viewed',
    authenticateToken,
    validateRequest({ params: projectIdSchema.merge(taskIdSchema) }),
    taskController.markTaskChatAsViewedHandler
);

export default router;
