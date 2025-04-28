// frontend/src/schemas/adminUserFormSchema.ts
import { z } from 'zod';
import { UserRole } from '../types';

const userRoles: [UserRole, ...UserRole[]] = ['ADMIN', 'COORDINADOR', 'USUARIO'];

// Schema CREAR (sin cambios)
export const createUserFormSchema = z.object({
    email: z.string({ required_error: "Email es requerido." }).email("Email inválido.").trim().toLowerCase(),
    password: z.string({ required_error: "Contraseña es requerida." }).min(8, "Contraseña muy corta (mín. 8 caracteres)."),
    passwordConfirmation: z.string({ required_error: "Confirmación es requerida." }),
    name: z.string().trim().max(100).optional(),
    role: z.enum(userRoles, { required_error: "Rol es requerido." }),
    isActive: z.boolean().optional().default(true),
    etiquetaIds: z.array(z.number().int().positive()).optional().default([]),
})
.refine(data => data.password === data.passwordConfirmation, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirmation"],
});


// Schema ACTUALIZAR (con z.preprocess para contraseñas opcionales)
export const updateUserFormSchema = z.object({
    email: z.string().email("Email inválido.").trim().toLowerCase().optional(),
    // --- Contraseña con Preprocess ---
    password: z.preprocess(
                (val) => (val === "" ? undefined : val), // Convierte "" a undefined ANTES de validar
                z.string({ invalid_type_error: "Contraseña debe ser texto" })
                 .min(8, "Nueva contraseña muy corta (mín. 8).")
                 .optional() // Permite que el valor sea undefined
               ),
    // --- Confirmación con Preprocess ---
    passwordConfirmation: z.preprocess(
                (val) => (val === "" ? undefined : val), // Convierte "" a undefined ANTES de validar
                z.string({ invalid_type_error: "Confirmación debe ser texto" })
                 .optional() // Permite que el valor sea undefined
               ),
    // --------------------------------
    name: z.string().trim().min(1, "Nombre no puede ser vacío si se provee").max(100).nullish(),
    role: z.enum(userRoles).optional(),
    isActive: z.boolean().optional(),
    etiquetaIds: z.array(z.number().int().positive()).optional(),
})
// Refine combinado (sin cambios, debería funcionar bien con undefined)
.refine(data => {
    if (!data.password) { return true; } // Si password es undefined (porque era ""), pasa
    return data.passwordConfirmation && data.password === data.passwordConfirmation; // Si hay password, compara
}, {
    message: "La confirmación es requerida y debe coincidir con la nueva contraseña.",
    path: ["passwordConfirmation"],
});


// Tipos inferidos
export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>;