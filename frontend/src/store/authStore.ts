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
    isLoading: boolean;
    error: string | null;
    systemUnreadCount: number; // Contador para la campana de sistema
    chatUnreadCount: number;   // Contador para el nuevo icono de chat
    actions: {
      login: (token: string, user: UserWithEtiquetas) => void;
      logout: () => void;
      setUser: (user: UserWithEtiquetas | null) => void;
      setLoading: (loading: boolean) => void;
      setError: (error: string | null) => void;
      setUnreadCounts: (counts: { systemCount: number; chatCount: number }) => void; // Nueva acción
      connectSocketOnRehydrate: () => void;
    };
  }

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,
            systemUnreadCount: 0,
            chatUnreadCount: 0,

            // Acciones para modificar el estado
            actions: {
                login: (token, user) => {
                    console.log('[AuthStore] Logging in user:', user);
                    set({ 
                        token, 
                        user, 
                        isAuthenticated: true, 
                        error: null, 
                        isLoading: false, 
                        systemUnreadCount: 0, // Reset
                        chatUnreadCount: 0    // Reset
                    });
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
                    set({ 
                        token: null, 
                        user: null, 
                        isAuthenticated: false, 
                        error: null, 
                        isLoading: false, 
                        systemUnreadCount: 0, // Reset
                        chatUnreadCount: 0    // Reset
                    });
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
                
                setUnreadCounts: (counts) => {
                    console.log('[AuthStore] Updating unread counts:', counts);
                    set({ systemUnreadCount: counts.systemCount, chatUnreadCount: counts.chatCount });
                },
                
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
export const useSystemUnreadCount = () => useAuthStore((state) => state.systemUnreadCount);
export const useChatUnreadCount = () => useAuthStore((state) => state.chatUnreadCount);
// Para invocar la conexión del socket después de la rehidratación,
// lo haremos desde App.tsx usando un useEffect para mayor control y claridad.