// ========================================================================
// INICIO: Contenido COMPLETO y MODIFICADO para AppRoutes.tsx (Añade Panel Control)
// ========================================================================
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Importa el componente ProtectedRoute
import ProtectedRoute from '../components/ProtectedRoute';
// Importa el tipo UserRole
import { UserRole } from '../types';

// --- Carga diferida (Lazy Loading) de los componentes de página ---
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProjectListPage = lazy(() => import('../pages/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
const ProjectCreatePage = lazy(() => import('../pages/ProjectCreatePage'));
const ProjectEditPage = lazy(() => import('../pages/ProjectEditPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage'));
const AdminTagsPage = lazy(() => import('../pages/AdminTagsPage')); // Ya existía
const AdminLookupsPage = lazy(() => import('../pages/AdminLookupsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const ControlPanelPage = lazy(() => import('../pages/ControlPanelPage')); // <-- NUEVA IMPORTACIÓN LAZY

// Componente simple para mostrar mientras cargan las páginas lazy
const LoadingFallback = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
    </Box>
);

// Define los roles para usar en las props (mejora la legibilidad)
const ROLES = {
    ADMIN: 'ADMIN' as UserRole,
    COORDINADOR: 'COORDINADOR' as UserRole,
    USUARIO: 'USUARIO' as UserRole,
    // VISITANTE no necesita definición aquí si no se usa en allowedRoles
}

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>

                {/* --- Rutas Públicas --- */}
                {/* Cualquiera puede acceder */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProjectListPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />


                {/* --- Rutas Protegidas por Login (Cualquier Rol) --- */}
                {/* Solo usuarios autenticados */}
                <Route element={<ProtectedRoute />}>
                    {/* Ruta de Edición de Proyecto */}
                    <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
                    {/* Aquí irían otras rutas que solo requieren login, ej: /mi-perfil */}
                </Route>


                 {/* --- NUEVO: Ruta Panel de Control (Admin y Coordinador) --- */}
                 <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]} />}>
                    <Route path="/panel-control" element={<ControlPanelPage />} />
                     {/* También agrupamos aquí las que comparten estos roles */}
                     <Route path="/dashboard" element={<DashboardPage />} />
                     <Route path="/projects/new" element={<ProjectCreatePage />} />
                 </Route>


                {/* --- Rutas Específicas de Admin (Solo Admin) --- */}
                {/* Estas rutas individuales siguen necesitando protección ADMIN */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/tags" element={<AdminTagsPage />} />
                    <Route path="/admin/lookups" element={<AdminLookupsPage />} />
                    {/* Si hubiera otras rutas solo para admin */}
                </Route>


                {/* --- Ruta Catch-all (404) --- */}
                <Route path="*" element={<NotFoundPage />} />

            </Routes>
        </Suspense>
    );
}

export default AppRoutes;
// ========================================================================
// FIN: Contenido COMPLETO y MODIFICADO para AppRoutes.tsx (Añade Panel Control)
// ========================================================================