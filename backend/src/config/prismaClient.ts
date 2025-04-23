import { PrismaClient } from '@prisma/client';

// Inicializa Prisma Client
const prisma = new PrismaClient({
    // Opcional: Configura logging si lo deseas
    // log: ['query', 'info', 'warn', 'error'],
});

// Exporta la instancia para usarla en otros módulos
export default prisma;