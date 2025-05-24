// frontend/src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Outlet añadido por si acaso para la estructura de Admin
import { CircularProgress, Box, Typography } from '@mui/material';
import ProtectedRoute from '../components/ProtectedRoute';
import { UserRole } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';

// --- Carga diferida / Importación Directa ---
import LoginPage from '../pages/LoginPage';
import ProjectListPage from '../pages/ProjectListPage'; 
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
import ProjectCreatePage from '../pages/ProjectCreatePage';
import ProjectEditPage from '../pages/ProjectEditPage';
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
                
                <Route path="/" element={
                    <ErrorBoundary fallbackMessage="Error al cargar la lista de proyectos.">
                        <ProjectListPage />
                    </ErrorBoundary>
                } /> 
                
                {/* Ruta para /projects/:id/tasks/:taskId */}
                <Route 
                    path="/projects/:id/tasks/:taskId" 
                    element={ // PÚBLICA, PERO CON ERROR BOUNDARY
                        <ErrorBoundary fallbackMessage="Error al cargar la página del proyecto para esta tarea.">
                            <ProjectDetailPage />
                        </ErrorBoundary>
                    } 
                />

                {/* Ruta para /projects/:id */}
                <Route 
                    path="/projects/:id" 
                    element={ // PÚBLICA, PERO CON ERROR BOUNDARY
                        <ErrorBoundary fallbackMessage="Error al cargar los detalles del proyecto.">
                            <ProjectDetailPage />
                        </ErrorBoundary>
                    } 
                />

                {/* --- Rutas Protegidas --- */}
                <Route 
                    path="/projects/:id/edit" 
                    element={ 
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}>
                            <ErrorBoundary fallbackMessage="Error al cargar el formulario de edición.">
                                <ProjectEditPage />
                            </ErrorBoundary>
                        </ProtectedRoute> 
                    } 
                />
                
                <Route
                    path="/projects/new"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}>
                             <ErrorBoundary fallbackMessage="Error al cargar el formulario de creación.">
                                <ProjectCreatePage />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />

                {/* Rutas Dashboard (Protegida para Admin/Coordinador) */}
                {/* Si DashboardPage es un componente simple y no un layout para más rutas hijas, no necesita Outlet aquí */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}>
                            <ErrorBoundary fallbackMessage="Error al cargar el Dashboard.">
                                <DashboardPage />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    } 
                />
                
                {/* Estructura Admin Anidada */}
                <Route 
                    path="/admin" 
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]}>
                            <ErrorBoundary fallbackMessage="Error en el panel de administración.">
                                <AdminLayout /> {/* AdminLayout debería tener un <Outlet /> para las rutas hijas */}
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                >
                    <Route path="tags" element={<AdminTagsPage />} />
                    <Route path="lookups" element={<AdminLookupsPage />} />
                    <Route 
                        path="users" 
                        element={ 
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                <AdminUsersPage />
                            </ProtectedRoute> 
                        } 
                    />
                    <Route index element={<Navigate to="tags" replace />} />
                </Route>

                {/* Ruta Catch-all (404) */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;