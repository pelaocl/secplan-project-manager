// frontend/src/routes/AppRoutes.tsx (REVISADO)

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from '../components/ProtectedRoute';
import { UserRole } from '../types';

// --- Carga diferida ---
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProjectListPage = lazy(() => import('../pages/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
const ProjectCreatePage = lazy(() => import('../pages/ProjectCreatePage'));
//const ProjectEditPage = lazy(() => import('../pages/ProjectEditPage'));
import ProjectEditPage from '../pages/ProjectEditPage';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage'));
const AdminTagsPage = lazy(() => import('../pages/AdminTagsPage'));
const AdminLookupsPage = lazy(() => import('../pages/AdminLookupsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
// const ControlPanelPage = lazy(() => import('../pages/ControlPanelPage')); // <-- ELIMINADO
const AdminLayout = lazy(() => import('../components/layout/AdminLayout')); // <-- Layout con Tabs

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
                <Route path="/projects/:id/edit" element={
                        <ProtectedRoute> {/* Protección básica de login */}
                            <ProjectEditPage /> {/* Sigue usando importación directa por ahora */}
                        </ProtectedRoute>
                    } 
                />

                 {/* --- Rutas Comunes Admin/Coord (SIN Panel Control) --- */}
                 <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]} />}>
                    {/* <Route path="/panel-control" element={<ControlPanelPage />} /> */ } {/* <-- ELIMINADO */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects/new" element={<ProjectCreatePage />} />
                 </Route>

                {/* --- ESTRUCTURA ADMIN ANIDADA --- */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="tags" element={<AdminTagsPage />} />
                    <Route path="lookups" element={<AdminLookupsPage />} />
                    <Route path="users" element={ <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminUsersPage /></ProtectedRoute> } />
                    <Route index element={<Navigate to="tags" replace />} />
                </Route>
                {/* --- FIN ESTRUCTURA ADMIN --- */}

                {/* --- Ruta Catch-all (404) --- */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;