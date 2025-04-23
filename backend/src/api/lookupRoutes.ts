import express from 'express';
import * as lookupController from '../controllers/lookupController'; // Asegúrate que exista y exporte
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/lookups/form-options (Requiere autenticación para ver todas las opciones)
router.get(
    '/form-options',
    authenticateToken, // Asegura que al menos esté logueado para obtener opciones internas como usuarios
    lookupController.getFormOptionsHandler // Necesitas crear este handler en lookupController
);

// Puedes añadir más rutas de lookup si necesitas (ej. solo tipos públicos para visitantes)

export default router;