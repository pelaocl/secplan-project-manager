import prisma from '../config/prismaClient';

// Servicio para obtener opciones de formularios (Lookups)
export const getFormOptions = async () => {
    // Ejecuta todas las consultas en paralelo para eficiencia
    const [estados, unidades, tipologias, sectores, lineas, programas, etapas, usuarios] = await prisma.$transaction([
        prisma.estadoProyecto.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.unidadMunicipal.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.tipologiaProyecto.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.sector.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.lineaFinanciamiento.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.programa.findMany({
            include: { lineaFinanciamiento: { select: { id: true } } }, // Incluye solo el ID para filtrar en frontend
            orderBy: { nombre: 'asc' }
        }),
        prisma.etapaFinanciamiento.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true }, // Selecciona solo lo necesario para el Select
            orderBy: { name: 'asc' }
        })
    ]);

    return {
        estados,
        unidades,
        tipologias,
        sectores,
        lineas,
        programas, // Frontend filtra estos por lineaFinanciamientoId
        etapas,
        usuarios // Para selects de Proyectista, Formulador, Colaboradores
    };
};

// Añade otras funciones de servicio para lookups si son necesarias