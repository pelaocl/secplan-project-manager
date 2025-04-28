// ========================================================================
// INICIO: Contenido COMPLETO y CORREGIDO para authStore.ts
// ========================================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Asegúrate de que User y UserRole incluyan lo necesario (como etiquetas en User si el login las devuelve)
import { User, UserRole, Etiqueta } from '../types';

// Actualiza la interfaz User si ahora incluye etiquetas desde el login
interface UserWithEtiquetas extends User {
    etiquetas?: Etiqueta[]; // Asegúrate que el login devuelva esto si lo necesitas globalmente
}

// Interfaz que define la estructura del estado de autenticación
interface AuthState {
    user: UserWithEtiquetas | null; // Usamos el tipo extendido si aplica
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Para indicar si hay una operación de auth en curso
    error: string | null; // Para almacenar mensajes de error de login/registro
    actions: {
        login: (token: string, user: UserWithEtiquetas) => void; // Recibe el usuario completo
        logout: () => void;
        // Actualiza setUser para aceptar el tipo potencialmente extendido
        setUser: (user: UserWithEtiquetas | null) => void;
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
    };
    // Ya no necesitamos la función getUserRole aquí dentro
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Acciones para modificar el estado
            actions: {
                login: (token, user) => {
                    console.log('AuthStore: Logging in user', user); // Verifica si vienen las etiquetas aquí
                    set({ token, user, isAuthenticated: true, error: null, isLoading: false });
                },
                logout: () => {
                    console.log('AuthStore: Logging out');
                    set({ token: null, user: null, isAuthenticated: false, error: null });
                    // Considera limpiar también sessionStorage si lo usas
                    // sessionStorage.removeItem('algunaClaveSiLaUsas');
                },
                setUser: (user) => {
                     console.log('AuthStore: Setting/Updating user', user);
                     // Actualiza solo el usuario, manteniendo el estado de autenticación si ya existe
                     set(state => ({ ...state, user: user ? { ...state.user, ...user } : null }));
                     // Si al actualizar datos (ej. admin cambia rol) debe re-evaluarse isAuthenticated:
                     // set({ user, isAuthenticated: !!user }); // Ajustar según lógica deseada
                },
                setLoading: (isLoading) => set({ isLoading }),
                setError: (error) => set({ error, isLoading: false }),
            },

             // Eliminamos la función getUserRole de aquí, usamos el hook selector directo
        }),
        {
            name: 'auth-storage', // Nombre en localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ // Persiste solo estos campos
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// --- Selectores y Hooks recomendados ---

export const useAuthActions = () => useAuthStore((state) => state.actions);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
// --- Hook para el Rol CORREGIDO ---
export const useCurrentUserRole = () => useAuthStore((state) => state.user?.role ?? null);
// --- Hook para las Etiquetas (si las guardas en el store) ---
// export const useCurrentUserEtiquetas = () => useAuthStore((state) => state.user?.etiquetas ?? []);

// ========================================================================
// FIN: Contenido COMPLETO y CORREGIDO para authStore.ts
// ========================================================================