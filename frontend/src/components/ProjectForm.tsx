import React, { useState, useEffect } from 'react';
// Importa los tipos necesarios de RHF para las props
import { Controller, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
    Box, Grid, TextField, Button, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography,
    Paper, Checkbox, FormControlLabel, Autocomplete, Chip, CircularProgress, FormLabel, RadioGroup, Radio
} from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // etc.

// El schema solo se importa si se usa aquí, pero la validación ocurre en la página padre
// import { projectFormSchema, ProjectFormValues } from '../schemas/projectFormSchema';
import { ProjectFormValues } from '../schemas/projectFormSchema'; // Solo necesitamos el tipo aquí
import { FormOptionsResponse, ProgramaOption, UserOption } from '../types';

// Props actualizadas: recibe herramientas de RHF desde la página padre
interface ProjectFormProps {
  isLoading?: boolean;
  lookupOptions: FormOptionsResponse | null;
  isEditMode?: boolean; // Para texto del botón (aunque el botón ahora está en el padre)
  // Props de RHF pasadas desde la página
  control: Control<ProjectFormValues>;
  errors: FieldErrors<ProjectFormValues>;
  watch: UseFormWatch<ProjectFormValues>;
  setValue: UseFormSetValue<ProjectFormValues>;
}

function ProjectForm({ isLoading = false, lookupOptions, isEditMode = false, control, errors, watch, setValue }: ProjectFormProps) {
  const [filteredProgramas, setFilteredProgramas] = useState<ProgramaOption[]>([]);
  const selectedLineaId = watch('lineaFinanciamientoId'); // Usa watch de props

  // Efecto para filtrar programas (usa watch y setValue de props)
  useEffect(() => {
    let newFilteredProgramas: ProgramaOption[] = [];
    if (lookupOptions?.programas && selectedLineaId) {
        const lineaIdNumber = Number(selectedLineaId);
        newFilteredProgramas = lookupOptions.programas.filter(p => p.lineaFinanciamientoId === lineaIdNumber);
    }
    setFilteredProgramas(newFilteredProgramas);

    // Resetea programa si es necesario (usa watch y setValue de props)
    const currentProgramaId = watch('programaId');
    if (currentProgramaId && !newFilteredProgramas.some(p => p.id === currentProgramaId)) {
        setValue('programaId', '');
    }
    // No incluir watch/setValue en las dependencias si vienen de props para evitar loops,
    // RHF se encarga de la reactividad.
  }, [selectedLineaId, lookupOptions?.programas, setValue]); // setValue es estable

  // El efecto para valores iniciales se maneja en el useForm de la página padre

  if (!lookupOptions) {
    return ( <Box display="flex" justifyContent="center" p={3}><CircularProgress /><Typography ml={2}>Cargando opciones...</Typography></Box> );
  }

  // El return AHORA NO incluye el <Box component="form"> ni el botón de submit
  return (
    <Grid container spacing={3}> {/* Contenedor principal */}

      {/* --- Sección Info Básica --- */}
      <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Información Básica</Typography>
              <Grid container spacing={2}>
                  {/* Los campos usan 'control' y 'errors' de las props */}
                  {/* Nombre */} <Grid item xs={12} md={8}><Controller name="nombre" control={control} render={({ field }) => ( <TextField {...field} label="Nombre del Proyecto" fullWidth required error={!!errors.nombre} helperText={errors.nombre?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Año */} <Grid item xs={12} md={4}><Controller name="ano" control={control} render={({ field }) => ( <TextField {...field} label="Año Iniciativa" type="number" fullWidth error={!!errors.ano} helperText={errors.ano?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Tipología */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth required error={!!errors.tipologiaId} disabled={isLoading}><InputLabel id="tipologia-select-label">Tipología</InputLabel><Controller name="tipologiaId" control={control} render={({ field }) => ( <Select {...field} labelId="tipologia-select-label" label="Tipología"> {lookupOptions.tipologias.map((o) => ( <MenuItem key={o.id} value={o.id}>{`${o.nombre} (${o.abreviacion})`}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.tipologiaId?.message}</FormHelperText></FormControl></Grid>
                  {/* Estado */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.estadoId} disabled={isLoading}><InputLabel id="estado-select-label">Estado</InputLabel><Controller name="estadoId" control={control} render={({ field }) => ( <Select {...field} labelId="estado-select-label" label="Estado" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguno)</em></MenuItem> {lookupOptions.estados.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.estadoId?.message}</FormHelperText></FormControl></Grid>
                  {/* Unidad */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.unidadId} disabled={isLoading}><InputLabel id="unidad-select-label">Unidad Municipal</InputLabel><Controller name="unidadId" control={control} render={({ field }) => ( <Select {...field} labelId="unidad-select-label" label="Unidad Municipal" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.unidades.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.unidadId?.message}</FormHelperText></FormControl></Grid>
                  {/* Sector */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.sectorId} disabled={isLoading}><InputLabel id="sector-select-label">Sector</InputLabel><Controller name="sectorId" control={control} render={({ field }) => ( <Select {...field} labelId="sector-select-label" label="Sector" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.sectores.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.sectorId?.message}</FormHelperText></FormControl></Grid>
                  {/* Dirección */} <Grid item xs={12} sm={12} md={8}><Controller name="direccion" control={control} render={({ field }) => ( <TextField {...field} label="Dirección" fullWidth error={!!errors.direccion} helperText={errors.direccion?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Sup Terreno */} <Grid item xs={12} sm={6} md={4}><Controller name="superficieTerreno" control={control} render={({ field }) => ( <TextField {...field} label="Superficie Terreno (m²)" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.superficieTerreno} helperText={errors.superficieTerreno?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Sup Edificación */} <Grid item xs={12} sm={6} md={4}><Controller name="superficieEdificacion" control={control} render={({ field }) => ( <TextField {...field} label="Superficie Edificación (m²)" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.superficieEdificacion} helperText={errors.superficieEdificacion?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Descripción */} <Grid item xs={12}><Controller name="descripcion" control={control} render={({ field }) => ( <TextField {...field} label="Descripción (Interna)" fullWidth multiline rows={3} error={!!errors.descripcion} helperText={errors.descripcion?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Priorizado */} <Grid item xs={12}><FormControlLabel control={ <Controller name="proyectoPriorizado" control={control} render={({ field }) => ( <Checkbox {...field} checked={field.value ?? false} disabled={isLoading} color="primary"/> )} /> } label="Proyecto Priorizado" /></Grid>
              </Grid>
          </Paper>
      </Grid>

      {/* --- Sección Equipo --- */}
      <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Equipo (Interno)</Typography>
              <Grid container spacing={2}>
                  {/* Proyectista */} <Grid item xs={12} sm={6}><Controller name="proyectistaId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(o, v) => o.id === v?.id} renderInput={(params) => ( <TextField {...params} label="Proyectista Asignado" error={!!errors.proyectistaId} helperText={errors.proyectistaId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                  {/* Formulador */} <Grid item xs={12} sm={6}><Controller name="formuladorId" control={control} render={({ field }) => ( <Autocomplete options={lookupOptions.usuarios} getOptionLabel={(o: UserOption) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.find(u => u.id === field.value) ?? null} onChange={(_, v) => field.onChange(v ? v.id : null)} isOptionEqualToValue={(o, v) => o.id === v?.id} renderInput={(params) => ( <TextField {...params} label="Formulador Asignado" error={!!errors.formuladorId} helperText={errors.formuladorId?.message} /> )} disabled={isLoading} /> )}/></Grid>
                  {/* Colaboradores */} <Grid item xs={12}><Controller name="colaboradoresIds" control={control} render={({ field }) => ( <Autocomplete multiple options={lookupOptions.usuarios} getOptionLabel={(o) => `${o.name || '?'} (${o.email})`} value={lookupOptions.usuarios.filter(u => field.value?.includes(u.id)) ?? []} onChange={(_, v) => field.onChange(v ? v.map(u => u.id) : [])} isOptionEqualToValue={(o, v) => o.id === v.id} renderInput={(params) => ( <TextField {...params} label="Colaboradores" error={!!errors.colaboradoresIds} helperText={errors.colaboradoresIds?.message}/> )} renderTags={(val: readonly UserOption[], getTagProps) => val.map((opt: UserOption, i: number) => ( <Chip variant="outlined" label={opt.name || opt.email} {...getTagProps({ index: i })} /> )) } disabled={isLoading}/> )}/></Grid>
              </Grid>
          </Paper>
      </Grid>

      {/* --- Sección Financiera --- */}
      <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Información Financiera (Interna)</Typography>
               <Grid container spacing={2}>
                  {/* Línea */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.lineaFinanciamientoId} disabled={isLoading}><InputLabel id="linea-select-label">Línea Financiamiento</InputLabel><Controller name="lineaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="linea-select-label" label="Línea Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.lineas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.lineaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                  {/* Programa */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.programaId} disabled={isLoading || !selectedLineaId}><InputLabel id="programa-select-label">Programa</InputLabel><Controller name="programaId" control={control} render={({ field }) => ( <Select {...field} labelId="programa-select-label" label="Programa" value={field.value ?? ''}> <MenuItem value=""><em>{selectedLineaId ? '(Ninguno)' : '(Seleccione Línea)'}</em></MenuItem> {filteredProgramas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.programaId?.message}</FormHelperText></FormControl></Grid>
                  {/* Etapa */} <Grid item xs={12} sm={6} md={4}><FormControl fullWidth error={!!errors.etapaFinanciamientoId} disabled={isLoading}><InputLabel id="etapa-select-label">Etapa Financiamiento</InputLabel><Controller name="etapaFinanciamientoId" control={control} render={({ field }) => ( <Select {...field} labelId="etapa-select-label" label="Etapa Financiamiento" value={field.value ?? ''}> <MenuItem value=""><em>(Ninguna)</em></MenuItem> {lookupOptions.etapas.map((o) => ( <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem> ))} </Select> )}/><FormHelperText>{errors.etapaFinanciamientoId?.message}</FormHelperText></FormControl></Grid>
                  {/* Monto */} <Grid item xs={12} sm={6} md={4}><Controller name="monto" control={control} render={({ field }) => ( <TextField {...field} label="Monto Referencial" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.monto} helperText={errors.monto?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Tipo Moneda */} <Grid item xs={12} sm={6} md={4}><FormControl component="fieldset" error={!!errors.tipoMoneda} disabled={isLoading}><FormLabel component="legend">Tipo Moneda</FormLabel><Controller name="tipoMoneda" control={control} render={({ field }) => ( <RadioGroup row {...field}> <FormControlLabel value="CLP" control={<Radio />} label="CLP" /> <FormControlLabel value="UF" control={<Radio />} label="UF" /> </RadioGroup> )}/><FormHelperText>{errors.tipoMoneda?.message}</FormHelperText></FormControl></Grid>
                  {/* Monto Adjudicado */} <Grid item xs={12} sm={6} md={4}><Controller name="montoAdjudicado" control={control} render={({ field }) => ( <TextField {...field} label="Monto Adjudicado" type="number" inputProps={{ step: "any" }} fullWidth error={!!errors.montoAdjudicado} helperText={errors.montoAdjudicado?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Cód Exp */} <Grid item xs={12} sm={6} md={4}><Controller name="codigoExpediente" control={control} render={({ field }) => ( <TextField {...field} label="Código Expediente" fullWidth error={!!errors.codigoExpediente} helperText={errors.codigoExpediente?.message} disabled={isLoading} /> )}/></Grid>
                  {/* Fecha Post */} <Grid item xs={12} sm={6} md={4}><Controller name="fechaPostulacion" control={control} render={({ field }) => ( <TextField {...field} label="Fecha Postulación" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.fechaPostulacion} helperText={errors.fechaPostulacion?.message} disabled={isLoading} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''} /> )}/></Grid>
                  {/* Cód Licitación */} <Grid item xs={12} sm={6} md={4}><Controller name="codigoLicitacion" control={control} render={({ field }) => ( <TextField {...field} label="Código Licitación" fullWidth error={!!errors.codigoLicitacion} helperText={errors.codigoLicitacion?.message} disabled={isLoading} /> )}/></Grid>
               </Grid>
          </Paper>
      </Grid>

      {/* El botón de submit ahora está en la página padre (ProjectCreatePage) */}

    </Grid>
  );
}

export default ProjectForm;