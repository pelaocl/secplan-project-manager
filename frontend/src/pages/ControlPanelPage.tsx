// frontend/src/pages/ControlPanelPage.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container, Box, Typography, Grid, Card, CardActionArea, CardContent, SvgIcon
} from '@mui/material';
// Importa iconos para cada sección
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'; // Usuarios
import StyleIcon from '@mui/icons-material/Style'; // Etiquetas (Tags)
import ListAltIcon from '@mui/icons-material/ListAlt'; // Listas (Lookups)
// Importa el hook para obtener el rol del usuario actual
import { useCurrentUserRole } from '../store/authStore';
import { UserRole } from '../types'; // Importa el tipo UserRole si es necesario

// Un pequeño helper para las tarjetas
interface ControlPanelCardProps {
    title: string;
    description: string;
    icon: typeof SvgIcon;
    linkTo: string;
    color?: 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'success';
}

const ControlPanelCard: React.FC<ControlPanelCardProps> = ({ title, description, icon: Icon, linkTo, color = 'primary' }) => (
    <Grid item xs={12} sm={6} md={4}> {/* Layout responsivo para las tarjetas */}
        <Card elevation={3} sx={{ height: '100%' }}> {/* Ocupa toda la altura disponible en la fila */}
            <CardActionArea component={RouterLink} to={linkTo} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2 }}>
                <Icon sx={{ fontSize: 48, mb: 1.5 }} color={color} />
                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    </Grid>
);


function ControlPanelPage() {
    const userRole = useCurrentUserRole(); // Obtiene el rol del usuario logueado

    return (
        <Container maxWidth="md"> {/* Hacemos el panel un poco más compacto */}
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                    Panel de Control
                </Typography>

                <Grid container spacing={3} justifyContent="center"> {/* Centra las tarjetas si son menos de 3 */}

                    {/* Tarjeta: Gestionar Usuarios (Solo ADMIN) */}
                    {userRole === 'ADMIN' && (
                        <ControlPanelCard
                            title="Usuarios"
                            description="Crear, editar, eliminar y asignar roles/etiquetas a usuarios."
                            icon={ManageAccountsIcon}
                            linkTo="/admin/users" // Enlaza a la futura página de usuarios
                            color="primary"
                        />
                    )}

                    {/* Tarjeta: Gestionar Etiquetas (ADMIN y COORDINADOR) */}
                    {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                        <ControlPanelCard
                            title="Etiquetas"
                            description="Administrar las etiquetas visuales (nombre y color) asignables a usuarios."
                            icon={StyleIcon}
                            linkTo="/admin/tags" // Enlaza a la página que ya funciona
                            color="secondary"
                        />
                    )}

                    {/* Tarjeta: Gestionar Listas (ADMIN y COORDINADOR) */}
                    {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                        <ControlPanelCard
                            title="Listas Desplegables"
                            description="Gestionar opciones de Estado, Unidad, Tipología, Sector, etc."
                            icon={ListAltIcon}
                            linkTo="/admin/lookups" // Enlaza a la futura página de lookups
                            color="info"
                        />
                    )}

                    {/* TODO: Añadir más tarjetas para otras secciones si es necesario */}

                </Grid>
            </Box>
        </Container>
    );
}

export default ControlPanelPage;