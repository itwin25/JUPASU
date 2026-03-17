import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { userApi } from '../api/user.api';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { WithdrawRequest } from '@/types/user.types';
import { AuthResponse } from '@/features/auth/types/auth.types';
import { useToastStore } from '@/stores/toast.store';

/**
 * 회원 탈퇴 프로세스를 관리하는 커스텀 훅
 */
export function useWithdraw() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const addToast = useToastStore((state) => state.addToast);

  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawRequest) => userApi.withdrawUser(data),
    onSuccess: async (response) => {
      if (response.status === 200) {
        // 1. 성공 메시지 표시
        addToast('회원 탈퇴가 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');

        try {
          // 2. 서버 로그아웃 처리
          await authApi.signOut();
        } catch (error) {
          console.error('로그아웃 실패:', error);
        }

        // 3. 로컬 인증 상태 정리
        clearAuth();

        // 4. 로그인 페이지로 이동 (에러 코드를 포함하여 토스트 유도)
        router.push('/login?error=login_required');
      } else {
        addToast('비밀번호를 확인해주세요.', 'error');
      }
    },
    onError: (error: AxiosError<AuthResponse<null>>) => {
      const message =
        error.response?.data?.message ||
        '비밀번호가 일치하지 않거나 탈퇴 처리 중 오류가 발생했습니다.';
      addToast(message, 'error');
    },
  });

  const handleWithdraw = async (password: string) => {
    if (!password) {
      addToast('비밀번호를 입력해 주세요.', 'warning');
      return;
    }

    withdrawMutation.mutate({ password });
  };

  return {
    handleWithdraw,
    isLoading: withdrawMutation.isPending,
    isError: withdrawMutation.isError,
    error: withdrawMutation.error,
  };
}
