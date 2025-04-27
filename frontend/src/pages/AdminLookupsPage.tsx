// frontend/src/pages/AdminLookupsPage.tsx (v2 - Añade Crear)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form'; // <-- RHF
import { zodResolver } from '@hookform/resolvers/zod'; // <-- Resolver
import {
    Container, Box, Typography, CircularProgress, Alert, Button, Paper,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider, Chip,
    Tabs, Tab, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Select, MenuItem, InputLabel, FormControl, FormHelperText // <-- Añadidos
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { lookupAdminApi, validLookupTypes, LookupType } from '../services/lookupAdminApi'; // API ahora tiene create
import { LineaFinanciamientoOption } from '../types'; // Asumiendo que tienes este tipo para el select
// --- Importa Schemas y Tipos de Formulario ---
import {
    simpleLookupFormSchema, unidadFormSchema, tipologiaFormSchema, programaFormSchema, AnyLookupFormValues
} from '../schemas/lookupFormSchema';

// Etiquetas para las pestañas (sin cambios)
const lookupLabels: Record<LookupType, string> = { /* ... */ estados: 'Estados Proyecto', unidades: 'Unidades Municipales', tipologias: 'Tipologías Proyecto', sectores: 'Sectores', lineas: 'Líneas Financiamiento', programas: 'Programas', etapas: 'Etapas Financiamiento' };
// Mapeo para seleccionar el schema correcto
const createSchemaMapping: Record<LookupType, Zod.ZodSchema<any>> = {
    estados: simpleLookupFormSchema, unidades: unidadFormSchema, tipologias: tipologiaFormSchema,
    sectores: simpleLookupFormSchema, lineas: simpleLookupFormSchema, programas: programaFormSchema, etapas: simpleLookupFormSchema,
};

function AdminLookupsPage() {
    const [currentTab, setCurrentTab] = useState<LookupType>('estados');
    const [lookupData, setLookupData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null); // Error en diálogo
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingRecord, setEditingRecord] = useState<any | null>(null); // Para modo edición futuro
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // --- Estado ADICIONAL para opciones del Select de Líneas (para form de Programa) ---
    const [lineasOptions, setLineasOptions] = useState<LineaFinanciamientoOption[]>([]);
    // ----------------------------------------------------------------------------

    // --- Configuración React Hook Form ---
    // Usamos 'any' aquí porque el schema cambiará dinámicamente
    const methods = useForm<AnyLookupFormValues>({
        // El resolver se aplicará dinámicamente al resetear/abrir diálogo
        defaultValues: { nombre: '', abreviacion: '', colorChip: '#CCCCCC', lineaFinanciamientoId: undefined },
    });
    const { control, handleSubmit, reset, formState: { errors: formStateErrors } } = methods;
    // ---------------------------------

    // Función para cargar datos del lookup actual Y las líneas si es necesario
    const loadData = useCallback(async (lookupType: LookupType) => {
        setLoading(true); setError(null); setLookupData([]);
        console.log(`[AdminLookupsPage] Loading data for: ${lookupType}`);
        try {
            const dataPromise = lookupAdminApi.fetchAll(lookupType);
            // Si estamos en la pestaña 'programas', también necesitamos las líneas para el formulario
            const lineasPromise = lookupType === 'programas' ? lookupAdminApi.fetchAll('lineas') : Promise.resolve([]);

            const [data, lineas] = await Promise.all([dataPromise, lineasPromise]);

            setLookupData(data);
            if (lookupType === 'programas') {
                setLineasOptions(lineas as LineaFinanciamientoOption[]); // Guarda las opciones
            }
        } catch (err) { /* ... manejo de error ... */
            const errorMsg = err instanceof Error ? err.message : `Error cargando ${lookupLabels[lookupType]}.`; setError(errorMsg); console.error(`Error en loadData(${lookupType}):`, err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(currentTab); }, [currentTab, loadData]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: LookupType) => { setCurrentTab(newValue); };

    // --- Manejadores de Diálogo ---
    const handleCreateClick = () => {
        const schema = createSchemaMapping[currentTab]; // Selecciona schema correcto
        setDialogMode('create');
        setEditingRecord(null);
        // Resetea con valores por defecto Y aplica el resolver correcto
        reset({ nombre: '', abreviacion: '', colorChip: '#CCCCCC', lineaFinanciamientoId: undefined }, {
            keepValues: false, // No mantener valores previos
        });
        // Necesitamos una forma de decirle a RHF que use el schema correcto ahora.
        // Esto es complejo. Un workaround es validar manualmente antes de llamar a la API
        // o re-inicializar useForm, lo cual es problemático.
        // Por ahora, confiaremos en la validación del backend y la validación visual de RHF
        // basada en el último schema con el que se reseteó (puede no ser 100% preciso si cambias rápido de tab y abres)
        // Alternativa más robusta: Usar librerías de formularios dinámicos o validar en onSubmit.
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleEditClick = (item: any) => {
        alert(`TODO: Editar ${currentTab} ID: ${item.id}`);
        // const schema = updateSchemaMapping[currentTab]; // Necesitaríamos un mapping para update
        // setDialogMode('edit');
        // setEditingRecord(item);
        // reset( mapDataToFormValues(item, currentTab), { resolver: zodResolver(schema) }); // Mapear datos y aplicar schema
        // setFormError(null);
        // setIsFormDialogOpen(true);
    };

    const handleDeleteClick = (item: any) => { alert(`TODO: Eliminar ${currentTab} ID: ${item.id}`); };
    const handleDialogClose = () => { setIsFormDialogOpen(false); setEditingRecord(null); setFormError(null); };
    // ---------------------------

    // --- Manejador de Envío (Solo Creación por ahora) ---
    const onDialogSubmit = async (data: AnyLookupFormValues) => {
        setIsSubmitting(true); setFormError(null);

        // Validar manualmente con el schema correcto para el tab actual (workaround por RHF dinámico)
        const schema = createSchemaMapping[currentTab];
        const validationResult = schema.safeParse(data);

        if (!validationResult.success) {
             // Intenta mostrar un error útil, aunque RHF ya debería mostrar en campos
             console.error("Error validación frontend:", validationResult.error.flatten());
             setFormError("Verifique los errores en el formulario.");
             setIsSubmitting(false);
             return;
        }

        // Prepara los datos a enviar (quita campos no relevantes para el tipo actual)
        const dataToSend: any = { nombre: validationResult.data.nombre };
        if (currentTab === 'unidades' || currentTab === 'tipologias') {
            dataToSend.abreviacion = (validationResult.data as UnidadFormValues | TipologiaFormValues).abreviacion;
        }
        if (currentTab === 'tipologias') {
            dataToSend.colorChip = (validationResult.data as TipologiaFormValues).colorChip;
        }
        if (currentTab === 'programas') {
            dataToSend.lineaFinanciamientoId = (validationResult.data as ProgramaFormValues).lineaFinanciamientoId;
        }


        const isEditing = dialogMode === 'edit' && editingRecord;
        if (isEditing) {
            // TODO: Implementar Update
            alert("Update no implementado");
            setIsSubmitting(false);
            return;
        }

        // --- Lógica de Creación ---
        try {
            console.log(`Llamando a create(${currentTab})`, dataToSend);
            const newRecord = await lookupAdminApi.create(currentTab, dataToSend);
            const message = `${lookupLabels[currentTab].slice(0,-1)} "${newRecord.nombre}" creado correctamente.`; // Ej: "Estado Proyecto 'Nuevo' creado..."

            setIsFormDialogOpen(false);
            setSnackbar({ open: true, message, severity: 'success' });
            loadData(currentTab); // Refresca la lista del tab actual

        } catch (err) {
            console.error(`Error en create(${currentTab}):`, err);
            const errorMsg = err instanceof Error ? err.message : `Ocurrió un error al crear.`;
            setFormError(errorMsg); // Muestra error en diálogo
        } finally {
            setIsSubmitting(false);
        }
    };
    // ----------------------------------------------------

    // --- Renderizado Lista (sin cambios estructurales) ---
    const renderListItem = (item: any, type: LookupType) => { /* ... código sin cambios ... */
        const { id, nombre, abreviacion, colorChip, lineaFinanciamientoId } = item; let secondaryTextParts = []; if (abreviacion) secondaryTextParts.push(`Abr: ${abreviacion}`); if (colorChip) secondaryTextParts.push(`Color: ${colorChip}`); if (lineaFinanciamientoId) secondaryTextParts.push(`ID Línea: ${lineaFinanciamientoId}`);
        return ( <ListItem key={id}> {type === 'tipologias' && colorChip && ( <Box sx={{ width: 24, height: 24, backgroundColor: colorChip, borderRadius: '4px', mr: 2, border: '1px solid grey' }} /> )} <ListItemText primary={nombre || 'Sin Nombre'} secondary={secondaryTextParts.length > 0 ? secondaryTextParts.join(' | ') : null} /> <ListItemSecondaryAction> <Tooltip title={`Editar ${lookupLabels[type]}`}><IconButton edge="end" onClick={() => handleEditClick(item)}><EditIcon /></IconButton></Tooltip> <Tooltip title={`Eliminar ${lookupLabels[type]}`}><IconButton edge="end" onClick={() => handleDeleteClick(item)} sx={{ ml: 1 }}><DeleteIcon color="error" /></IconButton></Tooltip> </ListItemSecondaryAction> </ListItem> );
    }
    // --------------------------------------------------

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                {/* Cabecera y Botón Crear */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}> <Typography variant="h4" component="h1"> Gestionar Listas Desplegables </Typography> <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}> Nuevo Ítem en {lookupLabels[currentTab]} </Button> </Stack>
                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}> <Tabs value={currentTab} onChange={handleTabChange} aria-label="Tipos de Lookup" variant="scrollable" scrollButtons="auto"> {validLookupTypes.map((type) => ( <Tab key={type} label={lookupLabels[type]} value={type} /> ))} </Tabs> </Box>
                {/* Contenido Pestaña */}
                {loading && (<Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>)}
                {!loading && error && (<Alert severity="error">{error}</Alert>)}
                {!loading && !error && ( <Paper elevation={2}> <List disablePadding> {lookupData.length === 0 && (<ListItem><ListItemText primary={`No hay ${lookupLabels[currentTab]} creados.`} /></ListItem>)} {lookupData.map((item, index) => ( <React.Fragment key={item.id || index}> {renderListItem(item, currentTab)} {index < lookupData.length - 1 && <Divider component="li" />} </React.Fragment> ))} </List> </Paper> )}
            </Box>

             {/* --- Diálogo para Crear/Editar Lookup --- */}
             <Dialog open={isFormDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                 <DialogTitle>{dialogMode === 'create' ? `Crear Nuevo: ${lookupLabels[currentTab]}` : `Editar: ${editingRecord?.nombre}`}</DialogTitle>
                 {/* Usamos FormProvider para pasar el contexto */}
                 <FormProvider {...methods}>
                     <Box component="form" onSubmit={handleSubmit(onDialogSubmit)} noValidate>
                         <DialogContent>
                             {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

                             {/* Campo Nombre (Siempre visible) */}
                             <Controller name="nombre" control={control} render={({ field }) => ( <TextField {...field} autoFocus margin="dense" label="Nombre" type="text" fullWidth variant="outlined" error={!!formStateErrors.nombre} helperText={formStateErrors.nombre?.message} disabled={isSubmitting}/> )}/>

                             {/* --- Campos Condicionales --- */}

                             {/* Abreviación (para Unidades y Tipologías) */}
                             {(currentTab === 'unidades' || currentTab === 'tipologias') && (
                                 <Controller name="abreviacion" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Abreviación" type="text" fullWidth variant="outlined" error={!!formStateErrors.abreviacion} helperText={formStateErrors.abreviacion?.message} disabled={isSubmitting}/> )}/>
                             )}

                             {/* Color (para Tipologías) */}
                             {currentTab === 'tipologias' && (
                                  <Controller name="colorChip" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Color Etiqueta" type="color" fullWidth variant="outlined" error={!!formStateErrors.colorChip} helperText={formStateErrors.colorChip ? formStateErrors.colorChip.message : "Selecciona un color (#rrggbb)"} disabled={isSubmitting} InputLabelProps={{ shrink: true }} sx={{ '& input[type="color"]': { height: '40px', p: '4px' } }}/> )}/>
                             )}

                              {/* Línea Financiamiento ID (para Programas) */}
                              {currentTab === 'programas' && (
                                  <Controller
                                      name="lineaFinanciamientoId"
                                      control={control}
                                      render={({ field }) => (
                                          <FormControl fullWidth margin="dense" error={!!formStateErrors.lineaFinanciamientoId} disabled={isSubmitting}>
                                              <InputLabel id="linea-financ-select-label">Línea Financiamiento Asociada</InputLabel>
                                              <Select
                                                  {...field}
                                                  labelId="linea-financ-select-label"
                                                  label="Línea Financiamiento Asociada"
                                                  value={field.value ?? ''} // Maneja undefined/null
                                                  onChange={(e) => field.onChange(Number(e.target.value) || '')} // Asegura número o ''
                                              >
                                                  <MenuItem value=""><em>Seleccione una línea</em></MenuItem>
                                                  {lineasOptions.map((linea) => (
                                                      <MenuItem key={linea.id} value={linea.id}>{linea.nombre}</MenuItem>
                                                  ))}
                                              </Select>
                                              <FormHelperText>{formStateErrors.lineaFinanciamientoId?.message}</FormHelperText>
                                          </FormControl>
                                      )}
                                  />
                              )}

                         </DialogContent>
                         <DialogActions sx={{ p: '16px 24px' }}>
                             <Button onClick={handleDialogClose} disabled={isSubmitting}>Cancelar</Button>
                             <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Crear' : 'Guardar Cambios')} </Button>
                         </DialogActions>
                     </Box>
                </FormProvider>
             </Dialog>

        {/* Snackbar para mensajes de éxito/error (VERSIÓN SIMPLIFICADA PARA PRUEBA) */}
        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            // Pasamos el mensaje directamente, sin Alert
            message={snackbar.message}
            // Podríamos añadir un Key para forzar re-render si el mensaje cambia
            key={snackbar.message} // Opcional, pero a veces ayuda con transiciones
        />
        </Container>
    );
}

export default AdminLookupsPage;