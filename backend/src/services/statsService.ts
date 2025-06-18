import { Prisma, EstadoTarea } from '@prisma/client';
import prisma from '../config/prismaClient';

/**
 * Calcula la suma total de montos de proyectos, agrupados por tipología.
 * Devuelve un array con el nombre de la tipología y el monto total.
 */
async function getMontoPorTipologia() {
    // 1. Agrupar proyectos por tipologiaId y sumar sus montos.
    const montoAgrupado = await prisma.project.groupBy({
        by: ['tipologiaId'],
        _sum: {
            monto: true,
        },
        where: {
            // Opcional: podrías filtrar por proyectos que no estén en ciertos estados, ej. Cancelado
            // estado: {
            //   nombre: { not: 'Cancelado' }
            // }
        }
    });

    // 2. Obtener los IDs de las tipologías de los resultados.
    const tipologiaIds = montoAgrupado.map(item => item.tipologiaId);

    // 3. Buscar los nombres de esas tipologías.
    const tipologias = await prisma.tipologiaProyecto.findMany({
        where: {
            id: { in: tipologiaIds },
        },
        select: {
            id: true,
            nombre: true,
        },
    });

    // 4. Crear un mapa para buscar nombres por ID eficientemente.
    const tipologiaMap = new Map(tipologias.map(t => [t.id, t.nombre]));

    // 5. Formatear el resultado final para el frontend.
    const resultadoFormateado = montoAgrupado.map(item => ({
        name: tipologiaMap.get(item.tipologiaId) || 'Sin Tipología', // Nombre de la tipología
        value: item._sum.monto?.toNumber() || 0, // Suma del monto convertida a número
    })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor monto

    return resultadoFormateado;
}

/**
 * Calcula la suma de montos de proyectos, agrupados por programa,
 * e incluye el nombre de la línea de financiamiento a la que pertenece cada programa.
 */
async function getInversionPorPrograma() {
    // 1. Agrupar proyectos por programaId y sumar sus montos.
    const inversionAgrupada = await prisma.project.groupBy({
        by: ['programaId'],
        _sum: {
            monto: true,
        },
        where: {
            programaId: {
                not: null,
            },
            monto: {
                not: null,
            }
        },
    });

    if (inversionAgrupada.length === 0) return [];

    const programaIds = inversionAgrupada.map(item => item.programaId!);

    // 2. Buscar los detalles de esos programas, incluyendo la línea de financiamiento relacionada.
    const programas = await prisma.programa.findMany({
        where: {
            id: { in: programaIds },
        },
        include: {
            lineaFinanciamiento: { // Incluimos la relación para obtener su nombre
                select: {
                    nombre: true,
                },
            },
        },
    });

    // 3. Crear un mapa para buscar detalles por ID eficientemente.
    const programaMap = new Map(programas.map(p => [p.id, p]));

    // 4. Formatear el resultado final para el frontend.
    const resultadoFormateado = inversionAgrupada.map(item => {
        const programaInfo = programaMap.get(item.programaId!);
        const programaNombre = programaInfo?.nombre || 'Programa Desconocido';
        const lineaNombre = programaInfo?.lineaFinanciamiento?.nombre || 'N/A';

        return {
            name: `${programaNombre} (${lineaNombre})`,
            value: item._sum.monto?.toNumber() || 0,
        }
    }).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}

/**
 * Calcula la cantidad de tareas activas agrupadas por usuario asignado.
 */
async function getTareasActivasPorUsuario() {
    const tareasAgrupadas = await prisma.tarea.groupBy({
        by: ['asignadoId'],
        _count: {
            id: true,
        },
        where: {
            asignadoId: {
                not: null, // Solo tareas que tienen a alguien asignado
            },
            // Contamos solo tareas activas
            estado: {
                notIn: [EstadoTarea.COMPLETADA, EstadoTarea.CANCELADA],
            },
        },
    });

    if (tareasAgrupadas.length === 0) return [];

    const userIds = tareasAgrupadas.map(item => item.asignadoId!);

    const usuarios = await prisma.user.findMany({
        where: {
            id: { in: userIds },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    const userMap = new Map(usuarios.map(u => [u.id, u.name || u.email]));

    const resultadoFormateado = tareasAgrupadas.map(item => ({
        name: userMap.get(item.asignadoId!) || 'Usuario Desconocido',
        value: item._count.id,
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}

/**
 * Calcula la cantidad de proyectos agrupados por unidad municipal.
 */
async function getProyectosPorUnidad() {
    const proyectosAgrupados = await prisma.project.groupBy({
        by: ['unidadId'],
        _count: {
            id: true,
        },
        where: {
            unidadId: {
                not: null,
            },
        },
    });

    if (proyectosAgrupados.length === 0) return [];

    const unidadIds = proyectosAgrupados.map(item => item.unidadId!);

    const unidades = await prisma.unidadMunicipal.findMany({
        where: {
            id: { in: unidadIds },
        },
        select: {
            id: true,
            nombre: true,
        },
    });

    const unidadMap = new Map(unidades.map(u => [u.id, u.nombre]));

    const resultadoFormateado = proyectosAgrupados.map(item => ({
        name: unidadMap.get(item.unidadId!) || 'Sin Unidad Asignada',
        value: item._count.id,
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}

/**
 * Calcula la cantidad de proyectos agrupados por sector.
 */
async function getProyectosPorSector() {
    const proyectosAgrupados = await prisma.project.groupBy({
        by: ['sectorId'],
        _count: {
            id: true, // Contamos proyectos por su ID
        },
        where: {
            sectorId: {
                not: null, // Ignoramos proyectos sin sector asignado
            },
        },
    });

    if (proyectosAgrupados.length === 0) return [];

    const sectorIds = proyectosAgrupados.map(item => item.sectorId!);

    const sectores = await prisma.sector.findMany({
        where: {
            id: { in: sectorIds },
        },
        select: {
            id: true,
            nombre: true,
        },
    });

    const sectorMap = new Map(sectores.map(s => [s.id, s.nombre]));

    const resultadoFormateado = proyectosAgrupados.map(item => ({
        name: sectorMap.get(item.sectorId!) || 'Sin Sector Asignado',
        value: item._count.id, // El valor es la cantidad de proyectos
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}

/**
 * Calcula la suma de superficies (terreno y edificación) por tipología de proyecto.
 */
async function getSuperficiePorTipologia() {
    const superficieAgrupada = await prisma.project.groupBy({
        by: ['tipologiaId'],
        _sum: {
            superficieTerreno: true,
            superficieEdificacion: true,
        },
        where: {
            // Consideramos solo proyectos que tengan al menos una de las dos superficies
            OR: [
                { superficieTerreno: { gt: 0 } },
                { superficieEdificacion: { gt: 0 } },
            ]
        }
    });

    if (superficieAgrupada.length === 0) return [];

    const tipologiaIds = superficieAgrupada.map(item => item.tipologiaId);

    const tipologias = await prisma.tipologiaProyecto.findMany({
        where: { id: { in: tipologiaIds } },
        select: { id: true, nombre: true },
    });

    const tipologiaMap = new Map(tipologias.map(t => [t.id, t.nombre]));

    const resultadoFormateado = superficieAgrupada.map(item => ({
        name: tipologiaMap.get(item.tipologiaId) || 'Sin Tipología',
        terreno: item._sum.superficieTerreno || 0,
        edificacion: item._sum.superficieEdificacion || 0,
    }));

    return resultadoFormateado;
}

/**
 * Función principal que recopila todas las estadísticas para el dashboard.
 * En el futuro, llamará a otras funciones de estadísticas aquí.
 */
export async function getDashboardData() {
    const [
        montoPorTipologia,
        inversionPorPrograma,
        tareasActivasPorUsuario,
        proyectosPorUnidad,
        proyectosPorSector,
        superficiePorTipologia,
    ] = await Promise.all([
        getMontoPorTipologia(),
        getInversionPorPrograma(),
        getTareasActivasPorUsuario(),
        getProyectosPorUnidad(),
        getProyectosPorSector(),
        getSuperficiePorTipologia(),
    ]);

    return {
        financiero: {
            montoPorTipologia,
            inversionPorPrograma,
        },
        personas: {
            tareasActivasPorUsuario,
            proyectosPorUnidad,
        },
        geografico: {
            proyectosPorSector,
            superficiePorTipologia,
        },
    };
}