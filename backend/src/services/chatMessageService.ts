// backend/src/services/chatMessageService.ts
import prisma from '../config/prismaClient';
import { CreateChatMessageInput, GetChatMessagesQuery } from '../schemas/chatMessageSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { Role, User as PrismaUser, Tarea, MensajeChatTarea, TipoNotificacion, TipoRecursoNotificacion, Project as PrismaProject } from '@prisma/client';
import { UserPayload } from '../types/express';
import { emitToRoom } from '../socketManager'; 
import { notificationService } from './notificationService'; 

// Ajustamos el tipo de retorno de checkTaskChatAccess para ser más explícito
type TaskWithProjectDetailsForChatAccess = Tarea & {
  proyecto: PrismaProject & {
    colaboradores: Pick<PrismaUser, 'id'>[];
    proyectista?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
    formulador?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
  };
  creador?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
  asignado?: Pick<PrismaUser, 'id' | 'name' | 'email' | 'role'> | null;
};

// Helper para verificar si un usuario puede interactuar con el chat de una tarea
const checkTaskChatAccess = async (taskId: number, userPayload: UserPayload): Promise<TaskWithProjectDetailsForChatAccess> => {
    const tarea = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            proyecto: {
                include: {
                    colaboradores: { select: { id: true } }, // Solo IDs
                    proyectista: { select: { id: true, name: true, email: true, role: true } }, // SIN password
                    formulador: { select: { id: true, name: true, email: true, role: true } },  // SIN password
                }
            },
            creador: { select: { id: true, name: true, email: true, role: true } }, // SIN password
            asignado: { select: { id: true, name: true, email: true, role: true } } // SIN password
        }
    });

    if (!tarea) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }
    
    const typedTarea = tarea as TaskWithProjectDetailsForChatAccess; // Casteamos al tipo que espera la lógica

    if (userPayload.role === Role.ADMIN || userPayload.role === Role.COORDINADOR) {
        return typedTarea;
    }

    const isCreator = typedTarea.creadorId === userPayload.id;
    const isAssignee = typedTarea.asignadoId === userPayload.id;
    // Accedemos a proyectistaId y formuladorId directamente del campo escalar del proyecto si está disponible
    // o a través del objeto proyectista/formulador si se incluyó.
    // El include actual en `proyecto` ya trae el objeto `proyectista` y `formulador` con su ID.
    const isProjectProyectista = typedTarea.proyecto.proyectista?.id === userPayload.id;
    const isProjectFormulador = typedTarea.proyecto.formulador?.id === userPayload.id;
    const isProjectCollaborator = typedTarea.proyecto.colaboradores.some(colab => colab.id === userPayload.id);

    if (!isCreator && !isAssignee && !isProjectProyectista && !isProjectFormulador && !isProjectCollaborator) {
        throw new ForbiddenError('No tienes permiso para interactuar con el chat de esta tarea.');
    }
    return typedTarea;
};

// La función createChatMessage permanece igual en su lógica, pero ahora el objeto 'tarea'
// que recibe de checkTaskChatAccess ya no tendrá los passwords en sus relaciones anidadas.
export const createChatMessage = async (
    taskId: number,
    remitentePayload: UserPayload,
    data: CreateChatMessageInput
): Promise<MensajeChatTarea> => {
    const tarea = await checkTaskChatAccess(taskId, remitentePayload); // 'tarea' ya no tiene passwords anidados
    
    // Este log ahora será seguro respecto a los passwords de usuarios relacionados con la tarea
    console.log('[ChatMessageService] Detalles de la Tarea para el chat (sin passwords anidados):', JSON.stringify(tarea, null, 2));
    console.log(`[ChatMessageService] Remitente del mensaje (User ID): ${remitentePayload.id}, Nombre: ${remitentePayload.name}`);

    const nuevoMensaje = await prisma.mensajeChatTarea.create({
        data: {
            contenido: data.contenido,
            tarea: { connect: { id: taskId } },
            remitente: { connect: { id: remitentePayload.id } },
        },
        include: {
            remitente: {
                select: { id: true, name: true, email: true, role: true } // Ya estaba bien aquí
            }
        }
    });

    const nombreRemitente = remitentePayload.name || remitentePayload.email;
    const mensajeNotificacion = `${nombreRemitente} envió un mensaje en la tarea "${tarea.titulo}" del proyecto "${tarea.proyecto.nombre}".`;
    
    const interesadosPotencialesIds = new Set<number>();
    if (tarea.creadorId) interesadosPotencialesIds.add(tarea.creadorId);
    if (tarea.asignadoId) interesadosPotencialesIds.add(tarea.asignadoId);
    tarea.proyecto.colaboradores.forEach(colab => interesadosPotencialesIds.add(colab.id));
    if (tarea.proyecto.proyectistaId) interesadosPotencialesIds.add(tarea.proyecto.proyectistaId); // Aquí se usa el ID escalar del proyecto
    if (tarea.proyecto.formuladorId) interesadosPotencialesIds.add(tarea.proyecto.formuladorId);   // Aquí también

    const usuariosParaNotificar = await prisma.user.findMany({
        where: { id: { in: Array.from(interesadosPotencialesIds) } },
        select: { id: true, role: true }
    });

    usuariosParaNotificar.forEach(async (usuario) => {
        if (usuario.id === remitentePayload.id) return; 

        let crearNotificacionParaEsteUsuario = false;
        if (usuario.role === Role.USUARIO) {
            crearNotificacionParaEsteUsuario = true;
        } 
        else if (usuario.role === Role.ADMIN || usuario.role === Role.COORDINADOR) {
            if (tarea.creadorId === usuario.id || 
                tarea.asignadoId === usuario.id ||
                tarea.proyecto.proyectistaId === usuario.id // Usamos el ID escalar del proyecto
            ) {
                crearNotificacionParaEsteUsuario = true;
            } else {
                // console.log(`[ChatMessageService] Admin/Coordinador (ID: ${usuario.id}) no notificado...`);
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
    });

    const taskRoom = `task_chat_${taskId}`;
    emitToRoom(taskRoom, 'nuevo_mensaje_chat', nuevoMensaje); 

    return nuevoMensaje;
};

// La función getChatMessagesByTaskId ya selecciona explícitamente los campos del remitente,
// por lo que no debería exponer passwords.
export const getChatMessagesByTaskId = async ( /* ... */ ) => { /* ... tu código existente ... */ };


export const chatMessageService = {
    createChatMessage,
    getChatMessagesByTaskId,
};