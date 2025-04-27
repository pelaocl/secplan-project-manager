// ========================================================================
// INICIO: Contenido COMPLETO y FINAL para AdminLookupsPage.tsx (CRUD Completo)
// ========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Container, Box, Typography, CircularProgress, Alert, Button, Paper,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider, Chip,
    Tabs, Tab, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
    Select, MenuItem, InputLabel, FormControl, FormHelperText, useTheme, DialogContentText // <-- Asegura que todos estén importados
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { lookupAdminApi, validLookupTypes, LookupType } from '../services/lookupAdminApi'; // API ahora tiene create/update/delete
import { LineaFinanciamientoOption } from '../types'; // Asume tipo existe
// --- Importa Schemas y Tipos de Formulario ---
import {
    simpleLookupFormSchema, unidadFormSchema, tipologiaFormSchema, programaFormSchema, AnyLookupFormValues,
    updateSimpleLookupFormSchema, updateUnidadFormSchema, updateTipologiaFormSchema, updateProgramaFormSchema, AnyUpdateLookupFormValues
} from '../schemas/lookupFormSchema';
import { z } from 'zod';
import { ApiError } from '../services/apiService';

// Labels y mapping (sin cambios)
const lookupLabels: Record<LookupType, string> = { estados: 'Estados Proyecto', unidades: 'Unidades Municipales', tipologias: 'Tipologías Proyecto', sectores: 'Sectores', lineas: 'Líneas Financiamiento', programas: 'Programas', etapas: 'Etapas Financiamiento' };
const createSchemaMapping: Record<LookupType, z.ZodSchema<any>> = { estados: simpleLookupFormSchema, unidades: unidadFormSchema, tipologias: tipologiaFormSchema, sectores: simpleLookupFormSchema, lineas: simpleLookupFormSchema, programas: programaFormSchema, etapas: simpleLookupFormSchema, };
const updateSchemaMapping: Record<LookupType, z.ZodSchema<any>> = { estados: updateSimpleLookupFormSchema, unidades: updateUnidadFormSchema, tipologias: updateTipologiaFormSchema, sectores: updateSimpleLookupFormSchema, lineas: updateSimpleLookupFormSchema, programas: updateProgramaFormSchema, etapas: updateSimpleLookupFormSchema, };

function AdminLookupsPage() {
    const theme = useTheme();
    const [currentTab, setCurrentTab] = useState<LookupType>('estados');
    const [lookupData, setLookupData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [lineasOptions, setLineasOptions] = useState<LineaFinanciamientoOption[]>([]);

    // --- Estados para Diálogo BORRADO (Verificados) ---
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<any | null>(null); // Guarda el registro a borrar
    const [isDeleting, setIsDeleting] = useState(false); // Estado de carga para borrado
    // ---------------------------------------------

    const methods = useForm<AnyLookupFormValues | AnyUpdateLookupFormValues>({
        defaultValues: { nombre: '', abreviacion: '', colorChip: '#CCCCCC', lineaFinanciamientoId: undefined },
    });
    const { control, handleSubmit, reset, formState: { errors: formStateErrors } } = methods;

    const loadData = useCallback(async (lookupType: LookupType) => {
        setLoading(true); setError(null); setLookupData([]);
        try {
            const dataPromise = lookupAdminApi.fetchAll(lookupType);
            const lineasPromise = lookupType === 'programas' ? lookupAdminApi.fetchAll('lineas') : Promise.resolve([]);
            const [data, lineas] = await Promise.all([dataPromise, lineasPromise]);
            setLookupData(data);
            if (lookupType === 'programas') { setLineasOptions(lineas as LineaFinanciamientoOption[]); }
        } catch (err) { const errorMsg = err instanceof Error ? err.message : `Error cargando ${lookupLabels[lookupType]}.`; setError(errorMsg); console.error(`Error en loadData(${lookupType}):`, err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(currentTab); }, [currentTab, loadData]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: LookupType) => { setCurrentTab(newValue); };

    const mapApiDataToFormValues = (record: any, type: LookupType): Partial<AnyLookupFormValues> => {
        const defaults: Partial<AnyLookupFormValues> = { nombre: record?.nombre ?? '', abreviacion: record?.abreviacion ?? '', colorChip: record?.colorChip?.toUpperCase() ?? '#CCCCCC', lineaFinanciamientoId: record?.lineaFinanciamientoId ?? undefined, }; return defaults;
    }

    // --- Manejadores de Diálogo Crear/Editar ---
    const handleCreateClick = () => {
        setDialogMode('create'); setEditingRecord(null); reset(mapApiDataToFormValues({}, currentTab)); setFormError(null); setIsFormDialogOpen(true);
    };
    const handleEditClick = (item: any) => {
        setDialogMode('edit'); setEditingRecord(item); reset(mapApiDataToFormValues(item, currentTab)); setFormError(null); setIsFormDialogOpen(true);
    };
    const handleFormDialogClose = () => {
        setIsFormDialogOpen(false); setEditingRecord(null); setFormError(null);
    };
    const onDialogSubmit = async (data: AnyLookupFormValues | AnyUpdateLookupFormValues) => {
        setIsSubmitting(true); setFormError(null); const isEditing = dialogMode === 'edit' && editingRecord;
        const schema = isEditing ? updateSchemaMapping[currentTab] : createSchemaMapping[currentTab];
        const validationResult = schema.safeParse(data);
        if (!validationResult.success) { console.error("Error validación frontend:", validationResult.error.flatten()); setFormError("Verifique los errores en el formulario."); setIsSubmitting(false); return; }
        const dataToSend = validationResult.data;
        try {
            let message = ''; let resultRecord: any;
            if (isEditing) { resultRecord = await lookupAdminApi.update(currentTab, editingRecord.id, dataToSend); message = `${lookupLabels[currentTab].slice(0,-1)} "${resultRecord.nombre}" actualizado.`; }
            else { resultRecord = await lookupAdminApi.create(currentTab, dataToSend); message = `${lookupLabels[currentTab].slice(0,-1)} "${resultRecord.nombre}" creado.`; }
            setIsFormDialogOpen(false); setSnackbar({ open: true, message, severity: 'success' }); loadData(currentTab);
        } catch (err) { const errorMsg = (err instanceof ApiError && err.body?.message) ? err.body.message : (err instanceof Error ? err.message : `Ocurrió un error.`); setFormError(errorMsg); }
        finally { setIsSubmitting(false); }
    };
    // --------------------------------------------

    // --- Manejadores de Diálogo BORRADO (Completos) ---
    const handleDeleteClick = (item: any) => { // <- Recibe el item completo
        setRecordToDelete(item); // <-- Guarda el item a borrar
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => { // <-- Definición que faltaba
        setIsDeleteDialogOpen(false);
        setTimeout(() => setRecordToDelete(null), 300); // Resetea después de animación
    };

    const confirmDelete = async () => { // <-- Lógica de borrado
        if (!recordToDelete) return; setIsDeleting(true); setError(null);
        try {
            await lookupAdminApi.deleteRecord(currentTab, recordToDelete.id); // Llama a la API
            setSnackbar({ open: true, message: `${lookupLabels[currentTab].slice(0,-1)} "${recordToDelete.nombre}" eliminado.`, severity: 'success' });
            handleCloseDeleteDialog(); loadData(currentTab); // Cierra y refresca
        } catch (err) { const errorMsg = err instanceof Error ? err.message : 'Error al eliminar.'; setSnackbar({ open: true, message: errorMsg, severity: 'error' }); handleCloseDeleteDialog(); }
        finally { setIsDeleting(false); }
    };
    // ------------------------------------

    // Renderizado Lista
    const renderListItem = (item: any, type: LookupType) => { /* ... sin cambios ... */ return ( <ListItem key={item.id}> {type === 'tipologias' && item.colorChip && ( <Box sx={{ width: 24, height: 24, backgroundColor: item.colorChip, borderRadius: '4px', mr: 2, border: '1px solid grey' }} /> )} <ListItemText primary={item.nombre || 'Sin Nombre'} secondary={[item.abreviacion ? `Abr: ${item.abreviacion}`:null, item.lineaFinanciamientoId ? `ID Línea: ${item.lineaFinanciamientoId}`:null].filter(Boolean).join(' | ')} /> <ListItemSecondaryAction> <Tooltip title={`Editar ${lookupLabels[type]}`}><IconButton edge="end" aria-label="editar" onClick={() => handleEditClick(item)}><EditIcon /></IconButton></Tooltip> <Tooltip title={`Eliminar ${lookupLabels[type]}`}><IconButton edge="end" aria-label="eliminar" onClick={() => handleDeleteClick(item)} sx={{ ml: 1 }}><DeleteIcon color="error" /></IconButton></Tooltip> </ListItemSecondaryAction> </ListItem> ); }

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

              {/* Diálogo para Crear/Editar Lookup */}
              <Dialog open={isFormDialogOpen} onClose={handleFormDialogClose} maxWidth="sm" fullWidth>
                  <DialogTitle>{dialogMode === 'create' ? `Crear Nuevo: ${lookupLabels[currentTab]}` : `Editar: ${editingRecord?.nombre}`}</DialogTitle>
                  <FormProvider {...methods}> <Box component="form" onSubmit={handleSubmit(onDialogSubmit)} noValidate> <DialogContent> {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                      <Controller name="nombre" control={control} render={({ field }) => ( <TextField {...field} autoFocus margin="dense" label="Nombre" fullWidth variant="outlined" error={!!formStateErrors.nombre} helperText={formStateErrors.nombre?.message} disabled={isSubmitting}/> )}/>
                      {(currentTab === 'unidades' || currentTab === 'tipologias') && ( <Controller name="abreviacion" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Abreviación" fullWidth variant="outlined" error={!!formStateErrors.abreviacion} helperText={formStateErrors.abreviacion?.message} disabled={isSubmitting}/> )}/> )}
                      {currentTab === 'tipologias' && ( <Controller name="colorChip" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Color Etiqueta" type="color" fullWidth variant="outlined" error={!!formStateErrors.colorChip} helperText={formStateErrors.colorChip ? formStateErrors.colorChip.message : "Selecciona un color (#rrggbb)"} disabled={isSubmitting} InputLabelProps={{ shrink: true }} sx={{ '& input[type="color"]': { height: '40px', p: '4px' } }}/> )}/> )}
                      {currentTab === 'programas' && ( <Controller name="lineaFinanciamientoId" control={control} render={({ field }) => ( <FormControl fullWidth margin="dense" error={!!formStateErrors.lineaFinanciamientoId} disabled={isSubmitting}> <InputLabel id="linea-financ-select-label">Línea Financiamiento Asociada</InputLabel> <Select {...field} labelId="linea-financ-select-label" label="Línea Financiamiento Asociada" value={field.value ?? ''} onChange={(e) => field.onChange(Number(e.target.value) || '')}> <MenuItem value=""><em>Seleccione</em></MenuItem> {lineasOptions.map((linea) => ( <MenuItem key={linea.id} value={linea.id}>{linea.nombre}</MenuItem> ))} </Select> <FormHelperText>{formStateErrors.lineaFinanciamientoId?.message}</FormHelperText> </FormControl> )}/> )}
                  </DialogContent> <DialogActions sx={{ p: '16px 24px' }}> <Button onClick={handleFormDialogClose} disabled={isSubmitting}>Cancelar</Button> <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Crear' : 'Guardar Cambios')} </Button> </DialogActions> </Box> </FormProvider>
              </Dialog>

             {/* Diálogo Confirmación de Borrado (Corregido y Completo) */}
            <Dialog
                open={isDeleteDialogOpen} // Usa el estado correcto
                onClose={handleCloseDeleteDialog} // Usa el handler correcto
                aria-labelledby="delete-dialog-title"
            >
                <DialogTitle id="delete-dialog-title">Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que quieres eliminar el ítem{' '}
                        <Typography component="span" sx={{ fontWeight: 'bold' }}>
                            {recordToDelete?.nombre}
                        </Typography>
                        {' '}de la lista '{lookupLabels[currentTab]}'?
                        <br />
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting} autoFocus>
                        {isDeleting ? <CircularProgress size={20} color="inherit"/> : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

             {/* Snackbar (sin cambios) */}
             <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                  <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
             </Snackbar>

        </Container>
    );
 }

 export default AdminLookupsPage;