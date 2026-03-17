'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store'; // 작성하신 Zustand 스토어 경로
import { UserInfo } from '@/types/user.types';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  logout: () => void;
  login: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, clearAuth, hydrateAuth } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const login = () => {
    hydrateAuth();
  };

  const logout = () => {
    clearAuth();
    router.push('/initial');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isAuthenticated,
        isLoading: !isMounted,
        user,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
