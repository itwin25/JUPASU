'use client';

import { useState } from 'react';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';

export default function PasswordResetForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 비밀번호 재설정 로직
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-main/60 mb-4">
        가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
      </p>
      <Input
        label="이메일"
        type="email"
        placeholder="이메일을 입력해주세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" size="full">
        재설정 메일 발송
      </Button>
    </form>
  );
}
