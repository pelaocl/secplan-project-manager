// backend/src/services/taskService.ts
import prisma from '../config/prismaClient';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { Role, User, Project, Task } from '@prisma/client'; // Importa tipos necesarios
import { emitToUser } from '../socketManager'; // Para emitir eventos de Socket.IO
// Importaríamos un notificationService si ya lo tuviéramos para crear notificaciones en DB.
// import { notificationService } from './notificationService'; 

// Helper para verificar permisos (ejemplo básico)
// Deberás expandir esto según tus reglas de negocio detalladas
const checkProjectAccess = async (projectId: number, requestingUser: UserPayload): Promise<Project> => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { 
            proyectista: true, // Para saber quién es el proyectista del proyecto
            formulador: true,  // Para saber quién es el formulador
            colaboradores: true // Para la lista de colaboradores
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
        throw new ForbiddenError('No tienes permiso para acceder a las tareas de este proyecto.');
    }
    return project;
};


export const createTask = async (
    projectId: number,
    data: CreateTaskInput,
    creatorPayload: UserPayload // <--- CAMBIO: Acepta UserPayload
): Promise<Task> => {
    // 1. Verificar que el proyecto exista y que el creador tenga permisos sobre él
    // (Admin y Coordinador pueden crear tareas en cualquier proyecto)
    // (Otros roles necesitarían ser parte del proyecto para crear tareas, define tus reglas)
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new NotFoundError(`Proyecto con ID ${projectId} no encontrado.`);
    }
    if (creator.role !== Role.ADMIN && creator.role !== Role.COORDINADOR) {
        // Aquí podrías añadir lógica más fina, ej. ¿puede un 'USUARIO' del proyecto crear tareas?
        // Por ahora, asumimos que solo Admin/Coordinador crean tareas.
        throw new ForbiddenError('No tienes permiso para crear tareas en este proyecto.');
    }

    // 2. Validar asignadoId si se provee (¿es un usuario válido? ¿es parte del proyecto?)
    if (data.asignadoId) {
        const asignee = await prisma.user.findUnique({ where: { id: data.asignadoId }});
        if (!asignee) {
            throw new AppError(`Usuario asignado con ID ${data.asignadoId} no encontrado.`, 400);
        }
        // Aquí podrías añadir lógica para asegurar que el 'asignado' sea parte del proyecto
        // (ej. verificar contra project.proyectistaId, project.formuladorId, project.colaboradores)
        // Por ahora, lo permitimos si el usuario existe.
    }
    
    const newTask = await prisma.tarea.create({
        data: {
            titulo: data.titulo,
            descripcion: data.descripcion, // Recordar que esto es HTML
            fechaPlazo: data.fechaPlazo,
            estado: data.estado,
            prioridad: data.prioridad,
            proyecto: { connect: { id: projectId } },
            creador: { connect: { id: creatorPayload.id } }, // <--- USA creatorPayload.id
            ...(data.asignadoId && { asignado: { connect: { id: data.asignadoId } } }),
        },
        include: { // Incluir datos para la notificación/respuesta
            asignado: { // <-- MODIFICAR AQUÍ
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                    // No incluir 'password'
                }
            },
            creador: { // <-- MODIFICAR AQUÍ
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                    // No incluir 'password'
                }
            },
            proyecto: { // <-- También buena práctica para el proyecto si es necesario
                select: {
                    id: true,
                    nombre: true,
                    codigoUnico: true
                    // Selecciona solo los campos del proyecto que realmente necesitas en la respuesta
                }
            },
        }
    });

    // 3. Lógica de Notificación (DB y Socket.IO)
    if (newTask.asignadoId && newTask.asignadoId !== creatorPayload.id) {
        const message = `Se te ha asignado una nueva tarea: "${newTask.titulo}" en el proyecto "${newTask.proyecto.nombre}".`;
        // TODO: Llamar a notificationService.createNotification(...) para guardar en DB
        // Ejemplo: await notificationService.createDBNotification({
        //    usuarioId: newTask.asignadoId,
        //    tipo: TipoNotificacion.NUEVA_TAREA_ASIGNADA,
        //    mensaje: message,
        //    urlDestino: `/projects/${projectId}/tasks/${newTask.id}`, // O la URL que corresponda
        //    recursoId: newTask.id,
        //    recursoTipo: TipoRecursoNotificacion.TAREA
        // });

        // Emitir evento por Socket.IO al usuario asignado
        emitToUser(newTask.asignadoId, 'nueva_tarea_asignada', { 
            taskId: newTask.id,
            titulo: newTask.titulo,
            proyectoNombre: newTask.proyecto.nombre,
            mensaje: message 
        });
    }
    // Podrías notificar a otros participantes del proyecto también si es necesario.

    return newTask;
};

export const getTasksByProjectId = async (
    projectId: number,
    requestingUserPayload: UserPayload // El usuario que realiza la solicitud
): Promise<Task[]> => {
    // Verificar acceso al proyecto
    await checkProjectAccess(projectId, requestingUserPayload);

    // Admins y Coordinadores ven todas las tareas del proyecto.
    // Otros usuarios (Proyectistas, Formuladores, Colaboradores del proyecto)
    // podrían tener una vista más restringida (ej. solo tareas asignadas a ellos o donde participan).
    // Por ahora, si tienen acceso al proyecto, les mostramos todas las tareas del proyecto.
    // Puedes refinar esto después.
    
    return prisma.tarea.findMany({
        where: { proyectoId: projectId },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
            // No incluimos mensajes aquí para no sobrecargar la lista
        },
        orderBy: {
            fechaCreacion: 'desc',
        },
    });
};

// ... (aquí irían getTaskById, updateTask, deleteTask)