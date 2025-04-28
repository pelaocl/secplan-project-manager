// backend/src/api/adminUserRoutes.ts

import express from 'express';
import * as adminUserController from '../controllers/adminUserController'; // Importa los handlers del controlador de usuarios admin
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { userIdSchema, createUserSchema, updateUserSchema } from '../schemas/adminUserSchemas'; // Importa los schemas Zod para usuarios
import { Role } from '@prisma/client';

const router = express.Router();

// === RUTAS PARA GESTIÓN DE USUARIOS (ADMIN) ===
// Base: /api/admin/users (montado en server.ts)
// Todas requieren rol ADMIN

// GET / - Obtener todos los usuarios
router.get(
    '/',
    authenticateToken,
    authorizeRole([Role.ADMIN]),   // Solo Admin
    adminUserController.getAllUsersHandler
);

// POST / - Crear un nuevo usuario
router.post(
    '/',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ body: createUserSchema }), // Valida el cuerpo con el schema de creación
    adminUserController.createUserHandler
);

// GET /:id - Obtener un usuario específico por ID
router.get(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ params: userIdSchema }), // Valida el ID de la URL
    adminUserController.getUserByIdHandler
);

// PUT /:id - Actualizar un usuario existente por ID
router.put(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ params: userIdSchema, body: updateUserSchema }), // Valida ID y cuerpo con schema de actualización
    adminUserController.updateUserHandler
);

// DELETE /:id - Eliminar un usuario existente por ID
router.delete(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ params: userIdSchema }), // Valida el ID de la URL
    adminUserController.deleteUserHandler
);

// Exporta el router configurado
export default router;