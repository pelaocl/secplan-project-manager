// ========================================================================
// INICIO: Contenido COMPLETO y MODIFICADO para ProjectListTable.tsx
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================
import React from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography,
    IconButton, Tooltip, Stack // <--- Añadidos
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // <--- Añadido
import DeleteIcon from '@mui/icons-material/Delete'; // <--- Añadido
import { Link, useNavigate } from 'react-router-dom'; // <--- Añadido Link
import { Project } from '../types'; // <-- Ajusta ruta si es necesario

interface ProjectListTableProps {
    projects: Project[];
    isAuthenticated: boolean;
    onDeleteClick: (projectId: number, projectName: string) => void; // <--- Nueva Prop
}

// Definición de cabeceras (sin la de Acciones, se añade condicionalmente)
const headCells = [
    { id: 'codigoUnico', label: 'Código', align: 'left' as const }, // Usar 'as const' para tipo literal
    { id: 'nombre', label: 'Nombre Proyecto', align: 'left' as const },
    { id: 'tipologia', label: 'Tipología', align: 'left' as const },
    { id: 'estado', label: 'Estado', align: 'left' as const },
    { id: 'unidad', label: 'Unidad', align: 'left' as const },
    { id: 'proyectista', label: 'Proyectista', align: 'left' as const },
    { id: 'ano', label: 'Año', align: 'right' as const },
];

function ProjectListTable({ projects, isAuthenticated, onDeleteClick }: ProjectListTableProps) {
    const navigate = useNavigate();

    // Navega a detalles al hacer clic en la fila (pero no en los botones)
    const handleRowClick = (projectId: number) => {
        navigate(`/projects/${projectId}`);
    };

    // Previene la navegación de fila cuando se hace clic en los botones de acción
    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Renderiza 'N/A' o un string vacío de forma segura
    const safeGet = (value: string | undefined | null, defaultValue: string = 'N/A'): string => {
        return value ?? defaultValue;
    };

    if (!projects || projects.length === 0) {
        return null; // O un mensaje indicando que no hay proyectos
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de proyectos">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                        {headCells.map((headCell) => (
                            <TableCell key={headCell.id} align={headCell.align} sx={{ fontWeight: 'bold' }}>
                                {headCell.label}
                            </TableCell>
                        ))}
                        {/* Cabecera Condicional "Acciones" */}
                        {isAuthenticated && (
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '100px' }}> {/* Añade minWidth si es necesario */}
                                Acciones
                            </TableCell>
                        )}
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
                            {/* Celdas de Datos */}
                            <TableCell component="th" scope="row">
                                <Chip
                                    label={project.codigoUnico || '?'}
                                    size="small"
                                    variant="filled"
                                    sx={{
                                        backgroundColor: project.tipologia?.colorChip || '#e0e0e0',
                                        color: '#fff',
                                        textShadow: '1px 1px 1px rgba(0,0,0,0.4)'
                                    }}/>
                            </TableCell>
                            <TableCell>{project.nombre || ''}</TableCell>
                            <TableCell>{project.tipologia?.nombre || ''}</TableCell>
                            <TableCell>{safeGet(project.estado?.nombre)}</TableCell>
                            <TableCell>{project.unidad?.nombre || ''}</TableCell>
                            {/* Muestra proyectista solo si está autenticado */}
                            <TableCell>{isAuthenticated ? safeGet(project.proyectista?.name ?? project.proyectista?.email, '') : ''}</TableCell>
                            <TableCell align="right">{project.ano ?? ''}</TableCell>

                            {/* Celda Condicional "Acciones" */}
                            {isAuthenticated && (
                                <TableCell align="center" onClick={handleActionClick}> {/* Detiene propagación */}
                                    <Stack direction="row" spacing={0.5} justifyContent="center"> {/* Ajusta spacing si es necesario */}
                                        <Tooltip title="Editar Proyecto">
                                            {/* Usamos Link para navegación directa */}
                                            <IconButton
                                                component={Link}
                                                to={`/projects/${project.id}/edit`}
                                                size="small"
                                                aria-label="editar"
                                                color="primary"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar Proyecto">
                                            {/* Llama a la función pasada por props */}
                                            <IconButton
                                                onClick={() => onDeleteClick(project.id, project.nombre)}
                                                size="small"
                                                aria-label="eliminar"
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ProjectListTable;
// ========================================================================
// FIN: Contenido COMPLETO y MODIFICADO para ProjectListTable.tsx
// ========================================================================