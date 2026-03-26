'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, X } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';
import { useSignout } from '@/features/auth/hooks/useSignout';
import { useUpdateProfileMutation, useUserProfile } from '@/features/user/hooks/useUserQueries';
import WithdrawModal from '@/features/user/components/WithdrawModal';
import { cn } from '@/lib/utils';
import { UserInfo } from '@/types/user.types';

const AVATARS = [
  'cat1.svg',
  'dog1.svg',
  'giraffe1.svg',
  'mouse1.svg',
  'tiger1.svg',
  'whale1.svg',
];

function normalizeAvatarForPicker(character?: string | null) {
  if (!character) return 'dog1.svg';

  const normalized = character
    .replace(/^\//, '')
    .replace(/\.svg$/i, '')
    .replace(/[1-3]$/, '');

  const avatar = `${normalized}1.svg`;
  return AVATARS.includes(avatar) ? avatar : 'dog1.svg';
}

function resolveAvatarSrc(character?: string | null) {
  if (!character) return '/dog1.svg';
  return character.startsWith('/') ? character : `/${character}`;
}

export default function ProfileEditPage() {
  const router = useRouter();

  const { data: profile, isLoading } = useUserProfile() as { data: UserInfo; isLoading: boolean };
  const updateProfileMutation = useUpdateProfileMutation();
  const { handleSignout, isLoading: isSignoutLoading } = useSignout();

  const [nickname, setNickname] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const profileNickname = profile ? profile.nickname : '';
  const profileCharacter = normalizeAvatarForPicker(profile?.character);

  const resolvedNickname = nickname ?? profileNickname;
  const resolvedAvatar = currentAvatar ?? profileCharacter;

  // 화면에 보여주는 실제 프로필 이미지는 서버 값 우선
  const previewAvatar = currentAvatar ?? profile?.character ?? 'dog1.svg';

  const handleUpdateProfile = async () => {
    const shouldChangePassword =
      Boolean(passwords.current.trim()) ||
      Boolean(passwords.new.trim()) ||
      Boolean(passwords.confirm.trim());

    if (shouldChangePassword) {
      if (!passwords.current || !passwords.new || !passwords.confirm) {
        alert('비밀번호 변경 항목을 모두 입력해주세요.');
        return;
      }

      if (passwords.new !== passwords.confirm) {
        alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    try {
      await updateProfileMutation.mutateAsync({
        nickname: resolvedNickname,
        character: resolvedAvatar,
        currentPassword: shouldChangePassword ? passwords.current : undefined,
        newPassword: shouldChangePassword ? passwords.new : undefined,
        confirmNewPassword: shouldChangePassword ? passwords.confirm : undefined,
      });

      setPasswords({ current: '', new: '', confirm: '' });
      alert('정보가 수정되었습니다.');
      router.push('/mypage');
    } catch {
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    handleSignout();
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-0">
      <header className="bg-background/80 sticky top-0 z-10 flex items-center px-4 py-4 backdrop-blur-md">
        <Link
          href="/mypage"
          className="border-primary-100 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm"
        >
          <ChevronLeft size={20} className="text-text-main" />
        </Link>
        <h1 className="text-text-main mr-9 flex-1 text-center text-base font-black">
          프로필 수정
        </h1>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-0">
        <div className="relative flex justify-center pt-2">
          <div className="bg-primary-100 relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md">
            <Image src={resolveAvatarSrc(previewAvatar)} alt="Avatar" fill className="object-cover" />
          </div>
          <button
            onClick={() => setIsAvatarPickerOpen(true)}
            className="absolute bottom-0 translate-x-9 rounded-full border-4 border-white bg-[#B36262] p-2 text-white shadow-sm transition-transform active:scale-90"
          >
            <Camera size={15} />
          </button>
        </div>

        <section className="space-y-4">
          <h3 className="text-text-main text-base font-black">기본 정보</h3>
          <Input
            label="닉네임"
            value={resolvedNickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-[1rem] px-4 py-3 text-sm"
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-text-main text-base font-black">비밀번호 변경</h3>
          <div className="space-y-3">
            <Input
              label="현재 비밀번호"
              type="password"
              placeholder="현재 비밀번호 입력"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="rounded-[1rem] px-4 py-3 text-sm"
            />
            <Input
              label="새 비밀번호"
              type="password"
              placeholder="8자 이상 새 비밀번호 입력"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="rounded-[1rem] px-4 py-3 text-sm"
            />
            <Input
              label="새 비밀번호 확인"
              type="password"
              placeholder="새 비밀번호 다시 입력"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="rounded-[1rem] px-4 py-3 text-sm"
            />
          </div>
        </section>

        <Button
          size="full"
          onClick={handleUpdateProfile}
          isLoading={updateProfileMutation.isPending}
          className="mt-3 h-12 rounded-[1.2rem] bg-[#B36262] text-sm font-black text-white shadow-md"
        >
          수정 완료
        </Button>

        <section className="mt-4 space-y-3 rounded-[1.5rem] border border-[#B36262]/10 bg-[#FFF5F5] p-4">
          <h4 className="text-xs font-black tracking-wider text-[#B36262] uppercase">계정 관리</h4>
          <div className="flex gap-2.5">
            <button
              onClick={handleLogout}
              disabled={isSignoutLoading}
              className="border-primary-100 text-text-main/60 flex h-10 flex-1 items-center justify-center rounded-[1rem] border bg-white text-[13px] font-bold disabled:opacity-50"
            >
              {isSignoutLoading ? '처리 중...' : '로그아웃'}
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="border-primary-100 text-text-main/60 flex h-10 flex-1 items-center justify-center rounded-[1rem] border bg-white text-[13px] font-bold"
            >
              계정 삭제
            </button>
          </div>
        </section>
      </main>

      {isAvatarPickerOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 duration-300">
          <div className="animate-in zoom-in w-full max-w-[20rem] space-y-6 rounded-[1.75rem] bg-white p-5 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-text-main text-base font-black">프로필 이미지 선택</h2>
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
                    resolvedAvatar === avatar
                      ? 'scale-105 border-[#B36262]'
                      : 'bg-primary-100/30 border-transparent',
                  )}
                >
                  <Image src={`/${avatar}`} alt={avatar} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <WithdrawModal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} />
    </div>
  );
}