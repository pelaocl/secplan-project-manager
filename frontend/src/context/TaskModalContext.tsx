import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Task } from '../types';
import { taskApi } from '../services/taskApi';
import TaskDetailModal from '../components/TaskDetailModal';
import { Box, CircularProgress, Backdrop } from '@mui/material';

// Define la forma de nuestro contexto
interface TaskModalContextType {
  openTaskModal: (projectId: number, taskId: number) => void;
  closeTaskModal: () => void;
}

// Crea el contexto
const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

// Hook personalizado para usar el contexto fácilmente en otros componentes
export const useTaskModal = () => {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error('useTaskModal debe ser usado dentro de un TaskModalProvider');
  }
  return context;
};

// El componente Provider que envolverá nuestra aplicación
export const TaskModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openTaskModal = async (projectId: number, taskId: number) => {
    // Si ya hay un modal abierto, no hacer nada para evitar solapamientos
    if (isModalOpen) return;
    
    setIsLoading(true);
    try {
      // Llama a la API para obtener los datos más recientes de la tarea
      const taskData = await taskApi.getTaskById(projectId, taskId);
      setSelectedTask(taskData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Fallo al obtener los detalles de la tarea para el modal:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setIsLoading(false);
    }
  };

  const closeTaskModal = () => {
    setIsModalOpen(false);
    // Retrasamos la limpieza de los datos de la tarea para que el modal se cierre suavemente
    setTimeout(() => {
        setSelectedTask(null);
    }, 300);
  };

  return (
    <TaskModalContext.Provider value={{ openTaskModal, closeTaskModal }}>
      {children}
      
      {/* El modal ahora vive aquí, en el nivel más alto, listo para ser mostrado */}
      <TaskDetailModal
        task={selectedTask}
        open={isModalOpen}
        onClose={closeTaskModal}
      />

      {/* Un indicador de carga para cuando se están obteniendo los datos de la tarea */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 100 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </TaskModalContext.Provider>
  );
};
