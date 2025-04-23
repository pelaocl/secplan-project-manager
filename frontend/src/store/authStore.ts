import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '../types'; // Importa tu tipo User y UserRole

// Interfaz que define la estructura del estado de autenticación
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para indicar si hay una operación de auth en curso
  error: string | null; // Para almacenar mensajes de error de login/registro
  actions: {
    login: (token: string, user: User) => void;
    logout: () => void; // <--- ACCIÓN AÑADIDA
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
  };
  // Función helper para obtener el rol (o null si no está logueado)
  // Se puede acceder como useAuthStore.getState().getUserRole() o con un selector
  getUserRole: () => UserRole | null;
}

export const useAuthStore = create<AuthState>()(
  // Middleware persist para guardar en localStorage (o sessionStorage)
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
          console.log('AuthStore: Logging in user', user);
          set({ token, user, isAuthenticated: true, error: null, isLoading: false });
          // Opcional: guardar token en sessionStorage también si es necesario
          // if (typeof window !== 'undefined') { sessionStorage.setItem('jwtToken', token); }
        },
        // --- Acción Logout ---
        logout: () => {
          console.log('AuthStore: Logging out');
          set({ token: null, user: null, isAuthenticated: false, error: null });
          // Limpia explícitamente si es necesario (aunque persist debería encargarse)
          // if (typeof window !== 'undefined') { localStorage.removeItem('auth-storage'); sessionStorage.removeItem('jwtToken'); }
        },
        // --- Fin Logout ---
        setUser: (user) => set({ user }), // Para actualizar datos del usuario si cambian
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error, isLoading: false }),
      },

      // Función helper dentro del estado
      getUserRole: () => {
          return get().user?.role ?? null; // Devuelve el rol del usuario actual o null
      }
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage
      storage: createJSONStorage(() => localStorage), // Usa localStorage
      // Selecciona qué partes del estado persistir (evita guardar acciones o estado no serializable)
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // No persistimos isLoading ni error
      }),
      // onRehydrateStorage: (state) => { // Opcional: Lógica al rehidratar
      //   console.log('AuthStore: Hydration finished');
      //   return (state, error) => {
      //     if (error) {
      //       console.error('AuthStore: Failed to rehydrate state', error);
      //     }
      //   }
      // }
    }
  )
);

// --- Selectores y Hooks recomendados para desacoplar componentes ---

// Hook para acceder solo a las acciones (evita re-renderizados innecesarios)
export const useAuthActions = () => useAuthStore((state) => state.actions);

// Selectores para partes específicas del estado
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useCurrentUserRole = () => useAuthStore((state) => state.getUserRole()); // Hook para el rol