'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Send, ChevronLeft, Heart, RotateCcw } from 'lucide-react';
import { useChat } from '@/features/chat/hooks/use-chat';
import MenuScannerModal from '@/features/scan/components/MenuScannerModal';

export default function ChatPage() {
  const router = useRouter();
  const { messages, sendMessage, isLoading, startNewChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isMenuScanOpen, setIsMenuScanOpen] = useState(false);

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

  const handleMenuScanComplete = (data: { wineNames?: string[]; foodNames?: string[] }) => {
  if (!data) return;

  const wines = data.wineNames || [];
  const foods = data.foodNames || [];

  if (wines.length === 0 && foods.length === 0) {
    sendMessage('메뉴판에서 와인이나 음식을 찾지 못했습니다.');
    return;
  }

  // 구조화된 프롬프트: 1개의 최고 페어링을 요청
  const prompt = `고객이 메뉴판을 스캔했습니다. 메뉴판에 있는 음식과 와인 중 가장 잘 어울리는 1개의 페어링을 추천해주세요.

    메뉴판 음식 목록: ${foods.join(', ')}
    메뉴판 와인 목록: ${wines.join(', ')}

    **응답 규칙:**
    - 인사말은 반드시 "메뉴판"이라는 단어를 포함하세요 (예: "메뉴판에서 멋진 조합을 찾았습니다!")
    - 인사말은 2문장으로 작성하세요
    - 인사말 다음에 아래 형식으로 페어링 정보를 작성하세요
    - 추천 이유에는 반드시 고객의 취향을 언급하세요 (예: "풍부한 맛을 선호하시는 고객님께", "육류를 즐기시는 취향에 맞춰")
    - 고객이 선택한 음식 목록을 분석하여 취향을 파악하세요 (예: 스테이크, 치즈가 많으면 "진한 풍미를 즐기시는 취향")

    **응답 형식 (필수):**
    1. 메뉴판 음식: [음식명]
      메뉴판 와인: [와인명]
      추천 이유:
      - [고객 취향 기반 이유]
      - [음식과 와인의 조화 이유]
      - [와인의 특징과 매칭 이유]

    정확히 1개의 페어링만 제시하고, 메뉴판에 없는 음식/와인은 포함하지 마세요.
    이전에 추천한 조합이 있다면 중복되지 않는 새로운 조합을 추천해주세요.`;

  sendMessage(prompt, '🍷 메뉴판으로 추천받기');
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2E1E18] -mb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+1rem)]">
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
            <RotateCcw size={16} />
            새 채팅
          </button>

          <Link
            href="/chat/history"
            className="rounded-full bg-black/18 px-3 py-2 text-[0.82rem] font-black backdrop-blur-sm transition-colors hover:bg-black/26"
          >
            기록
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

              {/* 추천 와인 카드 리스트 */}
              {latestBotMessage?.recommendations && latestBotMessage.recommendations.length > 0 && (
                <div className="mt-4 space-y-3">
                  {latestBotMessage.recommendations.map((rec, index) => (
                    <div 
                      key={rec.wine_id || index}
                      onClick={() => rec.wine_id && router.push(`/wine/${rec.wine_id}`)}
                      className="cursor-pointer rounded-[1.6rem] border border-[#F1D991] bg-[#FFF9EB] p-3.5 transition-shadow hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-white">
                          {rec.image_url ? (
                            <Image src={rec.image_url} alt={rec.name_kr || '와인'} fill className="object-cover p-1" />
                          ) : (
                            <span className="text-xl">🍷</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-text-main truncate text-[0.92rem] font-black">
                            {rec.name_kr || rec.name_en}
                          </h3>
                          <p className="text-text-main/48 truncate text-[0.7rem] font-semibold">
                            {rec.subtitle || rec.name_en}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {rec.price && (
                              <p className="text-[0.82rem] font-black text-[#B36262]">
                                ₩{rec.price.toLocaleString()}
                              </p>
                            )}
                            <span className="rounded-full bg-[#C78354] px-1.5 py-0.5 text-[0.55rem] font-black text-white uppercase">
                              {rec.match_percent || 90}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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

              {/* 액션 버튼들 */}
              {latestBotMessage?.actions && latestBotMessage.actions.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {latestBotMessage.actions.map((action, idx) => (
                    <button 
                      key={idx}
                      className="text-text-main/52 flex items-center gap-1.5 text-[0.74rem] font-semibold"
                    >
                      <Heart size={13} className="fill-[#D16B74] text-[#D16B74]" />
                      {action.label}
                    </button>
                  ))}
                </div>
  )}
              
              {/* 메뉴판 페어링 카드 */}
              {latestBotMessage?.menuPairings && latestBotMessage.menuPairings.length > 0 && (
                <div className="mt-6 space-y-4">
                  {latestBotMessage.menuPairings.map((pairing) => (
                    <div 
                      key={pairing.pairingNumber}
                      className="relative rounded-2xl border-2 border-[#E8D5B7] bg-gradient-to-br from-[#FFF9EB] to-[#FFE8CC] p-4 space-y-3"
                    >
                      {/* 음식-와인 헤더 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[0.75rem] font-semibold text-text-main/60 mb-1">
                            🍽️ 음식
                          </div>
                          <div className="text-[0.92rem] font-bold text-text-main break-words">
                            {pairing.foodName}
                          </div>
                        </div>
                        <div>
                          <div className="text-[0.75rem] font-semibold text-text-main/60 mb-1">
                            🍷 와인
                          </div>
                          <div className="text-[0.92rem] font-bold text-[#8B4513] break-words">
                            {pairing.wineName}
                          </div>
                        </div>
                      </div>

                      {/* 추천 이유 */}
                      <div className="pt-2 border-t border-[#E8D5B7]/40">
                        <div className="text-[0.75rem] font-semibold text-text-main/60 mb-2">
                          💭 추천 이유
                        </div>
                        <ul className="space-y-1.5">
                          {pairing.reasons.map((reason, idx) => (
                            <li 
                              key={idx}
                              className="text-[0.82rem] leading-5 text-text-main/80 flex gap-2"
                            >
                              <span className="text-[#B36262] font-bold shrink-0">•</span>
                              <span className="break-words">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              

              <div className="absolute right-8 bottom-0 h-5 w-5 translate-y-[40%] rotate-45 rounded-[0.35rem] bg-white" />
            </div>
          </section>

          <section className="px-1 pt-6 pb-4">
            <div className="flex flex-col items-end gap-2.5">
              {userMessages.map((message) => (
                <div
                  key={message.id}
                  className="text-text-main max-w-[14rem] rounded-full bg-white/90 px-4 py-3 text-[0.82rem] font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm"
                >
                  {message.displayText || message.text}
                </div>
              ))}
            </div>
          </section>
        </main>

        <div className="relative z-20">
          {showMenu && (
            <div className="absolute bottom-[4.8rem] left-1 w-[8.9rem] rounded-[1.35rem] bg-white/96 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <button 
                onClick={() => {
                  setIsMenuScanOpen(true);
                  setShowMenu(false);
                }}
                className="text-text-main hover:bg-primary-100/30 w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold transition-colors"
              >
                메뉴판 스캔
              </button>
              <button 
                onClick={() => router.push('/scan')}
                className="hover:bg-primary-100/30 w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold text-[#7B4D9B] transition-colors"
              >
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

      <MenuScannerModal 
        isOpen={isMenuScanOpen} 
        onClose={() => setIsMenuScanOpen(false)} 
        onAnalysisComplete={handleMenuScanComplete}
      />
    </div>
  );
}
