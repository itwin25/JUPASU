'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';

import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { signupSchema, SignupSchema } from '@/features/auth/schemas/auth.schema';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { AuthErrorResponse } from '@/features/auth/types/auth.types';

interface Step1FormProps {
  mutations: ReturnType<typeof useSignup>['mutations'];
  onSuccess: () => void;
}

export default function Step1Form({ mutations, onSuccess }: Step1FormProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { requestOtpAction, verifyOtp, signUp } = mutations;

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

  const handleAuthSend = async () => {
    if (!(await trigger('email'))) return;
    requestOtpAction.mutate(getValues('email'), {
      onSuccess: () => {
        clearErrors('email');
        setCurrentSubStep(3);
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
        Step 1 - 기본 정보
      </h2>

      <div className="space-y-6">
        {/* 닉네임 */}
        <Input
          label="닉네임"
          placeholder="와인을 사랑하는 사람"
          {...register('nickname', {
            onChange: (e) => {
              if (e.target.value.length >= 2 && currentSubStep === 1) setCurrentSubStep(2);
            },
          })}
          error={errors.nickname?.message}
          required
        />

        {/* 이메일 */}
        {currentSubStep >= 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex items-start gap-2">
            <div className="flex-1">
              <Input
                label="이메일"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={currentSubStep > 2}
                required
              />
            </div>
            {currentSubStep === 2 && (
              <div className="pt-[26px]">
                <Button
                  type="button"
                  onClick={handleAuthSend}
                  isLoading={requestOtpAction.isPending}
                  variant="secondary"
                  className="h-[56px]"
                >
                  인증
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 인증번호 */}
        {currentSubStep >= 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder="인증번호"
                {...register('authCode')}
                error={errors.authCode?.message}
                disabled={currentSubStep > 3}
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

        {/* 비밀번호 섹션 */}
        {currentSubStep >= 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <Input
              label="비밀번호"
              type={showPw ? 'text' : 'password'}
              placeholder="8자 이상의 비밀번호"
              {...register('password')}
              error={errors.password?.message}
              suffix={
                <button type="button" onClick={() => setShowPw(!showPw)}>
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
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                  {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              required
            />
          </div>
        )}

        {/* 연령 체크 */}
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
        disabled={!isAgeChecked || signUp.isPending}
        isLoading={signUp.isPending}
      >
        다음
      </Button>
    </form>
  );
}
