import { create } from 'zustand';
import { UserInfo, AuthStatus } from '@/types/user.types';

interface AuthState {
  user: UserInfo | null;
  status: AuthStatus;
  setUser: (user: UserInfo | null) => void;
  setStatus: (status: AuthStatus) => void;
  logout: () => void;
}

/**
 * 전역 인증 상태 스토어
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  setStatus: (status) => set({ status }),
  logout: () => set({ user: null, status: 'unauthenticated' }),
}));
