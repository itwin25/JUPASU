import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '../api/context/AuthContext';
import { useRouter } from 'next/navigation';

export const useSignout = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const signoutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      logout(); // 서버 로그아웃 성공 시 로컬 인증 상태 정리
      router.push('/login');
    },
    onError: (error) => {
      console.error('로그아웃 실패:', error);
      logout();
      router.push('/login');
    },
  });

  const handleSignout = () => {
    signoutMutation.mutate();
  };

  return {
    handleSignout,
    isLoading: signoutMutation.isPending,
  };
};
