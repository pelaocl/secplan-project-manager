import React from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper, // Para envolver la tabla con un fondo y sombra
    Chip,
    Typography
} from '@mui/material';
import { Project } from '../../types'; // Ajusta la ruta si es necesario

// Propiedades que espera el componente (solo necesita los proyectos ahora)
interface ProjectListTableProps {
  projects: Project[];
  // Ya no pasamos loading, se maneja en la página padre
}

function ProjectListTable({ projects }: ProjectListTableProps) {
  // Log para verificar las props (podemos quitarlo después)
  console.log("ProjectListTable (MUI Table version) received props:", { projects });

  // Si no hay proyectos (aunque la página padre ya debería manejarlo)
  if (!projects || projects.length === 0) {
    return <Typography sx={{ mt: 2 }}>No hay proyectos para mostrar.</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}> {/* Envuelve en Paper para estilo */}
      <Table sx={{ minWidth: 650 }} aria-label="simple projects table">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}> {/* Fondo ligero para cabecera */}
          <TableRow>
            {/* Define las cabeceras de las columnas */}
            <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Nombre Proyecto</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Tipología</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Unidad</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Proyectista</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Año</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Mapea cada proyecto a una fila de la tabla */}
          {projects.map((project) => (
            <TableRow
              key={project.id} // Key única para cada fila
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }} // Estilo MUI para quitar borde inferior de la última fila
            >
              {/* Celda para Código con Chip */}
              <TableCell component="th" scope="row">
                <Chip
                  label={project.codigoUnico || ''}
                  size="small"
                  variant="filled"
                  sx={{
                      backgroundColor: project.tipologia?.colorChip || '#e0e0e0',
                      color: '#fff',
                      textShadow: '1px 1px 1px rgba(0,0,0,0.4)',
                  }}
                />
              </TableCell>
              {/* Celda para Nombre */}
              <TableCell>{project.nombre || ''}</TableCell>
              {/* Celda para Tipología (nombre) */}
              <TableCell>{project.tipologia?.nombre || ''}</TableCell>
              {/* Celda para Estado */}
              <TableCell>{project.estado?.nombre || 'N/A'}</TableCell>
              {/* Celda para Unidad */}
              <TableCell>{project.unidad?.nombre || ''}</TableCell>
              {/* Celda para Proyectista (nombre o email) */}
              <TableCell>{project.proyectista?.name || project.proyectista?.email || ''}</TableCell>
              {/* Celda para Año */}
              <TableCell align="right">{project.ano || ''}</TableCell>
              {/* Añade más TableCell aquí si necesitas más columnas */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProjectListTable;