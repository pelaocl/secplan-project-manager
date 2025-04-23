import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Importa el componente para rutas protegidas (necesitarás crearlo/implementarlo después)
// import ProtectedRoute from '../components/ProtectedRoute'; // Descomenta cuando lo tengas

// Carga diferida (Lazy Loading) de los componentes de página
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProjectListPage = lazy(() => import('../pages/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
const ProjectCreatePage = lazy(() => import('../pages/ProjectCreatePage'));
const ProjectEditPage = lazy(() => import('../pages/ProjectEditPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage')); // Placeholder
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage')); // Placeholder
const AdminTagsPage = lazy(() => import('../pages/AdminTagsPage')); // Placeholder
const AdminLookupsPage = lazy(() => import('../pages/AdminLookupsPage')); // Placeholder
const NotFoundPage = lazy(() => import('../pages/NotFoundPage')); // Placeholder

// Componente simple para mostrar mientras cargan las páginas lazy
const LoadingFallback = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
    </Box>
);

function AppRoutes() {
  return (
    // Suspense es necesario para que React.lazy funcione
    <Suspense fallback={<LoadingFallback />}>
      <Routes> {/* El contenedor principal de todas las rutas */}

        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} /> {/* Asumiendo que tendrás esta página */}

        {/* --- Rutas Protegidas (Ejemplo - Requieren Login) --- */}
        {/* Descomenta el wrapper ProtectedRoute cuando lo implementes */}
        {/* <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'USUARIO']} />}> */}
          {/* Estas rutas solo serían accesibles si el usuario está logueado */}
          {/* La lógica específica de roles (quién puede crear/editar qué) va DENTRO de las páginas/componentes y/o en el backend */}
          <Route path="/projects/new" element={<ProjectCreatePage />} />
          <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
        {/* </Route> */}


        {/* --- Rutas de Administrador (Ejemplo - Requieren Rol ADMIN) --- */}
         {/* Descomenta el wrapper ProtectedRoute cuando lo implementes */}
        {/* <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}> */}
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/tags" element={<AdminTagsPage />} />
            <Route path="/admin/lookups" element={<AdminLookupsPage />} />
            {/* El dashboard podría ser accesible por Admin y Coordinador */}
            {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/* </Route> */}

        {/* --- Rutas de Coordinador/Admin (Ejemplo) --- */}
         {/* Descomenta el wrapper ProtectedRoute cuando lo implementes */}
        {/* <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR']} />}> */}
             <Route path="/dashboard" element={<DashboardPage />} />
        {/* </Route> */}


        {/* Ruta "Catch-all" para páginas no encontradas (404) */}
        {/* Asegúrate de que NotFoundPage.tsx exista en src/pages */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

export default AppRoutes;