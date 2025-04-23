import React from 'react';
import { Typography, Container, Box } from '@mui/material';

function ProjectListPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lista de Proyectos
        </Typography>
        <Typography variant="body1">
          (Contenido de ProjectListPage Rendered) {/* Mensaje de prueba */}
        </Typography>
        {/* Aquí iría la tabla/filtros después */}
      </Box>
    </Container>
  );
}

export default ProjectListPage;