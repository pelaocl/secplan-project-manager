import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider,
    // --- CORREGIDO: Añadir Button a la importación ---
    Button
} from '@mui/material';
import { projectApi } from '../services/projectApi';
import { Project } from '../types';
import ProjectMap from '../components/ProjectMap'; // Importa el mapa

function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const projectId = id ? parseInt(id, 10) : NaN;
        if (isNaN(projectId)) {
            setError("ID de proyecto inválido.");
            setLoading(false);
            return;
        }

        const loadProject = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await projectApi.getProjectById(projectId);
                console.log("Detalle de proyecto recibido:", data);
                setProject(data);
            } catch (err) {
                console.error(`Error fetching project ${projectId}:`, err);
                setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar el proyecto.');
            } finally {
                setLoading(false);
            }
        };

        loadProject();
    }, [id]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    }

    if (!project) {
        return <Typography sx={{ mt: 4 }}>No se encontró el proyecto.</Typography>;
    }

    // Renderizado de detalles (sin cambios en esta parte)
    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 3, my: 4 }}>
                {/* Encabezado */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                     <Chip
                        label={project.codigoUnico || 'S/C'}
                        size="medium"
                        variant="filled"
                        sx={{ backgroundColor: project.tipologia?.colorChip || '#757575', color: '#fff', mr: 2, fontSize: '1rem', height: 'auto', '& .MuiChip-label': { padding: '6px 12px'} }}
                    />
                    <Typography variant="h4" component="h1">
                        {project.nombre}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 3 }}/>

                {/* Detalles en Grilla */}
                <Grid container spacing={3}>
                    {/* Columna Izquierda */}
                    <Grid item xs={12} md={7}>
                         <Typography variant="h6" gutterBottom>Información General</Typography>
                         <Typography><strong>Tipología:</strong> {project.tipologia?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Estado:</strong> {project.estado?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Unidad Municipal:</strong> {project.unidad?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Sector:</strong> {project.sector?.nombre || 'N/A'}</Typography>
                         <Typography><strong>Año Iniciativa:</strong> {project.ano || 'N/A'}</Typography>
                         <Typography><strong>Dirección:</strong> {project.direccion || 'N/A'}</Typography>
                         <Typography><strong>Sup. Terreno (m²):</strong> {project.superficieTerreno ?? 'N/A'}</Typography>
                         <Typography><strong>Sup. Edificación (m²):</strong> {project.superficieEdificacion ?? 'N/A'}</Typography>
                         <Typography><strong>Priorizado:</strong> {project.proyectoPriorizado ? 'Sí' : 'No'}</Typography>
                         <Typography variant="body2" color="textSecondary" sx={{mt: 1}}>Creado: {new Date(project.createdAt).toLocaleDateString()}</Typography>
                         <Typography variant="body2" color="textSecondary">Última Mod: {new Date(project.updatedAt).toLocaleDateString()}</Typography>
                         {project.descripcion && (
                             <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom><strong>Descripción (Interna):</strong></Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{project.descripcion}</Typography>
                             </Box>
                         )}
                    </Grid>
                    {/* Columna Derecha */}
                    <Grid item xs={12} md={5}>
                         {(project.proyectista || project.formulador || project.colaboradores?.length > 0) && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Equipo (Interno)</Typography>
                                {project.proyectista && <Typography><strong>Proyectista:</strong> {project.proyectista.name || project.proyectista.email}</Typography>}
                                {project.formulador && <Typography><strong>Formulador:</strong> {project.formulador.name || project.formulador.email}</Typography>}
                                {project.colaboradores && project.colaboradores.length > 0 && (
                                    <Typography><strong>Colaboradores:</strong> {project.colaboradores.map(c => c.name || c.email).join(', ')}</Typography>
                                )}
                            </Box>
                         )}
                         {(project.monto || project.lineaFinanciamiento) && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Información Financiera (Interna)</Typography>
                                {project.lineaFinanciamiento && <Typography><strong>Línea:</strong> {project.lineaFinanciamiento.nombre}</Typography>}
                                {project.programa && <Typography><strong>Programa:</strong> {project.programa.nombre}</Typography>}
                                {project.etapaActualFinanciamiento && <Typography><strong>Etapa Actual:</strong> {project.etapaActualFinanciamiento.nombre}</Typography>}
                                {project.monto && <Typography><strong>Monto ({project.tipoMoneda}):</strong> {Number(project.monto).toLocaleString('es-CL', { style: 'currency', currency: project.tipoMoneda === 'UF' ? 'CLF' : 'CLP' })} </Typography>}
                                {project.montoAdjudicado && <Typography><strong>Monto Adjudicado ($):</strong> {Number(project.montoAdjudicado).toLocaleString('es-CL', { style: 'currency', currency: 'CLP'})}</Typography>}
                                {project.codigoExpediente && <Typography><strong>Cód. Expediente:</strong> {project.codigoExpediente}</Typography>}
                                {project.codigoLicitacion && <Typography><strong>ID Licitación:</strong> {project.codigoLicitacion}</Typography>}
                                {project.fechaPostulacion && <Typography><strong>Fecha Postulación:</strong> {new Date(project.fechaPostulacion).toLocaleDateString()}</Typography>}
                            </Box>
                          )}
                         <Typography variant="h6" gutterBottom>Ubicación (Referencial)</Typography>
                         <ProjectMap />
                    </Grid>
                </Grid>
                 {/* Botón para volver */}
                 <Button variant="outlined" sx={{mt: 3}} onClick={() => navigate('/')}>
                     Volver al Listado
                 </Button>
            </Paper>
        </Container>
    );
}

export default ProjectDetailPage;