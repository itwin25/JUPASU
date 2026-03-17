'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { UseMutationResult } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';

import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { signupSchema, SignupSchema } from '@/features/auth/schemas/auth.schema';
import { AuthErrorResponse, AuthResponse, SignupRequest } from '@/features/auth/types/auth.types';

type SignUpMutations = {
  requestOtpAction: UseMutationResult<
    AuthResponse<null>,
    AxiosError<AuthErrorResponse>,
    string,
    unknown
  >;
  verifyOtp: UseMutationResult<
    AuthResponse<null>,
    AxiosError<AuthErrorResponse>,
    { email: string; code: string },
    unknown
  >;
  signUp: UseMutationResult<
    AuthResponse<null>,
    AxiosError<AuthErrorResponse>,
    SignupRequest,
    unknown
  >;
};

interface SignUpFormProps {
  mutations: SignUpMutations;
  setNickname: (nickname: string) => void;
  nicknameMessage?: string;
  isValidatingNickname: boolean;
  isNicknameAvailable: boolean;
  onSuccess: () => void;
}

export default function SignUpForm({
  mutations,
  setNickname,
  nicknameMessage,
  isValidatingNickname,
  isNicknameAvailable,
  onSuccess,
}: SignUpFormProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { requestOtpAction: requestOtp, verifyOtp, signUp } = mutations;

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      nickname: '',
      email: '',
      authCode: '',
      password: '',
      confirmPassword: '',
      isAgeChecked: false,
    },
  });

  const isAgeChecked = useWatch({ control, name: 'isAgeChecked' });

  const shouldShowEmail = isNicknameAvailable || currentSubStep >= 2;

  const handleAuthSend = async () => {
    if (!(await trigger('email'))) return;
    requestOtp.mutate(getValues('email'), {
      onSuccess: () => {
        clearErrors('email');
        setCurrentSubStep(3); // 성공 이벤트 시점에 상태 변경 (안전)
      },
      onError: (error: AxiosError<AuthErrorResponse>) =>
        setError('email', { message: error.response?.data?.message || '발송 실패' }),
    });
  };

  const handleAuthVerify = async () => {
    if (!(await trigger('authCode'))) return;
    const { email, authCode } = getValues();
    verifyOtp.mutate(
      { email, code: authCode },
      {
        onSuccess: () => setCurrentSubStep(4),
        onError: (error: AxiosError<AuthErrorResponse>) =>
          setError('authCode', { message: error.response?.data?.message || '인증번호 불일치' }),
      },
    );
  };

  const handlePwGroupBlur = async () => {
    if (await trigger(['password', 'confirmPassword'])) setCurrentSubStep(5);
  };

  const onFinalSubmit = (data: SignupSchema) => {
    signUp.mutate(data, {
      onSuccess: () => onSuccess(),
      onError: (error: AxiosError<AuthErrorResponse>) =>
        alert(error.response?.data?.message || '가입 실패'),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-8 pb-10">
      <h2 className="text-primary-700 text-sm font-black tracking-widest uppercase">
        Sign Up - 기본 정보
      </h2>

      <div className="space-y-6">
        {/* 1. 닉네임 섹션 */}
        <div className="space-y-1.5">
          <Input
            label="닉네임"
            placeholder="와인을 사랑하는 사람"
            {...register('nickname', {
              onChange: (e) => setNickname(e.target.value),
            })}
            error={isValidatingNickname ? undefined : errors.nickname?.message || nicknameMessage}
            required
            suffix={isNicknameAvailable && <CheckCircle2 size={18} className="text-green-500" />}
          />
          {/* 상태 메시지 영역 (Type Error 해결을 위해 helperText 대신 별도 div 사용) */}
          {!errors.nickname && !nicknameMessage && (
            <div className="px-1 text-xs font-medium">
              {isValidatingNickname && <span className="text-text-main/40">중복 확인 중...</span>}
              {isNicknameAvailable && (
                <span className="text-green-600">사용 가능한 닉네임입니다.</span>
              )}
            </div>
          )}
        </div>

        {/* 2. 이메일 섹션 */}
        {shouldShowEmail && (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex items-start gap-2">
            <div className="flex-1">
              <Input
                label="이메일"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={currentSubStep >= 3}
                required
              />
            </div>
            {currentSubStep < 3 && (
              <div className="pt-[26px]">
                <Button
                  type="button"
                  onClick={handleAuthSend}
                  isLoading={requestOtp.isPending}
                  variant="secondary"
                  className="h-[56px]"
                >
                  인증
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 3. 인증번호 섹션 */}
        {currentSubStep >= 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder="인증번호"
                {...register('authCode')}
                error={errors.authCode?.message}
                disabled={currentSubStep >= 4}
                required
              />
            </div>
            {currentSubStep === 3 && (
              <Button
                type="button"
                onClick={handleAuthVerify}
                isLoading={verifyOtp.isPending}
                className="h-[56px]"
              >
                확인
              </Button>
            )}
          </div>
        )}

        {/* 4. 비밀번호 섹션 */}
        {currentSubStep >= 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <Input
              label="비밀번호"
              type={showPw ? 'text' : 'password'}
              placeholder="8자 이상의 비밀번호"
              {...register('password')}
              error={errors.password?.message}
              suffix={
                <button type="button" onClick={() => setShowPw(!showPw)} className="pr-2">
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              required
            />
            <Input
              label="비밀번호 확인"
              type={showConfirmPw ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력해주세요"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              onBlur={handlePwGroupBlur}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="pr-2"
                >
                  {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              required
            />
          </div>
        )}

        {/* 5. 연령 체크 섹션 */}
        {currentSubStep >= 5 && (
          <div
            onClick={() => setValue('isAgeChecked', !isAgeChecked, { shouldValidate: true })}
            className="animate-in fade-in slide-in-from-bottom-4 flex cursor-pointer items-center gap-2"
          >
            <div
              className={`h-4 w-4 rounded-full border transition-colors ${isAgeChecked ? 'bg-primary-700 border-primary-700' : 'border-gray-300'}`}
            />
            <span className={isAgeChecked ? 'text-text-main font-bold' : 'text-text-main/50'}>
              만 19세 이상 가입 가능
            </span>
            {errors.isAgeChecked && (
              <p className="ml-auto text-xs text-red-500">{errors.isAgeChecked.message}</p>
            )}
          </div>
        )}
      </div>

      <Button
        type="submit"
        size="full"
        disabled={!isAgeChecked || signUp.isPending || !isNicknameAvailable}
        isLoading={signUp.isPending}
      >
        다음
      </Button>
    </form>
  );
}
