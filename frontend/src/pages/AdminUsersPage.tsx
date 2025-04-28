// ========================================================================
// INICIO: Contenido COMPLETO y FINAL (con Crear funcional) para AdminUsersPage.tsx
// ========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box, Typography, CircularProgress, Alert, Button, Paper, Chip, IconButton, Tooltip, Stack,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, InputLabel, FormControl, FormHelperText, Autocomplete, Switch, FormControlLabel,
    Grid, Snackbar, // <-- Importación añadida
    useTheme
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { userAdminApi } from '../services/userAdminApi'; // API de usuarios admin
import { tagApi } from '../services/tagApi'; // API para obtener etiquetas
import { User, Etiqueta, UserRole } from '../types'; // Tipos necesarios
import { createUserFormSchema, CreateUserFormValues /*, updateUserFormSchema */ } from '../schemas/adminUserFormSchema'; // Schema Zod
// Importa Role si lo necesitas para el Select, o define las opciones manualmente
// import { Role } from '@prisma/client'; // NO USAR EN FRONTEND
const roleOptions: UserRole[] = ['ADMIN', 'COORDINADOR', 'USUARIO']; // Opciones para el Select


function AdminUsersPage() {
    const theme = useTheme();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [dialogUserMode, setDialogUserMode] = useState<'create' | 'edit'>('create');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableTags, setAvailableTags] = useState<Etiqueta[]>([]);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // --- Configuración React Hook Form ---
    // Definimos el tipo explícitamente aquí para claridad
    type FormValues = CreateUserFormValues; // Por ahora solo usamos el de creación

    const methods = useForm<FormValues>({
        resolver: zodResolver(createUserFormSchema), // Usa schema de creación por defecto
        defaultValues: {
            email: '', password: '', passwordConfirmation: '', name: '',
            role: 'USUARIO', // Default a USUARIO como UserRole
            isActive: true,
            etiquetaIds: []
        }
    });
    const { control, handleSubmit, reset, formState: { errors: formStateErrors } } = methods;
    // ---------------------------------

    // Carga Usuarios y Etiquetas
    const loadInitialData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [fetchedUsers, fetchedTags] = await Promise.all([
                userAdminApi.fetchAllUsers(),
                tagApi.fetchAllTags()
            ]);
            setUsers(fetchedUsers);
            setAvailableTags(fetchedTags);
        } catch (err) { /* ... manejo de error ... */
            const errorMsg = err instanceof Error ? err.message : 'Error cargando datos iniciales.'; setError(errorMsg); console.error("Error en loadInitialData:", err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    // --- Manejadores Diálogo ---
    const handleCreateUserClick = () => {
        setDialogUserMode('create'); setEditingUser(null);
        reset({ email: '', password: '', passwordConfirmation: '', name: '', role: 'USUARIO', isActive: true, etiquetaIds: [] });
        // TODO: Asegurar que se usa el resolver correcto si se implementa EDIT
        setFormError(null); setIsUserDialogOpen(true);
    };
    const handleEditUserClick = (user: User) => { alert(`TODO: Editar Usuario ID: ${user.id}`); /* TODO */ };
    const handleDeleteUserClick = (id: number) => { alert(`TODO: Eliminar Usuario ID: ${id}`); /* TODO */};
    const handleUserDialogClose = () => { setIsUserDialogOpen(false); setEditingUser(null); setFormError(null); };
    // ---------------------------

    // --- Submit del Formulario del Diálogo (Solo Crear) ---
    const onUserDialogSubmit = async (data: CreateUserFormValues) => { // Usa el tipo específico aquí
        setIsSubmitting(true); setFormError(null);
        const isEditing = dialogUserMode === 'edit' && editingUser;

        const schema = createUserFormSchema; // TODO: Cambiar a updateUserFormSchema si es edit
        const validation = schema.safeParse(data);
        if (!validation.success){ console.error("Error validación frontend:", validation.error.flatten()); setFormError("Verifique los errores en el formulario."); setIsSubmitting(false); return; }

        const { passwordConfirmation, ...apiData } = validation.data; // Usa data validada y quita confirmación

        if (isEditing) { /* ... Lógica de Update (TODO) ... */ alert("Update no implementado"); setIsSubmitting(false); return; }

        // --- Lógica de Creación ---
        try {
            const newUser = await userAdminApi.createUser(apiData);
            const message = `Usuario "${newUser.email}" creado correctamente.`;
            setIsUserDialogOpen(false); setSnackbar({ open: true, message, severity: 'success' });
            loadInitialData(); // Recarga usuarios y etiquetas
        } catch (err) { const errorMsg = (err instanceof ApiError && err.body?.message) ? err.body.message : (err instanceof Error ? err.message : `Ocurrió un error.`); setFormError(errorMsg); }
        finally { setIsSubmitting(false); }
    };
    // ---------------------------------------------------------

    // --- Definición de Columnas DataGrid ---
    const columns: GridColDef<User>[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        {
            field: 'name',
            headerName: 'Nombre',
            width: 200,
            flex: 1,
             // Añade optional chaining: ?.name
            valueGetter: (params: GridValueGetterParams<User>) => params.row?.name || '-'
        },
        { field: 'email', headerName: 'Email', width: 250, flex: 1 },
        { field: 'role', headerName: 'Rol Base', width: 130 },
        {
            field: 'isActive',
            headerName: 'Estado',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => ( params.value ? <Tooltip title="Activo"><CheckCircleIcon color="success" /></Tooltip> : <Tooltip title="Inactivo"><CancelIcon color="action" /></Tooltip> ),
        },
        {
            field: 'etiquetas',
            headerName: 'Etiquetas',
            width: 250,
            sortable: false,
             renderCell: (params: GridRenderCellParams<User, Etiqueta[] | undefined>) => (
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5, overflow: 'hidden', maxHeight: '50px' }}>
                     {/* Añade filtro extra para asegurar que 'etiqueta' no sea null/undefined */}
                     {params.value && params.value.length > 0
                        ? params.value
                            .filter(etiqueta => etiqueta != null) // <-- Filtro añadido
                            .map((etiqueta) => (
                                // Ahora etiqueta no debería ser null/undefined aquí
                                <Chip
                                    key={etiqueta.id}
                                    label={etiqueta.nombre} // Acceso seguro si el filtro funciona
                                    size="small"
                                    sx={{ backgroundColor: etiqueta.color, color: theme.palette.getContrastText(etiqueta.color || '#ffffff') }}
                                />
                            ))
                        : '-'
                     }
                 </Box>
             ),
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            /* ... resto de la definición de acciones ... */
             renderCell: (params: GridRenderCellParams<User>) => ( <Stack direction="row" spacing={0.5} justifyContent="center"> <Tooltip title="Editar Usuario"><IconButton size="small" onClick={() => handleEditUserClick(params.row)}><EditIcon /></IconButton></Tooltip> <Tooltip title="Eliminar Usuario"><IconButton size="small" onClick={() => handleDeleteUserClick(params.row.id)}><DeleteIcon color="error" /></IconButton></Tooltip> </Stack> ),
        },
    ];
    // -----------------------------------------
    console.log("Datos de usuarios pasados a DataGrid:", users);
    return (
         <Box sx={{ height: 'calc(100vh - 150px)', width: '100%', px: { xs: 1, sm: 2, md: 3 } }}> {/* Ajusta padding responsivo */}
             <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                 <Typography variant="h4" component="h1">Gestionar Usuarios</Typography>
                 <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateUserClick}>Nuevo Usuario</Button>
             </Stack>

             {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}

             <Paper elevation={2} sx={{ height: '100%', width: '100%' }}>
                 <DataGrid rows={users} columns={columns} loading={loading} initialState={{ pagination: { paginationModel: { pageSize: 10 } }, }} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick autoHeight={false} sx={{ border: 'none' }} />
             </Paper>

             {/* --- Diálogo Crear/Editar Usuario --- */}
             <Dialog open={isUserDialogOpen} onClose={handleUserDialogClose} maxWidth="sm" fullWidth>
                 <DialogTitle>{dialogUserMode === 'create' ? 'Crear Nuevo Usuario' : `Editar Usuario: ${editingUser?.email}`}</DialogTitle>
                 <FormProvider {...methods}>
                     <Box component="form" onSubmit={handleSubmit(onUserDialogSubmit)} noValidate sx={{ mt: -1 }}> {/* Ajusta margen si es necesario */}
                         <DialogContent>
                             {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                             <Grid container spacing={2}>
                                  {/* Nombre */}
                                  <Grid item xs={12} sm={6}> <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} margin="dense" label="Nombre (Opcional)" fullWidth variant="outlined" error={!!formStateErrors.name} helperText={formStateErrors.name?.message} disabled={isSubmitting}/> )}/> </Grid>
                                  {/* Email */}
                                  <Grid item xs={12} sm={6}> <Controller name="email" control={control} render={({ field }) => ( <TextField {...field} required autoFocus margin="dense" label="Email" type="email" fullWidth variant="outlined" error={!!formStateErrors.email} helperText={formStateErrors.email?.message} disabled={isSubmitting}/> )}/> </Grid>
                                  {/* Rol Base */}
                                   <Grid item xs={12} sm={6}> <Controller name="role" control={control} defaultValue={'USUARIO'} render={({ field }) => ( <FormControl fullWidth margin="dense" error={!!formStateErrors.role} disabled={isSubmitting}> <InputLabel id="role-select-label">Rol Base</InputLabel> <Select {...field} labelId="role-select-label" label="Rol Base" value={field.value ?? ''}> {roleOptions.map((roleValue) => ( <MenuItem key={roleValue} value={roleValue}>{roleValue}</MenuItem> ))} </Select> <FormHelperText>{formStateErrors.role?.message}</FormHelperText> </FormControl> )}/> </Grid>
                                  {/* Estado Activo */}
                                  <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', pt: { xs: 0, sm: 1 } }}> <Controller name="isActive" control={control} render={({ field }) => ( <FormControlLabel control={<Switch {...field} checked={field.value ?? true} disabled={isSubmitting} />} label={field.value ?? true ? "Activo" : "Inactivo"} /> )}/> </Grid>
                                  {/* Contraseña (solo en modo crear por ahora, o si se quiere cambiar en edit) */}
                                  <Grid item xs={12} sm={6}> <Controller name="password" control={control} render={({ field }) => ( <TextField {...field} required margin="dense" label="Contraseña" type="password" fullWidth variant="outlined" error={!!formStateErrors.password} helperText={formStateErrors.password?.message} disabled={isSubmitting}/> )}/> </Grid>
                                  {/* Confirmar Contraseña */}
                                  <Grid item xs={12} sm={6}> <Controller name="passwordConfirmation" control={control} render={({ field }) => ( <TextField {...field} required margin="dense" label="Confirmar Contraseña" type="password" fullWidth variant="outlined" error={!!formStateErrors.passwordConfirmation} helperText={formStateErrors.passwordConfirmation?.message} disabled={isSubmitting}/> )}/> </Grid>
                                   {/* Selector de Etiquetas */}
                                   <Grid item xs={12}>
                                        <Controller
                                             name="etiquetaIds"
                                             control={control}
                                             defaultValue={[]}
                                             render={({ field }) => (
                                                 <Autocomplete
                                                     multiple id="tags-select" options={availableTags} getOptionLabel={(o) => o.nombre}
                                                     value={availableTags.filter(tag => field.value?.includes(tag.id))}
                                                     onChange={(_, newValue) => field.onChange(newValue.map(tag => tag.id))}
                                                     isOptionEqualToValue={(o, v) => o.id === v.id}
                                                     renderTags={(value, getTagProps) => value.map((option, index) => ( <Chip {...getTagProps({ index })} key={option.id} label={option.nombre} size="small" sx={{ bgcolor: option.color, color: theme.palette.getContrastText(option.color || '#ffffff') }}/> ))}
                                                     renderInput={(params) => ( <TextField {...params} variant="outlined" label="Etiquetas Asignadas" placeholder="Seleccionar..." margin="dense" error={!!formStateErrors.etiquetaIds} helperText={formStateErrors.etiquetaIds?.message}/> )}
                                                     disabled={isSubmitting} />
                                             )} />
                                   </Grid>
                              </Grid>
                         </DialogContent>
                         <DialogActions sx={{ p: '16px 24px' }}>
                             <Button onClick={handleUserDialogClose} disabled={isSubmitting}>Cancelar</Button>
                             <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : (dialogUserMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios')} </Button>
                         </DialogActions>
                     </Box>
                 </FormProvider>
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
// FIN: Contenido v2 para AdminUsersPage.tsx (con Crear funcional)
// ========================================================================