'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Circle } from 'lucide-react';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { useLoginMutation } from '../hooks/useLoginMutation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending } = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="space-y-2">
          <Input
            label="비밀번호"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            suffix={<Circle size={20} className="text-text-main/40" />}
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
