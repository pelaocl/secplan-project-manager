// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, Etiqueta } from '../types'; // Asegúrate que Etiqueta esté definida si se usa
import { socketService } from '../services/socketService'; // <-- IMPORTAR socketService

// Actualiza la interfaz User si ahora incluye etiquetas desde el login
interface UserWithEtiquetas extends User {
    etiquetas?: Etiqueta[]; 
}

// Interfaz que define la estructura del estado de autenticación
interface AuthState {
    user: UserWithEtiquetas | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Para indicar si hay una operación de auth en curso o carga inicial
    error: string | null;
    actions: {
        login: (token: string, user: UserWithEtiquetas) => void;
        logout: () => void;
        setUser: (user: UserWithEtiquetas | null) => void;
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        // Nueva acción para manejar la conexión del socket después de la rehidratación
        connectSocketOnRehydrate: () => void;
    };
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            user: null,
            token: null,
            isAuthenticated: false,
            // isLoading: true, // Iniciar como true para que App.tsx pueda mostrar un loader al inicio
            isLoading: true, // <<<----- INICIAMOS isLoading en true
            error: null,

            // Acciones para modificar el estado
            actions: {
                login: (token, user) => {
                    console.log('[AuthStore] Logging in user:', user);
                    set({ token, user, isAuthenticated: true, error: null, isLoading: false });
                    // localStorage es manejado por 'persist' middleware para token, user, isAuthenticated
                    
                    // Conectar Socket.IO
                    if (token) {
                        console.log('[AuthStore] User logged in, connecting socket...');
                        socketService.connect(token);
                    }
                },
                logout: () => {
                    console.log('[AuthStore] Logging out...');
                    // Desconectar Socket.IO ANTES de limpiar el estado
                    socketService.disconnect(); 
                    set({ token: null, user: null, isAuthenticated: false, error: null, isLoading: false });
                    // 'persist' middleware limpiará los campos parcializados de localStorage
                },
                setUser: (user) => {
                    console.log('AuthStore: Setting/Updating user', user);
                    set(state => ({ 
                        ...state, 
                        user: user ? { ...(state.user || {}), ...user } as UserWithEtiquetas : null 
                    }));
                },
                setLoading: (isLoading) => set({ isLoading }),
                setError: (error) => set({ error, isLoading: false }),
                connectSocketOnRehydrate: () => {
                    const { token, isAuthenticated } = get();
                    if (isAuthenticated && token) {
                        console.log('[AuthStore] Rehydrated with active session, connecting socket...');
                        socketService.connect(token);
                    }
                    // Siempre marcamos isLoading como false después del intento de rehidratación/conexión
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage', 
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                // No persistimos isLoading ni error
            }),
            onRehydrateStorage: (state) => {
                console.log('[AuthStore] Storage rehydrated.');
                // Llamar a la acción para conectar el socket después de que el estado se haya rehidratado.
                // Directamente llamamos a la acción que está en el estado para asegurar que usamos la última versión de las funciones del store.
                // Esto se ejecutará una vez después de que el estado persistido se cargue.
                // No es necesario devolver nada aquí.
            }
        }
    )
);

// Selectores (sin cambios)
export const useAuthActions = () => useAuthStore((state) => state.actions);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useCurrentUserRole = () => useAuthStore((state) => state.user?.role ?? null);

// Para invocar la conexión del socket después de la rehidratación,
// lo haremos desde App.tsx usando un useEffect para mayor control y claridad.