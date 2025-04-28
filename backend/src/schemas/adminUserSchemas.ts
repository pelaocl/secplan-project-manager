// backend/src/schemas/adminUserSchemas.ts

import { z } from 'zod';
import { Role } from '@prisma/client'; // Importa el Enum Role de Prisma

// Schema para validar el ID numérico en parámetros de URL (ej: /users/123)
export const userIdSchema = z.object({
    id: z.preprocess(
        (val) => parseInt(String(val), 10),
        z.number({ invalid_type_error: "El ID de usuario debe ser un número." })
           .int("El ID debe ser un entero.")
           .positive("El ID debe ser positivo.")
    ),
});

// Schema para validar el cuerpo (body) al CREAR un usuario desde el panel admin
export const createUserSchema = z.object({
    email: z.string({ required_error: "El email es requerido." })
            .email("El formato del email no es válido.")
            .trim().toLowerCase() // Guarda emails en minúsculas y sin espacios extra
            .max(255, "Email demasiado largo."),

    password: z.string({ required_error: "La contraseña es requerida." })
               .min(8, "La contraseña debe tener al menos 8 caracteres."),
               // Podrías añadir validaciones más complejas aquí si quieres:
               // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, "Contraseña debe incluir mayúscula, minúscula y número"),

    name: z.string()
           .trim()
           .min(1, "El nombre no puede estar vacío si se proporciona.")
           .max(100, "Nombre demasiado largo.")
           .optional(), // El nombre es opcional al crear

    role: z.nativeEnum(Role, { // Valida contra los roles definidos en Prisma
        required_error: "El rol es requerido.",
        invalid_type_error: `Rol inválido. Debe ser ${Object.values(Role).join(', ')}.`
    }),

    isActive: z.boolean({ invalid_type_error: "Estado activo debe ser verdadero o falso."})
               .optional(), // Si no se envía, el servicio o DB pondrán el default (true)

    // Se espera un array de IDs numéricos para las etiquetas
    etiquetaIds: z.array(
                        z.number({ invalid_type_error: "Cada ID de etiqueta debe ser un número." })
                         .int()
                         .positive("ID de etiqueta inválido.")
                    )
                    .optional(), // Es opcional asignar etiquetas al crear
});
// Nota: No incluimos confirmación de contraseña aquí por simplicidad, pero se podría añadir con .refine()


// Schema para validar el cuerpo (body) al ACTUALIZAR un usuario desde el panel admin
export const updateUserSchema = z.object({
    // Todos los campos son opcionales
    email: z.string({ invalid_type_error: "Email debe ser texto." })
            .email("El formato del email no es válido.")
            .trim().toLowerCase()
            .max(255, "Email demasiado largo.")
            .optional(),

    password: z.string()
               .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
               // .regex(...) // Podrías añadir validación compleja aquí también
               .optional()
               // Si se envía password: null o password: "" el servicio NO debería actualizarla
               // Si se envía password: "nuevacontraseña", el servicio DEBERÍA hashearla y actualizarla
               // No necesitamos .nullable() aquí si el servicio maneja la omisión del campo o string vacío
               .refine(val => val === undefined || val === "" || val.length >= 8, {
                   message: "La contraseña debe estar vacía o tener al menos 8 caracteres.",
               }), // Asegura que si se envía, cumpla el mínimo

    name: z.string()
           .trim()
           .min(1, "El nombre no puede estar vacío si se proporciona.")
           .max(100, "Nombre demasiado largo.")
           .nullish(), // .nullish() permite enviar 'null' para borrar el nombre, o 'undefined'/omitir para no cambiarlo

    role: z.nativeEnum(Role, {
        invalid_type_error: `Rol inválido. Debe ser ${Object.values(Role).join(', ')}.`
    }).optional(),

    isActive: z.boolean({ invalid_type_error: "Estado activo debe ser verdadero o falso."})
               .optional(),

    // Permite enviar un array (incluso vacío []) para actualizar las etiquetas,
    // u omitir el campo para no modificarlas.
    etiquetaIds: z.array(
                        z.number({ invalid_type_error: "Cada ID de etiqueta debe ser un número." })
                         .int()
                         .positive("ID de etiqueta inválido.")
                    )
                    .optional(),
});


// Inferir tipos para usar en TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;