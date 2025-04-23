import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from '../components/ProtectedRoute'; // Component to handle auth checks

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('../pages/LoginPage'));
const ProjectListPage = React.lazy(() => import('../pages/ProjectListPage'));
const ProjectDetailPage = React.lazy(() => import('../pages/ProjectDetailPage'));
const ProjectCreatePage = React.lazy(() => import('../pages/ProjectCreatePage'));
const ProjectEditPage = React.lazy(() => import('../pages/ProjectEditPage'));
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const AdminUsersPage = React.lazy(() => import('../pages/AdminUsersPage'));
const AdminTagsPage = React.lazy(() => import('../pages/AdminTagsPage'));
const AdminLookupsPage = React.lazy(() => import('../pages/AdminLookupsPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

const LoadingFallback = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
    </Box>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProjectListPage />} /> {/* List view can be public */}
        <Route path="/projects/:id" element={<ProjectDetailPage />} /> {/* Detail view public part */}

        {/* Protected Routes (Require Login) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'USUARIO']} />}>
           {/* Routes accessible by ADMIN, COORDINADOR, USUARIO */}
           {/* Example: A logged-in user might see more detail on the list/detail pages handled internally */}
           <Route path="/projects/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR']} element={<ProjectCreatePage />} />} />
           <Route path="/projects/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'USUARIO']} element={<ProjectEditPage />} />} />
           {/* Note: Edit permission logic (is Proyectista) is handled inside ProjectEditPage/Form + Backend */}
        </Route>

        {/* Protected Admin Routes */}
         <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/tags" element={<AdminTagsPage />} />
            <Route path="/admin/lookups" element={<AdminLookupsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} /> {/* Or make dashboard accessible to COORDINADOR too */}
         </Route>

         {/* Protected Coordinator Routes (Example: Dashboard) */}
         <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR']} />}>
            {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
            {/* Add other Coordinator-specific routes here */}
         </Route>


        {/* Catch-all Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;