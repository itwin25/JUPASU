'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Plus, RotateCcw, Send } from 'lucide-react';
import { useChat } from '@/features/chat/hooks/use-chat';
import { useWineScrapMutation } from '@/features/wine/hooks/useWineListQuery';

const formatPrice = (price?: number | null) => {
  if (!price || price <= 0) {
    return '가격 정보 확인 필요';
  }

  return `₩${price.toLocaleString('ko-KR')}`;
};

export default function ChatPage() {
  const router = useRouter();
  const { messages, sendMessage, isLoading, startNewChat } = useChat();
  const { mutateAsync: toggleScrap, isPending: isScrapPending } = useWineScrapMutation();
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [scrappedWineIds, setScrappedWineIds] = useState<number[]>([]);

  const latestBotMessage = useMemo(
    () => [...messages].reverse().find((msg) => msg.type === 'bot'),
    [messages],
  );

  const userMessages = useMemo(
    () => messages.filter((msg) => msg.type === 'user').slice(-3),
    [messages],
  );

  const currentWineId = latestBotMessage?.card?.wine_id;
  const isScrapped =
    typeof currentWineId === 'number' ? scrappedWineIds.includes(currentWineId) : false;

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    setShowMenu(false);
  };

  const handleToggleScrap = async () => {
    if (!currentWineId || isScrapPending) return;

    try {
      await toggleScrap(currentWineId);
      setScrappedWineIds((prev) =>
        prev.includes(currentWineId)
          ? prev.filter((wineId) => wineId !== currentWineId)
          : [...prev, currentWineId],
      );
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  return (
    <div className="relative -mb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+1rem)] min-h-screen overflow-hidden bg-[#2E1E18]">
      <div className="absolute inset-0 z-0">
        <Image src="/chatbot.svg" alt="소믈리에 배경" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,16,12,0.28),rgba(25,16,12,0.1)_30%,rgba(25,16,12,0.18)_72%,rgba(25,16,12,0.5))]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between px-1 py-2 text-white">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-1.5 rounded-full bg-black/18 px-3 py-2 text-[0.82rem] font-black backdrop-blur-sm transition-colors hover:bg-black/26"
          >
            <ChevronLeft size={18} />
            뒤로가기
          </button>

          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 rounded-full bg-black/18 px-3 py-2 text-[0.82rem] font-black backdrop-blur-sm transition-colors hover:bg-black/26"
          >
            <RotateCcw size={16} />새 대화
          </button>

          <Link
            href="/chat/history"
            className="rounded-full bg-black/18 px-3 py-2 text-[0.82rem] font-black backdrop-blur-sm transition-colors hover:bg-black/26"
          >
            전체 대화 보기
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-between pt-3">
          <section className="mx-auto w-full max-w-[22rem]">
            <div className="relative rounded-[2rem] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#7BB181]" />
                <span className="text-[0.95rem] font-black text-[#9B6A42]">소믈리에</span>
              </div>

              <p className="text-text-main text-[0.94rem] leading-6 font-medium whitespace-pre-line">
                {latestBotMessage?.text ||
                  (isLoading
                    ? '소믈리에가 답변을 준비하고 있어요...'
                    : '소믈리에에게 물어보세요. 음식이나 메뉴를 알려주시면 어울리는 와인을 추천해드릴게요.')}
              </p>

              {latestBotMessage?.card && (
                <>
                  <Link
                    href={latestBotMessage.card.detail_url || '#'}
                    className="mt-4 block rounded-[1.75rem] border border-[#F1D991] bg-[#FFF9EB] p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(155,106,66,0.12)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-white shadow-sm">
                        <Image
                          src={latestBotMessage.card.image_url || '/default_wine.png'}
                          alt={latestBotMessage.card.name_kr}
                          width={64}
                          height={64}
                          className="h-16 w-16 object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-text-main truncate text-[1rem] font-black">
                              {latestBotMessage.card.name_kr}
                            </h3>
                            <p className="text-text-main/55 text-[0.8rem] font-semibold">
                              {latestBotMessage.card.subtitle || '추천 와인'}
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            {typeof latestBotMessage.card.match_percent === 'number' && (
                              <span className="shrink-0 rounded-full bg-[#C78354] px-3 py-1.5 text-[0.72rem] font-black text-white">
                                {latestBotMessage.card.match_percent}% MATCH
                              </span>
                            )}
                            <ChevronRight size={18} className="mt-1 shrink-0 text-[#9B6A42]" />
                          </div>
                        </div>

                        <p className="mt-2 text-[1rem] font-black text-[#B36262]">
                          {formatPrice(latestBotMessage.card.price)}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={handleToggleScrap}
                    disabled={isScrapPending}
                    className="text-text-main/70 mt-4 inline-flex items-center gap-2 text-[0.86rem] font-semibold disabled:opacity-50"
                  >
                    <Heart
                      size={18}
                      className={isScrapped ? 'fill-[#D16B74] text-[#D16B74]' : 'text-[#D16B74]'}
                    />
                    위시리스트에 추가하기
                  </button>
                </>
              )}

              <div className="absolute right-8 bottom-0 h-5 w-5 translate-y-[70%] rotate-45 rounded-[0.35rem] bg-white" />
            </div>
          </section>

          <section className="px-1 pt-6 pb-4">
            <div className="flex flex-col items-end gap-2.5">
              {userMessages.map((message) => (
                <div
                  key={message.id}
                  className="text-text-main max-w-[14rem] rounded-full bg-white/90 px-4 py-3 text-[0.82rem] font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm"
                >
                  {message.text}
                </div>
              ))}
            </div>
          </section>
        </main>

        <div className="relative z-20">
          {showMenu && (
            <div className="absolute bottom-[4.8rem] left-1 w-[8.9rem] rounded-[1.35rem] bg-white/96 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <button className="text-text-main hover:bg-primary-100/30 w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold transition-colors">
                와인 라벨 인식
              </button>
              <button className="hover:bg-primary-100/30 w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold text-[#7B4D9B] transition-colors">
                메뉴판 인식
              </button>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-[23rem] items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="border-primary-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[#B36262] transition-transform active:scale-95"
            >
              <Plus size={18} />
            </button>

            <input
              className="text-text-main placeholder:text-text-main/35 min-w-0 flex-1 bg-transparent text-[0.86rem] font-medium focus:outline-none"
              placeholder="어울리는 와인을 물어보세요.. (@친구이름)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />

            <button
              onClick={handleSend}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B36262] text-white transition-transform active:scale-95"
            >
              <Send size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
