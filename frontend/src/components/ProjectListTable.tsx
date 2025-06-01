import React, { useMemo } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    useTheme, useMediaQuery, Breakpoint, Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Asegúrate que este import esté
import { Project } from '../types';

// Definición de Columnas (Exportada para que ProjectListPage la use)
export interface ColumnDefinition<T> {
    id: string;
    label: string;
    align?: 'left' | 'right' | 'center';
    minWidth?: string | number;
    dataAccessor?: (item: T) => React.ReactNode;
    renderCell?: (item: T, isAuthenticated: boolean) => React.ReactNode;
    showOnBreakpoints?: Breakpoint[]; // Array de MUI Breakpoints: 'xs', 'sm', 'md', 'lg', 'xl'
}

interface ProjectListTableProps {
    projects: Project[];
    columns: ColumnDefinition<Project>[];
    isAuthenticated: boolean;
    // onDeleteClick ya no es necesaria como prop aquí, se maneja en el renderCell de la columna "Acciones"
}

function ProjectListTable({ projects, columns, isAuthenticated }: ProjectListTableProps) {
    const navigate = useNavigate();
    const theme = useTheme();

    // Hooks para determinar el estado de los breakpoints. Se llaman incondicionalmente.
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));
    const isSm = useMediaQuery(theme.breakpoints.only('sm'));
    const isMd = useMediaQuery(theme.breakpoints.only('md'));
    const isLg = useMediaQuery(theme.breakpoints.only('lg'));
    const isXl = useMediaQuery(theme.breakpoints.up('xl')); // up('xl') para xl y más grandes

    // Memoizar las columnas visibles para evitar recalcular en cada render si las props no cambian
    const dynamicallyVisibleColumns = useMemo(() => {
        return columns.filter(col => {
            if (!col.showOnBreakpoints || col.showOnBreakpoints.length === 0) {
                return true; // Si no se especifican breakpoints, mostrar siempre
            }
            // La columna se muestra si el breakpoint actual está en su lista de showOnBreakpoints
            if (isXs && col.showOnBreakpoints.includes('xs')) return true;
            if (isSm && col.showOnBreakpoints.includes('sm')) return true;
            if (isMd && col.showOnBreakpoints.includes('md')) return true;
            if (isLg && col.showOnBreakpoints.includes('lg')) return true;
            if (isXl && col.showOnBreakpoints.includes('xl')) return true;
            return false;
        });
    }, [columns, isXs, isSm, isMd, isLg, isXl]); // Dependencias correctas

    const handleRowClick = (projectId: number) => {
        navigate(`/projects/${projectId}`);
    };

    if (!projects || projects.length === 0) {
        // El mensaje de "No se encontraron proyectos" ya se maneja en ProjectListPage
        // o se podría mostrar un mensaje más genérico aquí si la lista filtrada queda vacía
        return <Typography sx={{ p: 2, textAlign: 'center' }}>No hay proyectos para mostrar con los filtros actuales.</Typography>;
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 0, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
            <Table sx={{ minWidth: 340 }} aria-label="tabla de proyectos">{/*
                No dejes líneas vacías o espacios aquí si es posible.
                El <TableHead> debe ser el siguiente elemento lógico.
            */}<TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableRow>
                        {dynamicallyVisibleColumns.map((column) => (
                            <TableCell
                                key={column.id}
                                align={column.align || 'left'}
                                sx={{ fontWeight: 'bold', py: 1, px: 1.5, minWidth: column.minWidth, whiteSpace: 'normal',wordBreak: 'break-word', }}
                            >
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead><TableBody>
                    {projects.map((project) => (
                        <TableRow
                            key={project.id}
                            hover
                            onClick={() => handleRowClick(project.id)}
                            sx={{ 
                                cursor: 'pointer', 
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:hover': { backgroundColor: theme.palette.action.hover }
                            }}
                        >
                            {dynamicallyVisibleColumns.map((column, index) => (
                                <TableCell
                                    key={`${project.id}-${column.id}`}
                                    align={column.align || 'left'}
                                    component={index === 0 ? "th" : "td"}
                                    scope={index === 0 ? "row" : undefined}
                                    sx={{ py: 1, px: 1.5 }}
                                >
                                    {column.renderCell
                                        ? column.renderCell(project, isAuthenticated)
                                        : column.dataAccessor
                                            ? column.dataAccessor(project)
                                            : 'N/D'
                                    }
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody></Table>
        </TableContainer>
    );
}

export default ProjectListTable;