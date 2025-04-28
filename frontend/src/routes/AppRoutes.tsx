// frontend/src/routes/AppRoutes.tsx (Layout Plano para /projects/new)

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from '../components/ProtectedRoute';
import { UserRole } from '../types';

// --- Carga diferida / Importación Directa ---
// ... (imports sin cambios, ProjectCreatePage y ProjectEditPage están directas) ...
import LoginPage from '../pages/LoginPage'; // <- Importa Login también si quieres hacer lazy todo lo demás
import ProjectListPage from '../pages/ProjectListPage'; // <- Importa directo o lazy? Asumamos lazy por ahora
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
import ProjectCreatePage from '../pages/ProjectCreatePage'; // <-- Directa
import ProjectEditPage from '../pages/ProjectEditPage'; // <-- Directa
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage'));
const AdminTagsPage = lazy(() => import('../pages/AdminTagsPage'));
const AdminLookupsPage = lazy(() => import('../pages/AdminLookupsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));

const LoadingFallback = () => ( <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box> );
const ROLES = { ADMIN: 'ADMIN' as UserRole, COORDINADOR: 'COORDINADOR' as UserRole, USUARIO: 'USUARIO' as UserRole }

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* --- Rutas Públicas --- */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProjectListPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />

                {/* --- Rutas Protegidas por Login --- */}
                <Route path="/projects/:id/edit" element={ <ProtectedRoute><ProjectEditPage /></ProtectedRoute> } />

                 {/* --- Rutas Comunes Admin/Coord --- */}
                 {/* Ruta Dashboard sigue protegida en grupo */}
                 <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* Ya NO está /projects/new aquí */}
                 </Route>

                 {/* Ruta Crear Proyecto - Definida Planamente con su protección */}
                 <Route
                    path="/projects/new"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}>
                             <ProjectCreatePage />
                        </ProtectedRoute>
                    }
                 />

                {/* --- Estructura Admin Anidada (sin cambios) --- */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}><AdminLayout /></ProtectedRoute>}>
                   {/* ... tags, lookups, users, index ... */}
                   <Route path="tags" element={<AdminTagsPage />} />
                   <Route path="lookups" element={<AdminLookupsPage />} />
                   <Route path="users" element={ <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminUsersPage /></ProtectedRoute> } />
                   <Route index element={<Navigate to="tags" replace />} />
                </Route>

                {/* --- Ruta Catch-all (404) --- */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;