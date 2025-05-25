// frontend/src/schemas/taskFormSchema.ts
import { z } from 'zod';
import { EstadoTarea, PrioridadTarea } from '../types'; // Asegúrate que estos enums estén en tus tipos del frontend

// Helper para procesar números opcionales (similar al que usamos en projectFormSchema)
const preprocessOptionalNumberOrNull = (val: unknown): number | null => {
    if (val === '' || val == null) return null; // Captura undefined y '' como null
    const num = Number(val);
    return isNaN(num) ? null : num; // Devuelve null si no es un número válido después de la coerción
};

export const taskFormSchema = z.object({
    titulo: z.string().min(3, "El título debe tener al menos 3 caracteres.").max(255, "El título es demasiado largo."),
    descripcion: z.string().nullable().optional(), // HTML del editor enriquecido, puede ser null o no estar
    
    asignadoId: z.preprocess(
        preprocessOptionalNumberOrNull,
        z.number().int().positive("Debe ser un ID válido.").nullable().optional()
    ),
    participantesIds: z.array(z.number().int().positive()).optional().default([]),
    
    fechaPlazo: z.preprocess((arg) => {
        if (!arg || arg === '') return null; // Si está vacío o nulo, devuelve null
        // Si es string o Date, intenta convertirlo a Date
        if (typeof arg === 'string' || arg instanceof Date) {
            const date = new Date(arg);
            // Si la fecha es inválida, Zod la rechazará.
            // Si es válida, la devolvemos para la validación de Zod.
            return isNaN(date.getTime()) ? null : date; 
        }
        return null; // Para otros tipos o inválidos
    }, z.date({ invalid_type_error: "Fecha de plazo inválida." }).nullable().optional()),

    prioridad: z.nativeEnum(PrioridadTarea, {
        errorMap: () => ({ message: "Seleccione una prioridad válida." })
    }).nullable().optional(), // Permite que sea null o no se envíe

    estado: z.nativeEnum(EstadoTarea, { // El estado podría tener un valor por defecto al crear
        errorMap: () => ({ message: "Seleccione un estado válido." })
    }).optional().default(EstadoTarea.PENDIENTE), // Por defecto 'PENDIENTE' al crear
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
