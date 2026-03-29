'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Send, ChevronLeft, ChevronRight, Heart, RotateCcw, X } from 'lucide-react';
import { useChat } from '@/features/chat/hooks/use-chat';
import { friendApi } from '@/features/friend/api/friend.api';
import { FriendListItem } from '@/features/friend/types/friend.types';
import MenuScannerModal from '@/features/scan/components/MenuScannerModal';
import { useWineScrapMutation } from '@/features/wine/hooks/useWineListQuery';

const formatPrice = (price?: number | null) => {
  if (!price || price <= 0) {
    return '가격 정보 확인 필요';
  }

  return `₩${price.toLocaleString('ko-KR')}`;
};

export default function ChatPage() {
  const router = useRouter();
  const {
    messages,
    sendMessage,
    isLoading,
    startNewChat,
    activeMode,
    hasMenuContext,
    enterMenuMode,
    exitMenuMode,
  } = useChat();

  const { mutateAsync: toggleScrap, isPending: isScrapPending } = useWineScrapMutation();
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isMenuScanOpen, setIsMenuScanOpen] = useState(false);
  const [scrappedWineIds, setScrappedWineIds] = useState<number[]>([]);

  // 맨션 관련 상태
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [showMentionOverlay, setShowMentionOverlay] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionedFriends, setMentionedFriends] = useState<{ id: number; nickname: string }[]>([]);

  // 친구 목록 가져오기
  useEffect(() => {
    friendApi.getFriends().then(setFriends).catch(console.error);
  }, []);

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
  const isMenuDemoLoading =
    isLoading &&
    latestBotMessage?.text.includes('소믈리에가 최적의 와인과 음식 페어링 조합을 찾고 있습니다.');

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    // 실제 메시지에 포함된 맨션 친구들만 필터링 (삭제되었을 수 있으므로)
    const activeMentions = mentionedFriends.filter((f) => inputValue.includes(`@${f.nickname}`));

    sendMessage(inputValue.trim(), undefined, undefined, activeMentions);
    setInputValue('');
    setMentionedFriends([]);
    setShowMenu(false);
    setShowMentionOverlay(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // 맨션 트리거 감지 (@ 이후 텍스트 추출)
    const lastAtIdx = value.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const textAfterAt = value.slice(lastAtIdx + 1);
      // 공백이 있으면 맨션 모드 종료
      if (!textAfterAt.includes(' ')) {
        setMentionFilter(textAfterAt);
        setShowMentionOverlay(true);
        return;
      }
    }
    setShowMentionOverlay(false);
  };

  const handleSelectFriend = (friend: FriendListItem) => {
    const lastAtIdx = inputValue.lastIndexOf('@');
    if (lastAtIdx === -1) return;

    const beforeAt = inputValue.slice(0, lastAtIdx);
    const newValue = `${beforeAt}@${friend.nickname} `;

    setInputValue(newValue);
    setMentionedFriends((prev) => {
      if (prev.find((f) => f.id === friend.friendId)) return prev;
      return [...prev, { id: friend.friendId, nickname: friend.nickname }];
    });
    setShowMentionOverlay(false);
  };

  const filteredFriends = friends.filter((f) =>
    f.nickname.toLowerCase().includes(mentionFilter.toLowerCase()),
  );

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

  const handleMenuScanComplete = (data: { wineNames?: string[]; foodNames?: string[] }) => {
    if (!data) return;

    const wines = data.wineNames || [];
    const foods = data.foodNames || [];

    if (wines.length === 0 && foods.length === 0) {
      sendMessage('메뉴판에서 와인이나 음식을 찾지 못했습니다.');
      return;
    }

    sendMessage('메뉴판 스캔 완료', '🍷 메뉴판으로 추천받기', data);
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
                {(isMenuDemoLoading ? '' : latestBotMessage?.text) ||
                  (isLoading
                    ? '소믈리에가 답변을 준비하고 있어요...'
                    : '소믈리에에게 물어보세요. 음식이나 메뉴를 알려주시면 어울리는 와인을 추천해드릴게요.')}
              </p>

              {isMenuDemoLoading && (
                <div className="menu-loading-shell mt-4 overflow-hidden rounded-[1.6rem] border border-[#F1D9B0] bg-[linear-gradient(135deg,#FFF9EF,#FFF1D4)] px-4 py-4 shadow-[0_14px_30px_rgba(179,98,98,0.1)]">
                  <div className="flex items-center gap-4">
                    <div className="loading-radar relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                      <div className="loading-ring loading-ring-1" />
                      <div className="loading-ring loading-ring-2" />
                      <div className="loading-core" />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[#B36262] px-2.5 py-1 text-[0.62rem] font-black tracking-[0.12em] text-white uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                        AI Sommelier
                      </div>
                      <p className="text-[0.82rem] leading-5 font-black tracking-[0.01em] text-[#8F5A34]">
                        소믈리에가 최적의 와인과 음식 페어링 조합을 찾고 있습니다.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 pl-20">
                    <span className="loading-pill loading-pill-1" />
                    <span className="loading-pill loading-pill-2" />
                    <span className="loading-pill loading-pill-3" />
                  </div>
                </div>
              )}

              {!isMenuDemoLoading &&
                latestBotMessage?.menuPairings &&
                latestBotMessage.menuPairings.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <div className="ai-reveal-chip inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#B36262,#D08A54)] px-3.5 py-2 text-[0.68rem] font-black tracking-[0.12em] text-white uppercase shadow-[0_16px_28px_rgba(179,98,98,0.22)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      AI Pairing Result
                    </div>
                  </div>
                )}

              {/* 추천 와인 카드 리스트 (기존 recommendations 형태) */}
              {latestBotMessage?.recommendations && latestBotMessage.recommendations.length > 0 && (
                <div className="mt-4 space-y-3">
                  {latestBotMessage.recommendations.map((rec, index) => (
                    <div
                      key={rec.wine_id || index}
                      onClick={() => rec.wine_id && router.push(`/wines/${rec.wine_id}`)}
                      className={`recommendation-sommelier-card rounded-[1.6rem] border border-[#F1D991] bg-[#FFF9EB] p-3.5 transition-shadow ${
                        rec.wine_id
                          ? 'cursor-pointer hover:shadow-md active:scale-[0.98]'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] bg-[radial-gradient(circle_at_top,#FFFDF7,#F9E6C0_62%,#F0D29D)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(155,106,66,0.12)]">
                          {rec.image_url ? (
                            <Image
                              src={rec.image_url}
                              alt={rec.name_kr || '와인'}
                              fill
                              className="object-contain p-2 drop-shadow-[0_16px_18px_rgba(70,42,20,0.22)]"
                            />
                          ) : (
                            <span className="text-xl">🍷</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="recommendation-chip mb-2 inline-flex rounded-full bg-[#F4E4C8] px-2.5 py-1 text-[0.6rem] font-black tracking-[0.08em] text-[#9B6A42] uppercase">
                            Sommelier Pick
                          </div>
                          <h3 className="text-text-main truncate text-[1rem] font-black">
                            {rec.name_kr || rec.name_en}
                          </h3>
                          <p className="text-text-main/48 mt-1 truncate text-[0.76rem] font-semibold">
                            {rec.subtitle || rec.name_en}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
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

              {/* 추천 와인 카드 (새로운 card 형태) */}
              {latestBotMessage?.card && (
                <>
                  <Link
                    href={`/wines/${latestBotMessage.card.wine_id}`}
                    className="relative mt-4 block rounded-[1.75rem] border border-[#F1D991] bg-[#FFF9EB] p-4 pr-10 transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(155,106,66,0.12)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="ml-[-0.15rem] flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-white p-2 shadow-sm">
                        <Image
                          src={latestBotMessage.card.image_url || '/default_wine.png'}
                          alt={latestBotMessage.card.name_kr}
                          width={64}
                          height={64}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-text-main truncate text-[1rem] font-black">
                              {latestBotMessage.card.name_kr}
                            </h3>
                            <p className="text-text-main/55 text-[0.72rem] font-semibold">
                              {latestBotMessage.card.subtitle || '추천 와인'}
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            {typeof latestBotMessage.card.match_percent === 'number' && (
                              <span className="relative top-[-0.15rem] shrink-0 rounded-full bg-[#C78354] px-3 py-1.5 text-[0.72rem] font-black text-white">
                                {latestBotMessage.card.match_percent}%
                              </span>
                            )}
                          </div>
                        </div>

                        <p
                          className={`mt-2 font-black text-[#B36262] ${
                            !latestBotMessage.card.price || latestBotMessage.card.price <= 0
                              ? 'text-[0.84rem]'
                              : 'text-[1rem]'
                          }`}
                        >
                          {formatPrice(latestBotMessage.card.price)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-[#9B6A42]"
                    />
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

              {/* 메뉴판 페어링 카드 */}
              {latestBotMessage?.menuPairings && latestBotMessage.menuPairings.length > 0 && (
                <div className="mt-6 space-y-4">
                  {latestBotMessage.menuPairings.map((pairing) => (
                    <div
                      key={pairing.pairingNumber}
                      className="menu-pairing-reveal relative space-y-3 overflow-hidden rounded-2xl border-2 border-[#E8D5B7] bg-gradient-to-br from-[#FFF9EB] to-[#FFE8CC] p-4"
                    >
                      <div className="pairing-flare" />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-text-main/60 mb-1 text-[0.75rem] font-semibold">
                            🍽️ 음식
                          </div>
                          <div className="text-text-main text-[0.92rem] font-bold break-words">
                            {pairing.foodName}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-main/60 mb-1 text-[0.75rem] font-semibold">
                            🍷 와인
                          </div>
                          <div className="text-[0.92rem] font-bold break-words text-[#8B4513]">
                            {pairing.wineName}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#E8D5B7]/40 pt-2">
                        <div className="text-text-main/60 mb-2 text-[0.75rem] font-semibold">
                          💭 추천 이유
                        </div>
                        <ul className="space-y-1.5">
                          {pairing.reasons.map((reason, idx) => (
                            <li
                              key={idx}
                              className="text-text-main/80 flex gap-2 text-[0.82rem] leading-5"
                            >
                              <span className="shrink-0 font-bold text-[#B36262]">•</span>
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

          <div className="mx-auto flex w-full max-w-[23rem] flex-col gap-2">
            {hasMenuContext && (
              <div className="flex items-center justify-between rounded-full bg-white/90 px-3 py-2 text-[0.74rem] font-bold text-[#7A4C2B] shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm">
                <button
                  onClick={activeMode === 'menu' ? undefined : enterMenuMode}
                  className={`flex items-center gap-2 ${activeMode === 'menu' ? 'cursor-default' : 'transition-opacity hover:opacity-80'}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${activeMode === 'menu' ? 'bg-[#7BB181]' : 'bg-[#C9B9A6]'}`}
                  />
                  <span>{activeMode === 'menu' ? '메뉴판 추천 ON' : '메뉴판 추천 OFF'}</span>
                </button>

                {activeMode === 'menu' ? (
                  <button
                    onClick={exitMenuMode}
                    className="flex items-center gap-1 rounded-full bg-[#F4E7D8] px-2.5 py-1 text-[0.7rem] font-black text-[#9B6A42] transition-colors hover:bg-[#EEDBC7]"
                  >
                    <X size={12} />
                    일반 대화
                  </button>
                ) : (
                  <button
                    onClick={enterMenuMode}
                    className="rounded-full bg-[#B36262] px-2.5 py-1 text-[0.7rem] font-black text-white transition-colors hover:bg-[#9F5454]"
                  >
                    이어서 추천
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
              {showMentionOverlay && filteredFriends.length > 0 && (
                <div className="absolute right-4 bottom-full left-4 z-[30] mb-3 max-h-48 overflow-y-auto rounded-2xl border border-white/20 bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md">
                  <div className="px-2 py-1.5 text-[0.7rem] font-bold text-[#9B6A42] opacity-60">
                    함께 마시는 친구 태그
                  </div>
                  {filteredFriends.map((friend) => (
                    <button
                      key={friend.friendId}
                      onClick={() => handleSelectFriend(friend)}
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 transition-colors hover:bg-[#FDF6E9] active:bg-[#F9EBD3]"
                    >
                      <span className="text-[14px] font-bold text-[#4A3428]">
                        @{friend.nickname}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="border-primary-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[#B36262] transition-transform active:scale-95"
              >
                <Plus size={18} />
              </button>

              <input
                className="text-text-main placeholder:text-text-main/35 min-w-0 flex-1 bg-transparent text-[0.86rem] font-medium focus:outline-none"
                placeholder={
                  activeMode === 'menu'
                    ? '메뉴판 기준으로 다시 추천받아보세요'
                    : '소믈리에에게 물어보세요... (@김친구)'
                }
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showMentionOverlay && filteredFriends.length > 0) {
                      handleSelectFriend(filteredFriends[0]);
                      e.preventDefault();
                    } else {
                      handleSend();
                    }
                  }
                }}
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

      <MenuScannerModal
        isOpen={isMenuScanOpen}
        onClose={() => setIsMenuScanOpen(false)}
        onAnalysisComplete={handleMenuScanComplete}
      />

      <style jsx>{`
        @keyframes aiRise {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes aiSweep {
          0% {
            opacity: 0;
            transform: translateX(-140%) rotate(18deg);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(260%) rotate(18deg);
          }
        }

        @keyframes aiPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.9;
          }
        }

        @keyframes aiChipReveal {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.88);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .ai-reveal-chip {
          animation: aiChipReveal 560ms cubic-bezier(0.2, 0.75, 0.2, 1) both;
        }

        .recommendation-sommelier-card {
          position: relative;
          overflow: hidden;
          animation: aiRise 700ms cubic-bezier(0.2, 0.75, 0.2, 1) both;
        }

        .recommendation-sommelier-card::before {
          content: '';
          position: absolute;
          inset: -35%;
          background: radial-gradient(
            circle at top right,
            rgba(255, 212, 128, 0.32),
            transparent 42%
          );
          animation: aiPulse 2400ms ease-in-out infinite;
          pointer-events: none;
        }

        .recommendation-sommelier-card::after {
          content: '';
          position: absolute;
          top: -35%;
          left: -20%;
          width: 38%;
          height: 190%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.86), transparent);
          transform: rotate(18deg);
          animation: aiSweep 1600ms ease-out 240ms both;
          pointer-events: none;
        }

        .menu-pairing-reveal {
          position: relative;
          animation: aiRise 820ms cubic-bezier(0.2, 0.75, 0.2, 1) both;
          animation-delay: 120ms;
        }

        .pairing-flare {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 18%,
            rgba(255, 255, 255, 0.38) 50%,
            transparent 82%
          );
          transform: translateX(-130%);
          animation: aiSweep 1800ms ease-out 420ms both;
          pointer-events: none;
        }

        .menu-loading-shell {
          position: relative;
        }

        .loading-radar {
          background: radial-gradient(circle, rgba(179, 98, 98, 0.18), rgba(255, 255, 255, 0));
        }

        .loading-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 1.5px solid rgba(179, 98, 98, 0.24);
          animation: aiPulse 2200ms ease-in-out infinite;
        }

        .loading-ring-2 {
          inset: 8px;
          animation-delay: 220ms;
        }

        .loading-core {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #b36262, #d08a54);
          box-shadow: 0 0 18px rgba(179, 98, 98, 0.35);
        }

        .loading-pill {
          display: inline-block;
          height: 0.45rem;
          width: 2.75rem;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(179, 98, 98, 0.22), rgba(208, 138, 84, 0.72));
          animation: aiPulse 1500ms ease-in-out infinite;
        }

        .loading-pill-2 {
          animation-delay: 180ms;
        }

        .loading-pill-3 {
          animation-delay: 360ms;
        }
      `}</style>
    </div>
  );
}
