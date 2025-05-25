// frontend/src/pages/ProjectCreatePage.tsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback añadido si no estaba
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box, CircularProgress, Alert, Paper, Snackbar, Button } from '@mui/material';
import { useForm, FormProvider, SubmitHandler, FieldErrors, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// import { DevTool } from "@hookform/devtools"; // Sigue comentado

import { lookupApi } from '../services/lookupApi';
import { projectApi } from '../services/projectApi';
import { FormOptionsResponse, Project, DEFAULT_TIPO_MONEDA, EstadoTarea, CreateTaskFrontendInput } from '../types'; // CreateTaskFrontendInput no se usa aquí, pero Project y Enums sí
import { projectFormSchema, ProjectFormValues } from '../schemas/projectFormSchema';
import ProjectForm from '../components/ProjectForm'; // Usaremos el ProjectForm modificado para la prueba
import { ApiError } from '../services/apiService';

function ProjectCreatePage() {
    const navigate = useNavigate();
    const [lookupOptions, setLookupOptions] = useState<FormOptionsResponse | null>(null);
    const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const methods = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            nombre: '',
            tipologiaId: null, // Usar null para selects opcionales o que Zod coercerá
            estadoId: null,
            unidadId: null,
            sectorId: null,
            descripcion: null,
            direccion: '',
            superficieTerreno: null,
            superficieEdificacion: null,
            ano: null,
            proyectoPriorizado: false,
            proyectistaId: null,
            formuladorId: null,
            colaboradoresIds: [],
            lineaFinanciamientoId: null, // Usar null para que el useEffect en ProjectForm lo maneje
            programaId: null,          // Usar null
            etapaFinanciamientoId: null,
            monto: null,
            tipoMoneda: DEFAULT_TIPO_MONEDA,
            codigoExpediente: '',
            fechaPostulacion: null,
            montoAdjudicado: null,
            codigoLicitacion: '',
            location_point: null,
            area_polygon: null,
        },
    });
    const { control, handleSubmit, watch, setValue, getValues, formState: { errors }, reset } = methods;

    useEffect(() => {
        const loadOptions = async () => {
            setLoadingOptions(true);
            setLoadError(null);
            try {
                const options = await lookupApi.getFormOptions();
                setLookupOptions(options);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Error al cargar opciones del formulario.";
                console.error("[ProjectCreatePage] Error en loadOptions (mensaje):", errorMessage);
                if (err instanceof ApiError && err.data) {
                    console.error("[ProjectCreatePage] ApiError data (lookups):", JSON.stringify(err.data, null, 2));
                }
                setLoadError(errorMessage);
            } finally {
                setLoadingOptions(false);
            }
        };
        loadOptions();
    }, []);

    const onValidSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
        setIsSubmitting(true);
        setApiError(null);
        setSuccessMessage(null);
        console.log("Datos del formulario a enviar (ProjectCreatePage):", data);
        try {
            // Aquí iría la lógica de sanitización para data.descripcion si ReactQuill estuviera activo
            const newProject = await projectApi.createProject(data); // Asume que createProject espera ProjectFormValues
            setSuccessMessage(`Proyecto "${newProject.nombre}" creado con ID: ${newProject.id}. Redirigiendo...`);
            setTimeout(() => {
                navigate(`/projects/${newProject.id}`); // Redirige a la página de detalle del nuevo proyecto
            }, 2000);
        } catch (err) {
            let message = 'Ocurrió un error inesperado al crear el proyecto.';
            if (err instanceof ApiError) {
                message = err.message || `Error ${err.status}: No se pudo crear el proyecto.`;
                if(err.data && typeof err.data.message === 'string') message = err.data.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            console.error("[ProjectCreatePage] Error en onValidSubmit (mensaje):", message);
            if (err instanceof ApiError && err.data) {
                console.error("[ProjectCreatePage] ApiError data (submit):", JSON.stringify(err.data, null, 2));
            }
            setApiError(message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const onInvalidSubmit = (validationErrors: FieldErrors<ProjectFormValues>) => {
        console.error('[ProjectCreatePage] Errores de validación RHF:', validationErrors);
        setApiError("Por favor, corrija los errores en el formulario.");
    };

    if (loadingOptions) {
        return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 100 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando opciones...</Typography></Box> );
    }
    if (loadError) {
        return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>Error al cargar opciones del formulario: {loadError}</Alert></Container> );
    }
    if (!lookupOptions) { // Si no hay error pero tampoco opciones (después de cargar)
        return ( <Container maxWidth="md"><Alert severity="warning" sx={{ mt: 4 }}>No se pudieron cargar las opciones necesarias para el formulario.</Alert></Container> );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Crear Nuevo Proyecto
                </Typography>
                <FormProvider {...methods}>
                    <Box component="form" onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} noValidate>
                        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                            <ProjectForm
                                lookupOptions={lookupOptions}
                                isLoading={isSubmitting}
                                control={control} // Pasando control
                                errors={errors}   // Pasando errors
                                watch={watch}     // Pasando watch
                                setValue={setValue} // Pasando setValue
                                isEditMode={false}
                            />
                        </Paper>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                             <Button variant="outlined" color="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Crear Proyecto'}
                            </Button>
                        </Box>
                    </Box>
                </FormProvider>
            </Box>
            {/* <DevTool control={control} /> */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMessage(null)} severity="success" variant="filled" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}
export default ProjectCreatePage;