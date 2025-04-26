// ========================================================================
// INICIO: Contenido completo para backend/src/services/projectService.ts
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================

import { Prisma, Role, TipoMoneda } from '@prisma/client';
import prisma from '../config/prismaClient';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from '../schemas/projectSchemas';
import { ForbiddenError, NotFoundError, BadRequestError, AppError } from '../utils/errors';

// Interfaz para el usuario autenticado (puedes ajustarla si tiene más campos)
interface AuthenticatedUser {
    id: number;
    role: Role;
    email?: string; // Opcional
    name?: string;  // Opcional
}

// --- Funciones Auxiliares (Helpers) ---
// Definidas aquí para ser reutilizables por createProject y updateProject

const parseIntOptional = (value: unknown): number | null => {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num > 0 ? num : null;
};

const parseIntAno = (value: unknown): number | null => {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 1900 && num <= new Date().getFullYear() + 10 ? num : null;
};

const parseDecimalOptional = (value: unknown): Prisma.Decimal | null => {
    if (value == null || value === '') return null;
    const num = Number(typeof value === 'string' ? value.replace(',', '.') : value);
    return !isNaN(num) && num >= 0 ? new Prisma.Decimal(num) : null;
};

const parseDateOptional = (value: unknown): Date | null => {
    if (value == null || value === '') return null;
    const date = (value instanceof Date) ? value : new Date(String(value) + 'T00:00:00Z');
    return !isNaN(date.getTime()) ? date : null;
};

// --- Helper para Seleccionar Campos ---
// Define qué campos devolver según si el usuario está autenticado
const getProjectSelectFields = (user?: AuthenticatedUser): Prisma.ProjectSelect => {
    const publicFields: Prisma.ProjectSelect = {
        id: true, codigoUnico: true, nombre: true, direccion: true, superficieTerreno: true,
        superficieEdificacion: true, ano: true, proyectoPriorizado: true, createdAt: true, updatedAt: true,
        estado: { select: { id: true, nombre: true } },
        unidad: { select: { id: true, nombre: true, abreviacion: true } },
        tipologia: { select: { id: true, nombre: true, abreviacion: true, colorChip: true } },
        sector: { select: { id: true, nombre: true } },
    };

    // Si el usuario está logueado (y no es VISITANTE, aunque podrías tener lógica diferente),
    // devuelve campos adicionales internos/privados.
    if (user && user.role && user.role !== Role.VISITANTE) {
        return {
            ...publicFields,
            descripcion: true, proyectistaId: true, formuladorId: true,
            proyectista: { select: { id: true, name: true, email: true } },
            formulador: { select: { id: true, name: true, email: true } },
            colaboradores: { select: { id: true, name: true, email: true } }, // Asegúrate que el modelo User tenga 'name' y 'email'
            lineaFinanciamientoId: true, programaId: true, etapaFinanciamientoId: true,
            monto: true, tipoMoneda: true, codigoExpediente: true, fechaPostulacion: true,
            montoAdjudicado: true, codigoLicitacion: true,
            lineaFinanciamiento: { select: { id: true, nombre: true } },
            programa: { select: { id: true, nombre: true } },
            etapaActualFinanciamiento: { select: { id: true, nombre: true } }, // Corregido nombre del campo
        };
    }
    // Si no hay usuario o es visitante, devuelve solo los campos públicos.
    return publicFields;
};

// --- Función para Generar Código Único ---
// (Sin cambios respecto a tu versión anterior)
async function generateCodigoUnico(tipologiaId: number): Promise<string> {
    const tipologia = await prisma.tipologiaProyecto.findUnique({
        where: { id: tipologiaId },
        select: { abreviacion: true }
    });
    if (!tipologia) {
        throw new BadRequestError('Tipología inválida para generar código único.');
    }
    const abr = tipologia.abreviacion;

    // Busca el último proyecto con esa tipología por código para obtener el correlativo
    const lastProject = await prisma.project.findFirst({
        where: {
            tipologiaId: tipologiaId,
            // Asegura que el código siga el patrón esperado para evitar errores si hay códigos manuales
            codigoUnico: { startsWith: `${abr}-` }
        },
        orderBy: {
            // Ordenar por longitud y luego alfabéticamente puede ser más robusto
            // para casos como ABR-99 -> ABR-100
            codigoUnico: 'desc',
        },
        select: { codigoUnico: true }
    });

    let nextCorrelativo = 1;
    if (lastProject && lastProject.codigoUnico) {
        const parts = lastProject.codigoUnico.split('-');
        if (parts.length > 1) {
            const lastNum = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastNum)) {
                nextCorrelativo = lastNum + 1;
            }
        }
    }
    // Formatea el número con ceros a la izquierda (ej. 1 -> 001)
    const correlativoStr = nextCorrelativo.toString().padStart(3, '0');
    return `${abr}-${correlativoStr}`;
}

// --- Funciones del Servicio CRUD ---

// GET /api/projects (Listar)
export const findAllProjects = async (query: ListProjectsQuery, user?: AuthenticatedUser) => {
    // Parseo y validación de paginación y límites
    const page = parseInt(String(query.page || '1'), 10);
    const limit = parseInt(String(query.limit || '10'), 10);
    const safePage = isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit; // Limite max 100
    const skip = (safePage - 1) * safeLimit;
    const take = safeLimit;

    // Opciones de ordenamiento
    const { sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const validSortBy = ['nombre', 'codigoUnico', 'ano', 'createdAt', 'updatedAt'].includes(sortBy) ? sortBy : 'createdAt';

    // Construcción de filtros (Where)
    const where: Prisma.ProjectWhereInput = {};
    const { searchText, estadoId, tipologiaId, unidadId, sectorId } = query;

    if (searchText) {
        const searchConditions: Prisma.ProjectWhereInput[] = [
            { nombre: { contains: searchText, mode: 'insensitive' } },
            { codigoUnico: { contains: searchText, mode: 'insensitive' } },
        ];
        // Solo busca en descripción si el usuario está logueado
        if (user) {
            searchConditions.push({ descripcion: { contains: searchText, mode: 'insensitive' } });
        }
        where.OR = searchConditions;
    }

    // Filtros por IDs de relaciones (asegúrate que los IDs son números)
    if (estadoId) where.estadoId = Number(estadoId);
    if (tipologiaId) where.tipologiaId = Number(tipologiaId);
    if (unidadId) where.unidadId = Number(unidadId);
    if (sectorId) where.sectorId = Number(sectorId);

    // Selecciona los campos según el usuario
    const select = getProjectSelectFields(user);

    try {
        // Ejecuta la consulta y el conteo en una transacción
        const [projects, total] = await prisma.$transaction([
            prisma.project.findMany({
                where,
                select,
                skip,
                take,
                orderBy: { [validSortBy]: sortOrder }
            }),
            prisma.project.count({ where }),
        ]);

        // Devuelve resultado paginado
        return {
            projects,
            pagination: {
                totalItems: total,
                totalPages: Math.ceil(total / safeLimit),
                currentPage: safePage,
                pageSize: safeLimit,
            }
        };
    } catch (error) {
        console.error("Error in findAllProjects transaction:", error);
        throw new AppError("Error al buscar proyectos", 500);
    }
};

// GET /api/projects/:id (Obtener uno)
export const findProjectById = async (id: number, user?: AuthenticatedUser) => {
    const select = getProjectSelectFields(user); // Selecciona campos según usuario
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            select
        });

        if (!project) {
            throw new NotFoundError(`Proyecto con ID ${id} no encontrado`);
        }
        return project;
    } catch (error) {
        console.error(`Error in findProjectById for ID ${id}:`, error);
        if (error instanceof NotFoundError) throw error; // Relanza si ya es NotFoundError
        throw new AppError(`Error al buscar el proyecto con ID ${id}`, 500);
    }
};

// POST /api/projects (Crear)
export const createProject = async (data: CreateProjectInput, user: AuthenticatedUser) => {
    console.log(`[createProject] Attempting creation by User ${user.id} (${user.role})`);

    // Genera el código único basado en la tipología
    const codigoUnico = await generateCodigoUnico(data.tipologiaId);

    // Prepara el objeto de datos para Prisma, usando los helpers de parseo
    const createData: Prisma.ProjectCreateInput = {
        codigoUnico,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        direccion: data.direccion ?? null,
        superficieTerreno: parseDecimalOptional(data.superficieTerreno),
        superficieEdificacion: parseDecimalOptional(data.superficieEdificacion),
        ano: parseIntAno(data.ano),
        proyectoPriorizado: data.proyectoPriorizado ?? false,
        tipoMoneda: data.tipoMoneda ?? TipoMoneda.CLP, // Default a CLP si no se especifica
        monto: parseDecimalOptional(data.monto),
        codigoExpediente: data.codigoExpediente ?? null,
        fechaPostulacion: parseDateOptional(data.fechaPostulacion),
        montoAdjudicado: parseDecimalOptional(data.montoAdjudicado),
        codigoLicitacion: data.codigoLicitacion ?? null,

        // --- Conexiones a relaciones ---
        tipologia: { connect: { id: data.tipologiaId } }, // Requerido
        estado: data.estadoId ? { connect: { id: Number(data.estadoId) } } : undefined,
        unidad: data.unidadId ? { connect: { id: Number(data.unidadId) } } : undefined,
        sector: data.sectorId ? { connect: { id: Number(data.sectorId) } } : undefined,
        proyectista: data.proyectistaId ? { connect: { id: Number(data.proyectistaId) } } : undefined,
        formulador: data.formuladorId ? { connect: { id: Number(data.formuladorId) } } : undefined,
        lineaFinanciamiento: data.lineaFinanciamientoId ? { connect: { id: Number(data.lineaFinanciamientoId) } } : undefined,
        programa: data.programaId ? { connect: { id: Number(data.programaId) } } : undefined,
        etapaActualFinanciamiento: data.etapaFinanciamientoId ? { connect: { id: Number(data.etapaFinanciamientoId) } } : undefined, // Corregido nombre de campo

        // Conectar colaboradores si se proporcionan IDs válidos
        ...(data.colaboradoresIds && data.colaboradoresIds.length > 0 && {
            colaboradores: {
                connect: data.colaboradoresIds
                    .map(id => Number(id)) // Convertir a número
                    .filter(id => !isNaN(id) && id > 0) // Filtrar inválidos
                    .map((id) => ({ id: id })) // Mapear a formato { id: ... }
            }
        }),
    };

    try {
        // Intenta crear el proyecto en la BD
        const newProject = await prisma.project.create({
            data: createData,
            select: getProjectSelectFields(user) // Devuelve el proyecto creado con los campos adecuados
        });
        console.log(`[createProject] Project created successfully by user ${user.id} with ID: ${newProject.id}`);
        return newProject;
    } catch (error) {
        console.error(`[createProject] Error during prisma.project.create:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Error de restricción única (ej. codigoUnico duplicado)
            if (error.code === 'P2002') {
                // Intenta identificar qué campo causó el error (puede ser codigoUnico u otro)
                const target = (error.meta?.target as string[])?.join(', ');
                throw new BadRequestError(`Error al crear: El valor para '${target || 'campo único'}' ya existe.`);
            }
             // Error si un ID de relación (FK) no existe
            if (error.code === 'P2025') {
                 throw new BadRequestError(`Error al crear: Uno de los IDs relacionados (ej. estado, unidad, proyectista) no existe.`);
             }
        }
        // Error genérico
        throw new AppError("Error al crear el proyecto en la base de datos", 500);
    }
};


// PUT /api/projects/:id (Actualizar)
// =============== NUEVA FUNCION ===============
export const updateProject = async (id: number, data: UpdateProjectInput, user: AuthenticatedUser) => {
    console.log(`[updateProject] Attempting update for Project ID ${id} by User ${user.id} (${user.role})`);

    // 1. Buscar el proyecto existente (incluir campos para permisos si es necesario)
    const existingProject = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            proyectistaId: true, // Necesario para la verificación de permisos de USUARIO
        }
    });

    if (!existingProject) {
        throw new NotFoundError(`Proyecto con ID ${id} no encontrado.`);
    }

    // 2. Verificar Permisos
    const isAdminOrCoord = user.role === Role.ADMIN || user.role === Role.COORDINADOR;
    // Asume que un USUARIO puede editar SI es el proyectista asignado
    const isOwner = user.role === Role.USUARIO && existingProject.proyectistaId === user.id;

    if (!isAdminOrCoord && !isOwner) {
        console.warn(`[updateProject] Forbidden attempt: User ${user.id} (${user.role}) tried to update Project ${id} (Proyectista ID: ${existingProject.proyectistaId})`);
        throw new ForbiddenError('No tienes permiso para editar este proyecto.');
    }

    console.log(`[updateProject] Permissions OK for User ${user.id} on Project ${id}. Preparing data...`);

    // 3. Preparar los datos para la actualización (updateData)
    // Solo incluye campos que realmente vienen en el objeto 'data' de entrada
    const updateData: Prisma.ProjectUpdateInput = {};

    // Mapea campos simples y parseados si están presentes en 'data'
    if ('nombre' in data) updateData.nombre = data.nombre;
    if ('descripcion' in data) updateData.descripcion = data.descripcion; // Permite setear a null
    if ('direccion' in data) updateData.direccion = data.direccion; // Permite setear a null
    if ('ano' in data) updateData.ano = parseIntAno(data.ano);
    if ('proyectoPriorizado' in data) updateData.proyectoPriorizado = data.proyectoPriorizado;
    if ('tipoMoneda' in data) updateData.tipoMoneda = data.tipoMoneda;
    if ('codigoExpediente' in data) updateData.codigoExpediente = data.codigoExpediente; // Permite setear a null
    if ('codigoLicitacion' in data) updateData.codigoLicitacion = data.codigoLicitacion; // Permite setear a null

    // Campos numéricos/decimales parseados
    if ('superficieTerreno' in data) updateData.superficieTerreno = parseDecimalOptional(data.superficieTerreno);
    if ('superficieEdificacion' in data) updateData.superficieEdificacion = parseDecimalOptional(data.superficieEdificacion);
    if ('monto' in data) updateData.monto = parseDecimalOptional(data.monto);
    if ('montoAdjudicado' in data) updateData.montoAdjudicado = parseDecimalOptional(data.montoAdjudicado);

    // Campos de fecha parseados
    if ('fechaPostulacion' in data) updateData.fechaPostulacion = parseDateOptional(data.fechaPostulacion);

    // --- Manejo de Relaciones ---
    // Nota: Usamos 'in' para verificar si la propiedad existe en 'data',
    // incluso si su valor es 'null' o 'undefined'.

    // Relaciones 1-a-N / 1-a-1
    // Si el ID viene, conecta. Si viene explícitamente null, desconecta (si la relación es opcional).
    if ('tipologiaId' in data && data.tipologiaId !== null) { // Asume tipologiaId no puede ser null
         updateData.tipologia = { connect: { id: Number(data.tipologiaId) } };
    }
    if ('estadoId' in data) {
        updateData.estado = data.estadoId === null ? { disconnect: true } : { connect: { id: Number(data.estadoId) } };
    }
    if ('unidadId' in data) {
        updateData.unidad = data.unidadId === null ? { disconnect: true } : { connect: { id: Number(data.unidadId) } };
    }
     if ('sectorId' in data) {
        updateData.sector = data.sectorId === null ? { disconnect: true } : { connect: { id: Number(data.sectorId) } };
    }
    if ('proyectistaId' in data) {
        updateData.proyectista = data.proyectistaId === null ? { disconnect: true } : { connect: { id: Number(data.proyectistaId) } };
    }
    if ('formuladorId' in data) {
        updateData.formulador = data.formuladorId === null ? { disconnect: true } : { connect: { id: Number(data.formuladorId) } };
    }
    if ('lineaFinanciamientoId' in data) {
        updateData.lineaFinanciamiento = data.lineaFinanciamientoId === null ? { disconnect: true } : { connect: { id: Number(data.lineaFinanciamientoId) } };
    }
    if ('programaId' in data) {
        updateData.programa = data.programaId === null ? { disconnect: true } : { connect: { id: Number(data.programaId) } };
    }
    // Corregido nombre de campo 'etapaFinanciamientoId' a 'etapaActualFinanciamiento' para la relación
    if ('etapaFinanciamientoId' in data) {
        updateData.etapaActualFinanciamiento = data.etapaFinanciamientoId === null ? { disconnect: true } : { connect: { id: Number(data.etapaFinanciamientoId) } };
    }

    // Relación N-a-N (Colaboradores) - Usa 'set' para sincronizar la lista
    // 'set' reemplaza completamente las conexiones existentes con las nuevas proporcionadas.
    if ('colaboradoresIds' in data) {
         const validIds = (data.colaboradoresIds || []) // Asegura que sea un array
            .map(id => Number(id)) // Convierte a número
            .filter(id => !isNaN(id) && id > 0); // Filtra IDs inválidos
        updateData.colaboradores = {
            set: validIds.map(id => ({ id: id })) // Reemplaza la lista existente
        };
        console.log(`[updateProject] Setting colaboradores for project ${id} to IDs: [${validIds.join(', ')}]`);
    }

    // NO actualizamos 'codigoUnico' aquí. Se genera solo al crear.

    // console.log('[updateProject] Prisma update data:', JSON.stringify(updateData, null, 2)); // Log para depurar (opcional)

    // 4. Realizar la actualización en la BD
    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data: updateData,
            select: getProjectSelectFields(user) // Devuelve el proyecto con los campos según el rol
        });
        console.log(`[updateProject] Project ${id} updated successfully by User ${user.id}`);
        return updatedProject; // Devuelve el proyecto actualizado
    } catch (error) {
        console.error(`[updateProject] Error during prisma.project.update for ID ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Error si intentas conectar un ID de relación que no existe
            if (error.code === 'P2025') {
                 throw new BadRequestError(`Error al actualizar: Uno de los IDs relacionados (ej. estado, unidad, colaborador, etc.) no existe.`);
            }
             // Error si se viola una restricción única (diferente de la PK) al actualizar
             if (error.code === 'P2002') {
                 const target = (error.meta?.target as string[])?.join(', ');
                 throw new BadRequestError(`Error al actualizar: El valor para '${target || 'campo único'}' ya existe en otro proyecto.`);
             }
        }
        // Error genérico si no es uno conocido de Prisma
        throw new AppError(`Error al actualizar el proyecto en la base de datos (ID: ${id})`, 500);
    }
};
// =============== FIN NUEVA FUNCION updateProject ===============


// DELETE /api/projects/:id (Eliminar)
// =============== NUEVA FUNCION ===============
export const deleteProject = async (id: number, user: AuthenticatedUser) => {
    console.log(`[deleteProject] Attempting deletion for Project ID ${id} by User ${user.id} (${user.role})`);

    // 1. Verificar rol (Solo ADMIN puede borrar según la configuración en projectRoutes.ts)
    // Aunque la ruta ya lo valida, una doble verificación aquí no hace daño.
    if (user.role !== Role.ADMIN) {
        // Este error no debería ocurrir si las rutas están bien, pero es una salvaguarda.
        throw new ForbiddenError('Acción no permitida. Solo administradores pueden eliminar proyectos.');
    }

    // 2. Buscar el proyecto para asegurarse que existe antes de borrar
    // No necesitamos seleccionar campos extra, solo confirmar existencia.
    const existingProject = await prisma.project.findUnique({
        where: { id },
        select: { id: true } // Solo necesitamos saber si existe
    });

    if (!existingProject) {
        // Si no existe, no hay nada que borrar, pero informamos como error "no encontrado".
        throw new NotFoundError(`Proyecto con ID ${id} no encontrado, no se puede eliminar.`);
    }

    // 3. Intentar eliminar el proyecto
    try {
        await prisma.project.delete({
            where: { id }
        });
        console.log(`[deleteProject] Project ${id} deleted successfully by User ${user.id}`);
        // DELETE exitoso no devuelve cuerpo (HTTP 204 usualmente manejado por el controlador)
    } catch (error) {
        console.error(`[deleteProject] Error during prisma.project.delete for ID ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Error común: Intento de borrar un proyecto que tiene registros relacionados
            // y la restricción de clave foránea (FK) lo impide (ej. onDelete: RESTRICT o SET_NULL si no es nullable).
             if (error.code === 'P2003' || error.code === 'P2014') { // P2003: FK constraint failed. P2014: Relation violation.
                 // El mensaje exacto depende de tu schema y relaciones.
                 throw new BadRequestError(`No se puede eliminar el proyecto (ID: ${id}) porque tiene registros relacionados (ej. tareas, comentarios, etc.). Elimine primero los registros asociados.`);
             }
        }
        // Error genérico
        throw new AppError(`Error al eliminar el proyecto (ID: ${id}) de la base de datos.`, 500);
    }
};
// =============== FIN NUEVA FUNCION deleteProject ===============


// ========================================================================
// FIN: Contenido completo para backend/src/services/projectService.ts
// ========================================================================