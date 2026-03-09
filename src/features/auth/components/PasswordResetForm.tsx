'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';

export default function PasswordResetForm() {
  const [step, setStep] = useState(1); // 1: Email Auth, 2: New Password
  const router = useRouter();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 인증번호 전송 로직
  };

  const handleVerifyCode = () => {
    // TODO: 인증 확인 로직
    setStep(2);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 비밀번호 재설정 로직
    router.push('/login');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 shadow-sm border border-primary-100">
      <h2 className="text-xl font-bold text-text-main mb-6">비밀번호 재설정</h2>

      {step === 1 ? (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-main/90 ml-1">Email</label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input 
                    type="email" 
                    placeholder="SSAFY@email.com" 
                    className="py-3 px-4" 
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-[52px] px-6 text-sm bg-primary-700 hover:bg-primary-900 rounded-2xl"
                >
                  전송
                </Button>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input 
                  placeholder="인증번호 입력" 
                  className="py-3 px-4" 
                />
              </div>
              <Button 
                type="button"
                onClick={handleVerifyCode}
                className="h-[52px] px-6 text-sm bg-primary-700 hover:bg-primary-900 rounded-2xl"
              >
                인증
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <Input 
              label="새 비밀번호" 
              type="password" 
              placeholder="8자 이상의 새 비밀번호" 
              className="py-3 px-4"
            />
            <Input 
              label="새 비밀번호 확인" 
              type="password" 
              placeholder="새 비밀번호 다시 입력" 
              className="py-3 px-4"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit"
              className="h-[44px] px-6 text-sm bg-primary-700 hover:bg-primary-900 rounded-2xl shadow-sm"
            >
              확인
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
