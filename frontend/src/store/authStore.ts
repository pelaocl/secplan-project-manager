import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the structure of the User object we expect from the backend
interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'COORDINADOR' | 'USUARIO' | 'VISITANTE'; // Match backend Role enum
  // Add other relevant user fields like etiquetas if needed
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Optional: for loading state during login/logout
  error: string | null; // Optional: for login errors
  actions: {
    login: (token: string, user: User) => void;
    logout: () => void;
    setUser: (user: User | null) => void; // Allow updating user info if needed
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      actions: {
        login: (token, user) => set({ token, user, isAuthenticated: true, error: null, isLoading: false }),
        logout: () => set({ token: null, user: null, isAuthenticated: false, error: null }),
        setUser: (user) => set({ user }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error, isLoading: false }),
      },
    }),
    {
      name: 'auth-storage', // Name of the item in storage (localStorage by default)
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
      // Only persist token and maybe user info (be careful with sensitive data)
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      // Custom function to get the Zustand hook's actions without persisting them
      // This avoids serializing functions into localStorage.
      // See Zustand docs for `persist` middleware with non-serializable state.
      // A common pattern is to separate state and actions or use a selector hook.
      // For simplicity here, actions are included but won't be persisted correctly by default.
      // Recommended: Export actions separately or use a dedicated hook.
      // Rehydration logic might be needed if actions depend on initial state.
    }
  )
);

// Selector hook for actions (recommended pattern)
export const useAuthActions = () => useAuthStore((state) => state.actions);

// Selector hook for auth status
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);