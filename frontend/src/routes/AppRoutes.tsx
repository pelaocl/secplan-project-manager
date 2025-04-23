import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// --- NUEVO: Importa el componente ProtectedRoute ---
import ProtectedRoute from '../components/ProtectedRoute';
// Importa el tipo UserRole si no lo has hecho ya en types/index.ts
import { UserRole } from '../types';

// Carga diferida (Lazy Loading) de los componentes de página
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProjectListPage = lazy(() => import('../pages/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
const ProjectCreatePage = lazy(() => import('../pages/ProjectCreatePage')); // Asegúrate que este archivo exista (puede estar vacío por ahora)
const ProjectEditPage = lazy(() => import('../pages/ProjectEditPage')); // Asegúrate que este archivo exista (puede estar vacío por ahora)
const DashboardPage = lazy(() => import('../pages/DashboardPage')); // Asegúrate que este archivo exista
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage')); // Asegúrate que este archivo exista
const AdminTagsPage = lazy(() => import('../pages/AdminTagsPage')); // Asegúrate que este archivo exista
const AdminLookupsPage = lazy(() => import('../pages/AdminLookupsPage')); // Asegúrate que este archivo exista
const NotFoundPage = lazy(() => import('../pages/NotFoundPage')); // Asegúrate que este archivo exista

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
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>

        {/* --- Rutas Públicas --- */}
        {/* Cualquiera puede acceder a estas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />


        {/* --- Rutas Protegidas por Login --- */}
        {/* Solo usuarios autenticados (cualquier rol) pueden acceder */}
        {/* El componente ProtectedRoute verifica si isAuthenticated es true */}
        <Route element={<ProtectedRoute />}>
            {/* Aquí irían rutas que solo requieren estar logueado, sin importar el rol */}
            {/* Por ejemplo, una página de perfil de usuario, si la hubiera */}
            {/* <Route path="/profile" element={<UserProfilePage />} /> */}

            {/* Nota: ProjectEditPage está aquí, pero la lógica *interna* de si */}
            {/* un USUARIO puede editar *ese proyecto específico* se maneja */}
            {/* en el backend y/o en la página misma. El rol base se permite aquí. */}
             <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
        </Route>


        {/* --- Rutas Protegidas por Rol: COORDINADOR o ADMIN --- */}
        {/* Solo usuarios con rol COORDINADOR o ADMIN pueden acceder */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.COORDINADOR]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects/new" element={<ProjectCreatePage />} />
            {/* Si hubiera otras rutas para estos roles */}
        </Route>


        {/* --- Rutas Protegidas por Rol: ADMIN --- */}
        {/* Solo usuarios con rol ADMIN pueden acceder */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/tags" element={<AdminTagsPage />} />
            <Route path="/admin/lookups" element={<AdminLookupsPage />} />
            {/* Si hubiera otras rutas solo para admin */}
        </Route>


        {/* --- Ruta Catch-all (404) --- */}
        {/* Esta siempre debe ir al final */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

export default AppRoutes;