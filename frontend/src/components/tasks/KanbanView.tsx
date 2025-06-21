import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Task, EstadoTarea } from '../../types';
import KanbanTaskCard from './KanbanTaskCard';

interface KanbanViewProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: number, newStatus: EstadoTarea) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onTaskStatusChange }) => {
  const theme = useTheme();

  const columns: { [key in EstadoTarea]?: Task[] } = {
    [EstadoTarea.PENDIENTE]: [],
    [EstadoTarea.EN_PROGRESO]: [],
    [EstadoTarea.EN_REVISION]: [],
    [EstadoTarea.COMPLETADA]: [],
  };

  // Agrupar tareas en sus respectivas columnas
  tasks.forEach(task => {
    if (columns[task.estado]) {
      columns[task.estado]?.push(task);
    }
  });
  
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return; // El usuario soltó la tarjeta fuera de una columna
    }
    if (source.droppableId === destination.droppableId) {
      return; // La tarjeta se movió a la misma columna, no hacemos nada
    }

    // El usuario movió la tarjeta a una nueva columna, actualizamos el estado
    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as EstadoTarea;
    onTaskStatusChange(taskId, newStatus);
  };

  const columnOrder: EstadoTarea[] = [
      EstadoTarea.PENDIENTE,
      EstadoTarea.EN_PROGRESO,
      EstadoTarea.EN_REVISION,
      EstadoTarea.COMPLETADA,
  ];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2,
          mt: 2,
          alignItems: 'flex-start'
        }}
      >
        {columnOrder.map((columnId) => {
          const columnTasks = columns[columnId] || [];
          return (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    bgcolor: snapshot.isDraggingOver ? theme.palette.action.hover : theme.palette.grey[100],
                    borderRadius: 2,
                    p: 1.5,
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Typography variant="h6" sx={{ p: 1, mb: 1, fontWeight: 'bold', color: 'text.secondary', fontSize: '1rem' }}>
                    {columnId.replace('_', ' ')} ({columnTasks.length})
                  </Typography>
                  
                  <Box sx={{ minHeight: '300px' /* para que las columnas vacías tengan altura */ }}>
                    {columnTasks.map((task, index) => (
                      <KanbanTaskCard key={task.id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                  </Box>
                </Box>
              )}
            </Droppable>
          );
        })}
      </Box>
    </DragDropContext>
  );
};

export default KanbanView;
