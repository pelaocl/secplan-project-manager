// backend/src/api/taskRoutes.ts
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { createTaskSchema, projectIdSchema, taskIdSchema, updateTaskSchema } from '../schemas/taskSchemas';
import * as taskController from '../controllers/taskController';
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

// TODO: Definir rutas para GET :taskId, PUT :taskId, DELETE :taskId
// router.get('/:taskId', authenticateToken, validateRequest({ params: taskIdSchema }), taskController.getTaskByIdHandler);
// router.put('/:taskId', authenticateToken, /* authorizeRole(...), */ validateRequest({ params: taskIdSchema, body: updateTaskSchema }), taskController.updateTaskHandler);
// router.delete('/:taskId', authenticateToken, /* authorizeRole([Role.ADMIN, Role.COORDINADOR]), */ validateRequest({ params: taskIdSchema }), taskController.deleteTaskHandler);

export default router;