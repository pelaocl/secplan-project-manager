import React from 'react';
import { Paper, Typography, Box, Chip, useTheme } from '@mui/material';
import { Draggable } from '@hello-pangea/dnd';
import { Task, PrioridadTarea } from '../../types';

interface KanbanTaskCardProps {
  task: Task;
  index: number;
}

const getPriorityColor = (priority?: PrioridadTarea | null): string => {
    switch (priority) {
        case 'ALTA': return 'error.main';
        case 'MEDIA': return 'warning.main';
        case 'BAJA': return 'info.main';
        default: return 'transparent';
    }
};

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ task, index }) => {
  const theme = useTheme();

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 4 : 1}
          sx={{
            p: 1.5,
            mb: 1.5,
            borderLeft: 5,
            borderColor: getPriorityColor(task.prioridad),
            transition: 'box-shadow 0.2s ease',
            bgcolor: snapshot.isDragging ? theme.palette.grey[100] : 'background.paper',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            {task.titulo}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            En: {task.proyecto?.codigoUnico || 'N/A'}
          </Typography>
          {task.fechaPlazo && (
              <Chip 
                label={`Vence: ${new Date(task.fechaPlazo).toLocaleDateString('es-CL')}`} 
                size="small" 
              />
          )}
        </Paper>
      )}
    </Draggable>
  );
};

export default KanbanTaskCard;
