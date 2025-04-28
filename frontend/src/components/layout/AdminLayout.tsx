// ========================================================================
// INICIO: Contenido RESTAURADO y LIMPIO para AdminLayout.tsx (v3)
// ========================================================================
import React from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material'; // Quitamos Typography, Alert
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUserRole } from '../../store/authStore';
import { UserRole } from '../../types';

// Definición de las pestañas disponibles en el panel de admin
const adminTabs: { label: string; path: string; roles: UserRole[] }[] = [
    { label: 'Etiquetas', path: '/admin/tags', roles: ['ADMIN', 'COORDINADOR'] },
    { label: 'Listas', path: '/admin/lookups', roles: ['ADMIN', 'COORDINADOR'] },
    { label: 'Usuarios', path: '/admin/users', roles: ['ADMIN'] },
];

function AdminLayout() {
    const location = useLocation();
    const userRole = useCurrentUserRole();
    let visibleTabs: typeof adminTabs = [];
    let currentTabPath: string | false = false;

    // Calcula Tabs Visibles y Activa (con validaciones internas)
    try {
        if (userRole) {
            visibleTabs = adminTabs.filter(tab => tab && Array.isArray(tab.roles) && tab.roles.includes(userRole));
        }

        for (const tab of visibleTabs) {
             if (tab && typeof tab.path === 'string' && location.pathname.startsWith(tab.path)) {
                if (!currentTabPath || tab.path.length > (currentTabPath as string).length) {
                    currentTabPath = tab.path;
                }
            }
        }
    } catch (error) {
        console.error("[AdminLayout] Error calculando tabs:", error);
        // Podríamos mostrar un error aquí si falla el cálculo
    }

    return (
        <Box sx={{ width: '100%' }}>
            {/* Contenedor de Pestañas */}
            <Paper square elevation={1} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                 <Tabs
                    value={currentTabPath} // Asigna la ruta activa o 'false'
                    aria-label="Pestañas de administración"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {/* Mapeo Defensivo */}
                    {visibleTabs.map((tab) => {
                        if (!tab || !tab.path || !tab.label) return null; // Evita errores si un tab es inválido
                        return (
                            <Tab
                                key={tab.path}
                                label={tab.label}
                                value={tab.path} // El valor que compara Tabs
                                component={RouterLink} // Se comporta como Link
                                to={tab.path} // Navega aquí
                            />
                        );
                    })}
                 </Tabs>
            </Paper>

            {/* Contenido de la Página Anidada */}
            {/* Quitamos el Box verde y el Typography de diagnóstico */}
            <Outlet />

        </Box>
    );
}

export default AdminLayout;
// ========================================================================
// FIN: Contenido RESTAURADO y LIMPIO para AdminLayout.tsx (v3)
// ========================================================================