'use client';

import Link from 'next/link';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';

interface Step1FormProps {
  onNext: () => void;
}

export default function Step1Form({ onNext }: Step1FormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-primary-700 font-bold">Step 1 - 기본 정보</h2>
      
      <div className="space-y-4">
        <Input label="닉네임" placeholder="와인을 사랑하는 사람" required />
        
        <div className="space-y-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input label="이메일" type="email" placeholder="example@email.com" required />
            </div>
            <Button variant="secondary" className="h-[56px] px-6 bg-gray-200 border-none text-gray-400">인증</Button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input placeholder="인증번호" required />
            </div>
            <Button variant="secondary" className="h-[56px] px-6 bg-gray-200 border-none text-gray-400">확인</Button>
          </div>
        </div>

        <Input label="비밀번호" type="password" placeholder="8자 이상의 비밀번호" required />
        <Input label="비밀번호 확인" type="password" placeholder="비밀번호를 다시 입력해주세요" required />
      </div>

      <div className="flex items-center gap-2 text-sm text-text-main/50 py-2">
        <div className="w-4 h-4 rounded-full border border-gray-300" />
        <span>만 19세 이상만 가입할 수 있어요</span>
      </div>

      <div className="pt-4 space-y-6">
        <Button onClick={onNext} size="full" className="text-lg">다음</Button>
        <div className="text-center text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-700 font-bold">로그인</Link>
        </div>
      </div>
    </div>
  );
}
