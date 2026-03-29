'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Send, ChevronLeft, Heart, RotateCcw, X } from 'lucide-react';
import { useChat, SelectedMenuContext } from '@/features/chat/hooks/use-chat';
import { friendApi } from '@/features/friend/api/friend.api';
import { FriendListItem } from '@/features/friend/types/friend.types';
import MenuScannerModal from '@/features/scan/components/MenuScannerModal';
import { useWineScrapMutation } from '@/features/wine/hooks/useWineListQuery';
import { MentionsInput, Mention, MentionsInputStyle } from 'react-mentions';

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
  const [friends, setFriends] = useState<FriendListItem[]>([]);

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

  // --- [최종 정밀 보정] Mentions 레이어링 수평 정렬 스타일 ---
  const sharedStyle = {
    fontSize: '14px',
    lineHeight: '20px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    fontWeight: 600,
  };

  const mentionsStyle: MentionsInputStyle = {
    control: {
      backgroundColor: 'transparent',
      fontSize: '14px',
      fontWeight: 600,
    },
    '&multiLine': {
      control: {
        minHeight: '40px',
      },
      highlighter: {
        ...sharedStyle,
        color: 'transparent',
        padding: '12px 12px 8px 4px',
        border: '1px solid transparent',
      },
      input: {
        ...sharedStyle,
        padding: '10px 12px',
        outline: 'none',
        color: '#4A3428',
        border: '1px solid transparent',
      },
    },
    suggestions: {
      list: {
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.1)',
        fontSize: '14px',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        position: 'absolute',
        bottom: '100%',
        marginBottom: '10px',
      },
      item: {
        padding: '10px 15px',
        '&focused': {
          backgroundColor: '#FDF6E9',
        },
      },
    },
  };

  const mentionTagStyle = {
    backgroundColor: '#F4E7D8',
    color: 'transparent',
    borderRadius: '4px',
    padding: '1px 4px',
  };

  const foodTagStyle = {
    backgroundColor: '#FFF9EB',
    color: 'transparent',
    borderRadius: '4px',
    padding: '1px 4px',
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    const mentionRegex = /@\[([^\]]+)\]\(user:([^\)]+)\)/g;
    const foodRegex = /#\[([^\]]+)\]\(food:([^\)]+)\)/g;

    const activeMentions: { id: number; nickname: string }[] = [];
    let match;
    while ((match = mentionRegex.exec(inputValue)) !== null) {
      activeMentions.push({ id: Number(match[2]), nickname: match[1] });
    }

    const taggedFoods: string[] = [];
    while ((match = foodRegex.exec(inputValue)) !== null) {
      taggedFoods.push(match[1]);
    }

    const displayValue = inputValue.replace(mentionRegex, '@$1').replace(foodRegex, '#$1');
    const menuContext = taggedFoods.length > 0 ? { taggedFoods } : undefined;

    sendMessage(displayValue.trim(), undefined, menuContext, activeMentions);
    setInputValue('');
    setShowMenu(false);
  };

  const handleMenuScanComplete = (data: SelectedMenuContext) => {
    sendMessage('메뉴판 스캔 완료', '🍷 메뉴판으로 추천받기', data);
  };

  const handleToggleScrap = async (wineId?: number) => {
    if (!wineId || isScrapPending) return;
    try {
      await toggleScrap(wineId);
    } catch (error) {
      console.error('Failed to toggle scrap:', error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2E1E18]">
      <div className="absolute inset-0 z-0">
        <Image src="/chatbot.svg" alt="소믈리에 배경" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,16,12,0.28),rgba(25,16,12,0.1)_30%,rgba(25,16,12,0.18)_72%,rgba(25,16,12,0.5))]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
            <RotateCcw size={16} />새 채팅
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
                  (isLoading
                    ? '소믈리에가 답변을 준비하고 있어요...'
                    : '소믈리에에게 물어보세요. 음식이나 메뉴를 알려주시면 어울리는 와인을 추천해드릴게요.')}
              </p>

              {latestBotMessage?.recommendations && latestBotMessage.recommendations.length > 0 && (
                <div className="mt-4 space-y-3">
                  {latestBotMessage.recommendations.map((rec, index) => (
                    <div
                      key={rec.wine_id || index}
                      onClick={() => rec.wine_id && router.push(`/wines/${rec.wine_id}`)}
                      className="cursor-pointer rounded-[1.6rem] border border-[#F1D991] bg-[#FFF9EB] p-3.5 shadow-sm active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] bg-white">
                          <Image
                            src={rec.image_url || '/default_wine.png'}
                            alt={rec.name_kr || '와인'}
                            fill
                            className="object-cover p-1"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-text-main truncate text-[0.92rem] font-black">
                            {rec.name_kr}
                          </h3>
                          <p className="text-text-main/48 truncate text-[0.7rem] font-semibold">
                            {rec.subtitle || rec.name_en}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-full bg-[#C78354] px-1.5 py-0.5 text-[0.55rem] font-black text-white">
                              {rec.match_percent}% match
                            </span>
                            <span className="text-[0.8rem] font-black text-[#B36262]">
                              {formatPrice(rec.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {latestBotMessage?.card && (
                <div className="mt-4">
                  <Link
                    href={`/wines/${latestBotMessage.card.wine_id}`}
                    className="block rounded-[1.75rem] border border-[#F1D991] bg-[#FFF9EB] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm">
                        <Image
                          src={latestBotMessage.card.image_url || '/default_wine.png'}
                          alt={latestBotMessage.card.name_kr || '추천 와인'}
                          fill
                          className="object-cover p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-text-main truncate text-[1rem] font-black">
                          {latestBotMessage.card.name_kr}
                        </h3>
                        <p className="text-text-main/48 truncate text-[0.72rem] font-bold">
                          {latestBotMessage.card.subtitle || latestBotMessage.card.name_en}
                        </p>
                        <p className="mt-1 font-black text-[#B36262]">
                          {formatPrice(latestBotMessage.card.price)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-[#C78354] px-2 py-0.5 text-[0.6rem] font-black whitespace-nowrap text-white">
                          {latestBotMessage.card.match_percent}% match
                        </span>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleToggleScrap(latestBotMessage.card?.wine_id)}
                    className="text-text-main/52 mt-3 flex items-center gap-1.5 px-1 text-[0.74rem] font-bold transition-opacity active:opacity-60"
                  >
                    <Heart size={14} className="fill-[#D16B74] text-[#D16B74]" />
                    위시리스트에 추가하기
                  </button>
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
                className="text-text-main w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold hover:bg-[#FDF6E9]"
              >
                메뉴판 스캔
              </button>
              <button
                onClick={() => router.push('/scan')}
                className="w-full rounded-[1rem] px-3 py-2.5 text-left text-[0.78rem] font-bold text-[#7B4D9B] hover:bg-[#FDF6E9]"
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
                    className="flex items-center gap-1 rounded-full bg-[#F4E7D8] px-2.5 py-1 text-[0.7rem] font-black text-[#9B6A42] hover:bg-[#EEDBC7]"
                  >
                    <X size={12} />
                    일반 대화
                  </button>
                ) : (
                  <button
                    onClick={enterMenuMode}
                    className="rounded-full bg-[#B36262] px-2.5 py-1 text-[0.7rem] font-black text-white hover:bg-[#9F5454]"
                  >
                    이어서 추천
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="border-primary-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[#B36262] transition-transform active:scale-95"
              >
                <Plus size={18} />
              </button>

              <div className="min-w-0 flex-1">
                <MentionsInput
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    activeMode === 'menu'
                      ? '메뉴판 기준으로 추천받기'
                      : '소믈리에에게 물어보세요... (@친구, #음식)'
                  }
                  style={mentionsStyle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                >
                  <Mention
                    trigger="@"
                    markup="@[__display__](user:__id__)"
                    data={friends.map((f) => ({
                      id: String(f.friendId),
                      display: String(f.nickname || '이름 없음'),
                    }))}
                    style={mentionTagStyle}
                    displayTransform={(_, display) => `${display}`}
                    appendSpaceOnAdd
                  />
                  <Mention
                    trigger="#"
                    markup="#[__display__](food:__id__)"
                    data={(search) => {
                      if (!search) return [];
                      return [{ id: search, display: search }];
                    }}
                    renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                      <div className={`px-4 py-2 ${focused ? 'bg-[#FDF6E9]' : ''}`}>
                        {suggestion.display} (음식 추가)
                      </div>
                    )}
                    style={foodTagStyle}
                    displayTransform={(_, display) => `${display}`}
                    appendSpaceOnAdd
                  />
                </MentionsInput>
              </div>

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
    </div>
  );
}
