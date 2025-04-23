import React from 'react';
import { Typography, Container, Box } from '@mui/material';
import { useParams } from 'react-router-dom'; // Para obtener el ID de la URL

function ProjectEditPage() {
  // Obtenemos el 'id' de la URL (ej. de /projects/1/edit)
  const { id } = useParams<{ id: string }>();

  return (
    <Container maxWidth="lg">
       <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Proyecto (ID: {id || 'N/A'}) {/* Muestra el ID que se está editando */}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Aquí se mostrará el formulario para editar el proyecto con ID: {id || 'N/A'}.
        </Typography>
        {/* Más adelante aquí irá el componente ProjectForm cargado con datos */}
       </Box>
    </Container>
  );
}

// ¡Muy importante para React.lazy!
export default ProjectEditPage;