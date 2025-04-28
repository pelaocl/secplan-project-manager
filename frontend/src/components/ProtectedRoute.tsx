// frontend/src/components/ProtectedRoute.tsx (VERSIÓN CORRECTA)

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useCurrentUser } from '../store/authStore';
import { UserRole } from '../types';

// Asegúrate de que acepte 'children'
interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    children?: React.ReactNode; // Prop estándar para los componentes hijos
}

// Recibe 'children'
function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const isAuthenticated = useIsAuthenticated();
    const currentUser = useCurrentUser();
    const location = useLocation();

    // Logs opcionales para depuración (puedes quitarlos si quieres)
    // console.log(`[ProtectedRoute] Check para ruta: ${location.pathname}`);
    // console.log(`[ProtectedRoute] isAuthenticated: ${isAuthenticated}`);
    // console.log(`[ProtectedRoute] currentUser:`, currentUser);
    // console.log(`[ProtectedRoute] allowedRoles: ${allowedRoles?.join(', ')}`);

    if (!isAuthenticated) {
        // console.log('[ProtectedRoute] NO AUTENTICADO. Redirigiendo a /login...');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = currentUser?.role; // Asume que el rol es único por ahora
        // console.log(`[ProtectedRoute] Verificando Rol. UserRole: ${userRole}`);
        // TODO: Ajustar esto si implementas roles múltiples en currentUser.roles (array)
        if (!userRole || !allowedRoles.includes(userRole)) {
            // console.log('[ProtectedRoute] ROL NO PERMITIDO. Redirigiendo a /...');
            return <Navigate to="/" replace />;
        } else {
             // console.log('[ProtectedRoute] ROL PERMITIDO.');
        }
    } else {
        // console.log('[ProtectedRoute] No se requieren roles específicos. Acceso permitido.');
    }

    // --- LA LÍNEA CLAVE CORREGIDA ---
    // Devuelve los componentes hijos que se pasaron a este componente
    // console.log('[ProtectedRoute] ACCESO PERMITIDO. Renderizando children...');
    return <>{children}</>;
    // -------------------------------
}

export default ProtectedRoute;