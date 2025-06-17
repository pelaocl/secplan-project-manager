import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as statsController from '../controllers/statsController';

const router = express.Router();

// GET /api/stats/dashboard
// Obtiene todas las métricas necesarias para el dashboard principal.
router.get(
    '/dashboard',
    authenticateToken, // Requiere que el usuario esté logueado para ver las estadísticas
    statsController.getDashboardStatsHandler
);

export default router;