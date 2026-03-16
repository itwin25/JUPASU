import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from '@/features/auth/api/auth.api';
import { SignupRequest, AuthResponse, AuthErrorResponse } from '@/features/auth/types/auth.types';

export const useSignup = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // 온보딩 공통 데이터
  const [onboardingData, setOnboardingData] = useState({
    tastes: { sweet: 3, acid: 3, body: 3, tannin: 3, aroma: 3 },
    selectedSituations: [] as string[],
  });

  // mutation
  const mutations = {
    /** 1. 이메일 중복 확인 + OTP 발송 통합 액션 */
    requestOtpAction: useMutation<AuthResponse<null>, AxiosError<AuthErrorResponse>, string>({
      mutationFn: async (email: string) => {
        await authApi.validateEmail(email);
        return authApi.sendOtp(email);
      },
    }),

    // otp 인증번호 확인
    verifyOtp: useMutation<
      AuthResponse<null>,
      AxiosError<AuthErrorResponse>,
      { email: string; code: string }
    >({
      mutationFn: (params) => authApi.verifyOtp(params.email, params.code),
    }),

    // 획원가입
    signUp: useMutation<AuthResponse<null>, AxiosError<AuthErrorResponse>, SignupRequest>({
      mutationFn: (request) => authApi.signUp(request),
    }),
  };

  const handleStep1Success = () => setStep(2);
  const handleNext = () => (step === 2 ? setStep(3) : router.push('/signup/complete'));
  const handleBack = () => (step === 1 ? router.push('/login') : setStep((prev) => prev - 1));

  return {
    step,
    mutations,
    handleStep1Success,
    handleNext,
    handleBack,
    onboardingData,
    setOnboardingData,
  };
};
