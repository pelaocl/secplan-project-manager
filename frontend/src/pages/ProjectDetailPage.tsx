// ========================================================================
// INICIO: Contenido COMPLETO y FINAL v9 para ProjectDetailPage.tsx (Grid v2 - MUI v5)
// ========================================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider, Button, Stack, Tooltip, IconButton, SvgIcon
} from '@mui/material';
// --- Iconos ---
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import StairsIcon from '@mui/icons-material/Stairs';
import ArticleIcon from '@mui/icons-material/Article';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
// --- Servicios y Tipos ---
import { projectApi } from '../services/projectApi';
import { Project, TipoMoneda, User } from '../types';
import ProjectMap from '../components/ProjectMap'; // Asume v corrigida con height 100%
import IconDetailItem from '../components/IconDetailItem'; // Asume v4 (sin Grid item interno)
import { ApiError } from '../services/apiService';
import { useIsAuthenticated } from '../store/authStore';

// --- Helper Functions (Sin cambios) ---
const formatCurrency = (value: string | number | null | undefined | { toNumber: () => number }, currency: TipoMoneda = 'CLP'): string => { /* ... */ let numericValue: number | null = null; if (value == null) numericValue = null; else if (typeof value === 'object' && value && typeof value.toNumber === 'function') numericValue = value.toNumber(); else { const num = Number(String(value).replace(',', '.')); if (!isNaN(num)) numericValue = num; } if (numericValue === null) return 'N/A'; try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency === 'UF' ? 'CLF' : 'CLP', minimumFractionDigits: currency === 'UF' ? 2 : 0, maximumFractionDigits: currency === 'UF' ? 4 : 0, }).format(numericValue); } catch (e) { console.error("Error formatting currency:", e); return `${currency === 'UF' ? 'UF' : '$'} ${numericValue.toLocaleString('es-CL')}`; } };
const formatDate = (dateString: string | Date | null | undefined): string => { /* ... */ if (!dateString) return 'N/A'; try { const date = (dateString instanceof Date) ? dateString : new Date(dateString); if (isNaN(date.getTime())) return 'Fecha inválida'; return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { console.error("Error formatting date:", e); return 'Fecha inválida'; } };
// -------------------------------------

// --- Componente Principal ---
function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isAuthenticated = useIsAuthenticated();

    useEffect(() => { /* ... (lógica de carga sin cambios) ... */
        const projectId = id ? parseInt(id, 10) : NaN; if (isNaN(projectId)) { setError("ID de proyecto inválido."); setLoading(false); return; }
        const loadProject = async () => { setLoading(true); setError(null); try { const projectData = await projectApi.getProjectById(projectId); setProject(projectData); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Ocurrió un error al cargar el proyecto."; setError(errorMsg); if (err instanceof ApiError && err.status === 404) { setError(`Error: Proyecto con ID ${projectId} no encontrado.`); } } finally { setLoading(false); } };
        loadProject();
    }, [id]);

    const handlePrint = () => { console.log("TODO: Imprimir ficha ID:", project?.id); alert("Impresión no implementada."); }

    // --- Renderizado Condicional (Loading/Error/Not Found - Sin cambios) ---
    if (loading) { return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: '70vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando proyecto...</Typography></Box> ); }
    if (error) { return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/projects')}> Volver al Listado </Button></Container> ); }
    if (!project) { return ( <Container maxWidth="md"><Typography sx={{ mt: 4 }}>No se encontró el proyecto.</Typography><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/projects')}> Volver al Listado </Button></Container> ); }

    // --- Renderizado Principal (Layout con Grid v2 estándar) ---
    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>

            {/* 1. Banner con Mapa y Acciones (Sin cambios) */}
            <Paper elevation={3} sx={{ height: { xs: '250px', sm: '300px', md: '350px' }, position: 'relative', overflow: 'hidden', mb: 3 }}>
                 <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}> <ProjectMap /> </Box>
                 <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)' }} />
                 <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, p: { xs: 2, md: 3 }, color: 'common.white', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
                     <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>{project.nombre}</Typography>
                     <Chip label={project.codigoUnico || '?'} size="medium" sx={{ backgroundColor: project.tipologia?.colorChip || 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '1rem', fontWeight: 'bold', textShadow: '1px 1px 1px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.5)' }} />
                 </Box>
                 <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, p: { xs: 1, sm: 2 }, display: 'flex', justifyContent: 'space-between' }}>
                      <Button variant="contained" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.6)' } }}>Volver</Button>
                      {isAuthenticated && ( <Stack direction="row" spacing={1}> <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.4)' } }}>Imprimir</Button> <Button component={Link} to={`/projects/${project.id}/edit`} variant="contained" size="small" color="primary" startIcon={<EditIcon />}>Editar</Button> </Stack> )}
                  </Box>
            </Paper>

            {/* Contenedor Grid Principal para las secciones */}
            <Grid container spacing={3}>

                 {/* 2. Bitácora (Condicional - Full Width) */}
                 {isAuthenticated && (
                    <Grid item xs={12}> {/* <-- Full width */}
                        <Paper elevation={2} sx={{ p: {xs: 2, md: 3} }}>
                            <Typography variant="h6" gutterBottom>Bitácora del Proyecto</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary"> (Funcionalidad pendiente) </Typography>
                        </Paper>
                    </Grid>
                 )}

                 {/* 3. Sección Información Básica (Full Width) */}
                 <Grid item xs={12}> {/* <-- Full width */}
                    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
                        <Typography variant="h6" gutterBottom>Información Básica</Typography>
                        <Divider sx={{ mb: 2.5 }} />
                        {/* Grid interna para 3 columnas (md=4) */}
                        <Grid container spacing={3} alignItems="flex-start"> {/* Aumentado spacing */}
                            {/* Envuelve CADA IconDetailItem en un Grid item con el tamaño deseado */}
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={BusinessIcon} label="Unidad Municipal" value={project.unidad?.nombre} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CategoryIcon} label="Tipología" value={project.tipologia?.nombre} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={InfoOutlinedIcon} label="Estado Actual" value={project.estado?.nombre} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CalendarTodayIcon} label="Año Iniciativa" value={project.ano} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa?.nombre} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Línea Financ." value={project.lineaFinanciamiento?.nombre} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Ref. (${project.tipoMoneda})`} value={formatCurrency(project.monto, project.tipoMoneda)} /> </Grid>
                            {/* Equipo */}
                            {isAuthenticated && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Proyectista" value={project.proyectista ? `${project.proyectista.name || '?'} (${project.proyectista.email})` : null} /> </Grid>}
                            {isAuthenticated && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Formulador" value={project.formulador ? `${project.formulador.name || '?'} (${project.formulador.email})` : null} /> </Grid>}
                            {isAuthenticated && project.colaboradores && project.colaboradores.length > 0 && (
                                <Grid item xs={12} md={4}> <IconDetailItem icon={GroupsIcon} label="Nº Colaboradores" value={project.colaboradores.length.toString()} /> </Grid>
                                // Si quieres mostrar la lista completa, usa xs={12} md={12}
                                // <Grid item xs={12}> <IconDetailItem icon={GroupsIcon} label="Colaboradores" value={project.colaboradores.map(c => c.name || c.email).join(', ')} /> </Grid>
                            )}
                        </Grid>
                    </Paper>
                 </Grid>

                {/* 4. Sección Descripción (REORDENADA - Full Width, si existe) */}
                {project.descripcion && (
                   <Grid item xs={12}>
                       <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
                           <Typography variant="h6" gutterBottom>Descripción (Interna)</Typography>
                           <Divider sx={{ mb: 2 }} />
                           <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{project.descripcion}</Typography>
                       </Paper>
                   </Grid>
                )}

                 {/* 5. Sección Ubicación y Superficies (REORDENADA - Full Width) */}
                 <Grid item xs={12}>
                     <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
                        <Typography variant="h6" gutterBottom>Ubicación y Superficies</Typography>
                        <Divider sx={{ mb: 2.5 }} />
                        {/* Grid interna 2 columnas (md=6) y centrado */}
                        <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start"> {/* Puedes usar flex-start o center */}
                            <Grid item xs={12} md={6}> <IconDetailItem icon={TravelExploreIcon} label="Sector" value={project.sector?.nombre} /> </Grid>
                            <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Terreno (m²)" value={project.superficieTerreno?.toLocaleString('es-CL')} /> </Grid>
                            <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Edificación (m²)" value={project.superficieEdificacion?.toLocaleString('es-CL')} /> </Grid>
                            {/* Dirección puede ir sola abajo o aquí */}
                             <Grid item xs={12} md={6}> <IconDetailItem icon={LocationOnIcon} label="Dirección" value={project.direccion} /> </Grid>
                        </Grid>
                    </Paper>
                 </Grid>

                {/* --- Grupo Lado a Lado: Financiamiento y Estado/Fechas --- */}
                {isAuthenticated && (project.montoAdjudicado != null || project.lineaFinanciamiento || project.codigoExpediente || project.fechaPostulacion || project.proyectoPriorizado != null || project.createdAt) && (
                    <>
                         {/* 6. Sección Financiamiento (md=8 => ~67%) */}
                         <Grid item xs={12} md={8}>
                             <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
                                 <Typography variant="h6" gutterBottom>Detalles Financiamiento</Typography>
                                 <Divider sx={{ mb: 2.5 }} />
                                 {/* Grid interna 2 columnas (sm=6) */}
                                 <Grid container spacing={3} alignItems="flex-start">
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={ArticleIcon} label="Línea" value={project.lineaFinanciamiento?.nombre} /> </Grid>
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa?.nombre} /> </Grid>
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={StairsIcon} label="Etapa Actual" value={project.etapaActualFinanciamiento?.nombre} /> </Grid>
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Adj. (${project.tipoMoneda})`} value={formatCurrency(project.montoAdjudicado, project.tipoMoneda)} /> </Grid>
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="Cód. Expediente" value={project.codigoExpediente} /> </Grid>
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="ID Licitación" value={project.codigoLicitacion} /> </Grid>
                                      <Grid item xs={12} sm={6}> <IconDetailItem icon={EventIcon} label="Fecha Postulación" value={formatDate(project.fechaPostulacion)} /> </Grid>
                                      {/* Dejé Monto Ref aquí por si acaso, si no, quitar */}
                                      {/* <Grid item xs={12} sm={6}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Ref. (${project.tipoMoneda})`} value={formatCurrency(project.monto, project.tipoMoneda)} /> </Grid> */}
                                 </Grid>
                             </Paper>
                         </Grid>

                        {/* 7. Sección Estado y Fechas (md=4 => ~33%) */}
                         <Grid item xs={12} md={4}>
                             <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
                                 <Typography variant="h6" gutterBottom>Estado y Fechas</Typography>
                                 <Divider sx={{ mb: 2.5 }} />
                                  {/* Grid interna para alinear verticalmente */}
                                 <Grid container spacing={3} alignItems="flex-start">
                                      <Grid item xs={12}> <IconDetailItem icon={project.proyectoPriorizado ? CheckBoxIcon : CheckBoxOutlineBlankIcon} label="Priorizado" value={project.proyectoPriorizado ? 'Sí' : 'No'} /> </Grid>
                                      <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid>
                                      <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid>
                                 </Grid>
                             </Paper>
                         </Grid>
                     </>
                )}
                {/* Fallback Fechas si no autenticado */}
                 {!isAuthenticated && ( <Grid item xs={12}> <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}> <Typography variant="h6" gutterBottom>Fechas</Typography> <Divider sx={{ mb: 3 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid> </Grid> </Paper> </Grid> )}

            </Grid> {/* Fin Grid Principal Contenido */}

        </Container>
    );
}

export default ProjectDetailPage;
// ========================================================================
// FIN: Contenido COMPLETO y FINAL v9 para ProjectDetailPage.tsx (Grid v2 - MUI v5)
// ========================================================================