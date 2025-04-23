import React from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography
} from '@mui/material';
import { Project } from '../../types'; // Ajusta la ruta si es necesario

// Propiedades que espera el componente
interface ProjectListTableProps {
  projects: Project[];
  // *** NUEVO: Prop para saber si el usuario está autenticado ***
  isAuthenticated: boolean;
  // Ya no pasamos loading aquí
}

// Definición de Cabeceras (constante fuera del componente)
const headCells = [
    { id: 'codigoUnico', label: 'Código', align: 'left' },
    { id: 'nombre', label: 'Nombre Proyecto', align: 'left' },
    { id: 'tipologia', label: 'Tipología', align: 'left' },
    { id: 'estado', label: 'Estado', align: 'left' },
    { id: 'unidad', label: 'Unidad', align: 'left' },
    { id: 'proyectista', label: 'Proyectista', align: 'left' }, // Mantenemos la cabecera
    { id: 'ano', label: 'Año', align: 'right' },
];

function ProjectListTable({ projects, isAuthenticated }: ProjectListTableProps) {
  console.log("ProjectListTable received props:", { projects, isAuthenticated });

  if (!projects || projects.length === 0) {
     // La página padre ya no debería renderizar esto si no hay proyectos
     // pero lo dejamos como una doble seguridad.
    return <Typography sx={{ mt: 2 }}>No hay proyectos para mostrar.</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple projects table">
        {/* CORREGIDO: Quitamos espacios/saltos de línea dentro de TableHead y TableRow */}
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            {headCells.map((headCell) => (
              <TableCell key={headCell.id} align={headCell.align as any} sx={{ fontWeight: 'bold' }}>
                {headCell.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              {/* Celda Código con Chip */}
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
              {/* Celdas con datos */}
              <TableCell>{project.nombre || ''}</TableCell>
              <TableCell>{project.tipologia?.nombre || ''}</TableCell>
              <TableCell>{project.estado?.nombre || 'N/A'}</TableCell>
              <TableCell>{project.unidad?.nombre || ''}</TableCell>
              {/* *** CORREGIDO: Celda Proyectista Condicional *** */}
              <TableCell>
                {/* Muestra el proyectista SOLO si está autenticado Y si el dato existe */}
                {isAuthenticated ? (project.proyectista?.name || project.proyectista?.email || '') : ''}
              </TableCell>
              <TableCell align="right">{project.ano || ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProjectListTable;