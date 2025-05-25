// frontend/src/components/TaskForm.tsx (Archivo Nuevo)
import React from 'react';
import { Controller, useFormContext, Control, FieldErrors } from 'react-hook-form';
import {
    Box, Grid, TextField, Select, MenuItem, FormControl, InputLabel,
    FormHelperText, Typography, Autocomplete, CircularProgress, useTheme, Chip
} from '@mui/material';
import ReactQuill from 'react-quill-new'; // O el editor que estés usando
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV2"; 
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es';

import { TaskFormValues } from '../schemas/tagFormSchema';
import { FormOptionsResponse, UserOption, EstadoTarea, PrioridadTarea } from '../types';

// Copia o mueve quillModules y quillFormats aquí o a un archivo de utilidades
const quillModules  = {
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

interface TaskFormProps {
    // No pasamos control, errors, etc. directamente si vamos a usar FormProvider
    // y useFormContext() dentro de este componente.
    // Pero si este es un sub-componente de un formulario más grande que no usa FormProvider,
    // entonces sí necesitarías pasar control, etc.
    // Por ahora, asumamos que se usará con FormProvider en un modal.
    isSubmitting?: boolean; // Para deshabilitar campos mientras se envía
    lookupOptions: FormOptionsResponse; // Para los selects/autocompletes
}

const TaskForm: React.FC<TaskFormProps> = ({ isSubmitting, lookupOptions }) => {
    const theme = useTheme();
    // Obtenemos los métodos del formulario del FormProvider más cercano
    const { control, formState: { errors }, setValue, watch } = useFormContext<TaskFormValues>();

    // --- DEFINICIÓN DE selectedParticipantesObjects ---
    const currentParticipantesIds = watch('participantesIds') || []; // Obtiene los IDs actuales del formulario
    // Asegúrate de que lookupOptions y lookupOptions.usuarios existan antes de filtrar
    const selectedParticipantesObjects = lookupOptions?.usuarios // <--- USA 'lookupOptions'
        ? lookupOptions.usuarios.filter(user => 
            currentParticipantesIds.includes(user.id)
          )
        : []; // Si lookupOptions o lookupOptions.usuarios no existen, devuelve un array vacío

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid container spacing={3}>
                {/* Título */}
                <Grid item xs={12}>
                    <Controller
                        name="titulo"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Título de la Tarea"
                                fullWidth
                                required
                                autoFocus
                                error={!!errors.titulo}
                                helperText={errors.titulo?.message}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                </Grid>

                {/* Descripción (ReactQuill) */}
                <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.descripcion} disabled={isSubmitting}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: errors.descripcion ? theme.palette.error.main : 'text.secondary' }}>
                            Descripción
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
                                    placeholder="Detalles de la tarea..."
                                    style={{ 
                                        backgroundColor: isSubmitting ? theme.palette.action.disabledBackground : 'transparent',
                                        minHeight: '150px', display: 'flex', flexDirection: 'column' 
                                    }}
                                    readOnly={isSubmitting}
                                />
                            )}
                        />
                        {errors.descripcion && <FormHelperText>{errors.descripcion.message}</FormHelperText>}
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    {/* Asignado A (Autocomplete) */}
                    <Controller
                        name="asignadoId"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                options={lookupOptions.usuarios} // Asume que tienes usuarios en lookupOptions
                                getOptionLabel={(option: UserOption) => `${option.name || '?'} (${option.email})`}
                                value={lookupOptions.usuarios.find(u => u.id === field.value) || null}
                                onChange={(_, newValue) => {
                                    field.onChange(newValue ? newValue.id : null);
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Asignar a"
                                        fullWidth
                                        error={!!errors.asignadoId}
                                        helperText={errors.asignadoId?.message}
                                    />
                                )}
                                disabled={isSubmitting}
                                ListboxProps={{ style: { maxHeight: 200, overflow: 'auto' } }}
                            />
                        )}
                    />
                </Grid>

                {/* --- CAMPO PARTICIPANTES (Autocomplete Múltiple) --- */}
                    <Grid item xs={12} sm={6}> {/* O el tamaño que le hayas dado */}
                        <Controller
                            name="participantesIds"
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    multiple
                                    id="task-participantes-autocomplete"
                                    options={lookupOptions.usuarios}
                                    getOptionLabel={(option: UserOption) => 
                                        `${option.name || 'Usuario Desconocido'} (${option.email})`
                                    }
                                    value={selectedParticipantesObjects}
                                    onChange={(_, newValue) => {
                                        field.onChange(newValue.map(user => user.id));
                                    }}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            label="Participantes Adicionales"
                                            placeholder="Seleccionar participantes..."
                                            error={!!errors.participantesIds}
                                            helperText={errors.participantesIds ? (errors.participantesIds as any).message || 'Error en participantes' : ''}
                                        />
                                    )}
                                    renderTags={(value: readonly UserOption[], getTagProps) =>
                                        value.map((option: UserOption, index: number) => {
                                            const { key, ...tagProps } = getTagProps({ index }); // Asegúrate que getTagProps esté bien llamado
                                            return <Chip key={key} label={`${option.name || option.email}`} {...tagProps} />;
                                        })
                                    }
                                    disabled={isSubmitting}
                                    ListboxProps={{ style: { maxHeight: 200, overflow: 'auto' } }}
                                />
                            )}
                        />
                    </Grid>
                {/* --- FIN CAMPO PARTICIPANTES --- */}

                <Grid item xs={12} sm={6}>
                    {/* Fecha Plazo (DatePicker) */}
                    <Controller
                        name="fechaPlazo"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                label="Fecha Plazo"
                                value={field.value ? new Date(field.value) : null} // DatePicker espera Date o null
                                onChange={(date) => {
                                    field.onChange(date ? date.toISOString() : null);
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!errors.fechaPlazo,
                                        helperText: errors.fechaPlazo?.message,
                                        variant: 'outlined'
                                    }
                                }}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    {/* Prioridad (Select) */}
                    <FormControl fullWidth error={!!errors.prioridad} disabled={isSubmitting} variant="outlined">
                        <InputLabel id="prioridad-tarea-select-label">Prioridad</InputLabel>
                        <Controller
                            name="prioridad"
                            control={control}
                            defaultValue={null} // O un valor por defecto si lo deseas
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    labelId="prioridad-tarea-select-label"
                                    label="Prioridad"
                                    value={field.value ?? ''} // ?? '' para que el Select no se queje de valor null si no hay nada
                                >
                                    <MenuItem value=""><em>(Sin prioridad)</em></MenuItem>
                                    {Object.values(PrioridadTarea).map((prio) => (
                                        <MenuItem key={prio} value={prio}>{prio}</MenuItem>
                                    ))}
                                </Select>
                            )}
                        />
                        {errors.prioridad && <FormHelperText>{errors.prioridad.message}</FormHelperText>}
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    {/* Estado (Select) - Para CREAR, podrías querer que no sea editable o tenga un default */}
                    <FormControl fullWidth error={!!errors.estado} disabled={isSubmitting} variant="outlined">
                        <InputLabel id="estado-tarea-select-label">Estado</InputLabel>
                        <Controller
                            name="estado"
                            control={control}
                            defaultValue={EstadoTarea.PENDIENTE} // Default al crear
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    labelId="estado-tarea-select-label"
                                    label="Estado"
                                >
                                    {Object.values(EstadoTarea).map((est) => (
                                        <MenuItem key={est} value={est}>{est}</MenuItem>
                                    ))}
                                </Select>
                            )}
                        />
                        {errors.estado && <FormHelperText>{errors.estado.message}</FormHelperText>}
                    </FormControl>
                </Grid>
            </Grid>
        </LocalizationProvider>
    );
};

export default TaskForm;