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

export const getTaskById = async (
    projectId: number, // Todavía útil para el chequeo de acceso al proyecto
    taskId: number,
    requestingUserPayload: UserPayload
): Promise<Task | null> => {
    // Primero, verifica si el usuario tiene acceso al proyecto al que pertenece la tarea
    // Esto también nos da el objeto 'project' si lo necesitamos
    await checkProjectAccess(projectId, requestingUserPayload);

    const task = await prisma.tarea.findUnique({
        where: { 
            id: taskId,
            // Opcionalmente, puedes añadir proyectoId aquí para asegurar que la tarea pertenece al proyecto
            // aunque checkProjectAccess ya nos da una capa de seguridad a nivel de proyecto.
            // Si la ruta es /projects/:projectId/tasks/:taskId, entonces el projectId en la URL
            // ya nos da el contexto del proyecto.
            // Si la tarea no pertenece a ese projectId, findUnique con un filtro compuesto fallaría o sería más complejo.
            // Es más simple buscar por taskId y luego verificar si su proyectoId coincide con el de la URL.
        },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } },
            mensajes: { // <-- IMPORTANTE: Incluimos los mensajes del chat
                orderBy: {
                    fechaEnvio: 'asc', // Mensajes más antiguos primero
                },
                include: {
                    remitente: { select: { id: true, name: true, email: true, role: true } } // Datos del remitente del mensaje
                }
                // Podrías añadir paginación para mensajes aquí si esperas muchos: take, skip
            }
        }
    });

    if (!task) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }

    // Verificación adicional: que la tarea encontrada realmente pertenezca al proyectoId de la URL.
    // Esto es una buena práctica si taskId es el único criterio de búsqueda principal.
    if (task.proyectoId !== projectId) {
        throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
        // O podrías simplemente lanzar un NotFoundError para no revelar información.
    }
    
    // Aquí ya hemos verificado el acceso al proyecto.
    // Si hay reglas más específicas sobre quién puede ver qué tarea (además de pertenecer al proyecto),
    // se añadirían aquí. Por ejemplo, ¿puede un colaborador ver *cualquier* tarea del proyecto
    // o solo aquellas en las que es creador o asignado?
    // Por ahora, si tiene acceso al proyecto, puede ver la tarea.

    return task;
};

export const updateTask = async (
    projectId: number,
    taskId: number,
    data: UpdateTaskInput,
    requestingUserPayload: UserPayload
): Promise<Task> => {
    // 1. Verificar acceso al proyecto
    await checkProjectAccess(projectId, requestingUserPayload);

    // 2. Verificar que la tarea exista y pertenezca al proyecto
    const existingTask = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            proyecto: { select: { id: true, nombre: true } }, // Para el mensaje de notificación
            asignado: { select: { id: true, name: true } }, // Para saber el asignado anterior
            creador: { select: { id: true, name: true } }    // Para saber el creador
        }
    });

    if (!existingTask) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }
    if (existingTask.proyectoId !== projectId) {
        throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
    }

    // 3. Lógica de Permisos para Actualizar
    // Ejemplo: Admin/Coordinador pueden editar todo.
    // El asignado podría solo cambiar el estado a 'COMPLETADA' o 'EN_REVISION'.
    // El creador podría tener algunos permisos de edición.
    // Define esto según tus reglas de negocio.
    const isAdminOrCoordinator = requestingUserPayload.role === Role.ADMIN || requestingUserPayload.role === Role.COORDINADOR;
    const isAssignee = existingTask.asignadoId === requestingUserPayload.id;

    if (!isAdminOrCoordinator) {
        // Si no es Admin/Coordinador, aplicamos reglas más estrictas
        if (isAssignee) {
            // El asignado solo puede actualizar ciertos campos (ej. estado)
            const allowedUpdatesForAssignee: (keyof UpdateTaskInput)[] = ['estado'];
            for (const key in data) {
                if (!allowedUpdatesForAssignee.includes(key as keyof UpdateTaskInput)) {
                    throw new ForbiddenError(`Como asignado, solo puedes actualizar campos permitidos (ej: estado).`);
                }
            }
            // Adicionalmente, el asignado solo puede cambiar a ciertos estados
            if (data.estado && ![EstadoTarea.COMPLETADA, EstadoTarea.EN_REVISION, EstadoTarea.EN_PROGRESO, EstadoTarea.PENDIENTE].includes(data.estado)) {
                 throw new ForbiddenError(`Como asignado, solo puedes cambiar el estado a COMPLETADA, EN_REVISION, EN_PROGRESO o PENDIENTE.`);
            }
        } else {
            // Otros usuarios (que no son admin/coord ni el asignado actual) no pueden editar.
            throw new ForbiddenError('No tienes permiso para actualizar esta tarea.');
        }
    }
    
    // Campos que no deberían ser actualizables directamente por el usuario aquí (como creadorId, proyectoId)
    // ya están excluidos por UpdateTaskInput o no se pasan.

    const updatedTask = await prisma.tarea.update({
        where: { id: taskId },
        data: {
            titulo: data.titulo,
            descripcion: data.descripcion,
            fechaPlazo: data.fechaPlazo,
            estado: data.estado,
            prioridad: data.prioridad,
            // Si permites reasignar la tarea:
            ...(data.asignadoId !== undefined && { // Permite desasignar (null) o reasignar
                asignado: data.asignadoId === null 
                    ? { disconnect: true } 
                    : { connect: { id: data.asignadoId } }
            }),
        },
        include: {
            asignado: { select: { id: true, email: true, name: true, role: true } },
            creador: { select: { id: true, email: true, name: true, role: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } }
        }
    });

    // 4. Lógica de Notificación (DB y Socket.IO) por cambios significativos
    // Ejemplo: Notificar si el estado cambió o si se reasignó la tarea.
    
    // Notificación por cambio de estado
    if (data.estado && data.estado !== existingTask.estado) {
        const message = `El estado de la tarea "${updatedTask.titulo}" en el proyecto "${updatedTask.proyecto.nombre}" ha cambiado a: ${data.estado}.`;
        const recipientIds: number[] = [];
        if (updatedTask.creadorId && updatedTask.creadorId !== requestingUserPayload.id) recipientIds.push(updatedTask.creadorId);
        if (updatedTask.asignadoId && updatedTask.asignadoId !== requestingUserPayload.id && !recipientIds.includes(updatedTask.asignadoId)) recipientIds.push(updatedTask.asignadoId);
        // Podrías notificar a otros participantes del proyecto también.

        for (const recipientId of recipientIds) {
            try {
                await notificationService.createDBNotification({
                    usuarioId: recipientId,
                    tipo: TipoNotificacion.TAREA_ACTUALIZADA_ESTADO,
                    mensaje: message,
                    urlDestino: `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`,
                    recursoId: updatedTask.id,
                    recursoTipo: TipoRecursoNotificacion.TAREA
                });
                emitToUser(recipientId.toString(), 'tarea_actualizada', { 
                    notification: { /* ... objeto notificación ... */ },
                    taskId: updatedTask.id, 
                    titulo: updatedTask.titulo,
                    proyectoNombre: updatedTask.proyecto.nombre,
                    cambio: `estado a ${data.estado}`
                });
            } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de estado para usuario ${recipientId}:`, e); }
        }
    }

    // Notificación por reasignación de tarea
    // Asegúrate que updatedTask.proyecto exista y tenga nombre antes de usarlo.
    if (data.asignadoId !== undefined && data.asignadoId !== existingTask.asignadoId && updatedTask.proyecto && updatedTask.proyecto.nombre) {
        // Notificar al NUEVO asignado (si hay uno y no es quien hace el cambio)
        if (data.asignadoId !== null && data.asignadoId !== requestingUserPayload.id) { 
            const messageNewAssignee = `Se te ha asignado la tarea: "${updatedTask.titulo}" en el proyecto "${updatedTask.proyecto.nombre}".`;
            try {
                await notificationService.createDBNotification({ 
                    usuarioId: data.asignadoId,
                    tipo: TipoNotificacion.NUEVA_TAREA_ASIGNADA, // O un tipo TAREA_REASIGNADA
                    mensaje: messageNewAssignee,
                    urlDestino: `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`,
                    recursoId: updatedTask.id,
                    recursoTipo: TipoRecursoNotificacion.TAREA
                });
                emitToUser(data.asignadoId.toString(), 'nueva_tarea_asignada', { // O 'tarea_reasignada'
                    notification: { /* ... */ },
                    taskId: updatedTask.id, 
                    titulo: updatedTask.titulo,
                    proyectoNombre: updatedTask.proyecto.nombre, 
                    mensaje: messageNewAssignee 
                });
            } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de reasignación para NUEVO usuario ${data.asignadoId}:`, e); }
        }
        
        // Notificar al asignado ANTERIOR (si había uno y no es quien hace el cambio)
        if (existingTask.asignadoId && existingTask.asignadoId !== requestingUserPayload.id) { 
            const messageOldAssignee = `Ya no estás asignado a la tarea: "${updatedTask.titulo}" en el proyecto "${updatedTask.proyecto.nombre}".`;
            try {
                await notificationService.createDBNotification({ 
                    usuarioId: existingTask.asignadoId,
                    tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, // O un tipo TAREA_DESASIGNADA
                    mensaje: messageOldAssignee,
                    urlDestino: `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`,
                    recursoId: updatedTask.id,
                    recursoTipo: TipoRecursoNotificacion.TAREA
                 });
                emitToUser(existingTask.asignadoId.toString(), 'tarea_actualizada', { 
                    notification: { /* ... */ },
                    taskId: updatedTask.id,
                    titulo: updatedTask.titulo,
                    proyectoNombre: updatedTask.proyecto.nombre,
                    mensaje: messageOldAssignee
                 });
            } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de desasignación para ANTERIOR usuario ${existingTask.asignadoId}:`, e); }
        }
    }
    // Puedes añadir más lógicas de notificación para otros campos si es necesario.

    return updatedTask;
};

export const deleteTask = async (
    projectId: number,
    taskId: number,
    requestingUserPayload: UserPayload
): Promise<{ message: string }> => {
    // 1. Verificar acceso al proyecto
    const project = await checkProjectAccess(projectId, requestingUserPayload);

    // 2. Verificar que la tarea exista y pertenezca al proyecto
    const taskToDelete = await prisma.tarea.findUnique({
        where: { id: taskId }
    });

    if (!taskToDelete) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }
    if (taskToDelete.proyectoId !== projectId) {
        // Aunque checkProjectAccess ya valida el proyecto, esta es una doble seguridad.
        throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
    }

    // 3. Lógica de Permisos para Eliminar
    // Generalmente, solo Admins o Coordinadores pueden eliminar tareas.
    // Podrías permitir que el creador de la tarea también la elimine si no ha sido asignada o está en cierto estado.
    if (requestingUserPayload.role !== Role.ADMIN && requestingUserPayload.role !== Role.COORDINADOR) {
        // Ejemplo: Si quieres permitir que el creador borre sus propias tareas (quizás bajo ciertas condiciones)
        // if (taskToDelete.creadorId !== requestingUserPayload.id) {
        //     throw new ForbiddenError('No tienes permiso para eliminar esta tarea.');
        // }
        // Por ahora, solo Admin/Coordinador:
        throw new ForbiddenError('No tienes permiso para eliminar tareas en este proyecto.');
    }

    // 4. Eliminar la tarea
    // Si definiste `onDelete: Cascade` en tu schema.prisma para los MensajeChatTarea
    // relacionados con una Tarea, se borrarán automáticamente.
    // Las Notificaciones que apuntan a esta tarea a través de recursoId y recursoTipo TAREA
    // no se borrarán automáticamente a menos que tengas una relación directa con onDelete: Cascade.
    // Por ahora, las dejaremos (la notificación fue válida en su momento).
    await prisma.tarea.delete({
        where: { id: taskId }
    });

    // 5. Lógica de Notificación (DB - opcional) y Socket.IO
    // Podrías notificar al asignado, creador (si no es quien borra), o colaboradores del proyecto.
    const message = `La tarea "${taskToDelete.titulo}" del proyecto "${project.nombre}" ha sido eliminada por ${requestingUserPayload.name || requestingUserPayload.email}.`;
    
    // Ejemplo de notificación al asignado (si lo había y no es quien borra)
    if (taskToDelete.asignadoId && taskToDelete.asignadoId !== requestingUserPayload.id) {
        try {
            await notificationService.createDBNotification({
                usuarioId: taskToDelete.asignadoId,
                tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, // O un nuevo tipo TAREA_ELIMINADA
                mensaje: message,
                // urlDestino podría no ser relevante o apuntar al proyecto
                urlDestino: `/projects/${project.id}`, 
                recursoId: taskToDelete.id, // Guardamos el ID de la tarea eliminada
                recursoTipo: TipoRecursoNotificacion.TAREA 
            });
            emitToUser(taskToDelete.asignadoId.toString(), 'tarea_eliminada', { 
                taskId: taskToDelete.id, 
                titulo: taskToDelete.titulo,
                proyectoId: project.id,
                proyectoNombre: project.nombre,
                mensaje: `La tarea "${taskToDelete.titulo}" ha sido eliminada.`
            });
        } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de eliminación de tarea para usuario ${taskToDelete.asignadoId}:`, e); }
    }
    // Considera notificar también al creador si no es el mismo que requestingUserPayload.
    // Y quizás a todos los colaboradores del proyecto a través de un evento a una "sala" del proyecto.

    console.log(`[TaskService] Tarea ID ${taskId} eliminada por usuario ID ${requestingUserPayload.id}`);
    return { message: `Tarea ID ${taskId} eliminada correctamente.` };
};