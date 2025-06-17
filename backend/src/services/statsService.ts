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
 * Calcula la cantidad de proyectos agrupados por línea de financiamiento.
 */
async function getProyectosPorLineaFinanciamiento() {
    const proyectosAgrupados = await prisma.project.groupBy({
        by: ['lineaFinanciamientoId'],
        _count: {
            id: true, // Contamos proyectos por su ID
        },
        where: {
            lineaFinanciamientoId: {
                not: null, // Ignoramos proyectos sin línea de financiamiento asignada
            },
        },
    });

    if (proyectosAgrupados.length === 0) return [];

    const lineaIds = proyectosAgrupados.map(item => item.lineaFinanciamientoId!); // Usamos '!' porque filtramos los nulos

    const lineas = await prisma.lineaFinanciamiento.findMany({
        where: {
            id: { in: lineaIds },
        },
        select: {
            id: true,
            nombre: true,
        },
    });

    const lineaMap = new Map(lineas.map(l => [l.id, l.nombre]));

    const resultadoFormateado = proyectosAgrupados.map(item => ({
        name: lineaMap.get(item.lineaFinanciamientoId!) || 'Sin Línea de Financiamiento',
        value: item._count.id, // El valor es la cantidad de proyectos
    })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor cantidad

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
 * Función principal que recopila todas las estadísticas para el dashboard.
 * En el futuro, llamará a otras funciones de estadísticas aquí.
 */
export async function getDashboardData() {
    // Llamar a todas las funciones de agregación de datos en paralelo
    const [
        montoPorTipologia,
        proyectosPorLineaFinanciamiento,
        tareasActivasPorUsuario,
        proyectosPorUnidad, // Añadida la nueva llamada
    ] = await Promise.all([
        getMontoPorTipologia(),
        getProyectosPorLineaFinanciamiento(),
        getTareasActivasPorUsuario(),
        getProyectosPorUnidad(), // Llamamos a la nueva función
    ]);

    // Devolver un objeto estructurado para el dashboard
    return {
        financiero: {
            montoPorTipologia,
            proyectosPorLineaFinanciamiento,
        },
        personas: {
            tareasActivasPorUsuario,
            proyectosPorUnidad, // Añadido el nuevo dato
        },
        geografico: {
            // aquí irán los datos geográficos
        },
    };
}