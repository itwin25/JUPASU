'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';

interface Step1FormProps {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
}

export default function Step1Form({ data, setData, onNext }: Step1FormProps) {
  const { nickname, email, authCode, password, confirmPassword, isAgeChecked, currentSubStep } = data;
  
  const [emailError, setEmailError] = useState('');
  const [pwLengthError, setPwLengthError] = useState('');
  const [pwMatchError, setPwMatchError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // 닉네임 입력 완료 시 이메일 노출
  useEffect(() => {
    if (nickname.length >= 2 && currentSubStep === 1) {
      setData((prev: any) => ({ ...prev, currentSubStep: 2 }));
    }
  }, [nickname, currentSubStep, setData]);

  // 비밀번호 길이 검증
  useEffect(() => {
    if (password && password.length < 8) {
      setPwLengthError('비밀번호는 8자 이상이어야 합니다.');
    } else {
      setPwLengthError('');
    }
  }, [password]);

  // 비밀번호 일치 검증
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPwMatchError('비밀번호가 일치하지 않습니다.');
    } else {
      setPwMatchError('');
    }
  }, [password, confirmPassword]);

  const handleAuthSend = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setEmailError('');
    setData((prev: any) => ({ ...prev, currentSubStep: 3 }));
  };

  const handleAuthVerify = () => {
    if (authCode.length >= 4) {
      setData((prev: any) => ({ ...prev, currentSubStep: 4 }));
    }
  };

  const handlePwGroupBlur = () => {
    if (password.length >= 8 && confirmPassword && password === confirmPassword) {
      setData((prev: any) => ({ ...prev, currentSubStep: 5 }));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-primary-700 font-black text-sm uppercase tracking-widest">Step 1 - 기본 정보</h2>
      
      <div className="space-y-6">
        {/* 1. 닉네임 */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Input 
            label="닉네임" 
            placeholder="와인을 사랑하는 사람" 
            value={nickname}
            onChange={(e) => setData((prev: any) => ({ ...prev, nickname: e.target.value }))}
            required 
          />
        </div>
        
        {/* 2. 이메일 */}
        {currentSubStep >= 2 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input 
                  label="이메일" 
                  type="email" 
                  placeholder="example@email.com" 
                  value={email}
                  onChange={(e) => {
                    setData((prev: any) => ({ ...prev, email: e.target.value }));
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                  disabled={currentSubStep > 2}
                  required 
                />
              </div>
              {currentSubStep === 2 && (
                <div className="pt-[26px]">
                  <Button 
                    onClick={handleAuthSend}
                    variant="secondary" 
                    className="h-[56px] px-6 bg-primary-100 text-primary-700 font-black rounded-2xl"
                  >
                    인증
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 인증번호 */}
        {currentSubStep >= 3 && (
          <div className="flex gap-2 items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1">
              <Input 
                placeholder="인증번호" 
                value={authCode}
                onChange={(e) => setData((prev: any) => ({ ...prev, authCode: e.target.value }))}
                disabled={currentSubStep > 3}
                required 
              />
            </div>
            {currentSubStep === 3 && (
              <Button 
                onClick={handleAuthVerify}
                variant="secondary" 
                className="h-[56px] px-6 bg-primary-700 text-white font-black rounded-2xl"
              >
                확인
              </Button>
            )}
          </div>
        )}

        {/* 4. 비밀번호 & 비밀번호 확인 */}
        {currentSubStep >= 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Input 
              label="비밀번호" 
              type={showPw ? 'text' : 'password'} 
              placeholder="8자 이상의 비밀번호" 
              value={password}
              onChange={(e) => setData((prev: any) => ({ ...prev, password: e.target.value }))}
              error={pwLengthError}
              suffix={
                <button type="button" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={20} className="text-text-main/30" /> : <Eye size={20} className="text-text-main/30" />}
                </button>
              }
              required 
            />
            <Input 
              label="비밀번호 확인" 
              type={showConfirmPw ? 'text' : 'password'} 
              placeholder="비밀번호를 다시 입력해주세요" 
              value={confirmPassword}
              onChange={(e) => setData((prev: any) => ({ ...prev, confirmPassword: e.target.value }))}
              onBlur={handlePwGroupBlur}
              error={pwMatchError}
              suffix={
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                  {showConfirmPw ? <EyeOff size={20} className="text-text-main/30" /> : <Eye size={20} className="text-text-main/30" />}
                </button>
              }
              required 
            />
          </div>
        )}

        {/* 5. 19세 체크 */}
        {currentSubStep >= 5 && (
          <div 
            onClick={() => setData((prev: any) => ({ ...prev, isAgeChecked: !prev.isAgeChecked }))}
            className="flex items-center gap-2 text-sm text-text-main/50 py-2 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className={`w-4 h-4 rounded-full border transition-colors ${isAgeChecked ? 'bg-primary-700 border-primary-700' : 'border-gray-300'}`} />
            <span className={isAgeChecked ? "text-text-main font-bold" : ""}>만 19세 이상만 가입할 수 있어요</span>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="pt-6 space-y-6">
        <Button 
          onClick={onNext} 
          size="full" 
          disabled={!isAgeChecked || !!pwLengthError || !!pwMatchError || !password || !confirmPassword}
          className="text-lg shadow-lg disabled:bg-gray-200"
        >
          다음
        </Button>
        <div className="text-center text-sm font-bold text-text-main/40">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-700 font-black hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  );
}
