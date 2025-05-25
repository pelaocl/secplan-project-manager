// backend/src/schemas/taskSchemas.ts
import { z } from 'zod';
import { EstadoTarea, PrioridadTarea } from '@prisma/client'; // Importa los Enums de Prisma

export const createTaskSchema = z.object({
    titulo: z.string().min(3, "El título debe tener al menos 3 caracteres").max(255),
    descripcion: z.string().optional().nullable(), // HTML del editor enriquecido
    fechaPlazo: z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        return undefined; // o null si prefieres y el campo es nullable
    }, z.date().optional().nullable()),
    estado: z.nativeEnum(EstadoTarea).optional().default(EstadoTarea.PENDIENTE),
    prioridad: z.nativeEnum(PrioridadTarea).optional().nullable(),
    asignadoId: z.number().int().positive().optional().nullable(),
    participantesIds: z.array(z.number().int().positive()).optional().default([]),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
    // Puedes añadir validaciones específicas para la actualización si es necesario
    // Por ejemplo, si algunos campos no se pueden cambiar una vez creados.
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskIdSchema = z.object({
    taskId: z.string().regex(/^\d+$/, "ID de tarea debe ser un número").transform(val => parseInt(val, 10)),
});

export const projectIdSchema = z.object({ // Ya podrías tener esto en projectSchemas.ts
    projectId: z.string().regex(/^\d+$/, "ID de proyecto debe ser un número").transform(val => parseInt(val, 10)),
});