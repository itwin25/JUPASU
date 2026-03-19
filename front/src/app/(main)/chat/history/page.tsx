'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const HISTORY_DATA = [
  {
    id: 1,
    role: 'bot' as const,
    text: '달콤한 와인을 좋아하시는군요! 모스카토 다스티나 리슬링 같은 와인이 잘 어울려요. 과일 디저트와 함께 드시면 더 좋습니다.',
    time: '오전 10:24',
  },
  {
    id: 2,
    role: 'user' as const,
    text: '감사합니다.',
    time: '오전 10:25',
  },
];

const CHAT_BUBBLE_RADIUS = 'rounded-[1.75rem]';

export default function ChatHistoryPage() {
  const user = useAuthStore((state) => state.user);
  const userProfile = user?.character ? `/${user.character}` : '/dog1.svg';
  const userNickname = user?.nickname ?? '와인수인';

  return (
    <div className="bg-background min-h-screen pb-8">
      <header className="bg-background/96 sticky top-0 z-10 px-5 pt-[max(0.9rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur-md">
        <div className="app-shell flex items-center">
          <Link
            href="/chat"
            className="border-primary-100 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-[0_4px_12px_rgba(51,34,17,0.07)]"
          >
            <ChevronLeft size={18} className="text-text-main" />
          </Link>
        </div>
      </header>

      <main className="app-shell px-5 pt-5">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary-100/95 h-px flex-1" />
          <span className="text-text-main/36 text-[0.72rem] font-semibold tracking-wide">
            오늘 대화
          </span>
          <div className="bg-primary-100/95 h-px flex-1" />
        </div>

        <div className="space-y-6">
          {HISTORY_DATA.map((item) => {
            if (item.role === 'bot') {
              return (
                <div key={item.id} className="flex justify-start">
                  <div className="w-full max-w-[17.1rem]">
                    <div className="mb-1 flex items-center gap-2.5">
                      <div className="border-primary-100 relative h-10 w-10 overflow-hidden rounded-full border bg-white shadow-[0_4px_10px_rgba(51,34,17,0.07)]">
                        <Image
                          src="/chatbot_profile.svg"
                          alt="소믈리에 프로필"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[0.94rem] font-black tracking-tight text-[#9B6A42]">
                        소믈리에
                      </span>
                    </div>

                    <div
                      className={`text-text-main ml-[3.35rem] max-w-[13.8rem] border border-[#F0D36C] bg-[#FFF9EB] px-4.5 py-3.5 text-[0.9rem] leading-[1.68] font-semibold shadow-[0_8px_20px_rgba(51,34,17,0.045)] ${CHAT_BUBBLE_RADIUS}`}
                    >
                      {item.text}
                    </div>

                    <div className="text-text-main/34 mt-1 ml-[3.6rem] text-[0.68rem] font-medium">
                      {item.time}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="flex justify-end">
                <div className="flex w-full max-w-[17.1rem] justify-end gap-2.5">
                  <div className="flex max-w-[9.8rem] flex-col items-end">
                    <div className="text-text-main mb-1 text-[0.94rem] font-black tracking-tight">
                      {userNickname}
                    </div>

                    <div
                      className={`border-primary-100 text-text-main border bg-white px-4.5 py-3 text-[0.9rem] leading-[1.58] font-semibold shadow-[0_8px_20px_rgba(51,34,17,0.045)] ${CHAT_BUBBLE_RADIUS}`}
                    >
                      {item.text}
                    </div>

                    <div className="text-text-main/34 mt-1 pr-1 text-[0.68rem] font-medium">
                      {item.time}
                    </div>
                  </div>

                  <div className="pt-[0.05rem]">
                    <div className="border-primary-100 relative h-10 w-10 overflow-hidden rounded-full border bg-white shadow-[0_4px_10px_rgba(51,34,17,0.07)]">
                      <Image src={userProfile} alt="내 프로필" fill className="object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
