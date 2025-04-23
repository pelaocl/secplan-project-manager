import { z } from 'zod';

// Schema para el login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password debe tener al menos 6 caracteres"),
});

// Schema para el registro (ejemplo)
export const registerSchema = z.object({
    name: z.string().min(2, "Nombre es requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Password debe tener al menos 6 caracteres"),
    // confirmaPassword: z.string().min(6), // Si quieres confirmación
    // role: z.nativeEnum(Role).optional().default(Role.USUARIO), // Si permites elegir rol (cuidado!)
// }).refine(data => data.password === data.confirmaPassword, { // Ejemplo de validación cruzada
//     message: "Las contraseñas no coinciden",
//     path: ["confirmaPassword"],
});

// Infiere los tipos de TypeScript desde los schemas Zod
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>; // Descomenta si usas registerSchema