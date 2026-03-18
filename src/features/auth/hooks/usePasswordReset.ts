import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';

import { authApi } from '@/features/auth/api/auth.api';
import {
  ResetPasswordRequest,
  AuthResponse,
  AuthErrorResponse,
} from '@/features/auth/types/auth.types';
import { passwordResetSchema, PasswordResetSchema } from '@/features/auth/schemas/auth.schema';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import { useTimer } from '@/hooks';

/**
 * 비밀번호 재설정 관련 커스텀 훅
 * 비즈니스 로직, 상태 관리, 폼 처리를 관리
 */
export const usePasswordReset = () => {
  const [step, setStep] = useState(1); // 1: Email Auth, 2: New Password
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSentOnce, setIsSentOnce] = useState(false);

  const authTimer = useTimer(300); // 인증코드 유효시간용 (5분)

  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const addToast = useToastStore((state) => state.addToast);

  // React Hook Form 설정
  const form = useForm<PasswordResetSchema>({
    resolver: zodResolver(passwordResetSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      authCode: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { control, trigger, getValues, setError, clearErrors } = form;
  const authCode = useWatch({ control, name: 'authCode' });

  // 타이머 로직
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearErrors('email');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, clearErrors]);

  // Mutations
  const requestOtp = useMutation<AuthResponse<null>, AxiosError<AuthErrorResponse>, string>({
    mutationFn: (email: string) => authApi.sendPasswordResetOtp(email),
  });

  const verifyOtp = useMutation<
    AxiosResponse<AuthResponse<null>>,
    AxiosError<AuthErrorResponse>,
    { email: string; code: string }
  >({
    mutationFn: ({ email, code }) => authApi.verifyPasswordResetOtp(email, code),
  });

  const resetPassword = useMutation<
    AuthResponse<null>,
    AxiosError<AuthErrorResponse>,
    ResetPasswordRequest
  >({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  });

  // 인증번호 전송
  const handleAuthSend = async () => {
    if (!(await trigger('email'))) return;

    requestOtp.mutate(getValues('email'), {
      onSuccess: () => {
        clearErrors('email');
        setIsModalOpen(true);
        setTimeLeft(60);
        setIsSentOnce(true);
        authTimer.start(); // 5분 유효시간 타이머 시작
      },
      onError: (error) => {
        const message = error.response?.data?.message || '발송 실패';
        setError('email', { message });
        if (message.includes('60초')) {
          setTimeLeft(60);
          setIsSentOnce(true);
          authTimer.start(); // 60초 에러 시에도 타이머 재시작
        }
      },
    });
  };

  // 인증번호 검증
  const handleAuthVerify = async () => {
    if (!(await trigger('authCode'))) return;

    const { email, authCode } = getValues();
    verifyOtp.mutate(
      { email, code: authCode },
      {
        onSuccess: () => {
          setStep(2);
          authTimer.stop(); // 인증 성공 시 유효시간 타이머 정지
        },
        onError: (error) =>
          setError('authCode', { message: error.response?.data?.message || '인증번호 불일치' }),
      },
    );
  };

  // 비밀번호 재설정
  const onFinalSubmit = (data: PasswordResetSchema) => {
    resetPassword.mutate(
      {
        email: data.email,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          clearAuth();
          addToast('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.', 'success');
          router.push('/login');
        },
        onError: (error) =>
          addToast(error.response?.data?.message || '비밀번호 변경 실패', 'error'),
      },
    );
  };

  return {
    form,
    states: {
      step,
      showPw,
      showConfirmPw,
      isModalOpen,
      timeLeft,
      isSentOnce,
      authCode,
      authCodeTimeLeft: authTimer.formattedTime,
      isAuthCodeExpired: authTimer.isExpired,
      isLoading: requestOtp.isPending || verifyOtp.isPending || resetPassword.isPending,
    },
    actions: {
      setStep,
      setShowPw,
      setShowConfirmPw,
      setIsModalOpen,
      handleAuthSend,
      handleAuthVerify,
      onFinalSubmit,
    },
  };
};
