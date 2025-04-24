// Copia el código completo de ProjectListTable.tsx de la RESPUESTA #79 aquí
// (La versión que tenía project.estado?.nombre || 'N/A', etc.)
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
import { Project } from '../../types';
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
  const navigate = useNavigate();

  const handleRowClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  if (!projects || projects.length === 0) {
    return null;
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
            <TableRow
              key={project.id}
              hover
              onClick={() => handleRowClick(project.id)}
              sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
            >
              {/* --- Celdas en ORDEN con acceso seguro --- */}
              {/* 1. Código */}
              <TableCell component="th" scope="row">
                <Chip label={project.codigoUnico || ''} size="small" variant="filled" sx={{ backgroundColor: project.tipologia?.colorChip || '#e0e0e0', color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,0.4)'}}/>
              </TableCell>
              {/* 2. Nombre */}
              <TableCell>{project.nombre || ''}</TableCell>
              {/* 3. Tipología */}
              <TableCell>{project.tipologia?.nombre || ''}</TableCell>
              {/* 4. Estado */}
              <TableCell>{project.estado?.nombre || 'N/A'}</TableCell> {/* <--- Acceso seguro */}
              {/* 5. Unidad */}
              <TableCell>{project.unidad?.nombre || ''}</TableCell> {/* <--- Acceso seguro */}
              {/* 6. Proyectista (Condicional) */}
              <TableCell>
                {isAuthenticated ? (project.proyectista?.name || project.proyectista?.email || '') : ''}
              </TableCell>
              {/* 7. Año */}
              <TableCell align="right">{project.ano ?? ''}</TableCell> {/* <--- Acceso seguro */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProjectListTable;