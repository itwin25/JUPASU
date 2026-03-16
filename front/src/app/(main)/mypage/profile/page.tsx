'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
<<<<<<< HEAD
import { cn } from '@/utils/cn';
=======
import Modal from '@/components/ui/modal/Modal';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
>>>>>>> 85302d7 (feat : 마이페이지 UI 구현)

const AVATARS = ['cat1.svg', 'dog1.svg', 'giraffe1.svg', 'mouse1.svg', 'tiger1.svg', 'whale1.svg'];

export default function ProfileEditPage() {
  const [currentAvatar, setCurrentAvatar] = useState('dog1.svg');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center bg-background/80 px-4 py-4 backdrop-blur-md">
        <Link
          href="/mypage"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-100 bg-white shadow-sm"
        >
          <ChevronLeft size={20} className="text-text-main" />
        </Link>
        <h1 className="mr-9 flex-1 text-center text-base font-black text-text-main">내 정보 수정</h1>
      </header>

      <main className="flex-1 space-y-8 px-4">
        <div className="relative flex justify-center pt-2">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-primary-100 shadow-md">
            <Image src={`/${currentAvatar}`} alt="Avatar" fill className="object-cover" />
          </div>
          <button
            onClick={() => setIsAvatarPickerOpen(true)}
            className="absolute bottom-0 translate-x-9 rounded-full border-4 border-white bg-[#B36262] p-2 text-white shadow-sm transition-transform active:scale-90"
          >
            <Camera size={15} />
          </button>
        </div>

        <section className="space-y-4">
          <h3 className="text-base font-black text-text-main">기본 정보</h3>
          <Input label="닉네임" defaultValue="와인수인" className="rounded-[1rem] px-4 py-3 text-sm" />
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-black text-text-main">비밀번호 변경</h3>
          <div className="space-y-3">
            <Input
              label="현재 비밀번호"
              type="password"
              placeholder="현재 비밀번호 입력"
              className="rounded-[1rem] px-4 py-3 text-sm"
            />
            <Input
              label="새 비밀번호"
              type="password"
              placeholder="8자 이상 새 비밀번호 입력"
              className="rounded-[1rem] px-4 py-3 text-sm"
            />
            <Input
              label="새 비밀번호 확인"
              type="password"
              placeholder="새 비밀번호 다시 입력"
              className="rounded-[1rem] px-4 py-3 text-sm"
            />
          </div>
        </section>

        <Button size="full" className="mt-3 h-12 rounded-[1.2rem] bg-[#B36262] text-sm font-black text-white shadow-md">
          수정 완료
        </Button>

        <section className="mt-4 space-y-3 rounded-[1.5rem] border border-[#B36262]/10 bg-[#FFF5F5] p-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#B36262]">계정 관리</h4>
          <div className="flex gap-2.5">
            <button
              onClick={handleLogout}
              className="flex h-10 flex-1 items-center justify-center rounded-[1rem] border border-primary-100 bg-white text-[13px] font-bold text-text-main/60"
            >
              로그아웃
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex h-10 flex-1 items-center justify-center rounded-[1rem] border border-primary-100 bg-white text-[13px] font-bold text-text-main/60"
            >
              계정 삭제
            </button>
          </div>
        </section>
      </main>

      {isAvatarPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[20rem] space-y-6 rounded-[1.75rem] bg-white p-5 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-text-main">프로필 이미지 선택</h2>
              <button onClick={() => setIsAvatarPickerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => {
                    setCurrentAvatar(avatar);
                    setIsAvatarPickerOpen(false);
                  }}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-[1rem] border-[3px] transition-all',
                    currentAvatar === avatar ? 'scale-105 border-[#B36262]' : 'border-transparent bg-primary-100/30',
                  )}
                >
                  <Image src={`/${avatar}`} alt={avatar} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="계정 삭제"
        className="w-[calc(100vw-2rem)] max-w-[18.5rem] rounded-[1.55rem] bg-[#F7F5F1] px-3.5 py-4"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="full"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="rounded-[1rem]"
            >
              취소
            </Button>
            <Button
              size="full"
              onClick={handleDeleteAccount}
              className="rounded-[1rem] bg-[#D65F69] hover:bg-[#C44B56]"
            >
              확인
            </Button>
          </div>
        }
      >
        <div className="py-2 text-center">
          <p className="text-sm font-bold text-text-main/75">계정을 삭제하시겠습니까?</p>
        </div>
      </Modal>
    </div>
  );
}
