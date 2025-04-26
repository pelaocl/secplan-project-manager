import React from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography
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
  const handleRowClick = (projectId: number) => { navigate(`/projects/${projectId}`); };

  if (!projects || projects.length === 0) { return null; }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple projects table">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>{/* Sin espacios/saltos de línea antes/después */}
            {headCells.map((headCell) => (
              <TableCell key={headCell.id} align={headCell.align as any} sx={{ fontWeight: 'bold' }}>
                {headCell.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{/* Sin espacios/saltos de línea antes/después */}
          {projects.map((project) => (
            <TableRow
              key={project.id}
              hover
              onClick={() => handleRowClick(project.id)}
              sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
            >{/* Sin espacios/saltos de línea antes/después */}
              <TableCell component="th" scope="row"><Chip label={project.codigoUnico || ''} size="small" variant="filled" sx={{ backgroundColor: project.tipologia?.colorChip || '#e0e0e0', color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,0.4)'}}/></TableCell>
              <TableCell>{project.nombre || ''}</TableCell>
              <TableCell>{project.tipologia?.nombre || ''}</TableCell>
              <TableCell>{project.estado?.nombre || 'N/A'}</TableCell>
              <TableCell>{project.unidad?.nombre || ''}</TableCell>
              <TableCell>{isAuthenticated ? (project.proyectista?.name || project.proyectista?.email || '') : ''}</TableCell>
              <TableCell align="right">{project.ano ?? ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProjectListTable;