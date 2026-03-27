'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { chatApi } from '@/features/chat/api/chat.api';
import { ChatCard, ChatMessageResponse } from '@/features/chat/types/chat.types';
import { useUserProfile } from '@/features/user/hooks/useUserQueries';
import { useAuthStore } from '@/stores/auth.store';

const CHAT_BUBBLE_RADIUS = 'rounded-[1.75rem]';

const formatPrice = (price?: number | null) => {
  if (!price || price <= 0) {
    return '가격 정보 확인 필요';
  }

  return `₩${price.toLocaleString('ko-KR')}`;
};

const formatMessageTime = (createdAt: string) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const formatMessageDate = (createdAt: string) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

interface HistoryItem {
  id: number;
  role: 'bot' | 'user';
  text: string;
  time: string;
  dateLabel: string;
  card?: ChatCard | null;
}

export default function ChatHistoryPage() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useUserProfile();
  const userCharacter = user?.character ?? profile?.character;
  const userProfile = userCharacter ? `/${userCharacter}` : '/dog1.svg';
  const userNickname = user?.nickname ?? profile?.nickname ?? '와인수인';
  const [history, setHistory] = useState<ChatMessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await chatApi.getHistory();
        setHistory(response);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        setError('채팅 기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const historyItems = useMemo<HistoryItem[]>(
    () =>
      history.map((item) => ({
        id: item.id,
        role: item.role === 'user' ? 'user' : 'bot',
        text: item.content,
        time: formatMessageTime(item.createdAt),
        dateLabel: formatMessageDate(item.createdAt),
        card: item.card ?? null,
      })),
    [history],
  );

  useEffect(() => {
    if (isLoading || historyItems.length === 0) {
      return;
    }

    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [historyItems, isLoading]);

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
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-text-main/50 text-sm font-semibold">대화 기록을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-center text-sm font-semibold text-[#B36262]">{error}</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-text-main/50 text-sm font-semibold">아직 저장된 대화 기록이 없어요.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {historyItems.map((item, index) => {
              const showDateDivider =
                index === 0 || historyItems[index - 1].dateLabel !== item.dateLabel;

              return (
                <div key={item.id} className="space-y-6">
                  {showDateDivider && (
                    <div className="mb-6 flex items-center gap-3">
                      <div className="bg-primary-100/95 h-px flex-1" />
                      <span className="text-text-main/36 text-[0.72rem] font-semibold tracking-wide">
                        {item.dateLabel}
                      </span>
                      <div className="bg-primary-100/95 h-px flex-1" />
                    </div>
                  )}

                  {item.role === 'bot' ? (
                    <div className="flex justify-start">
                      <div className="w-full max-w-[22rem]">
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
                          className={`text-text-main ml-[3.35rem] max-w-[18.5rem] border border-[#F0D36C] bg-[#FFF9EB] px-4.5 py-3.5 text-[0.9rem] leading-[1.68] font-semibold whitespace-pre-line shadow-[0_8px_20px_rgba(51,34,17,0.045)] ${CHAT_BUBBLE_RADIUS}`}
                        >
                          <div>{item.text}</div>

                          {item.card && (
                            <Link
                              href={`/wines/${item.card.wine_id}`}
                              className="relative mt-3 block rounded-[1.4rem] border border-[#F1D991] bg-white/80 p-4 pr-10 transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(155,106,66,0.12)]"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="ml-[-0.15rem] flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-white p-2 shadow-sm">
                                  <Image
                                    src={item.card.image_url || '/default_wine.png'}
                                    alt={item.card.name_kr}
                                    width={64}
                                    height={64}
                                    className="h-full w-full object-contain"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <h3 className="text-text-main truncate text-[0.95rem] font-black">
                                        {item.card.name_kr}
                                      </h3>
                                      <p className="text-text-main/55 text-[0.7rem] font-semibold">
                                        {item.card.subtitle || '추천 와인'}
                                      </p>
                                    </div>

                                    {typeof item.card.match_percent === 'number' && (
                                      <span className="shrink-0 rounded-full bg-[#C78354] px-2.5 py-1 text-[0.68rem] font-black text-white">
                                        {item.card.match_percent}%
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className={`mt-2 font-black text-[#B36262] ${
                                      !item.card.price || item.card.price <= 0
                                        ? 'text-[0.78rem]'
                                        : 'text-[0.95rem]'
                                    }`}
                                  >
                                    {formatPrice(item.card.price)}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight
                                size={18}
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-[#9B6A42]"
                              />
                            </Link>
                          )}
                        </div>

                        <div className="text-text-main/34 mt-1 ml-[3.6rem] text-[0.68rem] font-medium">
                          {item.time}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="flex w-full max-w-[22rem] justify-end gap-2.5">
                        <div className="flex max-w-[18.5rem] flex-col items-end">
                          <div className="text-text-main mb-1 text-[0.94rem] font-black tracking-tight">
                            {userNickname}
                          </div>

                          <div
                            className={`border-primary-100 text-text-main border bg-white px-4.5 py-3 text-[0.9rem] leading-[1.58] font-semibold whitespace-pre-line shadow-[0_8px_20px_rgba(51,34,17,0.045)] ${CHAT_BUBBLE_RADIUS}`}
                          >
                            {item.text}
                          </div>

                          <div className="text-text-main/34 mt-1 pr-1 text-[0.68rem] font-medium">
                            {item.time}
                          </div>
                        </div>

                        <div className="pt-[0.05rem]">
                          <div className="border-primary-100 relative h-10 w-10 overflow-hidden rounded-full border bg-white shadow-[0_4px_10px_rgba(51,34,17,0.07)]">
                            <Image
                              src={userProfile}
                              alt="내 프로필"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </main>
    </div>
  );
}
