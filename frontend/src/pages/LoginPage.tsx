import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, CircularProgress, Alert, Link
} from '@mui/material';
import { frontendLoginSchema, FrontendLoginInput } from '../schemas/authSchemas'; // Schema y tipo Zod
import { authApi } from '../services/authApi'; // Función de API login
import { useAuthStore, useIsAuthenticated } from '../store/authStore'; // Hook y selector de Zustand
import { ApiError } from '../services/apiService'; // Para manejo de errores específico

function LoginPage() {
    const navigate = useNavigate();
    const loginAction = useAuthStore((state) => state.actions.login); // Obtiene la acción de login de Zustand
    const isAuthenticated = useIsAuthenticated(); // Hook para verificar si ya está logueado

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // Estado para errores de API

    // Redirige si el usuario ya está autenticado
    useEffect(() => {
        console.log('LoginPage useEffect: Checking auth state...', { isAuthenticated });
        if (isAuthenticated) {
            console.log('Usuario ya autenticado, redirigiendo a /');
            navigate('/', { replace: true }); // Redirige a la página principal
        }
    }, [isAuthenticated, navigate]);

    // Configuración de React Hook Form
    const { control, handleSubmit, formState: { errors: formErrors } } = useForm<FrontendLoginInput>({
        resolver: zodResolver(frontendLoginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // Función que se ejecuta al enviar el formulario
    const onSubmit: SubmitHandler<FrontendLoginInput> = async (data) => {
        setLoading(true);
        setError(null); // Limpia errores anteriores
        console.log('Intentando iniciar sesión con:', data.email);

        try {
            // Llama a la función de la API
            const response = await authApi.login(data);

            // Si la llamada es exitosa, actualiza el estado global de Zustand
            console.log('Login exitoso, usuario:', response.user);
            loginAction(response.token, response.user);

            // Redirige al usuario a la página principal (o a donde quieras)
            navigate('/', { replace: true });

        } catch (err) {
            console.error('Error en onSubmit:', err);
            // Maneja errores específicos de la API o genéricos
            if (err instanceof ApiError) {
                 // Usa el mensaje de error de la API (ej. "Credenciales inválidas")
                setError(err.message || `Error ${err.status}: Ocurrió un problema.`);
            } else if (err instanceof Error) {
                setError(err.message); // Error genérico de JavaScript
            } else {
                setError('Ocurrió un error inesperado durante el inicio de sesión.');
            }
        } finally {
            setLoading(false); // Detiene el indicador de carga
        }
    };

    // No renderiza nada si ya está autenticado (mientras redirige)
     if (isAuthenticated) {
         return null; // O un spinner mientras redirige
     }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Iniciar Sesión
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                    {/* Muestra error de API si existe */}
                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Correo Electrónico"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                error={!!formErrors.email}
                                helperText={formErrors.email?.message}
                                disabled={loading}
                            />
                        )}
                    />
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Contraseña"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                error={!!formErrors.password}
                                helperText={formErrors.password?.message}
                                disabled={loading}
                            />
                        )}
                    />
                    {/* TODO: Añadir Checkbox "Recordarme" si es necesario */}
                    {/* <FormControlLabel
                        control={<Checkbox value="remember" color="primary" />}
                        label="Recordarme"
                    /> */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                    </Button>
                    {/* TODO: Añadir enlaces para "Olvidé mi contraseña" o "Registrarse" si aplica */}
                    {/* <Grid container>
                        <Grid item xs>
                            <Link component={RouterLink} to="/forgot-password" variant="body2">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link component={RouterLink} to="/register" variant="body2">
                                {"¿No tienes cuenta? Regístrate"}
                            </Link>
                        </Grid>
                    </Grid> */}
                </Box>
            </Box>
            {/* Optional: Copyright/Footer */}
        </Container>
    );
}

export default LoginPage;