// backend/src/services/chatMessageService.ts
import prisma from '../config/prismaClient';
import { CreateChatMessageInput, GetChatMessagesQuery } from '../schemas/chatMessageSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { Role, User as PrismaUser, Tarea, MensajeChatTarea, TipoNotificacion, TipoRecursoNotificacion, Project as PrismaProject } from '@prisma/client';
import { UserPayload } from '../types/express';
import { emitToRoom } from '../socketManager'; 
import { notificationService } from './notificationService'; 

// --- Tipo extendido para incluir relaciones en las respuestas de la API ---
type MensajeChatTareaWithDetails = MensajeChatTarea & {
    remitente: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'>;
    mensajePadre?: (Pick<MensajeChatTarea, 'id' | 'contenido'> & {
        remitente: Pick<PrismaUser, 'id' | 'name'>;
    }) | null;
};

// (Esta parte no se modifica)
type TaskWithProjectDetailsForChatAccess = Tarea & {
    proyecto: PrismaProject & {
        colaboradores: Pick<PrismaUser, 'id'>[];
        proyectista?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
        formulador?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
    };
    creador?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
    asignado?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
};

// (Esta función auxiliar no se modifica)
const checkTaskChatAccess = async (taskId: number, userPayload: UserPayload): Promise<TaskWithProjectDetailsForChatAccess> => {
    const tarea = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            proyecto: {
                include: {
                    colaboradores: { select: { id: true } },
                    proyectista: { select: { id: true, name: true, email: true, role: true } },
                    formulador: { select: { id: true, name: true, email: true, role: true } },
                }
            },
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } }
        }
    });

    if (!tarea) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }
    
    const typedTarea = tarea as TaskWithProjectDetailsForChatAccess;

    if (userPayload.role === Role.ADMIN || userPayload.role === Role.COORDINADOR) {
        return typedTarea;
    }

    const isCreator = typedTarea.creadorId === userPayload.id;
    const isAssignee = typedTarea.asignadoId === userPayload.id;
    const isProjectProyectista = typedTarea.proyecto.proyectista?.id === userPayload.id;
    const isProjectFormulador = typedTarea.proyecto.formulador?.id === userPayload.id;
    const isProjectCollaborator = typedTarea.proyecto.colaboradores.some(colab => colab.id === userPayload.id);

    if (!isCreator && !isAssignee && !isProjectProyectista && !isProjectFormulador && !isProjectCollaborator) {
        throw new ForbiddenError('No tienes permiso para interactuar con el chat de esta tarea.');
    }
    return typedTarea;
};

// --- Nueva función auxiliar para manejar menciones ---
const handleMentions = async (
    message: MensajeChatTarea,
    task: TaskWithProjectDetailsForChatAccess,
    sender: UserPayload
): Promise<Set<number>> => {
    const mentionRegex = /@\[([^\]]+)\]\(user:(\d+)\)/g;
    const mentionedUserIds = new Set<number>();
    let match;

    while ((match = mentionRegex.exec(message.contenido)) !== null) {
        const userId = parseInt(match[2], 10);
        if (!isNaN(userId) && userId !== sender.id) {
            mentionedUserIds.add(userId);
        }
    }

    if (mentionedUserIds.size === 0) {
        return mentionedUserIds;
    }

    const senderName = sender.name || sender.email;
    const notificationMessage = `${senderName} te ha mencionado en un comentario en la tarea "${task.titulo}".`;

    for (const userId of mentionedUserIds) {
        try {
            await notificationService.createDBNotification({
                usuarioId: userId,
                tipo: TipoNotificacion.MENCION_EN_TAREA,
                mensaje: notificationMessage,
                urlDestino: `/projects/${task.proyectoId}/tasks/${task.id}`,
                recursoId: message.id,
                recursoTipo: TipoRecursoNotificacion.MENSAJE_CHAT_TAREA,
            });
        } catch (error) {
            console.error(`[handleMentions] Error creando notificación de mención para el usuario ${userId}:`, error);
        }
    }
    return mentionedUserIds;
};

export const createChatMessage = async (
    taskId: number,
    remitentePayload: UserPayload,
    data: CreateChatMessageInput
): Promise<MensajeChatTareaWithDetails> => {
    const tarea = await checkTaskChatAccess(taskId, remitentePayload);
    
    const createData: any = {
        contenido: data.contenido,
        tarea: { connect: { id: taskId } },
        remitente: { connect: { id: remitentePayload.id } },
    };

    if (data.mensajePadreId) {
        const parentMessage = await prisma.mensajeChatTarea.findFirst({
            where: { id: data.mensajePadreId, tareaId: taskId }
        });
        if (parentMessage) {
            createData.mensajePadre = { connect: { id: data.mensajePadreId } };
        } else {
            console.warn(`[ChatMessageService] Se intentó responder a un mensaje (ID: ${data.mensajePadreId}) que no existe o no pertenece a la tarea (ID: ${taskId}).`);
        }
    }

    const nuevoMensaje = await prisma.mensajeChatTarea.create({
        data: createData,
        include: {
            remitente: {
                select: { id: true, name: true, email: true, role: true }
            },
            mensajePadre: {
                select: {
                    id: true,
                    contenido: true,
                    remitente: { select: { id: true, name: true } }
                }
            }
        }
    });

    // 1. Manejar menciones específicas (alta prioridad)
    const idsMencionados = await handleMentions(nuevoMensaje, tarea, remitentePayload);

    // 2. Notificación general de nuevo mensaje, aplicando la lógica de roles original
    const nombreRemitente = remitentePayload.name || remitentePayload.email;
    const mensajeNotificacion = `${nombreRemitente} envió un mensaje en la tarea "${tarea.titulo}" del proyecto [${tarea.proyecto.codigoUnico}] ${tarea.proyecto.nombre}.`;
    
    const interesadosPotencialesIds = new Set<number>();
    if (tarea.creadorId) interesadosPotencialesIds.add(tarea.creadorId);
    if (tarea.asignadoId) interesadosPotencialesIds.add(tarea.asignadoId);
    if (tarea.proyecto.proyectistaId) interesadosPotencialesIds.add(tarea.proyecto.proyectistaId);
    if (tarea.proyecto.formuladorId) interesadosPotencialesIds.add(tarea.proyecto.formuladorId);
    tarea.proyecto.colaboradores.forEach(colab => interesadosPotencialesIds.add(colab.id));
    const participantesDirectos = await prisma.user.findMany({
        where: { tareasDondeParticipa: { some: { id: taskId } } },
        select: { id: true }
    });
    participantesDirectos.forEach(p => interesadosPotencialesIds.add(p.id));

    const usuariosParaNotificar = await prisma.user.findMany({
        where: { id: { in: Array.from(interesadosPotencialesIds) } },
        select: { id: true, role: true }
    });

    for (const usuario of usuariosParaNotificar) {
        if (usuario.id === remitentePayload.id) continue;
        if (idsMencionados.has(usuario.id)) continue;

        let crearNotificacionParaEsteUsuario = false;
        if (usuario.role === Role.USUARIO) {
            crearNotificacionParaEsteUsuario = true;
        } else if (usuario.role === Role.ADMIN || usuario.role === Role.COORDINADOR) {
            if (tarea.creadorId === usuario.id || 
                tarea.asignadoId === usuario.id ||
                tarea.proyecto.proyectistaId === usuario.id
            ) {
                crearNotificacionParaEsteUsuario = true;
            }
        }
        
        if (crearNotificacionParaEsteUsuario) {
            try {
                await notificationService.createDBNotification({
                    usuarioId: usuario.id,
                    tipo: TipoNotificacion.NUEVO_MENSAJE_TAREA,
                    mensaje: mensajeNotificacion,
                    urlDestino: `/projects/${tarea.proyectoId}/tasks/${taskId}`,
                    recursoId: nuevoMensaje.id,
                    recursoTipo: TipoRecursoNotificacion.MENSAJE_CHAT_TAREA,
                });
            } catch (dbNotificationError) {
                console.error(`[ChatMessageService] Error creando notificación de chat en DB para usuario ${usuario.id}:`, dbNotificationError);
            }
        }
    }

    const taskRoom = `task_chat_${taskId}`;
    emitToRoom(taskRoom, 'nuevo_mensaje_chat', nuevoMensaje); 

    return nuevoMensaje;
};


export const getChatMessagesByTaskId = async (
    taskId: number,
    requestingUserPayload: UserPayload,
    query: GetChatMessagesQuery
): Promise<{ messages: MensajeChatTareaWithDetails[], totalMessages: number, page: number, limit: number, totalPages: number }> => {
    await checkTaskChatAccess(taskId, requestingUserPayload);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [messages, totalMessages] = await prisma.$transaction([
        prisma.mensajeChatTarea.findMany({
            where: { tareaId: taskId },
            include: {
                remitente: {
                    select: { id: true, name: true, email: true, role: true }
                },
                mensajePadre: {
                    select: {
                        id: true,
                        contenido: true, 
                        remitente: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: {
                fechaEnvio: 'asc',
            },
            skip: skip,
            take: limit,
        }),
        prisma.mensajeChatTarea.count({
            where: { tareaId: taskId }
        })
    ]);

    const typedMessages = messages as MensajeChatTareaWithDetails[];

    return {
        messages: typedMessages,
        totalMessages,
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit)
    };
};

export const chatMessageService = {
    createChatMessage,
    getChatMessagesByTaskId,
};