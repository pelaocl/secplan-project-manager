import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box, CircularProgress, Alert, Paper, Snackbar, Button } from '@mui/material';
import { useForm, SubmitHandler, FieldErrors, UseFormReturn } from 'react-hook-form'; // Importa useForm aquí
import { zodResolver } from '@hookform/resolvers/zod'; // Importa resolver
import { DevTool } from "@hookform/devtools"; // Importa DevTool
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
  const [apiError, setApiError] = useState<string | null>(null); // Renombrado
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Configuración de React Hook Form AHORA VIVE AQUÍ ---
  const {
      control,
      handleSubmit, // Función para envolver nuestro submit
      watch,      // Para observar campos (ej. lineaFinanciamientoId)
      setValue,   // Para setear campos (ej. resetear programaId)
      getValues,  // Para loguear estado crudo
      formState: { errors } // Objeto con errores de validación por campo
    }: UseFormReturn<ProjectFormValues> = useForm<ProjectFormValues>({
      resolver: zodResolver(projectFormSchema),
      defaultValues: { /* ... tus defaultValues ... */
        nombre: '', tipologiaId: '', estadoId: '', unidadId: '', sectorId: '',
        descripcion: '', direccion: '', superficieTerreno: '', superficieEdificacion: '',
        ano: '', proyectoPriorizado: false, proyectistaId: null, formuladorId: null,
        colaboradoresIds: [], lineaFinanciamientoId: '', programaId: '', etapaFinanciamientoId: '',
        monto: '', tipoMoneda: DEFAULT_TIPO_MONEDA, codigoExpediente: '', fechaPostulacion: '',
        montoAdjudicado: '', codigoLicitacion: '',
       },
  });
  // --- Fin Configuración RHF ---

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
    console.log('[FRONTEND] RHF Raw Values (getValues):', JSON.stringify(getValues(), null, 2));
    console.log('[FRONTEND] Data from form after Zod validation (onSubmit):', JSON.stringify(data, null, 2));
    setIsSubmitting(true); setApiError(null); setSuccessMessage(null);
    try {
      const newProject = await projectApi.createProject(data);
      setSuccessMessage(`Proyecto "${newProject.nombre}" creado (ID: ${newProject.id})`);
      setTimeout(() => { navigate('/'); }, 1500); // <-- ¡Mantenemos la lógica original aquí!
    } catch (err) {
      console.error("Error submitting project:", err);
      let message = 'Ocurrió un error inesperado al crear el proyecto.';
      if (err instanceof ApiError) { message = err.message || `Error ${err.status}: No se pudo crear el proyecto.`; }
      else if (err instanceof Error) { message = err.message; }
      setApiError(message);
      setIsSubmitting(false);
    }
  };

  // Handler para errores de validación (con log)
  const onInvalidSubmit = (validationErrors: FieldErrors<ProjectFormValues>) => {
      console.error('[FORM ERRORS]', validationErrors);
      setApiError("Por favor, corrija los errores en el formulario.");
  };


  // --- Renderizado Principal (ESTRUCTURA JSX CORREGIDA) ---
  return (
    <Container maxWidth="lg">
       <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Nuevo Proyecto
        </Typography>

        {/* Muestra Loader si opciones están cargando */}
        {loadingOptions && (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 100 }}>
                <CircularProgress /><Typography sx={{ ml: 2 }}>Cargando opciones...</Typography>
            </Box>
        )}

        {/* Muestra error si falló carga de opciones */}
        {loadError && !loadingOptions && (
             <Alert severity="error" sx={{ mt: 4 }}>Error al cargar opciones: {loadError}</Alert>
        )}

        {/* Renderiza el FORMULARIO solo si las opciones cargaron bien y sin error */}
        {!loadingOptions && !loadError && lookupOptions && (
             // El Box actúa como el <form> y usa el handleSubmit del hook useForm
             <Box component="form" onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} noValidate>

                 {/* Muestra error de SUBMIT (API o validación general) si existe */}
                 {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

                 {/* Renderiza el componente de formulario, pasando las props de RHF */}
                 <ProjectForm
                     lookupOptions={lookupOptions}
                     isLoading={isSubmitting}
                     control={control}
                     errors={errors}
                     watch={watch}
                     setValue={setValue}
                 />

                 {/* Botón de Envío DENTRO del form */}
                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                     <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                       {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Crear Proyecto'}
                     </Button>
                 </Box>
             </Box>
         )}
         {/* Fin del bloque del formulario */}

       </Box>
       {/* DevTools y Snackbar fuera del Box principal del contenido */}
       <DevTool control={control} />
       <Snackbar open={!!successMessage} autoHideDuration={5000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
           <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>
       </Snackbar>
    </Container>
  );
}
export default ProjectCreatePage;