'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { signinSchema, SigninSchema } from '@/features/auth/schemas/auth.schema'; // 💡 SigninSchema와 동일한지 확인 필요
import { useSignin } from '../hooks/useSignin';
import { useToastStore } from '@/stores/toast.store';
import { useEffect, useRef } from 'react';

interface LoginFormProps {
  errorCode?: string;
}

export default function LoginForm({ errorCode }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { signinMutation } = useSignin();
  const addToast = useToastStore((state) => state.addToast);
  const toastShown = useRef(false);

  // 리다이렉트 에러용 토스트 (로그인 후 이용해주세요)
  useEffect(() => {
    if (!toastShown.current) {
      if (errorCode === 'login_required') {
        addToast('로그인 후 이용해주세요.', 'info');
        toastShown.current = true;
      }
    }
  }, [errorCode, addToast]);

  // React Hook Form 초기화
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SigninSchema>({
    resolver: zodResolver(signinSchema),
    mode: 'onChange', // 실시간 검증으로 버튼 활성화 상태 제어
  });

  // 폼 제출 핸들러
  const onSubmit = (data: SigninSchema) => {
    signinMutation.mutate(data);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-4">
        {/* 이메일 입력 */}
        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          {...register('email')}
          error={errors.email?.message}
          required
        />

        <div className="space-y-2">
          {/* 비밀번호 입력 */}
          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            placeholder="********"
            {...register('password')}
            error={
              errors.password?.message === '비밀번호를 입력해주세요.'
                ? errors.password.message
                : undefined
            }
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-main/40 hover:text-text-main/60 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
          <div className="flex justify-end">
            <Link
              href="/password-reset"
              className="text-primary-700 hover:text-primary-800 text-sm font-medium"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        {/* 버튼 컴포넌트 활성화 및 로딩 상태 연결 */}
        <Button
          type="submit"
          size="full"
          disabled={!isValid}
          isLoading={signinMutation.isPending}
          className="text-lg shadow-sm"
        >
          로그인
        </Button>

        <div className="text-text-main/60 text-center text-sm font-medium">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary-700 hover:text-primary-800 font-bold">
            회원가입
          </Link>
        </div>
      </div>
    </form>
  );
}
