// backend/src/services/tagService.ts

import { Prisma } from '@prisma/client';
import prisma from '../config/prismaClient'; // Importa tu instancia de PrismaClient
import { CreateTagInput, UpdateTagInput } from '../schemas/tagSchemas'; // Importa los tipos Zod
import { NotFoundError, BadRequestError, AppError } from '../utils/errors'; // Importa tus clases de error personalizadas

/**
 * Busca y devuelve todas las etiquetas, ordenadas por nombre.
 */
export const findAllTags = async () => {
    try {
        const tags = await prisma.etiqueta.findMany({
            orderBy: {
                nombre: 'asc', // Orden alfabético
            },
        });
        return tags;
    } catch (error) {
        console.error("[TagService] Error buscando todas las etiquetas:", error);
        // Lanza un error genérico de la aplicación si falla la consulta
        throw new AppError("Error al obtener la lista de etiquetas.", 500);
    }
};

/**
 * Busca una etiqueta por su ID.
 * Lanza un error NotFoundError si no se encuentra.
 */
export const findTagById = async (id: number) => {
    try {
        const tag = await prisma.etiqueta.findUnique({
            where: { id },
        });

        if (!tag) {
            // Lanza error específico si no existe
            throw new NotFoundError(`Etiqueta con ID ${id} no encontrada.`);
        }
        return tag;
    } catch (error) {
        // Si el error ya es NotFoundError, simplemente lo relanza
        if (error instanceof NotFoundError) {
            throw error;
        }
        // Para otros errores, loguea y lanza un error genérico
        console.error(`[TagService] Error buscando etiqueta por ID ${id}:`, error);
        throw new AppError(`Error al buscar la etiqueta con ID ${id}.`, 500);
    }
};

/**
 * Crea una nueva etiqueta.
 * VERSIÓN MODIFICADA: Añade chequeo case-insensitive.
 * Lanza un BadRequestError si el nombre ya existe (ignorando mayús/minús).
 */
export const createTag = async (data: CreateTagInput) => {
    // 1. Chequeo Case-Insensitive ANTES de intentar crear
    const existingTag = await prisma.etiqueta.findFirst({
        where: {
            nombre: {
                equals: data.nombre,
                mode: 'insensitive', // <-- Búsqueda Insensible
            }
        }
    });

    if (existingTag) {
        throw new BadRequestError(`La etiqueta con el nombre '${data.nombre}' (o una variación de mayúsculas/minúsculas) ya existe.`);
    }

    // 2. Si no existe, intentar crear
    try {
        const newTag = await prisma.etiqueta.create({
            data: {
                nombre: data.nombre, // Guardamos el nombre tal como viene (validado por Zod)
                color: data.color,   // Guardamos el color tal como viene (validado y en mayúsculas por Zod)
            },
        });
        return newTag;
    } catch (error) {
        // El P2002 de Prisma (unique constraint) ahora sería redundante si el chequeo anterior funciona bien,
        // pero lo dejamos por si acaso (ej. condiciones de carrera)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new BadRequestError(`La etiqueta con el nombre '${data.nombre}' ya existe (Error DB).`);
        }
        console.error("[TagService] Error creando etiqueta:", error);
        throw new AppError("Error al crear la etiqueta.", 500);
    }
};

/**
 * Actualiza una etiqueta existente por ID.
 * VERSIÓN MODIFICADA: Añade chequeo case-insensitive al validar nombre.
 * Lanza NotFoundError si la etiqueta no existe.
 * Lanza BadRequestError si el nuevo nombre ya está en uso por OTRA etiqueta (ignorando mayús/minús).
 */

/**
 * Actualiza una etiqueta existente por ID.
 * Lanza NotFoundError si la etiqueta no existe.
 * Lanza BadRequestError si el nuevo nombre ya está en uso por OTRA etiqueta.
 */
export const updateTag = async (id: number, data: UpdateTagInput) => {
    // 1. Asegurarse que la etiqueta que queremos actualizar existe
    const existingTag = await prisma.etiqueta.findUnique({ where: { id } });
    if (!existingTag) {
        throw new NotFoundError(`Etiqueta con ID ${id} no encontrada para actualizar.`);
    }

    // 2. Si se está intentando cambiar el nombre, verificar que el nuevo nombre no esté ya en uso por OTRA etiqueta
    if (data.nombre && data.nombre !== existingTag.nombre) {
        const conflictTag = await prisma.etiqueta.findUnique({
            where: { nombre: data.nombre },
        });
        // Si encontramos una etiqueta con el nuevo nombre Y no es la misma que estamos editando...
        if (conflictTag && conflictTag.id !== id) {
            throw new BadRequestError(`El nombre de etiqueta '${data.nombre}' ya está en uso.`);
        }
    }

    // 3. Intentar actualizar
    try {
        const updatedTag = await prisma.etiqueta.update({
            where: { id },
            data: {
                // Prisma ignora los campos si vienen como 'undefined'
                nombre: data.nombre,
                // Asegura mayúsculas si el color viene
                color: data.color?.toUpperCase(),
            },
        });
        return updatedTag;
    } catch (error) {
        // Captura errores inesperados (aunque el P2002 debería ser capturado antes)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             throw new BadRequestError(`Error al actualizar: El nombre '${data.nombre}' ya está en uso.`);
        }
        console.error(`[TagService] Error actualizando etiqueta ID ${id}:`, error);
        throw new AppError(`Error al actualizar la etiqueta con ID ${id}.`, 500);
    }
};

/**
 * Elimina una etiqueta por ID.
 * Lanza NotFoundError si la etiqueta no existe.
 * Lanza BadRequestError si la etiqueta está asignada a algún usuario.
 */
export const deleteTag = async (id: number) => {
    // 1. Verificar si la etiqueta existe Y si tiene usuarios asociados
    const tagWithUserCount = await prisma.etiqueta.findUnique({
        where: { id },
        // Incluye el conteo de usuarios relacionados
        include: {
            _count: {
                select: { usuarios: true },
            },
        },
    });

    // Si no existe, lanza error
    if (!tagWithUserCount) {
        throw new NotFoundError(`Etiqueta con ID ${id} no encontrada para eliminar.`);
    }

    // 2. Verificar si está en uso
    if (tagWithUserCount._count.usuarios > 0) {
        throw new BadRequestError(`No se puede eliminar la etiqueta '${tagWithUserCount.nombre}' porque está asignada a ${tagWithUserCount._count.usuarios} usuario(s). Primero debes desasignarla de todos los usuarios.`);
    }

    // 3. Si no está en uso, proceder a eliminar
    try {
        await prisma.etiqueta.delete({
            where: { id },
        });
        // DELETE exitoso no necesita devolver nada
    } catch (error) {
         // Maneja error si, por alguna razón, no se puede borrar (ej. P2025 si se borró justo antes)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundError(`Etiqueta con ID ${id} no encontrada para eliminar (probablemente ya fue eliminada).`);
        }
        console.error(`[TagService] Error eliminando etiqueta ID ${id}:`, error);
        throw new AppError(`Error al eliminar la etiqueta con ID ${id}.`, 500);
    }
};