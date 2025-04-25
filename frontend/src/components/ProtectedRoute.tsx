import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useCurrentUser } from '../store/authStore';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const location = useLocation();

  // Logs de depuración eliminados

  if (!isAuthenticated) {
    // Redirige a login si no está autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica roles si se especificaron
  if (allowedRoles && (!currentUser?.role || !allowedRoles.includes(currentUser.role))) {
    // Redirige a inicio si el rol no es permitido
    return <Navigate to="/" replace />;
  }

  // Permite acceso y renderiza la ruta hija
  return <Outlet />;
}

export default ProtectedRoute;