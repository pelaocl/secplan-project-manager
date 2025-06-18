import { Prisma, EstadoTarea } from '@prisma/client';
import prisma from '../config/prismaClient';
import { DashboardFilters } from '../schemas/statsSchemas';

// --- Helper para construir la cláusula 'where' base ---
const buildBaseProjectWhereClause = (filters: DashboardFilters): Prisma.ProjectWhereInput => {
    const where: Prisma.ProjectWhereInput = {};

    if (filters.ano) {
        where.ano = filters.ano;
    }
    if (filters.tipologiaId) {
        where.tipologiaId = filters.tipologiaId;
    }
    if (filters.estadoId) {
        where.estadoId = filters.estadoId;
    }
    if (filters.unidadId) {
        where.unidadId = filters.unidadId;
    }
    
    return where;
};


async function getMontoPorTipologia(filters: DashboardFilters) {
    const whereClause = buildBaseProjectWhereClause(filters);
    
    const montoAgrupado = await prisma.project.groupBy({
        by: ['tipologiaId'],
        _sum: {
            monto: true,
        },
        where: whereClause,
    });

    if (montoAgrupado.length === 0) return [];
    const tipologiaIds = montoAgrupado.map(item => item.tipologiaId);

    const tipologias = await prisma.tipologiaProyecto.findMany({
        where: { id: { in: tipologiaIds } },
        select: { id: true, nombre: true },
    });

    const tipologiaMap = new Map(tipologias.map(t => [t.id, t.nombre]));

    const resultadoFormateado = montoAgrupado.map(item => ({
        name: tipologiaMap.get(item.tipologiaId) || 'Sin Tipología',
        value: item._sum.monto?.toNumber() || 0,
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}


async function getInversionPorPrograma(filters: DashboardFilters) {
    const whereClause = buildBaseProjectWhereClause(filters);
    whereClause.programaId = { not: null };
    whereClause.monto = { not: null };

    const inversionAgrupada = await prisma.project.groupBy({
        by: ['programaId'],
        _sum: {
            monto: true,
        },
        where: whereClause,
    });

    if (inversionAgrupada.length === 0) return [];
    const programaIds = inversionAgrupada.map(item => item.programaId!);

    const programas = await prisma.programa.findMany({
        where: { id: { in: programaIds } },
        include: { lineaFinanciamiento: { select: { nombre: true } } },
    });

    const programaMap = new Map(programas.map(p => [p.id, p]));

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


async function getTareasActivasPorUsuario(filters: DashboardFilters) {
    const whereClause: Prisma.TareaWhereInput = {
        asignadoId: { not: null },
        estado: { notIn: [EstadoTarea.COMPLETADA, EstadoTarea.CANCELADA] },
        // --- CORRECCIÓN AQUÍ ---
        // Se cambió 'project' por 'proyecto' para que coincida con el schema de Prisma
        proyecto: buildBaseProjectWhereClause(filters)
    };
    
    const tareasAgrupadas = await prisma.tarea.groupBy({
        by: ['asignadoId'],
        _count: { id: true },
        where: whereClause,
    });

    if (tareasAgrupadas.length === 0) return [];
    const userIds = tareasAgrupadas.map(item => item.asignadoId!);

    const usuarios = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
    });

    const userMap = new Map(usuarios.map(u => [u.id, u.name || u.email]));

    const resultadoFormateado = tareasAgrupadas.map(item => ({
        name: userMap.get(item.asignadoId!) || 'Usuario Desconocido',
        value: item._count.id,
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}


async function getProyectosPorUnidad(filters: DashboardFilters) {
    const whereClause = buildBaseProjectWhereClause(filters);
    whereClause.unidadId = { not: null };

    const proyectosAgrupados = await prisma.project.groupBy({
        by: ['unidadId'],
        _count: { id: true },
        where: whereClause,
    });
    
    if (proyectosAgrupados.length === 0) return [];
    const unidadIds = proyectosAgrupados.map(item => item.unidadId!);

    const unidades = await prisma.unidadMunicipal.findMany({
        where: { id: { in: unidadIds } },
        select: { id: true, nombre: true },
    });

    const unidadMap = new Map(unidades.map(u => [u.id, u.nombre]));

    const resultadoFormateado = proyectosAgrupados.map(item => ({
        name: unidadMap.get(item.unidadId!) || 'Sin Unidad Asignada',
        value: item._count.id,
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}


async function getProyectosPorSector(filters: DashboardFilters) {
    const whereClause = buildBaseProjectWhereClause(filters);
    whereClause.sectorId = { not: null };

    const proyectosAgrupados = await prisma.project.groupBy({
        by: ['sectorId'],
        _count: { id: true },
        where: whereClause,
    });

    if (proyectosAgrupados.length === 0) return [];
    const sectorIds = proyectosAgrupados.map(item => item.sectorId!);

    const sectores = await prisma.sector.findMany({
        where: { id: { in: sectorIds } },
        select: { id: true, nombre: true },
    });

    const sectorMap = new Map(sectores.map(s => [s.id, s.nombre]));

    const resultadoFormateado = proyectosAgrupados.map(item => ({
        name: sectorMap.get(item.sectorId!) || 'Sin Sector Asignado',
        value: item._count.id,
    })).sort((a, b) => b.value - a.value);

    return resultadoFormateado;
}


async function getSuperficiePorTipologia(filters: DashboardFilters) {
    const whereClause = buildBaseProjectWhereClause(filters);
    whereClause.OR = [
        { superficieTerreno: { gt: 0 } },
        { superficieEdificacion: { gt: 0 } },
    ];
    
    const superficieAgrupada = await prisma.project.groupBy({
        by: ['tipologiaId'],
        _sum: {
            superficieTerreno: true,
            superficieEdificacion: true,
        },
        where: whereClause,
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


export async function getDashboardData(filters: DashboardFilters) {
    const [
        montoPorTipologia,
        inversionPorPrograma,
        tareasActivasPorUsuario,
        proyectosPorUnidad,
        proyectosPorSector,
        superficiePorTipologia,
    ] = await Promise.all([
        getMontoPorTipologia(filters),
        getInversionPorPrograma(filters),
        getTareasActivasPorUsuario(filters),
        getProyectosPorUnidad(filters),
        getProyectosPorSector(filters),
        getSuperficiePorTipologia(filters),
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
