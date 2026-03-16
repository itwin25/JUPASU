import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserInfo } from '@/types/user.types';
import { authToken } from '@/features/auth/utils/auth-token';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (user: UserInfo) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => {
        authToken.remove();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'jupasu-auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
