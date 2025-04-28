// frontend/src/schemas/adminUserFormSchema.ts
import { z } from 'zod';
// import { Role } from '@prisma/client'; // <-- ELIMINAR ESTA LÍNEA
import { UserRole } from '../types'; // <-- Importa tu tipo frontend

// Define los roles válidos explícitamente para Zod (basado en tu tipo UserRole)
const userRoles: [UserRole, ...UserRole[]] = ['ADMIN', 'COORDINADOR', 'USUARIO']; // Asegúrate que estos coincidan con tu enum de Prisma

export const createUserFormSchema = z.object({
    email: z.string({ required_error: "Email es requerido." }).email("Email inválido.").trim().toLowerCase(),
    password: z.string({ required_error: "Contraseña es requerida." }).min(8, "Contraseña muy corta (mín. 8 caracteres)."),
    passwordConfirmation: z.string({ required_error: "Confirmación es requerida." }),
    name: z.string().trim().max(100).optional(),
    // Usa z.enum con los valores definidos arriba
    role: z.enum(userRoles, {
        required_error: "Rol es requerido.",
        invalid_type_error: `Rol inválido. Debe ser ${userRoles.join(', ')}.`
    }),
    isActive: z.boolean().optional().default(true),
    etiquetaIds: z.array(z.number().int().positive()).optional().default([]),
})
.refine(data => data.password === data.passwordConfirmation, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirmation"],
});

// Schema de Update (también usa z.enum)
export const updateUserFormSchema = z.object({
   email: z.string().email().trim().toLowerCase().optional(),
   password: z.string().min(8).optional().nullable().transform(val => val === null ? undefined : val),
   name: z.string().trim().min(1).max(100).nullish(),
   role: z.enum(userRoles, { // <-- Usa z.enum aquí también
       invalid_type_error: `Rol inválido. Debe ser ${userRoles.join(', ')}.`
   }).optional(),
   isActive: z.boolean().optional(),
   etiquetaIds: z.array(z.number().int().positive()).optional(),
});


// Tipos inferidos (sin cambios)
export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>; // <-- Asegúrate de definir este si no lo tenías