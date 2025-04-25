import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider, Button
} from '@mui/material';
import { projectApi } from '../services/projectApi';
import { Project, TipoMoneda } from '../types'; // Importa TipoMoneda si lo usas en formatCurrency
import ProjectMap from '../components/ProjectMap';
import { ApiError } from '../services/apiService';

// Helper para formatear números como moneda Chilena o UF
const formatCurrency = (value: string | number | null | undefined, currency: TipoMoneda = 'CLP'): string => {
    // --- CORRECCIÓN AQUÍ ---
    // Asegura que el replace solo se aplique a strings y quita el "BGN"
    const numericValue = (typeof value === 'string') ? parseFloat(value.replace(',', '.')) : value;
    // -----------------------
    if (numericValue == null || isNaN(numericValue)) {
        return 'N/A';
    }
    try {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency === 'UF' ? 'CLF' : 'CLP',
            minimumFractionDigits: currency === 'UF' ? 2 : 0,
            maximumFractionDigits: currency === 'UF' ? 4 : 0,
        }).format(numericValue);
    } catch (e) {
        console.error("Error formatting currency:", e);
        return `${currency === 'UF' ? 'UF' : '$'} ${numericValue.toLocaleString('es-CL')}`;
    }
};

// Helper para formatear fechas (sin cambios)
const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = (dateString instanceof Date) ? dateString : new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) { return 'Fecha inválida'; }
};


function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect para cargar datos (sin cambios)
    useEffect(() => {
        const projectId = id ? parseInt(id, 10) : NaN;
        if (isNaN(projectId)) { setError("ID inválido."); setLoading(false); return; }
        const loadProject = async () => {
            setLoading(true); setError(null);
            try {
                const projectData = await projectApi.getProjectById(projectId);
                setProject(projectData);
            } catch (err) { /* ... manejo de error ... */ }
            finally { setLoading(false); }
        };
        loadProject();
    }, [id]);

    // Renderizado condicional (sin cambios)
    if (loading) { return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 300 }}><CircularProgress /></Box> ); }
    if (error) { return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>; }
    if (!project) { return <Typography sx={{ mt: 4 }}>No se encontró el proyecto.</Typography>; }

    // Renderizado de detalles (JSX sin cambios, pero ahora debería funcionar)
    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, my: 4 }}>
                {/* Encabezado */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 2, gap: 1 }}>
                     <Chip label={project.codigoUnico || 'S/C'} /* ... */ />
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1, wordBreak: 'break-word' }}>{project.nombre || 'Nombre no disponible'}</Typography>
                </Box>
                <Divider sx={{ mb: 3 }}/>
                {/* Detalles en Grilla */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                         <Typography variant="h6" gutterBottom>Información General</Typography>
                         <Typography><strong>Tipología:</strong> {project.tipologia?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Estado:</strong> {project.estado?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Unidad Municipal:</strong> {project.unidad?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Sector:</strong> {project.sector?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Año Iniciativa:</strong> {project.ano ?? 'N/A'}</Typography>
                         <Typography><strong>Dirección:</strong> {project.direccion || 'N/A'}</Typography>
                         <Typography><strong>Sup. Terreno (m²):</strong> {project.superficieTerreno?.toLocaleString('es-CL') ?? 'N/A'}</Typography>
                         <Typography><strong>Sup. Edificación (m²):</strong> {project.superficieEdificacion?.toLocaleString('es-CL') ?? 'N/A'}</Typography>
                         <Typography><strong>Priorizado:</strong> {project.proyectoPriorizado ? 'Sí' : 'No'}</Typography>
                         <Typography variant="body2" color="textSecondary" sx={{mt: 1}}>Creado: {formatDate(project.createdAt)}</Typography>
                         <Typography variant="body2" color="textSecondary">Última Mod: {formatDate(project.updatedAt)}</Typography>
                         {project.descripcion && ( <Box sx={{ mt: 2 }}><Typography variant="subtitle1" component="strong" gutterBottom>Descripción (Interna):</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{project.descripcion}</Typography></Box> )}
                    </Grid>
                    <Grid item xs={12} md={5}>
                         {(project.proyectista || project.formulador || (project.colaboradores?.length ?? 0) > 0) && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Equipo (Interno)</Typography>
                                {project.proyectista && <Typography><strong>Proyectista:</strong> {project.proyectista.name || project.proyectista.email}</Typography>}
                                {project.formulador && <Typography><strong>Formulador:</strong> {project.formulador.name || project.formulador.email}</Typography>}
                                {project.colaboradores && project.colaboradores.length > 0 && ( <Typography><strong>Colaboradores:</strong> {project.colaboradores.map(c => c.name || c.email).join(', ')}</Typography> )}
                            </Box>
                         )}
                         {(project.monto != null || project.lineaFinanciamiento || project.codigoExpediente) && ( // Condición un poco más robusta
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Información Financiera (Interna)</Typography>
                                {project.lineaFinanciamiento && <Typography><strong>Línea:</strong> {project.lineaFinanciamiento.nombre}</Typography>}
                                {project.programa && <Typography><strong>Programa:</strong> {project.programa.nombre}</Typography>}
                                {project.etapaActualFinanciamiento && <Typography><strong>Etapa Actual:</strong> {project.etapaActualFinanciamiento.nombre}</Typography>}
                                {project.monto != null && <Typography><strong>Monto ({project.tipoMoneda}):</strong> {formatCurrency(project.monto, project.tipoMoneda)}</Typography>}
                                {project.montoAdjudicado != null && <Typography><strong>Monto Adjudicado ({project.tipoMoneda === 'UF' ? 'UF':'$'}):</strong> {formatCurrency(project.montoAdjudicado, 'CLP')}</Typography>}
                                {project.codigoExpediente && <Typography><strong>Cód. Expediente:</strong> {project.codigoExpediente}</Typography>}
                                {project.codigoLicitacion && <Typography><strong>ID Licitación:</strong> {project.codigoLicitacion}</Typography>}
                                {project.fechaPostulacion && <Typography><strong>Fecha Postulación:</strong> {formatDate(project.fechaPostulacion)}</Typography>}
                            </Box>
                          )}
                         <Typography variant="h6" gutterBottom>Ubicación (Referencial)</Typography>
                         <ProjectMap />
                    </Grid>
                </Grid>
                 <Button variant="outlined" sx={{mt: 3}} onClick={() => navigate('/')}> Volver al Listado </Button>
            </Paper>
        </Container>
    );
}

export default ProjectDetailPage;