// backend/src/api/tagRoutes.ts

import express from 'express';
import * as tagController from '../controllers/tagController'; // Importa los handlers del controlador
import { authenticateToken } from '../middlewares/authMiddleware'; // Middleware para verificar JWT
import { authorizeRole } from '../middlewares/roleMiddleware'; // Middleware para verificar Rol
import { validateRequest } from '../middlewares/validationMiddleware'; // Middleware para validar con Zod
import { tagIdSchema, createTagSchema, updateTagSchema } from '../schemas/tagSchemas'; // Importa los schemas Zod
import { Role } from '@prisma/client'; // Importa el Enum Role

const router = express.Router();

// === RUTAS PARA ETIQUETAS ===
// Todas estas rutas asumirán que se montan bajo un prefijo como /api/admin/tags
// y requieren rol de ADMIN.

// GET / - Obtener todas las etiquetas
router.get(
    '/',
    authenticateToken,             // 1. Verifica token JWT
    authorizeRole([Role.ADMIN]),   // 2. Verifica que el rol sea ADMIN
    tagController.getAllTagsHandler  // 3. Llama al controlador
);

// POST / - Crear una nueva etiqueta
router.post(
    '/',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ body: createTagSchema }), // 4. Valida el cuerpo de la petición
    tagController.createTagHandler
);

// GET /:id - Obtener una etiqueta específica por ID
router.get(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ params: tagIdSchema }), // 4. Valida el parámetro :id de la URL
    tagController.getTagByIdHandler
);

// PUT /:id - Actualizar una etiqueta existente por ID
router.put(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ params: tagIdSchema, body: updateTagSchema }), // 4. Valida ID y cuerpo
    tagController.updateTagHandler
);

// DELETE /:id - Eliminar una etiqueta existente por ID
router.delete(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]),
    validateRequest({ params: tagIdSchema }), // 4. Valida el parámetro :id
    tagController.deleteTagHandler
);

// Exporta el router configurado
export default router;