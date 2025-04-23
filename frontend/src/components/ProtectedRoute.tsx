import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useCurrentUser } from '../store/authStore'; // Hooks de Zustand
import { UserRole } from '../types'; // Importa tu tipo UserRole si lo tienes definido

// Props que aceptará nuestro componente
interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Array opcional de roles permitidos para esta ruta
  // Nota: En React Router v6, el componente a renderizar se pasa a través de <Outlet />
  // por lo que no necesitamos una prop 'element' o 'component' aquí directamente.
}

/**
 * Componente Wrapper para proteger rutas.
 * Verifica si el usuario está autenticado y (opcionalmente) si tiene un rol permitido.
 * Si el acceso es permitido, renderiza el componente hijo de la ruta anidada usando <Outlet />.
 * Si el acceso es denegado, redirige al usuario a la página de Login o a la página principal.
 */
function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  // 1. Obtener estado de autenticación y datos del usuario desde Zustand
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const location = useLocation(); // Hook para obtener la ubicación actual (URL)

  // Log para depuración (puedes quitarlo después)
  console.log('[ProtectedRoute] Checking access for:', location.pathname);
  console.log('[ProtectedRoute] IsAuthenticated:', isAuthenticated);
  console.log('[ProtectedRoute] CurrentUser Role:', currentUser?.role);
  console.log('[ProtectedRoute] AllowedRoles:', allowedRoles);

  // 2. Verificar si el usuario está autenticado
  if (!isAuthenticated) {
    // No está logueado. Redirigir a /login.
    console.log('[ProtectedRoute] Denied: Not Authenticated. Redirecting to /login.');
    // Usamos 'replace' para que el usuario no pueda volver a la página protegida con el botón "atrás" del navegador.
    // Pasamos la ubicación actual en 'state' para poder redirigir de vuelta después del login si queremos.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si se especificaron roles permitidos, verificar el rol del usuario
  // Asegúrate que currentUser no sea null aquí (aunque si isAuthenticated es true, no debería serlo)
  if (allowedRoles && currentUser?.role && !allowedRoles.includes(currentUser.role)) {
    // Está logueado, pero su rol NO está en la lista de roles permitidos para esta ruta.
    console.log(`[ProtectedRoute] Denied: Role '${currentUser.role}' not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to /.`);
    // Redirigir a una página de "No autorizado" o a la página principal.
    // Por simplicidad, redirigimos a la página principal por ahora.
    // Podrías crear una página específica /unauthorized si lo prefieres.
    return <Navigate to="/" replace />;
  }

  // 4. Si pasó todas las verificaciones (autenticado y rol permitido, si aplica)
  console.log('[ProtectedRoute] Access Granted. Rendering child route via <Outlet />.');
  // Renderiza el componente de la ruta anidada que este ProtectedRoute está envolviendo.
  // <Outlet /> es el marcador de posición donde React Router renderizará el 'element' de la <Route> hija.
  return <Outlet />;
}

// Exporta el componente (no necesita ser default si no quieres)
export default ProtectedRoute;