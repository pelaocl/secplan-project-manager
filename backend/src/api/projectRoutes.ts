import express from 'express';
// Importa TODO el módulo del controlador como 'projectController'
import * as projectController from '../controllers/projectController';
// Importa los middlewares necesarios
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
// Importa los schemas Zod necesarios para validar
import { createProjectSchema, updateProjectSchema, listProjectsSchema, projectIdSchema } from '../schemas/projectSchemas';
// Importa el Enum Role para usar en authorizeRole
import { Role } from '@prisma/client';

// Crea el router
const router = express.Router();

// --- Definición de Rutas ---

// GET /api/projects (Lista pública/autenticada)
// authenticateToken se ejecuta siempre; si hay token válido, añade req.user, si no, req.user es undefined.
// El servicio diferencia qué campos devolver basado en req.user.
router.get(
    '/',
    authenticateToken, // Se ejecuta siempre para potencialmente adjuntar usuario
    validateRequest({ query: listProjectsSchema }), // Valida query params como page, limit, etc.
    projectController.getAllProjectsHandler // <-- Usa el nombre correcto exportado
);

// GET /api/projects/:id (Detalle público/autenticado)
// authenticateToken permite obtener datos completos si el usuario está logueado.
router.get(
    '/:id',
    authenticateToken, // Se ejecuta siempre
    validateRequest({ params: projectIdSchema }), // Valida que :id sea numérico
    projectController.getProjectByIdHandler // <-- Usa el nombre correcto exportado
);

// --- Rutas que REQUIEREN Autenticación y Roles Específicos ---

// POST /api/projects (Crear)
router.post(
    '/',
    authenticateToken, // Requiere token válido
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // Requiere rol específico
    validateRequest({ body: createProjectSchema }), // Valida el cuerpo de la petición
    projectController.createProjectHandler // <-- Usa el nombre correcto exportado
);

// PUT /api/projects/:id (Actualizar)
router.put(
    '/:id',
    authenticateToken, // Requiere token válido
    authorizeRole([Role.ADMIN, Role.COORDINADOR, Role.USUARIO]), // Roles permitidos inicialmente
    validateRequest({ params: projectIdSchema, body: updateProjectSchema }), // Valida ID y cuerpo
    projectController.updateProjectHandler // <-- Usa el nombre correcto exportado
);

// DELETE /api/projects/:id (Eliminar)
router.delete(
    '/:id',
    authenticateToken, // Requiere token válido
    authorizeRole([Role.ADMIN]), // Solo ADMIN
    validateRequest({ params: projectIdSchema }), // Valida ID
    projectController.deleteProjectHandler // <-- Usa el nombre correcto exportado
);

// Exporta el router configurado
export default router;