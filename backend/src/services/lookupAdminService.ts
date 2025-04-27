// backend/src/services/lookupAdminService.ts

import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../config/prismaClient';
import { validLookupTypes } from '../schemas/lookupAdminSchemas'; // Importa los tipos válidos
import { NotFoundError, BadRequestError, AppError } from '../utils/errors';

// Tipado para asegurar que lookupType es uno de los valores válidos
type LookupType = typeof validLookupTypes.enum[keyof typeof validLookupTypes.enum];

// Mapeo de los tipos de lookup de la URL a los nombres de modelo de Prisma
// y a los campos únicos que necesitan chequeo case-insensitive
const modelMapping: { [key in LookupType]: { model: keyof PrismaClient, uniqueFields: string[], relationToCheck?: keyof ProjectRelationCount } } = {
    estados:      { model: 'estadoProyecto',      uniqueFields: ['nombre'], relationToCheck: 'estado' },
    unidades:     { model: 'unidadMunicipal',     uniqueFields: ['nombre', 'abreviacion'], relationToCheck: 'unidad' },
    tipologias:   { model: 'tipologiaProyecto',   uniqueFields: ['nombre', 'abreviacion'], relationToCheck: 'tipologia' },
    sectores:     { model: 'sector',              uniqueFields: ['nombre'], relationToCheck: 'sector' },
    lineas:       { model: 'lineaFinanciamiento', uniqueFields: ['nombre'], relationToCheck: 'lineaFinanciamiento' }, // También programas
    programas:    { model: 'programa',            uniqueFields: ['nombre'], relationToCheck: 'programa' }, // Chequeo unique compuesto es handled por DB
    etapas:       { model: 'etapaFinanciamiento', uniqueFields: ['nombre'], relationToCheck: 'etapaActualFinanciamiento' },
};

// Helper para obtener el delegado de Prisma correcto de forma segura
// Usamos 'any' aquí porque el tipo exacto del delegado varía, pero las operaciones (findMany, create, etc.) son similares.
// Se podría mejorar con tipos más avanzados si fuera necesario.
const getDelegate = (lookupType: LookupType): any => {
    const mapping = modelMapping[lookupType];
    if (!mapping) {
        throw new BadRequestError(`Tipo de lookup inválido: ${lookupType}`);
    }
    return prisma[mapping.model];
};

// Tipo auxiliar para la verificación de relaciones en delete
type ProjectRelationCount = {
  estado?: number;
  unidad?: number;
  tipologia?: number;
  sector?: number;
  lineaFinanciamiento?: number;
  programa?: number;
  etapaActualFinanciamiento?: number;
};

// --- Funciones CRUD Genéricas ---

export const findAll = async (lookupType: LookupType) => {
    const delegate = getDelegate(lookupType);
    try {
        return await delegate.findMany({ orderBy: { nombre: 'asc' } });
    } catch (error) {
        console.error(`[LookupAdminService] Error buscando todos en ${lookupType}:`, error);
        throw new AppError(`Error al obtener la lista de ${lookupType}.`, 500);
    }
};

export const findById = async (lookupType: LookupType, id: number) => {
    const delegate = getDelegate(lookupType);
    try {
        const record = await delegate.findUnique({ where: { id } });
        if (!record) {
            throw new NotFoundError(`Registro de ${lookupType} con ID ${id} no encontrado.`);
        }
        return record;
    } catch (error) {
        if (error instanceof NotFoundError) throw error;
        console.error(`[LookupAdminService] Error buscando ID ${id} en ${lookupType}:`, error);
        throw new AppError(`Error al buscar en ${lookupType} con ID ${id}.`, 500);
    }
};

export const create = async (lookupType: LookupType, data: Record<string, any>) => {
    const delegate = getDelegate(lookupType);
    const mapping = modelMapping[lookupType];

    // 1. Chequeo de unicidad case-insensitive para campos definidos en mapping
    for (const field of mapping.uniqueFields) {
        if (data[field]) {
            const whereClause: any = {};
            whereClause[field] = { equals: data[field], mode: 'insensitive' };
            const existing = await delegate.findFirst({ where: whereClause });
            if (existing) {
                throw new BadRequestError(`Ya existe un registro en '${lookupType}' con ${field} '${data[field]}' (ignorando mayús/minús).`);
            }
        }
    }

    // 2. Preparar datos (asegurar mayúsculas para color si aplica)
     const createData = { ...data };
     if (lookupType === 'tipologias' && createData.colorChip) {
         createData.colorChip = String(createData.colorChip).toUpperCase();
     }
     // Asegurarse que FKs sean números si vienen como string
     if (lookupType === 'programas' && createData.lineaFinanciamientoId) {
        createData.lineaFinanciamientoId = Number(createData.lineaFinanciamientoId);
     }


    // 3. Intentar crear
    try {
        const newRecord = await delegate.create({ data: createData });
        return newRecord;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Error de unicidad de la DB (ej. unique compuesto en Programa)
            const target = (error.meta?.target as string[])?.join(', ');
            throw new BadRequestError(`Error de unicidad al crear en ${lookupType}: ${target} ya existe.`);
        }
        console.error(`[LookupAdminService] Error creando en ${lookupType}:`, error);
        throw new AppError(`Error al crear registro en ${lookupType}.`, 500);
    }
};

export const update = async (lookupType: LookupType, id: number, data: Record<string, any>) => {
    const delegate = getDelegate(lookupType);
    const mapping = modelMapping[lookupType];

    // 1. Verificar que el registro existe
    const existingRecord = await delegate.findUnique({ where: { id } });
    if (!existingRecord) {
        throw new NotFoundError(`Registro de ${lookupType} con ID ${id} no encontrado para actualizar.`);
    }

    // 2. Chequeo de unicidad case-insensitive si se cambia un campo unique
    for (const field of mapping.uniqueFields) {
        // Si el campo viene en data Y es diferente al existente (ignorando case)
        if (data[field] && String(data[field]).toLowerCase() !== String(existingRecord[field]).toLowerCase()) {
            const whereClause: any = { NOT: { id } }; // Excluir el registro actual
            whereClause[field] = { equals: data[field], mode: 'insensitive' };
            const conflict = await delegate.findFirst({ where: whereClause });
            if (conflict) {
                throw new BadRequestError(`Ya existe otro registro en '${lookupType}' con ${field} '${data[field]}' (ignorando mayús/minús).`);
            }
        }
    }

     // 3. Preparar datos (asegurar mayúsculas para color si aplica)
     const updateData = { ...data };
     if (lookupType === 'tipologias' && updateData.colorChip) {
         updateData.colorChip = String(updateData.colorChip).toUpperCase();
     }
     // Asegurarse que FKs sean números si vienen como string y se actualizan
     if (lookupType === 'programas' && updateData.lineaFinanciamientoId) {
         updateData.lineaFinanciamientoId = Number(updateData.lineaFinanciamientoId);
     }

    // 4. Intentar actualizar
    try {
        const updatedRecord = await delegate.update({ where: { id }, data: updateData });
        return updatedRecord;
    } catch (error) {
        // Manejar error P2002 por si acaso (aunque debería ser capturado antes)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            throw new BadRequestError(`Error de unicidad al actualizar ${lookupType}: ${target} ya existe.`);
        }
        console.error(`[LookupAdminService] Error actualizando ID ${id} en ${lookupType}:`, error);
        throw new AppError(`Error al actualizar registro en ${lookupType} con ID ${id}.`, 500);
    }
};

export const deleteRecord = async (lookupType: LookupType, id: number) => {
    const delegate = getDelegate(lookupType);
    const mapping = modelMapping[lookupType];

     // 1. Verificar que existe
     const record = await delegate.findUnique({ where: { id } });
     if (!record) {
         throw new NotFoundError(`Registro de ${lookupType} con ID ${id} no encontrado para eliminar.`);
     }

    // 2. Verificar dependencias (si aplica)
    if (mapping.relationToCheck) {
        // Necesitamos verificar la relación inversa en el modelo Project (o Programa para Linea)
        if (lookupType === 'lineas') {
            // Caso especial: LineaFinanciamiento se relaciona con Proyectos Y Programas
             const projectCount = await prisma.project.count({ where: { lineaFinanciamientoId: id } });
             const programaCount = await prisma.programa.count({ where: { lineaFinanciamientoId: id } });
             if (projectCount > 0 || programaCount > 0) {
                 throw new BadRequestError(`No se puede eliminar la línea '${record.nombre}' porque está asignada a ${projectCount} proyecto(s) y ${programaCount} programa(s).`);
             }
        } else {
            // Caso general: Chequear relación con Proyectos
             const whereClause: any = {};
             whereClause[mapping.relationToCheck + 'Id'] = id; // Ej: estadoId: id
             const projectCount = await prisma.project.count({ where: whereClause });

             if (projectCount > 0) {
                 throw new BadRequestError(`No se puede eliminar '${record.nombre}' de ${lookupType} porque está asignado a ${projectCount} proyecto(s).`);
             }
        }
    }


    // 3. Intentar eliminar
    try {
        await delegate.delete({ where: { id } });
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new NotFoundError(`Registro de ${lookupType} con ID ${id} no encontrado para eliminar (probablemente ya fue eliminado).`);
         }
        console.error(`[LookupAdminService] Error eliminando ID ${id} en ${lookupType}:`, error);
        throw new AppError(`Error al eliminar registro en ${lookupType} con ID ${id}.`, 500);
    }
};