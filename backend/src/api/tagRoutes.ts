// ========================================================================
// INICIO: Contenido COMPLETO y CORREGIDO para tagRoutes.ts (Permisos Ajustados)
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================
// backend/src/api/tagRoutes.ts

import express from 'express';
import * as tagController from '../controllers/tagController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { tagIdSchema, createTagSchema, updateTagSchema } from '../schemas/tagSchemas';
import { Role } from '@prisma/client';

const router = express.Router();

// === RUTAS PARA ETIQUETAS ===
// Base: /api/admin/tags (montado en server.ts)

// GET / - Obtener todas las etiquetas
router.get(
    '/',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // <-- CORREGIDO
    tagController.getAllTagsHandler
);

// POST / - Crear una nueva etiqueta
router.post(
    '/',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // <-- CORREGIDO
    validateRequest({ body: createTagSchema }),
    tagController.createTagHandler
);

// GET /:id - Obtener una etiqueta específica por ID
router.get(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // <-- CORREGIDO
    validateRequest({ params: tagIdSchema }),
    tagController.getTagByIdHandler
);

// PUT /:id - Actualizar una etiqueta existente por ID
router.put(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // <-- CORREGIDO
    validateRequest({ params: tagIdSchema, body: updateTagSchema }),
    tagController.updateTagHandler
);

// DELETE /:id - Eliminar una etiqueta existente por ID
router.delete(
    '/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]), // <-- MANTENIDO SOLO ADMIN (O cambia si quieres)
    validateRequest({ params: tagIdSchema }),
    tagController.deleteTagHandler
);

export default router;
// ========================================================================
// FIN: Contenido COMPLETO y CORREGIDO para tagRoutes.ts (Permisos Ajustados)
// ========================================================================