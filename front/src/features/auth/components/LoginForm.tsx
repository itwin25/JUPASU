'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { useLoginMutation } from '../hooks/useLoginMutation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLoginMutation();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateEmail(email)) {
      login({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-4">
        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(''); // 입력 시 에러 초기화
          }}
          onBlur={() => validateEmail(email)} // 포커스 아웃 시 검사
          error={emailError}
          required
        />
        <div className="space-y-2">
          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            <Link href="/password-reset" className="text-sm font-medium text-[#B36262] hover:text-[#880606]">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
      </div>
      
      <div className="pt-4 space-y-6">
        <Button type="submit" size="full" isLoading={isPending} className="text-lg shadow-sm">
          로그인
        </Button>
        
        <div className="text-center text-sm font-medium text-text-main/60">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-[#B36262] hover:text-[#880606] font-bold">
            회원가입
          </Link>
        </div>
      </div>
    </form>
  );
}
