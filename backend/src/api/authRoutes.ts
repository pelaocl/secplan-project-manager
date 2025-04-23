import express from 'express';
import * as authController from '../controllers/authController';
import { validateRequest } from '../middlewares/validationMiddleware';
import { loginSchema, registerSchema } from '../schemas/authSchemas'; // Asegúrate que estos schemas existan

const router = express.Router();

// POST /api/auth/login
router.post(
    '/login',
    validateRequest({ body: loginSchema }),
    authController.loginHandler
);

// POST /api/auth/register (Ejemplo si quieres añadir registro)
// Necesitarás crear registerSchema y registerHandler
// router.post(
//     '/register',
//     validateRequest({ body: registerSchema }),
//     authController.registerHandler
// );


// GET /api/auth/me (Ejemplo para obtener datos del usuario logueado)
// Necesitarás importar authenticateToken y crear un handler getMeHandler
// import { authenticateToken } from '../middlewares/authMiddleware';
// router.get('/me', authenticateToken, authController.getMeHandler);


export default router;