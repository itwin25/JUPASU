import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError, AxiosResponse } from 'axios';
import { authApi } from '@/features/auth/api/auth.api';
import { authToken } from '@/features/auth/utils/auth-token';
import { SigninSchema } from '@/features/auth/schemas/auth.schema';
import { AuthResponse, AuthErrorResponse } from '@/features/auth/types/auth.types';
import { useAuth } from '../api/context/AuthContext';
import { useToastStore } from '@/stores/toast.store';

export const useSignin = () => {
  const { login } = useAuth();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const signinMutation = useMutation<
    AxiosResponse<AuthResponse<null>>,
    AxiosError<AuthErrorResponse>,
    SigninSchema
  >({
    mutationFn: (data) => authApi.signIn(data),
    onSuccess: (response) => {
      const authHeader = response.headers['authorization'];
      const refreshToken = response.headers['refresh-token'];

      if (authHeader && refreshToken) {
        const accessToken = authHeader.replace('Bearer ', '');

        authToken.setAccess(accessToken);
        authToken.setRefresh(refreshToken);

        login();

        router.push('/home');
        router.refresh();
      }
    },
    onError: (error) => {
      addToast(error.response?.data?.message || '로그인에 실패했습니다.', 'error');
    },
  });

  return { signinMutation };
};
