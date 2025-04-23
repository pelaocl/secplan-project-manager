import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box, TextField, Button, Grid, MenuItem, Select, InputLabel, FormControl, FormHelperText,
    Checkbox, FormControlLabel, Typography, FormGroup, Autocomplete, Chip
} from '@mui/material';
import { z } from 'zod';
import { projectFormSchema, ProjectFormValues } from '../schemas/projectFormSchema'; // Import frontend Zod schema
import { lookupApi } from '../services/lookupApi'; // Assume lookupApi exists
import { User } from '../types'; // Shared types

interface LookupOptions {
    estados: any[];
    unidades: any[];
    tipologias: any[];
    sectores: any[];
    lineas: any[];
    programas: any[]; // Filter based on selected Linea
    etapas: any[];
    usuarios: User[]; // For asignaciones
}

interface ProjectFormProps {
    onSubmit: SubmitHandler<ProjectFormValues>;
    initialValues?: Partial<ProjectFormValues>; // For editing
    isLoading?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, initialValues = {}, isLoading = false }) => {
    const [lookupOptions, setLookupOptions] = useState<LookupOptions | null>(null);
    const [loadingLookups, setLoadingLookups] = useState(true);
    const [filteredProgramas, setFilteredProgramas] = useState<any[]>([]);

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            nombre: initialValues.nombre ?? '',
            descripcion: initialValues.descripcion ?? '', // Use '' for controlled inputs
            direccion: initialValues.direccion ?? '',
            superficieTerreno: initialValues.superficieTerreno ?? '', // Keep as string for input, Zod preprocesses
            superficieEdificacion: initialValues.superficieEdificacion ?? '',
            ano: initialValues.ano ?? '',
            proyectoPriorizado: initialValues.proyectoPriorizado ?? false,
            estadoId: initialValues.estadoId ?? '', // Use '' for Select default if no value
            unidadId: initialValues.unidadId ?? '',
            tipologiaId: initialValues.tipologiaId ?? '', // Required field
            sectorId: initialValues.sectorId ?? '',
            proyectistaId: initialValues.proyectistaId ?? '',
            formuladorId: initialValues.formuladorId ?? '',
            colaboradoresIds: initialValues.colaboradoresIds ?? [],
            lineaFinanciamientoId: initialValues.lineaFinanciamientoId ?? '',
            programaId: initialValues.programaId ?? '', // Needs filtering
            etapaFinanciamientoId: initialValues.etapaFinanciamientoId ?? '',
            monto: initialValues.monto ?? '',
            tipoMoneda: initialValues.tipoMoneda ?? 'CLP',
            codigoExpediente: initialValues.codigoExpediente ?? '',
            fechaPostulacion: initialValues.fechaPostulacion ?? '', // Handle Date input type
            montoAdjudicado: initialValues.montoAdjudicado ?? '',
            codigoLicitacion: initialValues.codigoLicitacion ?? '',
        },
    });

    // Fetch lookup options on mount
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                setLoadingLookups(true);
                const data = await lookupApi.getFormOptions(); // Your API call function
                setLookupOptions(data);
                // Set initial filtered programs if editing and linea is selected
                if (initialValues.lineaFinanciamientoId && data.programas) {
                     setFilteredProgramas(
                         data.programas.filter(p => p.lineaFinanciamientoId === initialValues.lineaFinanciamientoId)
                     );
                 } else if (data.programas) {
                    // Or show all initially if needed, depends on UX preference
                    // setFilteredProgramas(data.programas);
                 }

            } catch (error) {
                console.error("Error fetching lookup options:", error);
                // Handle error display
            } finally {
                setLoadingLookups(false);
            }
        };
        fetchLookups();
    }, [initialValues.lineaFinanciamientoId]); // Re-run if initial linea changes? Usually only needed once.


    // Watch for changes in Linea Financiamiento to filter Programas
    const selectedLineaId = watch('lineaFinanciamientoId');
    useEffect(() => {
        if (lookupOptions?.programas && selectedLineaId) {
            const numberLineaId = parseInt(selectedLineaId as string, 10); // Ensure number for comparison
            setFilteredProgramas(
                lookupOptions.programas.filter(p => p.lineaFinanciamientoId === numberLineaId)
            );
        } else {
            setFilteredProgramas([]); // Clear if no linea selected
        }
        // Optional: Reset programaId if linea changes
        // resetField('programaId'); // if you want to clear selection
    }, [selectedLineaId, lookupOptions?.programas]);


    if (loadingLookups) {
        return <CircularProgress />;
    }
    if (!lookupOptions) {
         return <Typography color="error">Error al cargar opciones del formulario.</Typography>
    }

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            <Grid container spacing={3}>
                {/* --- Basic Info Section --- */}
                <Grid item xs={12}><Typography variant="h6">Información Básica</Typography></Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Controller
                        name="nombre"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Nombre del Proyecto *" required fullWidth error={!!errors.nombre} helperText={errors.nombre?.message} />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                     <Controller
                         name="tipologiaId"
                         control={control}
                         render={({ field }) => (
                             <FormControl fullWidth required error={!!errors.tipologiaId}>
                                 <InputLabel id="tipologia-label">Tipología *</InputLabel>
                                 <Select labelId="tipologia-label" label="Tipología *" {...field} >
                                     <MenuItem value=""><em>Seleccione...</em></MenuItem>
                                     {lookupOptions.tipologias.map((tipo) => (
                                         <MenuItem key={tipo.id} value={tipo.id}>{tipo.nombre}</MenuItem>
                                     ))}
                                 </Select>
                                 <FormHelperText>{errors.tipologiaId?.message}</FormHelperText>
                             </FormControl>
                         )}
                     />
                 </Grid>
                 <Grid item xs={12} sm={6} md={4}>
                     <Controller
                         name="estadoId"
                         control={control}
                         render={({ field }) => (
                             <FormControl fullWidth error={!!errors.estadoId}>
                                 <InputLabel id="estado-label">Estado</InputLabel>
                                 <Select labelId="estado-label" label="Estado" {...field} >
                                      <MenuItem value=""><em>(Ninguno)</em></MenuItem>
                                     {lookupOptions.estados.map((est) => (
                                         <MenuItem key={est.id} value={est.id}>{est.nombre}</MenuItem>
                                     ))}
                                 </Select>
                                  <FormHelperText>{errors.estadoId?.message}</FormHelperText>
                             </FormControl>
                         )}
                     />
                 </Grid>
                 {/* ... Add other basic fields: direccion, superficieTerreno, superficieEdificacion, ano, unidadId, sectorId ... */}
                 <Grid item xs={12}>
                      <Controller
                          name="descripcion"
                          control={control}
                          render={({ field }) => (
                              <TextField {...field} label="Descripción (Interna)" multiline rows={3} fullWidth error={!!errors.descripcion} helperText={errors.descripcion?.message} />
                          )}
                      />
                  </Grid>
                  <Grid item xs={12}>
                     <FormGroup>
                         <FormControlLabel
                             control={
                                 <Controller
                                     name="proyectoPriorizado"
                                     control={control}
                                     render={({ field }) => (
                                         <Checkbox {...field} checked={field.value} />
                                     )}
                                 />
                             }
                             label="Proyecto Priorizado"
                         />
                     </FormGroup>
                 </Grid>


                {/* --- Equipo Section --- */}
                <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Equipo (Interno)</Typography></Grid>
                 <Grid item xs={12} sm={6}>
                     <Controller
                         name="proyectistaId"
                         control={control}
                         render={({ field }) => (
                            <Autocomplete
                                options={lookupOptions.usuarios}
                                getOptionLabel={(option) => option.name ? `${option.name} (${option.email})` : option.email} // Adjust label as needed
                                value={lookupOptions.usuarios.find(u => u.id === field.value) || null} // Find the object
                                onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')} // Pass only the ID back
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Proyectista"
                                        fullWidth
                                        error={!!errors.proyectistaId}
                                        helperText={errors.proyectistaId?.message}
                                    />
                                )}
                             />
                         )}
                     />
                 </Grid>
                 <Grid item xs={12} sm={6}>
                      <Controller
                          name="formuladorId"
                          control={control}
                          render={({ field }) => (
                             <Autocomplete
                                options={lookupOptions.usuarios}
                                getOptionLabel={(option) => option.name ? `${option.name} (${option.email})` : option.email}
                                value={lookupOptions.usuarios.find(u => u.id === field.value) || null}
                                onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Formulador"
                                        fullWidth
                                        error={!!errors.formuladorId}
                                        helperText={errors.formuladorId?.message}
                                    />
                                )}
                              />
                          )}
                      />
                  </Grid>
                 <Grid item xs={12}>
                      <Controller
                          name="colaboradoresIds"
                          control={control}
                          render={({ field }) => (
                              <Autocomplete
                                  multiple
                                  options={lookupOptions.usuarios}
                                  getOptionLabel={(option) => option.name ? `${option.name} (${option.email})` : option.email}
                                  value={lookupOptions.usuarios.filter(u => field.value?.includes(u.id)) || []}
                                  onChange={(_, newValue) => field.onChange(newValue.map(v => v.id))} // Pass array of IDs
                                  isOptionEqualToValue={(option, value) => option.id === value.id}
                                  renderInput={(params) => (
                                      <TextField
                                          {...params}
                                          label="Colaboradores"
                                          fullWidth
                                          error={!!errors.colaboradoresIds}
                                          helperText={errors.colaboradoresIds?.message}
                                      />
                                  )}
                                  renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                      <Chip variant="outlined" label={option.name || option.email} {...getTagProps({ index })} />
                                    ))
                                  }
                              />
                          )}
                      />
                  </Grid>


                {/* --- Financial Info Section --- */}
                <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Información Financiera (Interna)</Typography></Grid>
                 <Grid item xs={12} sm={6}>
                     <Controller
                         name="lineaFinanciamientoId"
                         control={control}
                         render={({ field }) => (
                             <FormControl fullWidth error={!!errors.lineaFinanciamientoId}>
                                 <InputLabel id="linea-label">Línea Financiamiento</InputLabel>
                                 <Select labelId="linea-label" label="Línea Financiamiento" {...field} >
                                     <MenuItem value=""><em>(Ninguna)</em></MenuItem>
                                     {lookupOptions.lineas.map((lin) => (
                                         <MenuItem key={lin.id} value={lin.id}>{lin.nombre}</MenuItem>
                                     ))}
                                 </Select>
                                 <FormHelperText>{errors.lineaFinanciamientoId?.message}</FormHelperText>
                             </FormControl>
                         )}
                     />
                 </Grid>
                 <Grid item xs={12} sm={6}>
                      <Controller
                          name="programaId"
                          control={control}
                          render={({ field }) => (
                              <FormControl fullWidth error={!!errors.programaId} disabled={!selectedLineaId}>
                                  <InputLabel id="programa-label">Programa</InputLabel>
                                  <Select labelId="programa-label" label="Programa" {...field} >
                                      <MenuItem value=""><em>{selectedLineaId ? '(Ninguno)' : '(Seleccione Línea Primero)'}</em></MenuItem>
                                      {filteredProgramas.map((prog) => (
                                          <MenuItem key={prog.id} value={prog.id}>{prog.nombre}</MenuItem>
                                      ))}
                                  </Select>
                                  <FormHelperText>{errors.programaId?.message}</FormHelperText>
                              </FormControl>
                          )}
                      />
                  </Grid>
                 {/* ... Add other financial fields: etapaFinanciamientoId, monto, tipoMoneda, codigoExpediente, fechaPostulacion, montoAdjudicado, codigoLicitacion ... */}
                 {/* Remember input type="date" for fechaPostulacion, "number" for numerical fields with step="any" for decimals */}


                {/* --- Submit Button --- */}
                <Grid item xs={12} sx={{ textAlign: 'right', mt: 3 }}>
                    <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : (initialValues.id ? 'Actualizar Proyecto' : 'Crear Proyecto')}
                    </Button>
                    {/* Optional: Cancel button */}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProjectForm;