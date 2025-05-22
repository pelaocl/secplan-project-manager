// backend/src/services/taskService.ts
import prisma from '../config/prismaClient';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { 
    Role, 
    User as PrismaUser, 
    Project, 
    Task,
    TipoNotificacion,
    TipoRecursoNotificacion
} from '@prisma/client';
import { emitToUser } from '../socketManager';
import { UserPayload } from '../types/express';
import { notificationService } from './notificationService';

// Helper para verificar permisos
const checkProjectAccess = async (projectId: number, requestingUser: UserPayload): Promise<Project> => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { 
            proyectista: true, // Para el chequeo de roles
            formulador: true,  // Para el chequeo de roles
            colaboradores: { select: { id: true } } // Solo IDs para el chequeo some()
        }
    });
    if (!project) {
        throw new NotFoundError(`Proyecto con ID ${projectId} no encontrado.`);
    }

    if (requestingUser.role === Role.ADMIN || requestingUser.role === Role.COORDINADOR) {
        return project;
    }

    const isProyectista = project.proyectistaId === requestingUser.id;
    const isFormulador = project.formuladorId === requestingUser.id;
    const isColaborador = project.colaboradores.some(colab => colab.id === requestingUser.id);

    if (!isProyectista && !isFormulador && !isColaborador) {
        throw new ForbiddenError('No tienes permiso para acceder a este proyecto o sus tareas.');
    }
    return project;
};


export const createTask = async (
    projectId: number, // projectId sigue siendo necesario para la conexión inicial
    data: CreateTaskInput,
    creatorPayload: UserPayload 
): Promise<Task> => { 
    // 1. Verificar permisos del creador (el proyecto se verifica implícitamente al intentar conectar)
    if (creatorPayload.role !== Role.ADMIN && creatorPayload.role !== Role.COORDINADOR) {
        throw new ForbiddenError('No tienes permiso para crear tareas en este proyecto.');
    }

    // 2. Validar asignadoId si se provee
    if (data.asignadoId) {
        const asignee = await prisma.user.findUnique({ where: { id: data.asignadoId }});
        if (!asignee) {
            throw new AppError(`Usuario asignado con ID ${data.asignadoId} no encontrado.`, 400);
        }
        // TODO: Opcional - Verificar si el 'asignadoId' pertenece al equipo del proyecto.
    }
    
    const newTask = await prisma.tarea.create({
        data: {
            titulo: data.titulo,
            descripcion: data.descripcion,
            fechaPlazo: data.fechaPlazo,
            estado: data.estado,
            prioridad: data.prioridad,
            proyecto: { connect: { id: projectId } }, // Conecta con el proyecto
            creador: { connect: { id: creatorPayload.id } },
            ...(data.asignadoId && { asignado: { connect: { id: data.asignadoId } } }),
        },
        include: { // Incluye los datos necesarios para la respuesta y notificaciones
            asignado: { select: { id: true, email: true, name: true, role: true }},
            creador: { select: { id: true, email: true, name: true, role: true }},
            proyecto: { select: { id: true, nombre: true, codigoUnico: true }} // <--- INCLUIMOS EL PROYECTO AQUÍ
        }
    });

    // 3. Lógica de Notificación (DB y Socket.IO)
    // Verificamos que newTask.proyecto y newTask.proyecto.nombre existan después del include
    if (newTask.asignadoId && newTask.asignadoId !== creatorPayload.id && newTask.proyecto && newTask.proyecto.nombre) {
        const message = `Se te ha asignado una nueva tarea: "${newTask.titulo}" en el proyecto "${newTask.proyecto.nombre}".`;
        
        try {
            await notificationService.createDBNotification({
               usuarioId: newTask.asignadoId,
               tipo: TipoNotificacion.NUEVA_TAREA_ASIGNADA,
               mensaje: message,
               urlDestino: `/projects/${newTask.proyecto.id}/tasks/${newTask.id}`, // Usamos el id del proyecto desde newTask
               recursoId: newTask.id,
               recursoTipo: TipoRecursoNotificacion.TAREA
            });
        } catch (dbNotificationError) {
            console.error("[TaskService] Error al crear notificación en DB para nueva tarea:", dbNotificationError);
        }

        emitToUser(newTask.asignadoId.toString(), 'nueva_tarea_asignada', { 
            notification: {
                mensaje: message,
                tipo: TipoNotificacion.NUEVA_TAREA_ASIGNADA,
                urlDestino: `/projects/${newTask.proyecto.id}/tasks/${newTask.id}`,
                fechaCreacion: new Date().toISOString(),
                leida: false
            },
            taskId: newTask.id,
            titulo: newTask.titulo,
            proyectoNombre: newTask.proyecto.nombre, // <--- AHORA USAMOS newTask.proyecto.nombre
        });
    }

    return newTask; // newTask ya incluye la información del proyecto seleccionada
};

export const getTasksByProjectId = async (
    projectId: number,
    requestingUserPayload: UserPayload
): Promise<Task[]> => {
    await checkProjectAccess(projectId, requestingUserPayload);
    
    return prisma.tarea.findMany({
        where: { proyectoId: projectId },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
            // Si necesitas el nombre del proyecto aquí también, puedes añadir:
            // proyecto: { select: { id: true, nombre: true } }
        },
        orderBy: {
            fechaCreacion: 'desc',
        },
    });
};

// TODO: Implementar getTaskById, updateTask, deleteTask