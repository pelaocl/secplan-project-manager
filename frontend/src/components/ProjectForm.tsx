// frontend/src/components/ProjectForm.tsx
import React, { useState, useEffect } from 'react';
import { Controller, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
    Box, Grid, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography,
    Paper, Checkbox, FormControlLabel, Autocomplete, Chip, CircularProgress, FormLabel, RadioGroup, Radio, useTheme
} from '@mui/material';
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV2"; // Usando V2 como se resolvió
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es'; // Importación por defecto para date-fns v2

import { ProjectFormValues } from '../schemas/projectFormSchema';
import { FormOptionsResponse, ProgramaOption, UserOption, DEFAULT_TIPO_MONEDA, EstadoTarea, PrioridadTarea } from '../types';
import ProjectFormMap from './ProjectFormMap'; // Importamos el mapa
import TiptapEditor from './TiptapEditor';   // <-- IMPORTAMOS EL NUEVO EDITOR TIPTAP

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
    const theme = useTheme(); 
    const [filteredProgramas, setFilteredProgramas] = useState<ProgramaOption[]>([]);
    const selectedLineaId = watch('lineaFinanciamientoId'); 
    const currentProgramaId = watch('programaId'); 
    
    useEffect(() => {
        let newFilteredProgramas: ProgramaOption[] = [];
        if (selectedLineaId && typeof selectedLineaId === 'number' && lookupOptions && lookupOptions.programas) {
            const lineaIdNumber = Number(selectedLineaId); 
            if (!isNaN(lineaIdNumber) && lineaIdNumber > 0) {
                newFilteredProgramas = lookupOptions.programas.filter(p => p && p.lineaFinanciamientoId === lineaIdNumber);
            }
        }
        setFilteredProgramas(newFilteredProgramas); 

        const isCurrentProgramaValid = newFilteredProgramas.some(p => p.id === currentProgramaId);

        if (currentProgramaId !== null && !isCurrentProgramaValid) { 
            setValue('programaId', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        } else if ((selectedLineaId === null || selectedLineaId === '') && currentProgramaId !== null) { 
            setValue('programaId', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }
    }, [selectedLineaId, currentProgramaId, lookupOptions?.programas, setValue]);
    
    if (!lookupOptions) { 
         return (
             <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
                <Typography ml={2} variant="caption">Cargando opciones necesarias...</Typography>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid container spacing={3}> {/* Contenedor Grid Principal */}
                
                {/* --- Sección Info Básica --- */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: {xs: 2, md: 3} }}>
                        <Typography variant="h6" gutterBottom>Información Básica</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}><Controller name="nombre" control={control} render={({ field }) => ( <TextField {...field} label="Nombre del Proyecto" fullWidth required autoFocus error={!!errors.nombre} helperText={errors.nombre?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} md={4}><Controller name="ano" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Año Iniciativa" type="number" fullWidth error={!!errors.ano} helperText={errors.ano?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth required error={!!errors.tipologiaId} disabled={isLoading} variant="outlined"><InputLabel id="tipologia-select-label-pf">Tipología</InputLabel><Controller name="tipologiaId" control={control} render={({ field }) => ( <Select {...field} labelId="tipologia-select-label-pf" label="Tipología" value={field.value ?? ''}> {lookupOptions.tipologias.map((o) => ( <MenuItem key={o.id} value={o.id}>{`${o.nombre} (${o.abreviacion})`}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.tipologiaId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.estadoId} disabled={isLoading} variant="outlined"><InputLabel id="estado-select-label-pf">Estado</InputLabel><Controller name="estadoId" control={control} render={({ field }) => ( <Select {...field} labelId="estado-select-label-pf" label="Estado" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguno)</em></MenuItem> {lookupOptions.estados.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.estadoId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.unidadId} disabled={isLoading} variant="outlined"><InputLabel id="unidad-select-label-pf">Unidad Municipal</InputLabel><Controller name="unidadId" control={control} render={({ field }) => ( <Select {...field} labelId="unidad-select-label-pf" label="Unidad Municipal" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.unidades.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.unidadId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.sectorId} disabled={isLoading} variant="outlined"><InputLabel id="sector-select-label-pf">Sector</InputLabel><Controller name="sectorId" control={control} render={({ field }) => ( <Select {...field} labelId="sector-select-label-pf" label="Sector" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguno)</em></MenuItem> {lookupOptions.sectores.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.sectorId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} md={8}><Controller name="direccion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Dirección" fullWidth error={!!errors.direccion} helperText={errors.direccion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} sm={6} md={4}><Controller name="superficieTerreno" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Superficie Terreno (m²)" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.superficieTerreno} helperText={errors.superficieTerreno?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} sm={6} md={4}><Controller name="superficieEdificacion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Superficie Edificación (m²)" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.superficieEdificacion} helperText={errors.superficieEdificacion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            
                            {/* Descripción con Editor Tiptap */}
                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.descripcion} disabled={isLoading}>
                                    <Typography variant="subtitle1" sx={{ mb: 1, color: errors.descripcion ? theme.palette.error.main : 'text.secondary' }}>
                                        Descripción (Interna)
                                    </Typography>
                                    <Controller
                                        name="descripcion"
                                        control={control}
                                        render={({ field }) => (
                                            <TiptapEditor
                                                value={field.value} // TiptapEditor maneja null/undefined
                                                onChange={field.onChange} // TiptapEditor devuelve null si está vacío
                                                placeholder="Escribe la descripción del proyecto aquí..."
                                                disabled={isLoading}
                                            />
                                        )}
                                    />
                                    {errors.descripcion && (
                                        <FormHelperText>{errors.descripcion.message}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}><FormControlLabel control={ <Controller name="proyectoPriorizado" control={control} render={({ field }) => ( <Checkbox {...field} checked={field.value ?? false} disabled={isLoading} color="primary"/> )} /> } label="Proyecto Priorizado" /></Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* --- Sección Equipo --- */}
                <Grid item xs={12}> 
                    <Paper elevation={2} sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Equipo (Interno)</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><Controller name="proyectistaId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => ( <TextField {...params} label="Proyectista Asignado" error={!!errors.proyectistaId} helperText={errors.proyectistaId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                            <Grid item xs={12} sm={6}><Controller name="formuladorId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => ( <TextField {...params} label="Formulador Asignado" error={!!errors.formuladorId} helperText={errors.formuladorId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                            <Grid item xs={12}><Controller name="colaboradoresIds" control={control} render={({ field }) => ( <Autocomplete multiple options={lookupOptions.usuarios} getOptionLabel={(o) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.filter(u => Array.isArray(field.value) && field.value.includes(u.id)) ?? []} onChange={(_, v) => field.onChange(v ? v.map(u => u.id) : [])} isOptionEqualToValue={(option, value) => option.id === value.id} renderInput={(params) => ( <TextField {...params} label="Colaboradores" error={!!errors.colaboradoresIds} helperText={errors.colaboradoresIds?.message as string | undefined}/> )} renderTags={(value: readonly UserOption[], getTagProps) => value.map((option: UserOption) => { const { key, ...tagProps } = getTagProps({ index: value.indexOf(option) }); return <Chip key={option.id} variant="outlined" label={option.name || option.email} {...tagProps} />; })} disabled={isLoading}/> )}/></Grid>
                        </Grid>
                    </Paper>
                </Grid>
                
                {/* Sección Financiera */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Información Financiera (Interna)</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.lineaFinanciamientoId} disabled={isLoading} variant="outlined"><InputLabel id="linea-select-label-pf">Línea Financiamiento</InputLabel><Controller name="lineaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="linea-select-label-pf" label="Línea Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.lineas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.lineaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.programaId} disabled={isLoading || !selectedLineaId} variant="outlined"><InputLabel id="programa-select-label-pf">Programa</InputLabel><Controller name="programaId" control={control} render={({ field }) => ( <Select {...field} labelId="programa-select-label-pf" label="Programa" value={field.value ?? ''} ><MenuItem value=""><em>{selectedLineaId ? '(Ninguno)' : '(Seleccione Línea)'}</em></MenuItem>{Array.isArray(filteredProgramas) && filteredProgramas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))}</Select> )}/><FormHelperText>{errors.programaId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.etapaFinanciamientoId} disabled={isLoading} variant="outlined"><InputLabel id="etapa-select-label">Etapa Financiamiento</InputLabel><Controller name="etapaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="etapa-select-label" label="Etapa Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.etapas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.etapaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><Controller name="monto" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Monto Referencial" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.monto} helperText={errors.monto?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} sm={6} md={4}><FormControl component="fieldset" error={!!errors.tipoMoneda} disabled={isLoading}><FormLabel component="legend">Tipo Moneda</FormLabel><Controller name="tipoMoneda" control={control} defaultValue={DEFAULT_TIPO_MONEDA} render={({ field }) => ( <RadioGroup row {...field} value={field.value ?? DEFAULT_TIPO_MONEDA}> <FormControlLabel value="CLP" control={<Radio />} label="CLP" /> <FormControlLabel value="UF" control={<Radio />} label="UF" /> </RadioGroup> )}/><FormHelperText>{errors.tipoMoneda?.message}</FormHelperText></FormControl></Grid>
                            <Grid item xs={12} sm={6} md={4}><Controller name="montoAdjudicado" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Monto Adjudicado" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.montoAdjudicado} helperText={errors.montoAdjudicado?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} sm={6} md={4}><Controller name="codigoExpediente" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Código Expediente" fullWidth error={!!errors.codigoExpediente} helperText={errors.codigoExpediente?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                            <Grid item xs={12} sm={6} md={4}> <Controller name="fechaPostulacion" control={control} render={({ field }) => ( <DatePicker label="Fecha Postulación" value={field.value ? new Date(field.value) : null} onChange={(date) => { field.onChange(date ? date.toISOString() : null); }} slotProps={{ textField: { fullWidth: true, error: !!errors.fechaPostulacion, helperText: errors.fechaPostulacion?.message as string | undefined, variant: 'outlined', disabled: isLoading }}} disabled={isLoading} /> )} /> </Grid>
                            <Grid item xs={12} sm={6} md={4}><Controller name="codigoLicitacion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Código Licitación" fullWidth error={!!errors.codigoLicitacion} helperText={errors.codigoLicitacion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        </Grid>
                    </Paper>
                </Grid>

            {/* --- Sección Mapa - DESCOMENTADA --- */}
            <Grid item xs={12}> 
                <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mt: 2, mb:3 }}>
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
            {/* --- FIN SECCIÓN MAPA --- */}
        </Grid> 
        </LocalizationProvider>
    );
}

export default ProjectForm;