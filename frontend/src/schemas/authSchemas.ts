import { z } from 'zod';

// Schema para la validación del formulario de Login en el Frontend
export const frontendLoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo electrónico es requerido." }) // No vacío
    .email({ message: "Debe ser un correo electrónico válido." }),
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida." }) // No vacío
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }), // Opcional: si quieres validar largo mínimo en frontend
});

// Infiere el tipo de TypeScript desde el schema Zod para usar en el formulario
export type FrontendLoginInput = z.infer<typeof frontendLoginSchema>;

// Podrías añadir aquí también el schema de registro si lo necesitas después
// export const frontendRegisterSchema = z.object({ ... });
// export type FrontendRegisterInput = z.infer<typeof frontendRegisterSchema>;