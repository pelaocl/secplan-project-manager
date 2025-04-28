// ========================================================================
// INICIO: Contenido COMPLETO y FINAL para AdminUsersPage.tsx (CRUD Completo)
// ========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box, Typography, CircularProgress, Alert, Button, Paper, Chip, IconButton, Tooltip, Stack,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, InputLabel, FormControl, FormHelperText, Autocomplete, Switch, FormControlLabel,
    Grid, Snackbar, useTheme, DialogContentText // <-- Imports completos de MUI
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { userAdminApi } from '../services/userAdminApi'; // API Usuarios (Create, Update, Delete)
import { tagApi } from '../services/tagApi'; // API Etiquetas (para fetchAll)
import { User, Etiqueta, UserRole } from '../types'; // Tipos
import {
    createUserFormSchema, CreateUserFormValues,
    updateUserFormSchema, UpdateUserFormValues
} from '../schemas/adminUserFormSchema'; // Schemas Zod
import { ApiError } from '../services/apiService';
import { useCurrentUser, useAuthActions } from '../store/authStore'; // Store para comparar/actualizar user logueado
import { z } from 'zod'; // Para tipos Zod

// Opciones para el Select de Rol
const roleOptions: UserRole[] = ['ADMIN', 'COORDINADOR', 'USUARIO'];

function AdminUsersPage() {
    const theme = useTheme();
    const currentUser = useCurrentUser(); // Obtiene usuario actual logueado
    const { setUser } = useAuthActions(); // Acción para actualizar user en store
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // Error carga tabla
    const [formError, setFormError] = useState<string | null>(null); // Error diálogo form C/U

    // Estados para Diálogo Crear/Editar Usuario
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [dialogUserMode, setDialogUserMode] = useState<'create' | 'edit'>('create');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableTags, setAvailableTags] = useState<Etiqueta[]>([]);

    // Estados para Diálogo Borrar Usuario
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Estado Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // --- Configuración React Hook Form ---
    type FormValues = CreateUserFormValues | UpdateUserFormValues;
    const methods = useForm<FormValues>({
        // Resolver se aplica manualmente en onSubmit
        defaultValues: { name: '', email: '', role: 'USUARIO', isActive: true, password: '', passwordConfirmation: '', etiquetaIds: [] },
    });
    const { control, handleSubmit, reset, watch, formState: { errors: formStateErrors } } = methods;
    const watchedPassword = watch('password');
    // ---------------------------------

    // Carga Usuarios y Etiquetas
    const loadInitialData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            console.log("[AdminUsersPage] Fetching users and tags...");
            const [fetchedUsers, fetchedTags] = await Promise.all([
                userAdminApi.fetchAllUsers(),
                tagApi.fetchAllTags()
            ]);
            console.log("[AdminUsersPage] Users received:", fetchedUsers);
            console.log("[AdminUsersPage] Tags received:", fetchedTags);
            setUsers(fetchedUsers);
            setAvailableTags(fetchedTags);
            console.log("[AdminUsersPage] State updated.");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error cargando datos iniciales.';
            setError(errorMsg); console.error("Error en loadInitialData:", err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    // --- Manejadores Diálogo Crear/Editar ---
    const handleCreateUserClick = () => {
        setDialogUserMode('create'); setEditingUser(null);
        reset({ email: '', password: '', passwordConfirmation: '', name: '', role: 'USUARIO', isActive: true, etiquetaIds: [] });
        setFormError(null); setIsUserDialogOpen(true);
    };
    const handleEditUserClick = (user: User) => {
        setDialogUserMode('edit'); setEditingUser(user);
        reset({ name: user.name ?? '', email: user.email, role: user.role, isActive: user.isActive ?? true, etiquetaIds: user.etiquetas?.map(t => t.id) ?? [], password: '', passwordConfirmation: '' });
        setFormError(null); setIsUserDialogOpen(true);
    };
    const handleUserDialogClose = () => { setIsUserDialogOpen(false); setEditingUser(null); setFormError(null); };
    // --------------------------------------------

    // --- Manejadores Diálogo BORRADO ---
    const handleDeleteUserClick = (user: User) => {
        if (currentUser && user.id === currentUser.id) { setSnackbar({ open: true, message: 'No puedes eliminar tu propia cuenta.', severity: 'warning'}); return; }
        setUserToDelete(user); setIsDeleteDialogOpen(true);
    };
    const handleCloseDeleteDialog = () => { setIsDeleteDialogOpen(false); setTimeout(() => setUserToDelete(null), 300); };
    // ------------------------------------

    // --- Submit del Formulario Crear/Editar ---
    const onUserDialogSubmit = async (data: FormValues) => {
        setIsSubmitting(true); setFormError(null);
        const isEditing = dialogUserMode === 'edit' && editingUser;
        const schema = isEditing ? updateUserFormSchema : createUserFormSchema;
        const validation = schema.safeParse(data);

        if (!validation.success){ console.error("Error validación frontend:", validation.error.flatten()); const firstError = Object.values(validation.error.flatten().fieldErrors)?.[0]?.[0]; setFormError(firstError || "Verifique los errores."); setIsSubmitting(false); return; }

        const { passwordConfirmation, ...validatedData } = validation.data;
        const apiData = { ...validatedData };
        if (isEditing && (!apiData.password)) { delete apiData.password; } // No enviar password vacío en update

        try {
            let message = ''; let resultUser: User;
            if (isEditing) {
                resultUser = await userAdminApi.update(editingUser.id, apiData as UpdateUserFormValues);
                message = `Usuario "${resultUser.email}" actualizado.`;
                if (currentUser && resultUser.id === currentUser.id) { setUser(resultUser); } // Actualiza user logueado
            } else {
                resultUser = await userAdminApi.create(apiData as CreateUserFormValues);
                message = `Usuario "${resultUser.email}" creado.`;
            }
            setIsUserDialogOpen(false); setSnackbar({ open: true, message, severity: 'success' });
            loadInitialData(); // Recarga usuarios
        } catch (err) { const errorMsg = (err instanceof ApiError && err.body?.message) ? err.body.message : (err instanceof Error ? err.message : `Ocurrió un error.`); setFormError(errorMsg); }
        finally { setIsSubmitting(false); }
    };
    // ---------------------------------------------------------

     // --- Confirmación de Borrado ---
     const confirmUserDelete = async () => {
        if (!userToDelete) return; setIsDeleting(true); setError(null);
        try {
            await userAdminApi.deleteUserFn(userToDelete.id); // Usa la clave exportada correcta
            setSnackbar({ open: true, message: `Usuario "${userToDelete.email}" eliminado.`, severity: 'success' });
            handleCloseDeleteDialog(); loadInitialData(); // Recarga usuarios
        } catch (err) { const errorMsg = err instanceof Error ? err.message : 'Error al eliminar.'; setSnackbar({ open: true, message: errorMsg, severity: 'error' }); handleCloseDeleteDialog(); }
        finally { setIsDeleting(false); }
    };
    // -----------------------------

    // --- Definición de Columnas DataGrid ---
    const columns: GridColDef<User>[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Nombre', width: 200, flex: 1, renderCell: (params) => params.row?.name || '-' },
        { field: 'email', headerName: 'Email', width: 250, flex: 1 },
        { field: 'role', headerName: 'Rol Base', width: 130 },
        { field: 'isActive', headerName: 'Estado', width: 100, align: 'center', headerAlign: 'center', renderCell: (params) => ( params.value ? <Tooltip title="Activo"><CheckCircleIcon color="success" /></Tooltip> : <Tooltip title="Inactivo"><CancelIcon color="action" /></Tooltip> ), },
        { field: 'etiquetas', headerName: 'Etiquetas', width: 250, sortable: false,
             renderCell: (params: GridRenderCellParams<User, Etiqueta[] | undefined>) => ( <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5, overflow: 'hidden', maxHeight: '50px' }}> {params.value && params.value.length > 0 ? params.value .filter(etiqueta => etiqueta != null) .map((etiqueta) => ( <Chip key={etiqueta.id} label={etiqueta.nombre} size="small" sx={{ backgroundColor: etiqueta.color, color: theme.palette.getContrastText(etiqueta.color || '#ffffff') }}/> )) : '-' } </Box> ),
        },
        { field: 'actions', headerName: 'Acciones', width: 120, sortable: false, disableColumnMenu: true, align: 'center', headerAlign: 'center',
            renderCell: (params: GridRenderCellParams<User>) => (
                 <Stack direction="row" spacing={0.5} justifyContent="center">
                     <Tooltip title="Editar Usuario"><IconButton size="small" onClick={() => handleEditUserClick(params.row)}><EditIcon /></IconButton></Tooltip>
                     <Tooltip title="Eliminar Usuario">
                        <span style={{ display: 'inline-block' /* Necesario a veces para que el span tome tamaño */ }}>
                            <IconButton size="small" onClick={() => handleDeleteUserClick(params.row)} disabled={currentUser?.id === params.row.id} >
                                <DeleteIcon color={currentUser?.id === params.row.id ? 'disabled' : 'error'} />
                            </IconButton>
                        </span>
                     </Tooltip>
                 </Stack>
            ),
        },
    ];
    // -----------------------------------------

    // --- Log Antes de Renderizar ---
    // console.log("[AdminUsersPage] Renderizando con estado 'users':", users);

    return (
         <Box sx={{ height: 'calc(100vh - 150px)', width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
             {/* Cabecera y botón crear */}
             <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}> <Typography variant="h4" component="h1">Gestionar Usuarios</Typography> <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateUserClick}>Nuevo Usuario</Button> </Stack>
             {/* Error carga */}
             {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
             {/* Tabla */}
             <Paper elevation={2} sx={{ height: '100%', width: '100%' }}> <DataGrid rows={users} columns={columns} loading={loading} initialState={{ pagination: { paginationModel: { pageSize: 10 } }, }} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick autoHeight={false} sx={{ border: 'none' }} getRowId={(row) => row.id} /* Asegura que DataGrid use user.id */ /> </Paper>

             {/* --- Diálogo Crear/Editar Usuario --- */}
             <Dialog open={isUserDialogOpen} onClose={handleUserDialogClose} maxWidth="sm" fullWidth>
                 <DialogTitle>{dialogUserMode === 'create' ? 'Crear Nuevo Usuario' : `Editar Usuario: ${editingUser?.email}`}</DialogTitle>
                 <FormProvider {...methods}>
                     <Box component="form" onSubmit={handleSubmit(onUserDialogSubmit)} noValidate sx={{ mt: -1 }}>
                         <DialogContent>
                             {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                             <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6}> <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Nombre (Opcional)" fullWidth variant="outlined" error={!!formStateErrors.name} helperText={formStateErrors.name?.message} disabled={isSubmitting}/> )}/> </Grid>
                                  <Grid item xs={12} sm={6}> <Controller name="email" control={control} render={({ field }) => ( <TextField {...field} required autoFocus margin="dense" label="Email" type="email" fullWidth variant="outlined" error={!!formStateErrors.email} helperText={formStateErrors.email?.message} disabled={isSubmitting}/> )}/> </Grid>
                                   <Grid item xs={12} sm={6}> <Controller name="role" control={control} defaultValue={'USUARIO'} render={({ field }) => ( <FormControl fullWidth margin="dense" error={!!formStateErrors.role} disabled={isSubmitting}> <InputLabel id="role-select-label">Rol Base</InputLabel> <Select {...field} labelId="role-select-label" label="Rol Base" value={field.value ?? ''}> {roleOptions.map((roleValue) => ( <MenuItem key={roleValue} value={roleValue}>{roleValue}</MenuItem> ))} </Select> <FormHelperText>{formStateErrors.role?.message}</FormHelperText> </FormControl> )}/> </Grid>
                                  <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', pt: { xs: 0, sm: 1 } }}> <Controller name="isActive" control={control} render={({ field }) => ( <FormControlLabel control={<Switch {...field} checked={field.value ?? true} disabled={isSubmitting} />} label={field.value ?? true ? "Activo" : "Inactivo"} /> )}/> </Grid>
                                  <Grid item xs={12} sm={6}> <Controller name="password" control={control} render={({ field }) => ( <TextField {...field} required={dialogUserMode === 'create'} margin="dense" label={dialogUserMode === 'create' ? "Contraseña" : "Nueva Contraseña (opcional)"} type="password" fullWidth variant="outlined" error={!!formStateErrors.password} helperText={formStateErrors.password?.message || (dialogUserMode === 'edit' ? 'Dejar vacío para no cambiar' : '')} disabled={isSubmitting} autoComplete="new-password"/> )}/> </Grid>
                                  <Grid item xs={12} sm={6}> <Controller name="passwordConfirmation" control={control} render={({ field }) => ( <TextField {...field} required={dialogUserMode === 'create' || !!watchedPassword} margin="dense" label={dialogUserMode === 'create' ? "Confirmar Contraseña" : "Confirmar Nueva Contraseña"} type="password" fullWidth variant="outlined" error={!!formStateErrors.passwordConfirmation} helperText={formStateErrors.passwordConfirmation?.message} disabled={isSubmitting || (dialogUserMode === 'edit' && !watchedPassword)} autoComplete="new-password"/> )}/> </Grid>
                                   <Grid item xs={12}> <Controller name="etiquetaIds" control={control} defaultValue={[]} render={({ field }) => ( <Autocomplete multiple id="tags-select" options={availableTags} getOptionLabel={(o) => o.nombre} value={availableTags.filter(tag => field.value?.includes(tag.id))} onChange={(_, newValue) => field.onChange(newValue.map(tag => tag.id))} isOptionEqualToValue={(o, v) => o.id === v.id} renderTags={(value, getTagProps) => value.map((option, index) => ( <Chip {...getTagProps({ index })} key={option.id} label={option.nombre} size="small" sx={{ bgcolor: option.color, color: theme.palette.getContrastText(option.color || '#ffffff') }}/> ))} renderInput={(params) => ( <TextField {...params} variant="outlined" label="Etiquetas Asignadas" placeholder="Seleccionar..." margin="dense" error={!!formStateErrors.etiquetaIds} helperText={formStateErrors.etiquetaIds?.message}/> )} disabled={isSubmitting} /> )}/> </Grid>
                              </Grid>
                         </DialogContent>
                         <DialogActions sx={{ p: '16px 24px' }}> <Button onClick={handleUserDialogClose} disabled={isSubmitting}>Cancelar</Button> <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : (dialogUserMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios')} </Button> </DialogActions>
                     </Box>
                 </FormProvider>
             </Dialog>

             {/* Diálogo Confirmación de Borrado Usuario */}
            <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent> <DialogContentText> ¿Estás seguro de que quieres eliminar al usuario{' '} <Typography component="span" sx={{ fontWeight: 'bold' }}> {userToDelete?.name || userToDelete?.email} </Typography> ? <br /> Esta acción no se puede deshacer. El sistema podría impedirla si el usuario tiene proyectos o tareas asociadas. </DialogContentText> </DialogContent>
                <DialogActions> <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>Cancelar</Button> <Button onClick={confirmUserDelete} color="error" variant="contained" disabled={isDeleting} autoFocus> {isDeleting ? <CircularProgress size={20} color="inherit"/> : 'Eliminar Usuario'} </Button> </DialogActions>
            </Dialog>

             {/* Snackbar */}
             <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                  <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
             </Snackbar>
         </Box>
    );
}

export default AdminUsersPage;
// ========================================================================
// FIN: Contenido COMPLETO v4 para AdminUsersPage.tsx (CRUD Usuarios Completo)
// ========================================================================