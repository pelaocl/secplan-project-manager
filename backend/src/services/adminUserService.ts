// backend/src/services/adminUserService.ts

import { Prisma, PrismaClient, Role } from '@prisma/client';
import prisma from '../config/prismaClient';
import bcrypt from 'bcryptjs';
import { CreateUserInput, UpdateUserInput } from '../schemas/adminUserSchemas';
import { NotFoundError, BadRequestError, AppError } from '../utils/errors';

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// --- Define los campos a seleccionar para evitar exponer la contraseña ---
const selectUserFields = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    // Incluye las etiquetas asociadas
    etiquetas: {
        select: {
            id: true,
            nombre: true,
            color: true,
        },
    },
};

/**
 * Busca y devuelve todos los usuarios con sus etiquetas.
 * TODO: Añadir opciones de paginación, filtros, ordenamiento si es necesario.
 */
export const findAllUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            select: selectUserFields, // Excluye contraseña
            orderBy: {
                name: 'asc', // Ordena por nombre por defecto
            },
        });
        return users;
    } catch (error) {
        console.error("[AdminUserService] Error buscando todos los usuarios:", error);
        throw new AppError("Error al obtener la lista de usuarios.", 500);
    }
};

/**
 * Busca un usuario por su ID, incluyendo etiquetas.
 * Lanza un error NotFoundError si no se encuentra.
 */
export const findUserById = async (id: number) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: selectUserFields, // Excluye contraseña
        });

        if (!user) {
            throw new NotFoundError(`Usuario con ID ${id} no encontrado.`);
        }
        return user;
    } catch (error) {
        if (error instanceof NotFoundError) throw error;
        console.error(`[AdminUserService] Error buscando usuario por ID ${id}:`, error);
        throw new AppError(`Error al buscar el usuario con ID ${id}.`, 500);
    }
};

/**
 * Crea un nuevo usuario.
 * Hashea la contraseña.
 * Asigna etiquetas si se proporcionan IDs.
 * Lanza BadRequestError si el email ya existe.
 */
export const createUser = async (data: CreateUserInput) => {
    // 1. Verifica si el email ya existe (case-insensitive)
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }, // Busca por email en minúsculas
    });
    if (existingUser) {
        throw new BadRequestError(`El email '${data.email}' ya está registrado.`);
    }

    // 2. Hashea la contraseña
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 3. Prepara los datos para Prisma
    const createData: Prisma.UserCreateInput = {
        email: data.email.toLowerCase(), // Guarda email en minúsculas
        password: hashedPassword,
        name: data.name, // Zod ya validó opcionalidad
        role: data.role, // Zod ya validó que sea un rol válido
        isActive: data.isActive ?? true, // Default a true si no se especifica
        // Conecta las etiquetas si se proporcionaron IDs
        ...(data.etiquetaIds && data.etiquetaIds.length > 0 && {
            etiquetas: {
                connect: data.etiquetaIds.map(id => ({ id: id }))
            }
        })
    };

    // 4. Intenta crear el usuario
    try {
        const newUser = await prisma.user.create({
            data: createData,
            select: selectUserFields, // Devuelve el usuario sin la contraseña
        });
        return newUser;
    } catch (error) {
        // Captura error de DB por si acaso (aunque el chequeo de email debería prevenir P2002)
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             throw new BadRequestError(`El email '${data.email}' ya existe (Error DB).`);
         }
        console.error("[AdminUserService] Error creando usuario:", error);
        throw new AppError("Error al crear el usuario.", 500);
    }
};

/**
 * Actualiza un usuario existente por ID.
 * Permite actualizar email, nombre, rol, estado, contraseña (opcional) y etiquetas.
 * Lanza NotFoundError si el usuario no existe.
 * Lanza BadRequestError si el nuevo email ya está en uso por OTRO usuario.
 */
export const updateUser = async (id: number, data: UpdateUserInput) => {
    // 1. Verifica que el usuario a actualizar existe
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
        throw new NotFoundError(`Usuario con ID ${id} no encontrado para actualizar.`);
    }

    // 2. Prepara los datos a actualizar
    const updateData: Prisma.UserUpdateInput = {};

    // 2a. Email: Si cambia, verifica que no exista en otro usuario
    if (data.email && data.email.toLowerCase() !== existingUser.email) {
        const conflictUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (conflictUser && conflictUser.id !== id) {
             throw new BadRequestError(`El email '${data.email}' ya está en uso por otro usuario.`);
        }
        updateData.email = data.email.toLowerCase(); // Añade email al objeto de actualización
    }

    // 2b. Contraseña: Si se proporciona una nueva (y no es vacía), hashéala
    if (data.password) { // Zod ya validó que si existe, tiene min 8 chars
        updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    // 2c. Otros campos directos (si vienen en data, se incluyen)
    if (data.name !== undefined) updateData.name = data.name; // Permite setear a null
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // 2d. Etiquetas: Si se proporciona el array 'etiquetaIds', sincronízalo usando 'set'
    // 'set' desconectará las antiguas y conectará solo las nuevas proporcionadas.
    // Si 'etiquetaIds' es un array vacío [], quitará todas las etiquetas.
    // Si 'etiquetaIds' es undefined, no hará nada a las etiquetas.
    if (data.etiquetaIds !== undefined) {
        updateData.etiquetas = {
            set: data.etiquetaIds.map(tagId => ({ id: tagId })),
        };
    }

    // 3. Si no hay datos para actualizar, retorna el usuario existente
     if (Object.keys(updateData).length === 0) {
         // Para evitar una llamada innecesaria a la DB, podemos buscarlo de nuevo con los campos seleccionados
         return findUserById(id); // Reutiliza la función que ya selecciona campos
     }

    // 4. Intenta actualizar
    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: selectUserFields, // Devuelve usuario actualizado sin contraseña
        });
        return updatedUser;
    } catch (error) {
        // Captura error de unicidad de email por si acaso
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             throw new BadRequestError(`Error al actualizar: El email '${data.email}' ya está en uso.`);
        }
        // Captura error si un ID de etiqueta en 'set' no existe
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new BadRequestError('Error al actualizar etiquetas: Una o más de las etiquetas seleccionadas no existen.');
         }
        console.error(`[AdminUserService] Error actualizando usuario ID ${id}:`, error);
        throw new AppError(`Error al actualizar el usuario con ID ${id}.`, 500);
    }
};

/**
 * Elimina un usuario por ID.
 * Lanza NotFoundError si el usuario no existe.
 * Lanza BadRequestError si el usuario tiene proyectos o tareas asociadas.
 * TODO: Considerar si se debe permitir borrar al único ADMIN.
 */
export const deleteUser = async (id: number) => {
    // 1. Verificar si existe y contar relaciones importantes
    const userWithCounts = await prisma.user.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    proyectosCreados: true,    // Proyectos donde es Proyectista
                    proyectosFormulados: true, // Proyectos donde es Formulador
                    proyectosColabora: true,   // Proyectos donde es Colaborador
                    tareasAsignadas: true,     // Tareas donde es Asignado
                }
            }
        }
    });

    if (!userWithCounts) {
        throw new NotFoundError(`Usuario con ID ${id} no encontrado para eliminar.`);
    }

    // 2. Verificar dependencias que impiden el borrado directo
    const relatedCounts = userWithCounts._count;
    const tieneProyectosAsociados = relatedCounts.proyectosCreados > 0 || relatedCounts.proyectosFormulados > 0 || relatedCounts.proyectosColabora > 0;
    const tieneTareasAsignadas = relatedCounts.tareasAsignadas > 0;

    if (tieneProyectosAsociados || tieneTareasAsignadas) {
        let message = `No se puede eliminar al usuario '${userWithCounts.name || userWithCounts.email}' porque está asociado con:`;
        if (relatedCounts.proyectosCreados > 0) message += ` ${relatedCounts.proyectosCreados} proyecto(s) como proyectista,`;
        if (relatedCounts.proyectosFormulados > 0) message += ` ${relatedCounts.proyectosFormulados} proyecto(s) como formulador,`;
        if (relatedCounts.proyectosColabora > 0) message += ` ${relatedCounts.proyectosColabora} proyecto(s) como colaborador,`;
        if (tieneTareasAsignadas) message += ` ${relatedCounts.tareasAsignadas} tarea(s) asignada(s),`;
        // Quita la última coma y añade punto. Reasigna proyectos/tareas antes de eliminar.
        message = message.replace(/,$/, '.') + ' Reasigna sus proyectos y tareas antes de eliminar.';
        throw new BadRequestError(message);
    }

    // (Opcional) Verificar si es el último admin
    // if (userWithCounts.role === Role.ADMIN) {
    //     const adminCount = await prisma.user.count({ where: { role: Role.ADMIN }});
    //     if (adminCount <= 1) {
    //         throw new BadRequestError("No se puede eliminar al único administrador del sistema.");
    //     }
    // }

    // 3. Intentar eliminar (desconectará automáticamente etiquetas por ser M-N implícita)
    try {
        await prisma.user.delete({
            where: { id },
        });
    } catch (error) {
        // Manejar error P2025 (si ya fue borrado) u otros
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundError(`Usuario con ID ${id} no encontrado para eliminar (probablemente ya fue eliminado).`);
        }
        console.error(`[AdminUserService] Error eliminando usuario ID ${id}:`, error);
        throw new AppError(`Error al eliminar el usuario con ID ${id}.`, 500);
    }
};