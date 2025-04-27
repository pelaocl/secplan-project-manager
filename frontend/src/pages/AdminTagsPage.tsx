// ========================================================================
// INICIO: Contenido COMPLETO y VERIFICADO para AdminTagsPage.tsx (v4 - CRUD Completo)
// ========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Container, Box, Typography, CircularProgress, Alert, Button, Paper,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider, Chip,
    Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
    DialogContentText, useTheme // <--- Añadido useTheme para getContrastText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { tagApi } from '../services/tagApi'; // API incluye ahora create/update/delete
import { Etiqueta } from '../types';
import { tagFormSchema, TagFormValues } from '../schemas/tagFormSchema';

function AdminTagsPage() {
    const theme = useTheme(); // Hook para acceder al tema (para getContrastText)
    const [tags, setTags] = useState<Etiqueta[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // Error general
    const [formError, setFormError] = useState<string | null>(null); // Error en diálogo C/U
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false); // Para diálogo Crear/Editar
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingTag, setEditingTag] = useState<Etiqueta | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Para form C/U
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // --- Estados para Diálogo BORRADO ---
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<Etiqueta | null>(null);
    const [isDeleting, setIsDeleting] = useState(false); // Para botón Borrar
    // --------------------------------------

    const methods = useForm<TagFormValues>({
        resolver: zodResolver(tagFormSchema),
        defaultValues: { nombre: '', color: '#CCCCCC' }
    });
    const { control, handleSubmit, reset, formState: { errors: formStateErrors } } = methods;

    const loadTags = useCallback(async () => {
        setLoading(true); setError(null);
        try { const fetchedTags = await tagApi.fetchAllTags(); setTags(fetchedTags); }
        catch (err) { setError(err instanceof Error ? err.message : 'Error cargando etiquetas.'); console.error("Error en loadTags:", err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadTags(); }, [loadTags]);

    // --- Manejadores de Diálogo Crear/Editar ---
    const handleCreateClick = () => {
        setDialogMode('create'); setEditingTag(null); reset({ nombre: '', color: '#CCCCCC' }); setFormError(null); setIsFormDialogOpen(true);
    };
    const handleEditClick = (tag: Etiqueta) => {
        setDialogMode('edit'); setEditingTag(tag); reset({ nombre: tag.nombre, color: tag.color }); setFormError(null); setIsFormDialogOpen(true);
    };
    const handleFormDialogClose = () => {
        setIsFormDialogOpen(false); setEditingTag(null); setFormError(null);
    };
    const onDialogSubmit = async (data: TagFormValues) => {
        setIsSubmitting(true); setFormError(null); const isEditing = dialogMode === 'edit' && editingTag;
        try {
            let message = ''; let updatedOrNewTag: Etiqueta;
            if (isEditing) {
                updatedOrNewTag = await tagApi.updateTag(editingTag.id, data); message = `Etiqueta "${updatedOrNewTag.nombre}" actualizada.`;
            } else {
                updatedOrNewTag = await tagApi.createTag(data); message = `Etiqueta "${updatedOrNewTag.nombre}" creada.`;
            }
            setIsFormDialogOpen(false); setSnackbar({ open: true, message, severity: 'success' }); loadTags();
        } catch (err) {
            console.error(`Error en ${dialogMode}Tag:`, err);
            const errorMsg = err instanceof Error ? err.message : `Ocurrió un error.`; setFormError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };
    // --------------------------------------------

    // --- Manejadores de Diálogo BORRADO ---
    const handleDeleteClick = (tag: Etiqueta) => {
        setTagToDelete(tag); setIsDeleteDialogOpen(true);
    };
    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false); setTagToDelete(null);
    };
    const confirmDelete = async () => {
        if (!tagToDelete) return; setIsDeleting(true); setError(null);
        try {
            await tagApi.deleteTag(tagToDelete.id); setSnackbar({ open: true, message: `Etiqueta "${tagToDelete.nombre}" eliminada.`, severity: 'success' });
            handleCloseDeleteDialog(); loadTags();
        } catch (err) {
            console.error("Error deleting tag:", err); const errorMsg = err instanceof Error ? err.message : 'Error al eliminar la etiqueta.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' }); handleCloseDeleteDialog();
        } finally {
            setIsDeleting(false);
        }
    };
    // ------------------------------------


    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                {/* Cabecera */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">Gestionar Etiquetas</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>Nueva Etiqueta</Button>
                </Stack>

                {/* Loading / Error */}
                {loading && (<Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>)}
                {!loading && error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}

                {/* Lista de Etiquetas */}
                {!loading && !error && (
                    <Paper elevation={2}>
                        <List disablePadding>
                            {tags.length === 0 && (<ListItem><ListItemText primary="No hay etiquetas creadas." /></ListItem>)}
                            {tags.map((tag, index) => (
                                <React.Fragment key={tag.id}>
                                    <ListItem>
                                        {/* Chip con color - VERIFICA ESTA LÍNEA */}
                                        <Chip
                                            label={tag.nombre}
                                            size="medium"
                                            sx={{
                                                backgroundColor: tag.color, // <-- Asegura que tag.color tenga un valor #rrggbb válido
                                                color: theme.palette.getContrastText(tag.color || '#ffffff'), // <-- Calcula contraste (fallback blanco si color falta)
                                                fontWeight: 500,
                                                mr: 2
                                            }}
                                        />
                                        <ListItemText secondary={`Color: ${tag.color}`} sx={{ flexGrow: 1 }}/>
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Editar Etiqueta"><IconButton edge="end" aria-label="editar" onClick={() => handleEditClick(tag)}><EditIcon /></IconButton></Tooltip>
                                            <Tooltip title="Eliminar Etiqueta"><IconButton edge="end" aria-label="eliminar" onClick={() => handleDeleteClick(tag)} sx={{ ml: 1 }}><DeleteIcon color="error" /></IconButton></Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < tags.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            {/* Diálogo Crear/Editar (VERIFICA ESTA ESTRUCTURA) */}
             <Dialog open={isFormDialogOpen} onClose={handleFormDialogClose} maxWidth="xs" fullWidth>
                 <DialogTitle>{dialogMode === 'create' ? 'Crear Nueva Etiqueta' : `Editar Etiqueta: ${editingTag?.nombre}`}</DialogTitle>
                 <FormProvider {...methods}>
                     <Box component="form" onSubmit={handleSubmit(onDialogSubmit)} noValidate>
                         <DialogContent>
                             {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                             <Controller name="nombre" control={control} render={({ field }) => ( <TextField {...field} autoFocus margin="dense" label="Nombre Etiqueta" type="text" fullWidth variant="outlined" error={!!formStateErrors.nombre} helperText={formStateErrors.nombre?.message} disabled={isSubmitting}/> )}/>
                             <Controller name="color" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Color" type="color" fullWidth variant="outlined" error={!!formStateErrors.color} helperText={formStateErrors.color ? formStateErrors.color.message : "Selecciona un color (#rrggbb)"} disabled={isSubmitting} InputLabelProps={{ shrink: true }} sx={{ '& input[type="color"]': { height: '40px', p: '4px' } }}/> )}/>
                         </DialogContent>
                         <DialogActions sx={{ p: '16px 24px' }}>
                             <Button onClick={handleFormDialogClose} disabled={isSubmitting}>Cancelar</Button>
                             <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Crear' : 'Guardar Cambios')} </Button>
                         </DialogActions>
                     </Box>
                </FormProvider>
             </Dialog>

             {/* Diálogo Confirmación de Borrado (Sin cambios respecto a v4) */}
            <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent> <DialogContentText> ¿Estás seguro de que quieres eliminar la etiqueta{' '} <Chip component="span" label={tagToDelete?.nombre} size="small" sx={{ backgroundColor: tagToDelete?.color, color: tagToDelete ? theme => theme.palette.getContrastText(tagToDelete.color) : undefined, fontWeight: 500 }} /> ? Esta acción no se puede deshacer. </DialogContentText> </DialogContent>
                <DialogActions> <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>Cancelar</Button> <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting} autoFocus> {isDeleting ? <CircularProgress size={20} color="inherit"/> : 'Eliminar'} </Button> </DialogActions>
            </Dialog>

            {/* Snackbar (sin cambios) */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                 <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
}

export default AdminTagsPage;
// ========================================================================
// FIN: Contenido COMPLETO y VERIFICADO para AdminTagsPage.tsx (v4 - CRUD Completo)
// ========================================================================