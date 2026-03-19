'use client';

import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';

export default function PasswordResetForm() {
  const {
    form: {
      register,
      handleSubmit,
      formState: { errors },
    },
    states: {
      step,
      showPw,
      showConfirmPw,
      isModalOpen,
      timeLeft,
      isSentOnce,
      isLoading,
      authCode,
      authCodeTimeLeft,
      isAuthCodeExpired,
    },
    actions: {
      setShowPw,
      setShowConfirmPw,
      setIsModalOpen,
      handleAuthSend,
      handleAuthVerify,
      onFinalSubmit,
    },
  } = usePasswordReset();

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="border-primary-100 animate-in fade-in rounded-3xl border bg-white p-6 shadow-sm duration-500">
        <h2 className="text-text-main mb-6 text-xl font-black">비밀번호 재설정</h2>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-text-main/90 ml-1 text-sm font-bold">Email</label>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="SSAFY@email.com"
                      {...register('email')}
                      error={errors.email?.message}
                      className="px-4 py-3"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAuthSend}
                    isLoading={isLoading}
                    disabled={timeLeft > 0 || !!errors.email}
                    className="bg-primary-700 hover:bg-primary-900 h-[52px] shrink-0 rounded-2xl px-6 text-sm disabled:bg-gray-200"
                  >
                    {isSentOnce ? '재전송' : '전송'}
                  </Button>
                </div>
                {timeLeft > 0 && (
                  <div className="flex items-center justify-between bg-white p-4">
                    <p className="text-primary-600 animate-in fade-in ml-1 text-xs font-medium duration-300">
                      메일을 못 받으셨나요?
                    </p>
                    <p className="text-primary-600 animate-in fade-in ml-1 text-xs font-medium duration-300">
                      {timeLeft}초 후 재전송
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="인증번호 입력"
                    {...register('authCode')}
                    error={
                      isAuthCodeExpired
                        ? '인증 시간이 만료되었습니다. 다시 시도해 주세요.'
                        : errors.authCode?.message
                    }
                    className="px-4 py-3"
                    suffix={
                      isSentOnce &&
                      !isAuthCodeExpired && (
                        <span className="text-primary-600 mr-2 text-sm font-medium">
                          {authCodeTimeLeft}
                        </span>
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAuthVerify}
                  isLoading={isLoading}
                  disabled={authCode?.length !== 6 || isLoading || isAuthCodeExpired}
                  className="bg-primary-700 hover:bg-primary-900 h-[52px] shrink-0 rounded-2xl px-6 text-sm disabled:bg-gray-200"
                >
                  인증
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onFinalSubmit)}
            className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300"
          >
            <div className="space-y-4">
              <Input
                label="새 비밀번호"
                type={showPw ? 'text' : 'password'}
                placeholder="8자 이상의 새 비밀번호"
                {...register('password')}
                error={errors.password?.message}
                className="px-4 py-3"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-text-main/30 hover:text-text-main transition-colors"
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
              <Input
                label="새 비밀번호 확인"
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="새 비밀번호 다시 입력"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                className="px-4 py-3"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="text-text-main/30 hover:text-text-main transition-colors"
                  >
                    {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={isLoading}
                className="bg-primary-700 hover:bg-primary-900 h-[44px] rounded-2xl px-8 text-sm font-bold shadow-sm disabled:bg-gray-200"
              >
                확인
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 커스텀 전송 알림 모달 */}
      {isModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5 duration-300">
          <div className="animate-in zoom-in-95 flex w-full max-w-sm flex-col items-center space-y-6 rounded-[40px] bg-white p-8 text-center duration-300">
            <div className="flex h-15 w-15 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-text-main text-xl font-black">전송 완료</h3>
              <p className="text-text-main/50 text-sm leading-relaxed font-bold">
                가입하신 이메일로
                <br />
                인증번호를 보내드렸습니다.
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(false)}
              className="bg-primary-700 hover:bg-primary-900 h-14 w-full rounded-2xl font-black text-white shadow-lg transition-all active:scale-95"
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
