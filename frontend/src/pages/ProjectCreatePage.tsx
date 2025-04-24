import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box, CircularProgress, Alert, Paper, Snackbar, Button } from '@mui/material';
import { useForm, SubmitHandler, FieldErrors, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// --- NUEVO: Importa DevTool ---
import { DevTool } from "@hookform/devtools";
// -----------------------------
import { lookupApi } from '../services/lookupApi';
import { projectApi } from '../services/projectApi';
import { FormOptionsResponse, Project, DEFAULT_TIPO_MONEDA } from '../types';
import { projectFormSchema, ProjectFormValues } from '../schemas/projectFormSchema';
import ProjectForm from '../components/ProjectForm';
import { ApiError } from '../services/apiService';

function ProjectCreatePage() {
  const navigate = useNavigate();
  const [lookupOptions, setLookupOptions] = useState<FormOptionsResponse | null>(null);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Configuración de RHF (añadimos getValues)
  const {
      control,
      handleSubmit,
      watch,
      setValue,
      getValues, // <<<--- Añadido para loguear estado crudo
      formState: { errors }
    }: UseFormReturn<ProjectFormValues> = useForm<ProjectFormValues>({
      resolver: zodResolver(projectFormSchema),
      defaultValues: {
        nombre: '', tipologiaId: '', estadoId: '', unidadId: '', sectorId: '',
        descripcion: '', direccion: '', superficieTerreno: '', superficieEdificacion: '',
        ano: '', proyectoPriorizado: false, proyectistaId: null, formuladorId: null,
        colaboradoresIds: [], lineaFinanciamientoId: '', programaId: '', etapaFinanciamientoId: '',
        monto: '', tipoMoneda: DEFAULT_TIPO_MONEDA, codigoExpediente: '', fechaPostulacion: '',
        montoAdjudicado: '', codigoLicitacion: '',
       },
  });

  // Carga de opciones (sin cambios)
  useEffect(() => {
    const loadOptions = async () => {
        setLoadingOptions(true); setLoadError(null);
        try { const options = await lookupApi.getFormOptions(); setLookupOptions(options); }
        catch (err) { console.error("...", err); const msg = "..."; setLoadError(msg); }
        finally { setLoadingOptions(false); }
    };
    loadOptions();
  }, []);

  // Handler para envío exitoso (con ambos logs)
  const onValidSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
    // Logueamos el estado crudo de RHF ANTES de enviar
    console.log('[FRONTEND] RHF Raw Values (getValues):', JSON.stringify(getValues(), null, 2));
    // Logueamos la data que pasó la validación Zod
    console.log('[FRONTEND] Data from form after Zod validation (onSubmit):', JSON.stringify(data, null, 2));

    setIsSubmitting(true); setApiError(null); setSuccessMessage(null);
    try {
      const newProject = await projectApi.createProject(data);
      setSuccessMessage(`Proyecto "${newProject.nombre}" creado (ID: ${newProject.id})`);
      setTimeout(() => { navigate('/'); }, 1500);
    } catch (err) {
        console.error("Error submitting project:", err);
        let message = 'Ocurrió un error inesperado al crear el proyecto.';
        if (err instanceof ApiError) { message = err.message || `Error ${err.status}: No se pudo crear el proyecto.`; }
        else if (err instanceof Error) { message = err.message; }
        setApiError(message);
        setIsSubmitting(false);
    }
  };

  // Handler para errores de validación (sin cambios)
  const onInvalidSubmit = (validationErrors: FieldErrors<ProjectFormValues>) => {
      console.error('[FORM ERRORS]', validationErrors);
      setApiError("Por favor, corrija los errores en el formulario.");
  };


  // Renderizado Principal
  return (
    <Container maxWidth="lg">
       <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Nuevo Proyecto
        </Typography>

        {/* Loader / Error de Carga de Opciones */}
        {loadingOptions && ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 100 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando opciones...</Typography></Box> )}
        {loadError && ( <Alert severity="error" sx={{ mt: 4 }}>Error al cargar opciones: {loadError}</Alert> )}

        {/* Formulario (se muestra solo si las opciones cargaron bien) */}
        {!loadingOptions && !loadError && lookupOptions && (
             <Box component="form" onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} noValidate>
                 {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                 <ProjectForm
                     lookupOptions={lookupOptions}
                     isLoading={isSubmitting}
                     control={control}
                     errors={errors}
                     watch={watch}
                     setValue={setValue}
                 />
                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                     <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                       {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Crear Proyecto'}
                     </Button>
                 </Box>
             </Box>
         )}
       </Box>

       {/* Renderiza las DevTools de RHF (solo se mostrarán en desarrollo) */}
       <DevTool control={control} />

       {/* Snackbar para éxito (sin cambios) */}
       <Snackbar open={!!successMessage} /* ... */ > <Alert /* ... */ >{successMessage}</Alert> </Snackbar>
    </Container>
  );
}
export default ProjectCreatePage;