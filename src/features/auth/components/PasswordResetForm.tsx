'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';

export default function PasswordResetForm() {
  const [step, setStep] = useState(1); // 1: Email Auth, 2: New Password
  const router = useRouter();

  // Input Values
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error States
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pwError, setPwError] = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');

  // UI States
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. 이메일 실시간 검증
  useEffect(() => {
    if (!email) {
      setEmailError('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
    } else {
      setEmailError('');
    }
  }, [email]);

  // 3. 새 비밀번호 실시간 검증
  useEffect(() => {
    if (password && password.length < 8) {
      setPwError('비밀번호는 8자 이상이어야 합니다.');
    } else {
      setPwError('');
    }
  }, [password]);

  // 4. 비밀번호 확인 실시간 검증
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPwError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPwError('');
    }
  }, [password, confirmPassword]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailError && email) {
      // 인증번호 전송 로직 시뮬레이션
      setIsModalOpen(true);
    }
  };

  const handleVerifyCode = () => {
    // 2. 인증번호 검증 (테스트용: 1234가 아니면 에러)
    if (code !== '1234') {
      setCodeError('인증번호가 일치하지 않습니다.');
    } else {
      setCodeError('');
      setStep(2);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwError && !confirmPwError && password === confirmPassword) {
      router.push('/login');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-primary-100 animate-in fade-in duration-500">
        <h2 className="text-xl font-black text-text-main mb-6">비밀번호 재설정</h2>

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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={emailError}
                      className="py-3 px-4" 
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={!!emailError || !email}
                    className="h-[52px] px-6 text-sm bg-primary-700 hover:bg-primary-900 rounded-2xl shrink-0 disabled:bg-gray-200"
                  >
                    전송
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input 
                    placeholder="인증번호 입력" 
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (codeError) setCodeError('');
                    }}
                    error={codeError}
                    className="py-3 px-4" 
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={!code}
                  className="h-[52px] px-6 text-sm bg-primary-700 hover:bg-primary-900 rounded-2xl shrink-0 disabled:bg-gray-200"
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
                type={showPw ? 'text' : 'password'} 
                placeholder="8자 이상의 새 비밀번호" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={pwError}
                className="py-3 px-4"
                suffix={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-text-main/30 hover:text-text-main transition-colors">
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
              <Input 
                label="새 비밀번호 확인" 
                type={showConfirmPw ? 'text' : 'password'} 
                placeholder="새 비밀번호 다시 입력" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPwError}
                className="py-3 px-4"
                suffix={
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-text-main/30 hover:text-text-main transition-colors">
                    {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                type="submit"
                disabled={!!pwError || !!confirmPwError || !password || !confirmPassword}
                className="h-[44px] px-8 text-sm font-bold bg-primary-700 hover:bg-primary-900 rounded-2xl shadow-sm disabled:bg-gray-200"
              >
                확인
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 커스텀 전송 알림 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-15 h-15 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-text-main">전송 완료</h3>
              <p className="text-sm font-bold text-text-main/50 leading-relaxed">
                가입하신 이메일로<br />인증번호를 보내드렸습니다.
              </p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(false)}
              className="w-full h-14 bg-primary-700 hover:bg-primary-900 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95"
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
