import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from '@/features/auth/api/auth.api';
import { onboardingApi } from '@/features/onboarding/api/onboarding.api';
import { SignupRequest, AuthResponse, AuthErrorResponse } from '@/features/auth/types/auth.types';
import { TasteData } from '@/features/wine/components/TasteProfileForm';
import { useTimer } from '@/hooks';

export const useSignup = () => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [debouncedNickname, setDebouncedNickname] = useState('');
  const router = useRouter();
  const authTimer = useTimer(300); // 인증코드 유효시간용 (5분)
  const resendTimer = useTimer(60); // 재전송 제한 시간용 (60초)
  const [isSentOnce, setIsSentOnce] = useState(false);

  // 1. 닉네임 디바운싱 (0.5초 대기)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNickname(nickname);
    }, 500); // 5000에서 500으로 수정
    return () => clearTimeout(timer);
  }, [nickname]);

  // 2. 닉네임 중복 검증 (useQuery 활용)
  const {
    data: nicknameCheckData,
    error: nicknameError,
    isFetching: isValidatingNickname,
  } = useQuery({
    queryKey: ['validateNickname', debouncedNickname],
    queryFn: () => authApi.validateNickname(debouncedNickname),
    enabled: debouncedNickname.length >= 2,
    retry: false,
    staleTime: 1000 * 60, // 1분간 결과 유지
  });

  const [onboardingData, setOnboardingData] = useState({
    tastes: { sweet: 3, acid: 3, body: 3, tannin: 3, abv: 3 },
    selectedWineTypes: [] as string[],
    selectedFlavorTags: [] as string[],
    selectedSituations: [] as string[],
  });

  const mutations = {
    requestOtpAction: useMutation<AuthResponse<null>, AxiosError<AuthErrorResponse>, string>({
      mutationFn: async (email: string) => {
        await authApi.validateEmail(email);
        return authApi.sendOtp(email);
      },
      onSuccess: () => {
        authTimer.start();
        resendTimer.start();
        setIsSentOnce(true);
      },
      onError: (error: AxiosError<AuthErrorResponse>) => {
        const message = error.response?.data?.message || '';
        if (message.includes('60초')) {
          resendTimer.start(60);
          setIsSentOnce(true);
        }
      },
    }),
    verifyOtp: useMutation<
      AuthResponse<null>,
      AxiosError<AuthErrorResponse>,
      { email: string; code: string }
    >({
      mutationFn: (params) => authApi.verifyOtp(params.email, params.code),
      onSuccess: () => {
        authTimer.stop();
      },
    }),
    signUp: useMutation<AuthResponse<null>, AxiosError<AuthErrorResponse>, SignupRequest>({
      mutationFn: (request) => authApi.signUp(request),
    }),
    updatePreference: useMutation<void, AxiosError<AuthErrorResponse>, TasteData>({
      mutationFn: (data) => onboardingApi.submitOnboarding(data),
      onSuccess: () => {
        setStep(3);
      },
    }),
  };

  const handleStep1Success = async (data: SignupRequest) => {
    try {
      // 1. 자동 로그인 실행 (토큰 획득)
      await authApi.signIn({
        email: data.email,
        password: data.password,
      });

      // 2. Step 2로 이동
      setStep(2);
    } catch (error) {
      console.error('Login after signup failed:', error);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      // Step 2에서 '다음' 클릭 시 취향 정보 제출
      mutations.updatePreference.mutate(onboardingData);
    } else if (step === 3) {
      router.push('/signup/complete');
    } else {
      setStep((prev) => prev + 1);
    }
  };
  const handleBack = () => (step === 1 ? router.push('/login') : setStep((prev) => prev - 1));

  // 닉네임 에러 메시지 추출
  const nicknameMessage = (nicknameError as AxiosError<AuthErrorResponse>)?.response?.data?.message;

  return {
    step,
    nickname,
    setNickname,
    nicknameMessage,
    isValidatingNickname,
    isNicknameAvailable: !!nicknameCheckData && !nicknameError,
    mutations,
    handleStep1Success,
    handleNext,
    handleBack,
    onboardingData,
    setOnboardingData,
    authCodeTimeLeft: authTimer.formattedTime,
    isAuthCodeExpired: authTimer.isExpired,
    resendSeconds: resendTimer.timeLeft,
    isSentOnce,
    startTimer: authTimer.start,
    stopTimer: authTimer.stop,
  };
};
