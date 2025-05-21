// ========================================================================
// INICIO: Contenido COMPLETO y FINAL para ProjectEditPage.tsx (v13 - Corregido)
// ========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Container, Box, Typography, CircularProgress, Alert, Button, Paper, Snackbar
} from '@mui/material';

import { projectApi } from '../services/projectApi';
import { lookupApi } from '../services/lookupApi';
import ProjectForm from '../components/ProjectForm';
import { projectFormSchema, ProjectFormSchemaType } from '../schemas/projectFormSchema';
import { FormOptionsResponse, Project } from '../types';
import { ApiError } from '../services/apiService';
import DOMPurify from 'dompurify';

function ProjectEditPage() {
    console.log('[ProjectEditPage] Renderizando...'); // Log inicial

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = Number(id);

    // Estados
    const [projectData, setProjectData] = useState<Project | null>(null);
    const [lookupOptions, setLookupOptions] = useState<FormOptionsResponse | null>(null); // Acepta objeto completo
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // RHF Config
    const methods = useForm<ProjectFormSchemaType>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {}, // Se poblará con reset
    });
    const { handleSubmit, control, formState: { errors }, watch, setValue, reset } = methods;

    // Carga de Datos
    const loadData = useCallback(async () => {
        console.log(`[ProjectEditPage] loadData - projectId: ${projectId}`);
        if (isNaN(projectId)) { setError("ID inválido."); setIsLoading(false); return; }
        setIsLoading(true); setError(null);
        try {
            console.log('[ProjectEditPage] Llamando APIs...');
            const [fetchedProject, fetchedLookups] = await Promise.all([
                projectApi.getProjectById(projectId),
                lookupApi.getFormOptions()
            ]);
            console.log('[ProjectEditPage] Datos recibidos:', { fetchedProject, fetchedLookups });

            // ** Importante: Verifica la estructura de fetchedLookups aquí **
             // Si fetchedLookups YA contiene directamente los arrays (estados, unidades...) usa esto:
             setLookupOptions(fetchedLookups);
             // Si fetchedLookups tiene una propiedad 'data' que contiene los arrays, usa esto:
             // setLookupOptions(fetchedLookups.data);
             // Por tu log anterior (#41), parece que NO tiene la propiedad 'data', así que la primera opción es la correcta.
             // Asegúrate que `lookupOptions` en el estado y como prop a ProjectForm sea del tipo correcto.

            setProjectData(fetchedProject);


            // Mapeo de datos (asegúrate que los nombres coincidan con tu ProjectFormSchemaType)
             const defaultFormData: Partial<ProjectFormSchemaType> = { // Usa Partial para seguridad
                 nombre: fetchedProject.nombre || '',
                 tipologiaId: fetchedProject.tipologia?.id, // Ya no necesita ?? undefined si el schema lo maneja
                 descripcion: fetchedProject.descripcion ?? null,
                 direccion: fetchedProject.direccion ?? null,
                 superficieTerreno: fetchedProject.superficieTerreno?.toString() ?? '', // Usa '' para textfield? o null? Verifica schema/componente
                 superficieEdificacion: fetchedProject.superficieEdificacion?.toString() ?? '',
                 ano: fetchedProject.ano ?? null, // null está bien para type number opcional
                 proyectoPriorizado: fetchedProject.proyectoPriorizado ?? false,
                 estadoId: fetchedProject.estado?.id ?? null, // null está bien para Select opcional
                 unidadId: fetchedProject.unidad?.id ?? null,
                 sectorId: fetchedProject.sector?.id ?? null,
                 proyectistaId: fetchedProject.proyectista?.id ?? null, // null para Autocomplete opcional
                 formuladorId: fetchedProject.formulador?.id ?? null,
                 colaboradoresIds: fetchedProject.colaboradores?.map(c => c.id) ?? [],
                 lineaFinanciamientoId: fetchedProject.lineaFinanciamiento?.id ?? null,
                 programaId: fetchedProject.programa?.id ?? null,
                 etapaFinanciamientoId: fetchedProject.etapaActualFinanciamiento?.id ?? null,
                 monto: fetchedProject.monto?.toString() ?? '',
                 tipoMoneda: fetchedProject.tipoMoneda ?? 'CLP',
                 codigoExpediente: fetchedProject.codigoExpediente ?? '', // Usa '' para textfield? o null?
                 fechaPostulacion: fetchedProject.fechaPostulacion ? new Date(fetchedProject.fechaPostulacion).toISOString().split('T')[0] : '', // '' para input date
                 montoAdjudicado: fetchedProject.montoAdjudicado?.toString() ?? '',
                 codigoLicitacion: fetchedProject.codigoLicitacion ?? '',
                 location_point: fetchedProject.location_point ?? null, // Usa null si no existe
                 area_polygon: fetchedProject.area_polygon ?? null,     // Usa null si no existe
             };

            console.log("[ProjectEditPage] defaultFormData construido:", defaultFormData);
            reset(defaultFormData as ProjectFormSchemaType); // Castea si usaste Partial
            console.log("[ProjectEditPage] Formulario reseteado.");

        } catch (err) { console.error("[ProjectEditPage] Error en loadData:", err); const errorMsg = err instanceof Error ? err.message : "Error al cargar datos."; setError(errorMsg); if (err instanceof ApiError && err.status === 404) { setError(`Error: Proyecto con ID ${projectId} no encontrado.`); } }
        finally { setIsLoading(false); console.log("[ProjectEditPage] loadData finalizado."); }
    }, [projectId, reset]); // Quita 'reset' si causa problemas, aunque debería ser estable

    useEffect(() => { loadData(); }, [loadData]);

    // Submit
    const onValidSubmit = async (formData: ProjectFormSchemaType) => {
        if (!projectData) return;

        // Sanitizar el campo descripción
        const sanitizedDescription = formData.descripcion
            ? DOMPurify.sanitize(formData.descripcion, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'img', 'br'],
                ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title']
            })
            : null;

        const dataToSend = {
            ...formData,
            descripcion: sanitizedDescription,
        };

        setIsSubmitting(true); setError(null); setSuccessMessage(null);
        console.log("Datos enviados para actualizar:", formData);
        try {
            const updatedProject = await projectApi.updateProject(projectData.id, formData);
            setSuccessMessage(`Proyecto "${updatedProject.nombre}" actualizado! Redirigiendo...`);
            setTimeout(() => { navigate(`/projects/${updatedProject.id}`); }, 1500);
        } catch (err) { console.error("Error al actualizar:", err); const errorMsg = err instanceof Error ? err.message : "Error al actualizar."; setError(errorMsg); }
        finally { setIsSubmitting(false); }
    };

    // --- Renderizado ---
    console.log('[ProjectEditPage] Render - isLoading:', isLoading, 'error:', error, 'projectData:', !!projectData, 'lookupOptions:', !!lookupOptions);

    if (isLoading) { return ( <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando datos...</Typography></Box> ); }
    if (error && !projectData) { return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container> ); }
    // Verifica ambos estados antes de proceder al render del form
    if (!projectData || !lookupOptions) { return ( <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><Typography>No se pudieron cargar los datos necesarios.</Typography></Box> ); }

    console.log('[ProjectEditPage] Renderizando Formulario...');

    return (
        <Container maxWidth="lg">
            {/* --- TÍTULO (Restaurado) --- */}
            <Typography variant="h4" component="h1" sx={{ my: 4 }}>
                Editar Proyecto: {projectData.nombre} ({projectData.codigoUnico})
            </Typography>
            {/* --------------------------- */}

            {/* Muestra error de submit */}
            {error && !isLoading && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <FormProvider {...methods}>
                <Box component="form" onSubmit={handleSubmit(onValidSubmit)} noValidate>
                    {/* Envuelve solo el FORMULARIO en Paper */}
                    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 3 }}> {/* Añade margen inferior */}
                        <ProjectForm
                            lookupOptions={lookupOptions} // Pasa el objeto completo
                            isLoading={isSubmitting}
                            isEditMode={true}
                            control={control}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                        />
                    </Paper>
                    {/* --- BOTONES (Restaurados - Fuera del Paper del form) --- */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}> {/* Ajusta margen y usa gap */}
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => navigate(-1)} // Volver atrás
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSubmitting ? 'Actualizando...' : 'Actualizar Proyecto'}
                        </Button>
                    </Box>
                    {/* ----------------------------------------------------- */}
                </Box>
            </FormProvider>

            {/* Snackbar (Restaurado con Alert - ¡Ojo! Puede dar error de transición) */}
             <Snackbar
                 open={!!successMessage || (!!error && !isLoading)} // Muestra si hay éxito O error post-carga
                 autoHideDuration={6000}
                 onClose={() => { setSuccessMessage(null); /* No limpiamos error aquí, se limpia al reintentar */ }}
                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                 // Usamos key para forzar re-renderizado si cambia el mensaje
                 key={successMessage || error}
             >
                 <Alert
                     onClose={() => { setSuccessMessage(null); setError(null); }} // Cierra y limpia ambos
                     severity={successMessage ? 'success' : 'error'}
                     sx={{ width: '100%' }}
                     variant="filled" // Variante filled se ve mejor en Snackbar
                 >
                     {successMessage || error}
                 </Alert>
             </Snackbar>

        </Container>
    );
}

export default ProjectEditPage;
// ========================================================================
// FIN: Contenido COMPLETO y FINAL para ProjectEditPage.tsx (v13 - Corregido)
// ========================================================================