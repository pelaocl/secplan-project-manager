// backend/src/api/notificationRoutes.ts
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { notificationIdParamSchema, getNotificationsQuerySchema } from '../schemas/notificationSchemas';
import * as notificationController from '../controllers/notificationController';

const router = express.Router();

// Obtener notificaciones para el usuario autenticado
// GET /api/notifications?soloNoLeidas=true
router.get(
    '/',
    authenticateToken,
    validateRequest({ query: getNotificationsQuerySchema }),
    notificationController.getNotificationsHandler
);

// Marcar todas las notificaciones como leídas
// PUT /api/notifications/read-all
router.put(
    '/read-all',
    authenticateToken,
    notificationController.markAllAsReadHandler
);

// Marcar una notificación específica como leída
// PUT /api/notifications/:notificationId/read
router.put(
    '/:notificationId/read',
    authenticateToken,
    validateRequest({ params: notificationIdParamSchema }),
    notificationController.markAsReadHandler
);

export default router;