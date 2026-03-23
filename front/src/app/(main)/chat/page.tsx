'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Send, ChevronLeft, Heart } from 'lucide-react';
import { useChat } from '@/features/chat/hooks/use-chat';

export default function ChatPage() {
  const router = useRouter();
  const { messages, sendMessage, isLoading } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // 마지막 봇 메시지 찾기 (스트리밍 중인 메시지 포함)
  const latestBotMessage = useMemo(() => {
    return [...messages].reverse().find((msg) => msg.type === 'bot');
  }, [messages]);

  // 최근 사용자 메시지 3개 (UI용)
  const userMessages = useMemo(() => {
    return messages.filter((msg) => msg.type === 'user').slice(-3);
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    sendMessage(inputValue.trim());
    setInputValue('');
    setShowMenu(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2E1E18]">
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
                  (isLoading ? '소믈리에가 생각 중입니다...' : '어떤 와인을 추천해드릴까요?')}
              </p>

              {latestBotMessage?.recommendation && (
                <div className="mt-4 rounded-[1.6rem] border border-[#F1D991] bg-[#FFF9EB] p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-white text-xl">
                      🍷
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-text-main truncate text-[0.92rem] font-black">
                        {latestBotMessage.recommendation.name}
                      </h3>
                      <p className="text-text-main/48 text-[0.7rem] font-semibold">
                        {latestBotMessage.recommendation.category}
                      </p>
                      <p className="mt-0.5 text-[0.82rem] font-black text-[#B36262]">
                        ₩{latestBotMessage.recommendation.price}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#C78354] px-2 py-1 text-[0.58rem] font-black text-white uppercase">
                      {latestBotMessage.recommendation.match}% match
                    </span>
                  </div>
                </div>
              )}

              {latestBotMessage?.options && latestBotMessage.options.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {latestBotMessage.options.map((option) => (
                    <button
                      key={option}
                      className="text-text-main/60 rounded-full bg-[#F7F4EF] px-4 py-2 text-[0.74rem] font-bold transition-colors hover:bg-[#F0EAE0]"
                      onClick={() => setInputValue(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {latestBotMessage?.recommendation && (
                <button className="text-text-main/52 mt-3 flex items-center gap-1.5 text-[0.74rem] font-semibold">
                  <Heart size={13} className="fill-[#D16B74] text-[#D16B74]" />
                  위시리스트에 추가하기
                </button>
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
                메뉴판 스캔
              </button>
              <button className="hover:bg-primary-100/30 w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold text-[#7B4D9B] transition-colors">
                라벨 스캔
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
              placeholder="소믈리에에게 물어보세요... (@김친구)"
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
