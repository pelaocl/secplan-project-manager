// frontend/src/components/ProjectForm.tsx
import React, { useState, useEffect } from 'react';
import { Controller, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import ReactQuill from 'react-quill-new';
import {
    Box, Grid, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography,
    Paper, Checkbox, FormControlLabel, Autocomplete, Chip, CircularProgress, FormLabel, RadioGroup, Radio, useTheme // useTheme importado
} from '@mui/material'; // Asegúrate que useTheme esté importado si lo usas directamente como theme.palette...
import { ProjectFormValues } from '../schemas/projectFormSchema';
import { FormOptionsResponse, ProgramaOption, UserOption } from '../types';
import ProjectFormMap from './ProjectFormMap';
// import theme from '../theme/theme'; // Si importas tu tema personalizado, asegúrate que la ruta sea correcta
                                     // o usa useTheme() de MUI como en el ejemplo de abajo.

// DEFINE QUILL CONFIGURATION OUTSIDE THE COMPONENT
const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], // Usará el handler simple de abajo
        ['clean']
      ],
      handlers: {
        image: function(this: { quill: any }) { // Handler simple para imagen
          const url = prompt('Por favor, ingrese la URL de la imagen:');
          if (url) {
            const quillInstance = this.quill;
            const range = quillInstance.getSelection(true);
            quillInstance.insertEmbed(range.index, 'image', url, 'user');
          }
        }
      }
    }
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link', 'image'
];

interface ProjectFormProps {
    isLoading?: boolean;
    lookupOptions: FormOptionsResponse | null;
    isEditMode?: boolean;
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    watch: UseFormWatch<ProjectFormValues>;
    setValue: UseFormSetValue<ProjectFormValues>;
}

function ProjectForm({ isLoading = false, lookupOptions, isEditMode = false, control, errors, watch, setValue }: ProjectFormProps) {
    const theme = useTheme(); // Obtener el tema de MUI para usarlo en sx props
    const [filteredProgramas, setFilteredProgramas] = useState<ProgramaOption[]>([]);
    const selectedLineaId = watch('lineaFinanciamientoId');
    const currentProgramaId = watch('programaId');
    
    // useEffect para filtrar programas basado en la línea seleccionada
    useEffect(() => {
        let newFilteredProgramas: ProgramaOption[] = [];
        if (selectedLineaId && lookupOptions?.programas) {
            const lineaIdNumber = Number(selectedLineaId);
            if (!isNaN(lineaIdNumber)) {
                newFilteredProgramas = lookupOptions.programas.filter(p => p && p.lineaFinanciamientoId === lineaIdNumber);
            } else {
                // console.warn("[ProjectForm useEffect] selectedLineaId no es un número válido:", selectedLineaId); // Comentado
            }
        }
        setFilteredProgramas(newFilteredProgramas);

        const isCurrentProgramaValid = newFilteredProgramas.some(p => p.id === currentProgramaId);
        if (currentProgramaId && !isCurrentProgramaValid) {
            setValue('programaId', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        } else if (!selectedLineaId && currentProgramaId) {
            setValue('programaId', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }
    }, [selectedLineaId, currentProgramaId, lookupOptions?.programas, setValue]);

    // Este es el bloque donde se reporta el error (línea ~90 en tu archivo original)
    if (!lookupOptions) {
        // Muestra loader si las opciones no han cargado
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
                <Typography ml={2}>Cargando opciones del formulario...</Typography>
            </Box>
        );
    }

    // Comentamos los logs que podrían causar problemas si lookupOptions es muy complejo
    // console.log('[ProjectForm Rendering] lookupOptions:', lookupOptions);
    // console.log('[ProjectForm Rendering] filteredProgramas State:', filteredProgramas);

    return (
        <Grid container spacing={3}> {/* Contenedor Grid Principal */}

            {/* --- Sección Info Básica --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: {xs: 2, md: 3} }}>
                    <Typography variant="h6" gutterBottom>Información Básica</Typography>
                    <Grid container spacing={2}>
                        {/* Nombre (Requerido) */}
                        <Grid item xs={12} md={8}><Controller name="nombre" control={control} render={({ field }) => ( <TextField {...field} label="Nombre del Proyecto" fullWidth required error={!!errors.nombre} helperText={errors.nombre?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Año (Opcional, maneja null) */}
                        <Grid item xs={12} md={4}><Controller name="ano" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Año Iniciativa" type="number" fullWidth error={!!errors.ano} helperText={errors.ano?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Tipología (Requerido) */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth required error={!!errors.tipologiaId} disabled={isLoading} variant="outlined"><InputLabel id="tipologia-select-label">Tipología</InputLabel><Controller name="tipologiaId" control={control} render={({ field }) => ( <Select {...field} labelId="tipologia-select-label" label="Tipología" value={field.value ?? ''}> {lookupOptions.tipologias.map((o) => ( <MenuItem key={o.id} value={o.id}>{`${o.nombre} (${o.abreviacion})`}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.tipologiaId?.message}</FormHelperText></FormControl></Grid>
                        {/* Estado (Opcional) */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.estadoId} disabled={isLoading} variant="outlined"><InputLabel id="estado-select-label">Estado</InputLabel><Controller name="estadoId" control={control} render={({ field }) => ( <Select {...field} labelId="estado-select-label" label="Estado" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguno)</em></MenuItem> {lookupOptions.estados.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.estadoId?.message}</FormHelperText></FormControl></Grid>
                        {/* Unidad (Opcional) */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.unidadId} disabled={isLoading} variant="outlined"><InputLabel id="unidad-select-label">Unidad Municipal</InputLabel><Controller name="unidadId" control={control} render={({ field }) => ( <Select {...field} labelId="unidad-select-label" label="Unidad Municipal" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.unidades.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.unidadId?.message}</FormHelperText></FormControl></Grid>
                        {/* Sector (Opcional) */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.sectorId} disabled={isLoading} variant="outlined"><InputLabel id="sector-select-label">Sector</InputLabel><Controller name="sectorId" control={control} render={({ field }) => ( <Select {...field} labelId="sector-select-label" label="Sector" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguno)</em></MenuItem> {lookupOptions.sectores.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.sectorId?.message}</FormHelperText></FormControl></Grid>
                        {/* Dirección (Opcional, maneja null) */}
                        <Grid item xs={12} md={8}><Controller name="direccion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Dirección" fullWidth error={!!errors.direccion} helperText={errors.direccion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Superficie Terreno (Opcional, maneja null) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="superficieTerreno" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Superficie Terreno (m²)" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.superficieTerreno} helperText={errors.superficieTerreno?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Superficie Edificación (Opcional, maneja null) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="superficieEdificacion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Superficie Edificación (m²)" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.superficieEdificacion} helperText={errors.superficieEdificacion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        
                        {/* Descripción con Editor de Texto Enriquecido (Opcional) */}
                        <Grid item xs={12}>
                            <FormControl fullWidth error={!!errors.descripcion} disabled={isLoading}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: errors.descripcion ? theme.palette.error.main : 'text.secondary' }}>
                                    Descripción (Interna)
                                </Typography>
                                <Controller
                                    name="descripcion"
                                    control={control}
                                    render={({ field }) => (
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value || ''}
                                            onChange={(content, delta, source, editor) => {
                                                const htmlContent = editor.getHTML();
                                                const textContent = editor.getText().trim();
                                                field.onChange(textContent ? htmlContent : null);
                                            }}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Escribe la descripción del proyecto aquí..."
                                            style={{ 
                                                backgroundColor: isLoading ? theme.palette.action.disabledBackground : 'transparent',
                                                minHeight: '200px',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                            readOnly={isLoading} 
                                        />
                                    )}
                                />
                                {errors.descripcion && (
                                    <FormHelperText>{errors.descripcion.message}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Priorizado */}
                        <Grid item xs={12}><FormControlLabel control={ <Controller name="proyectoPriorizado" control={control} render={({ field }) => ( <Checkbox {...field} checked={field.value ?? false} disabled={isLoading} color="primary"/> )} /> } label="Proyecto Priorizado" /></Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* --- Sección Equipo --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Equipo (Interno)</Typography>
                    <Grid container spacing={2}>
                        {/* Proyectista */}
                        <Grid item xs={12} sm={6}><Controller name="proyectistaId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(o, v) => o.id === v?.id} renderInput={(params) => ( <TextField {...params} label="Proyectista Asignado" error={!!errors.proyectistaId} helperText={errors.proyectistaId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                        {/* Formulador */}
                        <Grid item xs={12} sm={6}><Controller name="formuladorId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(o, v) => o.id === v?.id} renderInput={(params) => ( <TextField {...params} label="Formulador Asignado" error={!!errors.formuladorId} helperText={errors.formuladorId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                        {/* Colaboradores */}
                        <Grid item xs={12}><Controller name="colaboradoresIds" control={control} render={({ field }) => ( <Autocomplete multiple options={lookupOptions.usuarios} getOptionLabel={(o) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.filter(u => Array.isArray(field.value) && field.value.includes(u.id)) ?? []}
                        onChange={(_, v) => field.onChange(v ? v.map(u => u.id) : [])} isOptionEqualToValue={(o, v) => o.id === v.id} renderInput={(params) => ( <TextField {...params} label="Colaboradores" error={!!errors.colaboradoresIds} helperText={errors.colaboradoresIds?.message}/> )}
                        renderTags={(value: readonly UserOption[], getTagProps) =>
                            value.map((option: UserOption, index: number) => {
                                const { key, ...tagProps } = getTagProps({ index }); // Corrected key destructuring
                                return <Chip key={key} variant="outlined" label={option.name || option.email} {...tagProps} />;
                            })
                        }
                        disabled={isLoading}/> )}/></Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* --- Sección Financiera --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Información Financiera (Interna)</Typography>
                    <Grid container spacing={2}>
                        {/* Línea Financiamiento */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.lineaFinanciamientoId} disabled={isLoading} variant="outlined"><InputLabel id="linea-select-label">Línea Financiamiento</InputLabel><Controller name="lineaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="linea-select-label" label="Línea Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.lineas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.lineaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                        {/* Programa */}
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth error={!!errors.programaId} disabled={isLoading || !selectedLineaId} variant="outlined">
                                <InputLabel id="programa-select-label">Programa</InputLabel>
                                <Controller name="programaId" control={control} render={({ field }) => (
                                    <Select {...field} labelId="programa-select-label" label="Programa" value={field.value ?? ''} >
                                        <MenuItem value=""><em>{selectedLineaId ? '(Ninguno)' : '(Seleccione Línea)'}</em></MenuItem>
                                        {Array.isArray(filteredProgramas) && filteredProgramas.filter(o => o != null).map((o) => (
                                            <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                )}/>
                                <FormHelperText>{errors.programaId?.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        {/* Etapa Financiamiento */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.etapaFinanciamientoId} disabled={isLoading} variant="outlined"><InputLabel id="etapa-select-label">Etapa Financiamiento</InputLabel><Controller name="etapaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="etapa-select-label" label="Etapa Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.etapas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.etapaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                        {/* Monto */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="monto" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Monto Referencial" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.monto} helperText={errors.monto?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Tipo Moneda */}
                        <Grid item xs={12} sm={6} md={4}><FormControl component="fieldset" error={!!errors.tipoMoneda} disabled={isLoading}><FormLabel component="legend">Tipo Moneda</FormLabel><Controller name="tipoMoneda" control={control} defaultValue="CLP" render={({ field }) => ( <RadioGroup row {...field} value={field.value ?? 'CLP'}> <FormControlLabel value="CLP" control={<Radio />} label="CLP" /> <FormControlLabel value="UF" control={<Radio />} label="UF" /> </RadioGroup> )}/><FormHelperText>{errors.tipoMoneda?.message}</FormHelperText></FormControl></Grid>
                        {/* Monto Adjudicado */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="montoAdjudicado" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Monto Adjudicado" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.montoAdjudicado} helperText={errors.montoAdjudicado?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Código Expediente */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="codigoExpediente" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Código Expediente" fullWidth error={!!errors.codigoExpediente} helperText={errors.codigoExpediente?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Fecha Postulación */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="fechaPostulacion" control={control} render={({ field }) => ( <TextField {...field} label="Fecha Postulación" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.fechaPostulacion} helperText={errors.fechaPostulacion?.message} disabled={isLoading} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''} variant="outlined"/> )}/></Grid>
                        {/* Código Licitación */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="codigoLicitacion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Código Licitación" fullWidth error={!!errors.codigoLicitacion} helperText={errors.codigoLicitacion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* --- NUEVA SECCIÓN: Ubicación Geográfica (Mapa) --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Ubicación Geográfica
                    </Typography>
                    <ProjectFormMap
                        setValue={setValue}
                        watch={watch}
                    />
                    {errors.location_point && (
                        <FormHelperText error sx={{ mt: 1 }}>
                            {typeof errors.location_point.message === 'string'
                                ? errors.location_point.message
                                : 'Error en la ubicación del punto.'}
                        </FormHelperText>
                    )}
                    {errors.area_polygon && (
                        <FormHelperText error sx={{ mt: 1 }}>
                           {typeof errors.area_polygon.message === 'string'
                                ? errors.area_polygon.message
                                : 'Error en el polígono del área.'}
                        </FormHelperText>
                    )}
                </Paper>
            </Grid>
        </Grid> // Fin Contenedor Grid Principal
    );
}

export default ProjectForm;