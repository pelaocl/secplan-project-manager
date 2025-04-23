import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService'; // Asegúrate que authService exista
import { LoginInput, RegisterInput } from '../schemas/authSchemas'; // Tipos del schema Zod
import { AuthenticatedRequest } from '../types/express'; // Para req.user
import { UnauthorizedError } from '../utils/errors';

// Handler para Login
export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // El body ya fue validado por validateRequest(loginSchema) en authRoutes
        const loginData = req.body as LoginInput; // Castea a tu tipo Zod inferido
        const result = await authService.loginUser(loginData); // Llama al servicio

        if (!result) {
             // El servicio debería lanzar un error si falla, pero por si acaso
             throw new UnauthorizedError('Credenciales inválidas');
        }

        // Envía la respuesta (ej. token y datos de usuario)
        res.status(200).json(result);

    } catch (error) {
        next(error); // Pasa el error al manejador global
    }
};

// Handler para Registro (Ejemplo, si lo implementas)
// export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const registerData = req.body as RegisterInput;
//         const newUser = await authService.registerUser(registerData); // Necesitas crear este servicio
//         // No devuelvas la contraseña! Selecciona los campos necesarios
//         res.status(201).json({ message: 'Usuario registrado con éxito', userId: newUser.id });
//     } catch (error) {
//         next(error);
//     }
// };

// Handler para obtener datos del usuario actual (Ejemplo, si lo implementas)
// export const getMeHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//     try {
//         // El middleware authenticateToken ya adjuntó req.user
//         if (!req.user) {
//             throw new UnauthorizedError('No autenticado');
//         }
//         // Devuelve los datos del usuario (sin información sensible como el hash del password)
//         const userData = await authService.getUserById(req.user.id); // Necesitas este servicio
//         res.status(200).json(userData);
//     } catch (error) {
//         next(error);
//     }
// };

// Asegúrate de exportar CUALQUIER COSA para que sea un módulo
export {}; // Puedes quitar esto si exportas los handlers descomentados