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
    Chip
} from '@mui/material';
import { Project } from '../../types';
// *** NUEVO: Importa useNavigate para la navegación ***
import { useNavigate } from 'react-router-dom';

interface ProjectListTableProps {
  projects: Project[];
  isAuthenticated: boolean;
}

const headCells = [
    { id: 'codigoUnico', label: 'Código', align: 'left' },
    { id: 'nombre', label: 'Nombre Proyecto', align: 'left' },
    { id: 'tipologia', label: 'Tipología', align: 'left' },
    { id: 'estado', label: 'Estado', align: 'left' },
    { id: 'unidad', label: 'Unidad', align: 'left' },
    { id: 'proyectista', label: 'Proyectista', align: 'left' },
    { id: 'ano', label: 'Año', align: 'right' },
];

function ProjectListTable({ projects, isAuthenticated }: ProjectListTableProps) {
  // *** NUEVO: Hook para navegar ***
  const navigate = useNavigate();

  // *** NUEVO: Handler para el clic en la fila ***
  const handleRowClick = (projectId: number) => {
    console.log(`Navegando a /projects/${projectId}`);
    navigate(`/projects/${projectId}`);
  };

  console.log("ProjectListTable received props:", { projects, isAuthenticated });

  if (!projects || projects.length === 0) {
    return null; // La página padre maneja el mensaje "No hay proyectos"
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple projects table">
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
            // *** NUEVO: Añadimos onClick y estilos hover a TableRow ***
            <TableRow
              key={project.id}
              hover // Efecto visual al pasar el mouse
              onClick={() => handleRowClick(project.id)} // Llama al handler al hacer clic
              sx={{
                 '&:last-child td, &:last-child th': { border: 0 },
                 cursor: 'pointer' // Cambia el cursor a 'pointer'
                }}
            >
              <TableCell component="th" scope="row">
                <Chip /* ... Mismo código del chip ... */ label={project.codigoUnico || ''} size="small" variant="filled" sx={{ backgroundColor: project.tipologia?.colorChip || '#e0e0e0', color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,0.4)' }} />
              </TableCell>
              <TableCell>{project.nombre || ''}</TableCell>
              <TableCell>{project.tipologia?.nombre || ''}</TableCell>
              <TableCell>{project.estado?.nombre || 'N/A'}</TableCell>
              <TableCell>{project.unidad?.nombre || ''}</TableCell>
              <TableCell>
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