// ========================================================================
// INICIO: Contenido COMPLETO, CORREGIDO y con LOGS para ProjectForm.tsx
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================

import React, { useState, useEffect } from 'react';
import { Controller, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
    Box, Grid, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography,
    Paper, Checkbox, FormControlLabel, Autocomplete, Chip, CircularProgress, FormLabel, RadioGroup, Radio
} from '@mui/material';
import { ProjectFormValues } from '../schemas/projectFormSchema';
import { FormOptionsResponse, ProgramaOption, UserOption } from '../types'; // Removido DEFAULT_TIPO_MONEDA si no se usa aquí
import ProjectFormMap from './ProjectFormMap'; // Importa el nuevo componente de mapa

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
    const [filteredProgramas, setFilteredProgramas] = useState<ProgramaOption[]>([]);
    const selectedLineaId = watch('lineaFinanciamientoId');
    const currentProgramaId = watch('programaId'); // Necesario para la lógica de reset

    // useEffect para filtrar programas basado en la línea seleccionada
    useEffect(() => {
        // console.log('[ProjectForm useEffect] Running. selectedLineaId:', selectedLineaId, 'lookupOptions available:', !!lookupOptions); // Log Opcional
        let newFilteredProgramas: ProgramaOption[] = [];
        if (selectedLineaId && lookupOptions?.programas) {
            const lineaIdNumber = Number(selectedLineaId);
            if (!isNaN(lineaIdNumber)) {
                // Asegura que solo filtramos si tenemos un ID numérico válido
                newFilteredProgramas = lookupOptions.programas.filter(p => p && p.lineaFinanciamientoId === lineaIdNumber); // Añadido check p != null por si acaso
            } else {
                 console.warn("[ProjectForm useEffect] selectedLineaId no es un número válido:", selectedLineaId);
            }
        }
        // console.log('[ProjectForm useEffect] Setting filteredProgramas:', newFilteredProgramas); // Log Opcional
        setFilteredProgramas(newFilteredProgramas);

        // Resetea programaId SOLO si el programa actual ya no es válido para la línea seleccionada
        const isCurrentProgramaValid = newFilteredProgramas.some(p => p.id === currentProgramaId);
        if (currentProgramaId && !isCurrentProgramaValid) {
            // console.log('[ProjectForm useEffect] Resetting programaId because currentProgramaId is invalid.'); // Log Opcional
             setValue('programaId', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); // Usar null para resetear ID numérico
        } else if (!selectedLineaId && currentProgramaId) {
            // console.log('[ProjectForm useEffect] Resetting programaId because selectedLineaId is null.'); // Log Opcional
            // Resetea si se deselecciona la línea y había un programa seleccionado
             setValue('programaId', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); // Usar null
        }
    }, [selectedLineaId, currentProgramaId, lookupOptions?.programas, setValue]);


    if (!lookupOptions) {
        // Muestra loader si las opciones no han cargado
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
                <Typography ml={2}>Cargando opciones del formulario...</Typography>
            </Box>
        );
    }

    // --- LOGS DE DEPURACIÓN (antes del return) ---
    console.log('[ProjectForm Rendering] lookupOptions:', lookupOptions);
    console.log('[ProjectForm Rendering] filteredProgramas State:', filteredProgramas);
    // ----------------------------------------------

    // Renderizado con Grid v1 (ignora warnings de props v1 por ahora si es estable)
    return (
        <Grid container spacing={3}> {/* Contenedor Grid Principal */}

            {/* --- Sección Info Básica --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: {xs: 2, md: 3} }}> {/* Ajustado padding */}
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
                         {/* Descripción (Opcional, maneja null) */}
                        <Grid item xs={12}><Controller name="descripcion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Descripción (Interna)" fullWidth multiline rows={3} error={!!errors.descripcion} helperText={errors.descripcion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                         {/* Priorizado */}
                        <Grid item xs={12}><FormControlLabel control={ <Controller name="proyectoPriorizado" control={control} render={({ field }) => ( <Checkbox {...field} checked={field.value ?? false} disabled={isLoading} color="primary"/> )} /> } label="Proyecto Priorizado" /></Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* --- Sección Equipo --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: {xs: 2, md: 3}, mb: 3 }}> {/* Ajustado padding */}
                    <Typography variant="h6" gutterBottom>Equipo (Interno)</Typography>
                    <Grid container spacing={2}>
                         {/* Proyectista (Opcional) - Autocomplete maneja null */}
                        <Grid item xs={12} sm={6}><Controller name="proyectistaId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(o, v) => o.id === v?.id} renderInput={(params) => ( <TextField {...params} label="Proyectista Asignado" error={!!errors.proyectistaId} helperText={errors.proyectistaId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                         {/* Formulador (Opcional) - Autocomplete maneja null */}
                        <Grid item xs={12} sm={6}><Controller name="formuladorId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(o, v) => o.id === v?.id} renderInput={(params) => ( <TextField {...params} label="Formulador Asignado" error={!!errors.formuladorId} helperText={errors.formuladorId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                         {/* Colaboradores (Opcional) - Autocomplete multiple */}
                        <Grid item xs={12}><Controller name="colaboradoresIds" control={control} render={({ field }) => ( <Autocomplete multiple options={lookupOptions.usuarios} getOptionLabel={(o) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.filter(u => Array.isArray(field.value) && field.value.includes(u.id)) ?? []} // Asegura que field.value es array
                        onChange={(_, v) => field.onChange(v ? v.map(u => u.id) : [])} isOptionEqualToValue={(o, v) => o.id === v.id} renderInput={(params) => ( <TextField {...params} label="Colaboradores" error={!!errors.colaboradoresIds} helperText={errors.colaboradoresIds?.message}/> )}
                        renderTags={(value: readonly UserOption[], getTagProps) =>
                            value.map((option: UserOption, index: number) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return <Chip key={key} variant="outlined" label={option.name || option.email} {...tagProps} />;
                            })
                        }
                        disabled={isLoading}/> )}/></Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* --- Sección Financiera --- */}
            <Grid item xs={12}>
                 <Paper elevation={2} sx={{ p: {xs: 2, md: 3}, mb: 3 }}> {/* Ajustado padding */}
                    <Typography variant="h6" gutterBottom>Información Financiera (Interna)</Typography>
                     <Grid container spacing={2}>
                        {/* Línea Financiamiento (Opcional) */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.lineaFinanciamientoId} disabled={isLoading} variant="outlined"><InputLabel id="linea-select-label">Línea Financiamiento</InputLabel><Controller name="lineaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="linea-select-label" label="Línea Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.lineas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.lineaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                        {/* Programa (Opcional, depende de Línea) */}
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth error={!!errors.programaId} disabled={isLoading || !selectedLineaId} variant="outlined">
                                <InputLabel id="programa-select-label">Programa</InputLabel>
                                <Controller name="programaId" control={control} render={({ field }) => {
                                    // --- LOG DE DEPURACIÓN (dentro del render del Controller) ---
                                    console.log('[ProjectForm Programa Select] Rendering. Field Value:', field.value, 'filteredProgramas before map:', filteredProgramas);
                                    // --------------------------------------------------------------
                                    return (
                                        <Select
                                            {...field}
                                            labelId="programa-select-label"
                                            label="Programa"
                                            value={field.value ?? ''} // Usa string vacío para valor nulo/undefined
                                        >
                                            <MenuItem value=""><em>{selectedLineaId ? '(Ninguno)' : '(Seleccione Línea)'}</em></MenuItem>
                                            {/* Mapeo Defensivo */}
                                            {Array.isArray(filteredProgramas) && filteredProgramas
                                                .filter(o => o != null) // Filtra null/undefined
                                                .map((o) => (
                                                    <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem>
                                                ))}
                                        </Select>
                                    );
                                }}/>
                                <FormHelperText>{errors.programaId?.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        {/* Etapa Financiamiento (Opcional) */}
                        <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.etapaFinanciamientoId} disabled={isLoading} variant="outlined"><InputLabel id="etapa-select-label">Etapa Financiamiento</InputLabel><Controller name="etapaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="etapa-select-label" label="Etapa Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.etapas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.etapaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                        {/* Monto (Opcional, maneja null) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="monto" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Monto Referencial" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.monto} helperText={errors.monto?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                         {/* Tipo Moneda */}
                        <Grid item xs={12} sm={6} md={4}><FormControl component="fieldset" error={!!errors.tipoMoneda} disabled={isLoading}><FormLabel component="legend">Tipo Moneda</FormLabel><Controller name="tipoMoneda" control={control} defaultValue="CLP" /* Asegura default */ render={({ field }) => ( <RadioGroup row {...field} value={field.value ?? 'CLP'}> <FormControlLabel value="CLP" control={<Radio />} label="CLP" /> <FormControlLabel value="UF" control={<Radio />} label="UF" /> </RadioGroup> )}/><FormHelperText>{errors.tipoMoneda?.message}</FormHelperText></FormControl></Grid>
                         {/* Monto Adjudicado (Opcional, maneja null) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="montoAdjudicado" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Monto Adjudicado" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.montoAdjudicado} helperText={errors.montoAdjudicado?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                         {/* Código Expediente (Opcional, maneja null) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="codigoExpediente" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Código Expediente" fullWidth error={!!errors.codigoExpediente} helperText={errors.codigoExpediente?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                        {/* Fecha Postulación (Opcional, maneja formato) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="fechaPostulacion" control={control} render={({ field }) => ( <TextField {...field} label="Fecha Postulación" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.fechaPostulacion} helperText={errors.fechaPostulacion?.message} disabled={isLoading} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''} variant="outlined"/> )}/></Grid>
                         {/* Código Licitación (Opcional, maneja null) */}
                        <Grid item xs={12} sm={6} md={4}><Controller name="codigoLicitacion" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Código Licitación" fullWidth error={!!errors.codigoLicitacion} helperText={errors.codigoLicitacion?.message} disabled={isLoading} variant="outlined"/> )}/></Grid>
                    </Grid>
                </Paper>
            </Grid>


            {/* --- NUEVA SECCIÓN: Ubicación Geográfica (Mapa) --- */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}> {/* mt para un poco de espacio arriba */}
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Ubicación Geográfica
                    </Typography>
                    {/* +                        No necesitamos <Controller> para el mapa en sí si ProjectFormMap maneja setValue.
                        Pero sí podrías querer mostrar errores de validación de Zod aquí si los hubiera.
                    */}
                    <ProjectFormMap
                        setValue={setValue}
                        watch={watch}
                    />
                    {/* Mensajes de error para los campos del mapa (si Zod los reporta) */}
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

            {/* El botón de submit se renderiza en la página padre (ProjectEditPage o ProjectCreatePage) */}

        </Grid> // Fin Contenedor Grid Principal
    );
}

export default ProjectForm;

// ========================================================================
// FIN: Contenido COMPLETO, CORREGIDO y con LOGS para ProjectForm.tsx
// ========================================================================