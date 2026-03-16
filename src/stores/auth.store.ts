import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserInfo } from '@/types/user.types';
import { authToken } from '@/features/auth/utils/auth-token';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  // 액션
  setAuth: (user: UserInfo) => void;
  clearAuth: () => void;
  hydrateAuth: () => void; // 쿠키 상태와 스토어 동기화
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => {
        authToken.remove(); // 쿠키 삭제
        set({ user: null, isAuthenticated: false });
      },

      /**
       * hydrateAuth: 브라우저가 새로고침될 때
       * 쿠키에 토큰이 실제로 있는지 확인하여 스토어 상태를 동기화
       */
      hydrateAuth: () => {
        const hasToken = !!authToken.getAccess();
        if (hasToken) {
          set({ isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'jupasu-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
