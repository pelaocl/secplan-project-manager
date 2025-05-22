import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken'; // Importa SignOptions
import prisma from '../config/prismaClient';
import { LoginInput, RegisterInput } from '../schemas/authSchemas'; // Asegúrate que estos tipos existan
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors'; // Importa NotFoundError si usas getUserById
import { Role } from '@prisma/client';

// Servicio para login de usuario
export const loginUser = async (credentials: LoginInput) => {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    // Verifica si el usuario existe y la contraseña es correcta
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verifica si el usuario está activo
    if (!user.isActive) {
        throw new UnauthorizedError('La cuenta de usuario está desactivada.');
    }

    // Genera el token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error("FATAL ERROR: JWT_SECRET no está configurado.");
        // Lanza un error genérico para no exponer detalles internos
        throw new Error("Error de configuración del servidor.");
    }

    const tokenPayload = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,

    };

    // --- CORRECCIÓN APLICADA ---
    // Usa segundos para expiresIn. Ejemplo: 1 día = 24 * 60 * 60 segundos.
    // Si quieres leer de .env, asegúrate que sea un número de segundos o usa
    // una librería como 'ms' para convertir strings ('1d', '2h') a segundos.
    const defaultExpiresInSeconds = 24 * 60 * 60; // 1 día en segundos por defecto
    let expiresInSeconds: number = defaultExpiresInSeconds; // Inicializa con el default

    if (process.env.JWT_EXPIRES_IN) {
        const parsedExpiresIn = parseInt(process.env.JWT_EXPIRES_IN, 10); // Intenta parsear los segundos desde .env
        // Verifica si el parseo fue exitoso y es un número válido
        if (!isNaN(parsedExpiresIn) && parsedExpiresIn > 0) {
            expiresInSeconds = parsedExpiresIn;
        } else {
            console.warn(`JWT_EXPIRES_IN inválido ('${process.env.JWT_EXPIRES_IN}'), usando default: ${defaultExpiresInSeconds}s`);
            // Mantiene el valor default si el .env no es un número válido de segundos
        }
    }
    // ------ FIN CORRECCIÓN ------


    const signOptions: SignOptions = {
        expiresIn: expiresInSeconds, // Pasa el número de segundos
    };

    // Llama a jwt.sign con las opciones tipadas
    const token = jwt.sign(tokenPayload, jwtSecret, signOptions);


    // Devuelve el token y datos básicos del usuario (sin el hash del password)
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            // Añade otros campos si son necesarios en el frontend
        },
    };
};

// --- Código comentado para posible uso futuro ---

// Servicio para registrar un nuevo usuario (Ejemplo)
/*
export const registerUser = async (data: RegisterInput) => {
    const { email, password, name } = data;

    // Verifica si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new BadRequestError('El correo electrónico ya está registrado.');
    }

    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10); // 10 es el saltRounds

    // Crea el usuario en la BD (rol por defecto USUARIO)
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: Role.USUARIO, // O el rol por defecto que definas
            isActive: true, // O false si requiere activación
        },
    });

    // Devuelve el usuario creado (sin la contraseña)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};
*/

// Servicio para obtener datos de usuario por ID (Ejemplo para /auth/me)
/*
export const getUserById = async (id: number) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { // Selecciona solo los campos seguros
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            etiquetas: { select: { id: true, nombre: true, color: true } } // Ejemplo de relación
        }
    });
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }
    return user;
};
*/

// Exporta algo para asegurar que es un módulo (si no hay otras exportaciones activas)
export {};