import express from 'express';
import * as projectController from '../controllers/projectController';
// CORREGIDO: Importa authenticateToken aquí
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { createProjectSchema, updateProjectSchema, listProjectsSchema, projectIdSchema } from '../schemas/projectSchemas';
import { Role } from '@prisma/client';

const router = express.Router();

// GET /api/projects - Ahora aplica authenticateToken SIEMPRE
// authenticateToken añadirá req.user si hay token válido, si no, req.user será undefined.
// El servicio findAllProjects diferencia basado en la presencia de req.user.
router.get(
    '/',
    authenticateToken, // <--- AÑADIDO AQUÍ
    validateRequest({ query: listProjectsSchema }),
    projectController.getAllProjects
);

// GET /api/projects/:id - También debería tener authenticateToken
// para poder devolver campos privados si el usuario está logueado.
router.get(
    '/:id',
    authenticateToken, // <--- AÑADIDO AQUÍ
    validateRequest({ params: projectIdSchema }),
    projectController.getProjectById
);

// --- Rutas que REQUIEREN Autenticación y Roles Específicos ---

// POST /api/projects (Crear)
router.post(
    '/',
    authenticateToken, // Necesario para saber quién crea y verificar rol
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // Solo estos roles pueden crear
    validateRequest({ body: createProjectSchema }),
    projectController.createProjectHandler
);

// PUT /api/projects/:id (Actualizar)
router.put(
    '/:id',
    authenticateToken, // Necesario para saber quién actualiza y verificar rol/permiso
    authorizeRole([Role.ADMIN, Role.COORDINADOR, Role.USUARIO]), // Roles que *pueden* intentar editar
    validateRequest({ params: projectIdSchema, body: updateProjectSchema }),
    projectController.updateProjectHandler // El servicio verifica si USUARIO es el proyectista asignado
);

// DELETE /api/projects/:id (Eliminar)
router.delete(
    '/:id',
    authenticateToken, // Necesario para verificar rol
    authorizeRole([Role.ADMIN]), // Solo ADMIN puede eliminar
    validateRequest({ params: projectIdSchema }),
    projectController.deleteProjectHandler
);

// TODO: Añadir ruta para exportar? GET /export ? Considerar auth

export default router;