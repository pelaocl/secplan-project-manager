// backend/src/api/taskRoutes.ts
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { createTaskSchema, projectIdSchema, taskIdSchema, updateTaskSchema } from '../schemas/taskSchemas';
import * as taskController from '../controllers/taskController';
import chatMessageRoutes from './chatMessageRoutes'; // <-- IMPORTAR

// Importa un middleware de autorización de roles si lo tienes (ej. authorizeRole)
// import { authorizeRole } from '../middlewares/roleMiddleware';
// import { Role } from '@prisma/client'; // Si usas authorizeRole

const router = express.Router({ mergeParams: true }); // mergeParams es útil si anidas esta ruta

// Crear una tarea para un proyecto específico
// POST /api/projects/:projectId/tasks
router.post(
    '/', // La ruta base ya incluye /projects/:projectId/ si se monta así
    authenticateToken,
    // authorizeRole([Role.ADMIN, Role.COORDINADOR]), // Solo Admins/Coordinadores pueden crear
    validateRequest({ body: createTaskSchema /*, params: projectIdSchema (si no se anida) */ }),
    taskController.createTaskHandler
);

// Obtener todas las tareas de un proyecto específico
// GET /api/projects/:projectId/tasks
router.get(
    '/',
    authenticateToken,
    // projectIdSchema se validaría en el router padre si se anida así: projectRoutes.use('/:projectId/tasks', taskRoutes)
    // validateRequest({ params: projectIdSchema }),
    taskController.getTasksByProjectHandler
);

// GET /api/projects/:projectId/tasks/:taskId (Obtener una Tarea por ID)
router.get(
    '/:taskId', // El :projectId ya es parte de la ruta base donde se monta este router
    authenticateToken,
    validateRequest({ params: taskIdSchema }), // Validamos que taskId sea un número
    taskController.getTaskByIdHandler
);

// PUT /api/projects/:projectId/tasks/:taskId (Actualizar una Tarea)
router.put(
    '/:taskId',
    authenticateToken,
    validateRequest({ 
        params: taskIdSchema, // Valida taskId de la URL
        body: updateTaskSchema   // Valida el cuerpo de la solicitud
    }),
    taskController.updateTaskHandler
);

// DELETE /api/projects/:projectId/tasks/:taskId (Eliminar una Tarea)
router.delete(
    '/:taskId',
    authenticateToken,
    // Aquí podrías añadir un authorizeRole específico si solo Admins pueden borrar
    // ej: authorizeRole([Role.ADMIN, Role.COORDINADOR]),
    validateRequest({ params: taskIdSchema }), // Valida taskId de la URL
    taskController.deleteTaskHandler
);

// PUT /api/projects/:projectId/tasks/:taskId/mark-chat-viewed
router.put(
    '/:taskId/mark-chat-viewed',
    authenticateToken,
    validateRequest({ params: taskIdSchema }), // Valida que taskId sea un número
    taskController.markTaskChatAsViewedHandler // Asegúrate que este handler exista en taskController
);

// Esto manejará rutas como /api/projects/:projectId/tasks/:taskId/messages
router.use('/:taskId/messages', chatMessageRoutes); 
// Aquí, :taskId ya es capturado por este router (taskRoutes), y gracias a mergeParams
// en chatMessageRoutes, chatMessageRoutes también podrá acceder a req.params.taskId.

export default router;