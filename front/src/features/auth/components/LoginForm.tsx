'use client';

import { useState } from 'react';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="이메일"
        type="email"
        placeholder="이메일을 입력해주세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="비밀번호"
        type="password"
        placeholder="비밀번호를 입력해주세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" size="full" isLoading={isPending}>
        로그인
      </Button>
    </form>
  );
}
