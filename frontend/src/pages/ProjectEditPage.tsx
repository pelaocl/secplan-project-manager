// ========================================================================
// INICIO: Contenido completo para frontend/src/pages/ProjectEditPage.tsx
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
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
import ProjectForm from '../components/ProjectForm'; // Importa el formulario
import { projectFormSchema, ProjectFormSchemaType } from '../schemas/projectFormSchema'; // Schema Zod frontend
import { FormOptionsResponse, Project } from '../types'; // Tipos necesarios
import { ApiError } from '../services/apiService'; // Para manejo de errores API

function ProjectEditPage() {
    const { id } = useParams<{ id: string }>(); // Obtiene ID de la URL
    const navigate = useNavigate();
    const projectId = Number(id); // Convierte ID a número

    // Estados de la página
    const [projectData, setProjectData] = useState<Project | null>(null);
    const [lookupOptions, setLookupOptions] = useState<FormOptionsResponse['data'] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Carga inicial de datos
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Envío del formulario
    const [error, setError] = useState<string | null>(null); // Errores de carga o envío
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Configuración de React Hook Form
    const methods = useForm<ProjectFormSchemaType>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {}, // Inicialmente vacío, se poblará con 'reset'
    });

    const { handleSubmit, control, formState: { errors }, watch, setValue, reset } = methods;

    // --- Carga de Datos Inicial (Proyecto y Lookups) ---
    const loadData = useCallback(async () => {
        if (isNaN(projectId)) {
            setError("ID de proyecto inválido.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null); // Limpia errores previos
        try {
            // Llama a ambas APIs en paralelo para eficiencia
            const [fetchedProject, fetchedLookups] = await Promise.all([
                projectApi.getProjectById(projectId),
                lookupApi.getFormOptions() // Asume que getFormOptions devuelve { data: {...} }
            ]);

            setProjectData(fetchedProject);
            setLookupOptions(fetchedLookups); // Extrae la data

            // --- Poblar el formulario con los datos cargados ---
            // Mapea los datos del proyecto a los nombres de campo del formulario
            // ¡IMPORTANTE! Asegúrate que los nombres coincidan y maneja tipos (null, Date, etc.)
            const defaultFormData: ProjectFormSchemaType = {
                nombre: fetchedProject.nombre || '',
                tipologiaId: fetchedProject.tipologia?.id ?? undefined, // Tipología es requerida
                descripcion: fetchedProject.descripcion ?? null,
                direccion: fetchedProject.direccion ?? null,
                // Asegúrate que los decimales/números se pasen como number o string si el schema lo maneja
                superficieTerreno: fetchedProject.superficieTerreno?.toString() ?? null,
                superficieEdificacion: fetchedProject.superficieEdificacion?.toString() ?? null,
                ano: fetchedProject.ano ?? null,
                proyectoPriorizado: fetchedProject.proyectoPriorizado ?? false,
                estadoId: fetchedProject.estado?.id ?? null,
                unidadId: fetchedProject.unidad?.id ?? null,
                sectorId: fetchedProject.sector?.id ?? null,
                proyectistaId: fetchedProject.proyectista?.id ?? null,
                formuladorId: fetchedProject.formulador?.id ?? null,
                colaboradoresIds: fetchedProject.colaboradores?.map(c => c.id) ?? [],
                lineaFinanciamientoId: fetchedProject.lineaFinanciamiento?.id ?? null,
                programaId: fetchedProject.programa?.id ?? null,
                etapaFinanciamientoId: fetchedProject.etapaActualFinanciamiento?.id ?? null, // Ajusta si el nombre difiere
                monto: fetchedProject.monto?.toString() ?? null,
                tipoMoneda: fetchedProject.tipoMoneda ?? 'CLP', // Usa el default del schema si no viene
                codigoExpediente: fetchedProject.codigoExpediente ?? null,
                // Manejo de fecha: RHF espera string 'YYYY-MM-DD' o Date. API puede devolver string ISO.
                fechaPostulacion: fetchedProject.fechaPostulacion
                    ? new Date(fetchedProject.fechaPostulacion).toISOString().split('T')[0]
                    : null,
                montoAdjudicado: fetchedProject.montoAdjudicado?.toString() ?? null,
                codigoLicitacion: fetchedProject.codigoLicitacion ?? null,
            };
            console.log("Datos por defecto para el formulario:", defaultFormData);
            reset(defaultFormData); // Pobla el formulario con los datos

        } catch (err) {
            console.error("Error cargando datos para editar:", err);
            setError(err instanceof Error ? err.message : "Error al cargar los datos del proyecto.");
            if (err instanceof ApiError && err.status === 404) {
                setError(`Error: Proyecto con ID ${projectId} no encontrado.`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [projectId, reset]); // Incluye reset en dependencias

    useEffect(() => {
        loadData();
    }, [loadData]); // Llama a loadData cuando el componente se monta o projectId cambia

    // --- Manejador de Envío del Formulario ---
    const onValidSubmit = async (formData: ProjectFormSchemaType) => {
        if (!projectData) return; // No debería pasar si el form está visible

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        console.log("Datos enviados para actualizar:", formData);

        try {
            // Llama a la función de API para actualizar
            const updatedProject = await projectApi.updateProject(projectData.id, formData);
            setSuccessMessage(`Proyecto "${updatedProject.nombre}" actualizado correctamente!`);

            // Opcional: Redirigir después de un corto tiempo
            setTimeout(() => {
                 // Redirige a la lista o a la página de detalles del proyecto actualizado
                 navigate(`/projects/${updatedProject.id}`); // O a '/projects'
            }, 1500); // Espera 1.5 segundos

        } catch (err) {
            console.error("Error al actualizar proyecto:", err);
            const errorMsg = err instanceof Error ? err.message : "Ocurrió un error al actualizar.";
            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Renderizado ---
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando datos del proyecto...</Typography>
            </Box>
        );
    }

    // Muestra error de carga si ocurrió antes de renderizar el form
    if (error && !projectData) {
        return (
             <Container maxWidth="md">
                 <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
             </Container>
        );
    }

    // Si projectData o lookupOptions aún no están listos (poco probable aquí, pero seguro)
     if (!projectData || !lookupOptions) {
         return (
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                 <Typography>No se pudieron cargar los datos necesarios.</Typography>
             </Box>
         );
     }


    return (
        <Container maxWidth="lg">
            <Typography variant="h4" component="h1" sx={{ my: 4 }}>
                Editar Proyecto: {projectData.nombre} ({projectData.codigoUnico})
            </Typography>

            {/* Muestra error de envío encima del formulario */}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Usa FormProvider para pasar methods (control, errors, etc) implícitamente si ProjectForm usa useFormContext */}
            {/* Si ProjectForm NO usa useFormContext, simplemente pasa las props directamente */}
             <FormProvider {...methods}>
                 <Box component="form" onSubmit={handleSubmit(onValidSubmit)} noValidate>
                     <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>

                        {/* Renderiza el componente de formulario reutilizable */}
                        <ProjectForm
                            lookupOptions={lookupOptions}
                            isLoading={isSubmitting} // Pasa el estado de envío
                            isEditMode={true} // Indica que estamos en modo edición
                            // Pasa explícitamente las props que necesita ProjectForm
                            control={control}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                        />

                        {/* Botón de Envío (Responsabilidad de la página) */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting} // Deshabilita mientras se envía
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {isSubmitting ? 'Actualizando...' : 'Actualizar Proyecto'}
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                sx={{ ml: 2 }}
                                onClick={() => navigate(-1)} // Botón para volver atrás
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                        </Box>
                     </Paper>
                 </Box>
            </FormProvider>

            {/* Snackbar para mensaje de éxito */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage(null)}
                message={successMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Container>
    );
}

export default ProjectEditPage; // Necesario para React.lazy

// ========================================================================
// FIN: Contenido completo para frontend/src/pages/ProjectEditPage.tsx
// ========================================================================