'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, Camera, LogOut, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { cn } from '@/utils/cn';

const AVATARS = ['cat1.svg', 'dog1.svg', 'giraffe1.svg', 'mouse1.svg', 'tiger1.svg', 'whale1.svg'];

export default function ProfileEditPage() {
  const [currentAvatar, setCurrentAvatar] = useState('dog1.svg');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <header className="flex items-center px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <Link href="/mypage" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
          <ChevronLeft size={24} className="text-text-main" />
        </Link>
        <h1 className="flex-1 text-center font-black text-text-main mr-10">내 정보 수정</h1>
      </header>

      <main className="px-6 flex-1 space-y-10">
        {/* Profile Image */}
        <div className="flex justify-center relative pt-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-primary-100">
            <Image src={`/${currentAvatar}`} alt="Avatar" fill className="object-cover" />
          </div>
          <button 
            onClick={() => setIsAvatarPickerOpen(true)}
            className="absolute bottom-0 translate-x-12 w-10 h-10 bg-[#B36262] rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform"
          >
            <Camera size={18} />
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-6">
          <h3 className="text-base font-black text-text-main italic">기본 정보</h3>
          <Input label="닉네임" defaultValue="와인수인" />
        </div>

        {/* Password Change */}
        <div className="space-y-6">
          <h3 className="text-base font-black text-text-main italic">비밀번호 변경</h3>
          <div className="space-y-4">
            <Input label="현재 비밀번호" type="password" placeholder="현재 비밀번호 입력" />
            <Input label="새 비밀번호" type="password" placeholder="8자 이상의 새 비밀번호" />
            <Input label="새 비밀번호 확인" type="password" placeholder="새 비밀번호 다시 입력" />
          </div>
        </div>

        <Button size="full" className="h-16 text-lg font-black bg-[#B36262] text-white rounded-[32px] shadow-lg mt-8">
          변경사항 저장
        </Button>

        {/* Account Management */}
        <div className="bg-[#FFF5F5] rounded-[32px] p-6 border border-[#B36262]/10 space-y-4 mt-12">
           <h4 className="text-sm font-black text-[#B36262] uppercase tracking-wider">계정 관리</h4>
           <div className="flex gap-3">
              <button className="flex-1 bg-white h-12 rounded-2xl border border-primary-100 flex items-center justify-center gap-2 text-sm font-bold text-text-main/60">
                 로그아웃
              </button>
              <button className="flex-1 bg-white h-12 rounded-2xl border border-primary-100 flex items-center justify-center gap-2 text-sm font-bold text-text-main/60">
                 계정 삭제
              </button>
           </div>
        </div>
      </main>

      {/* Avatar Picker Modal */}
      {isAvatarPickerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black text-text-main">프로필 이미지 선택</h2>
                 <button onClick={() => setIsAvatarPickerOpen(false)}><X size={24} /></button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 {AVATARS.map((avatar) => (
                   <button 
                     key={avatar} 
                     onClick={() => {
                        setCurrentAvatar(avatar);
                        setIsAvatarPickerOpen(false);
                     }}
                     className={cn(
                       "relative aspect-square rounded-2xl overflow-hidden border-4 transition-all",
                       currentAvatar === avatar ? "border-[#B36262] scale-105" : "border-transparent bg-primary-100/30"
                     )}
                   >
                     <Image src={`/${avatar}`} alt={avatar} fill className="object-cover" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return <Trash2 size={size} />; // Simple X placeholder using Trash icon for now or use Lucide X if available
}
