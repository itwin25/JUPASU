import { useCallback, useEffect, useState } from 'react';
import { chatApi } from '../api/chat.api';
import { useAuthStore } from '@/stores/auth.store';
import { ChatAction, ChatCard, ChatMessageResponse, ChatStreamChunk } from '../types/chat.types';

const SESSION_STORAGE_KEY = 'chat_session_id';
const DEMO_MENU_SCAN_TRIGGER = '메뉴판 스캔 완료';
const DEMO_MENU_LOADING_MESSAGE = '소믈리에가 최적의 와인과 음식 페어링 조합을 찾고 있습니다.';
const DEMO_MENU_WINE_ID = 7139;
const DEMO_MENU_PAIRING: MenuRecommendation = {
  pairingNumber: 1,
  foodName: '우삼겹된장덮밥',
  wineName: 'VINEYARDS Shiraz',
  reasons: [
    '평소 묵직한 바디감과 스파이시한 레드 와인을 즐기시는 취향에 맞춰, 우삼겹된장덮밥과 쉬라즈를 추천해 드립니다.',
    '쉬라즈는 바디감이 묵직하고 탄닌(떫은맛)이 강하며, 후추 같은 스파이시한 풍미가 특징인 적포도주입니다.',
    '우삼겹의 풍부한 지방과 고기 향이 와인의 떫은맛을 부드럽게 중화시켜 최적의 균형을 만들어냅니다.',
    '된장 특유의 짭짤하고 깊은 감칠맛은 쉬라즈 와인이 가진 진한 검은 과실 향을 더욱 돋보이고 풍성하게 만들어 줍니다.',
  ],
};
const DEMO_MENU_WINE_CARD: WineCardData = {
  wine_id: DEMO_MENU_WINE_ID,
  name_kr: '빈야드 월드 시라즈',
  name_en: 'VINEYARDS Shiraz',
  subtitle: 'Shiraz',
  image_url: '/vineyards.png',
  match_percent: 82,
};

export interface WineCardData {
  wine_id?: number;
  name_kr?: string;
  name_en?: string;
  subtitle?: string;
  price?: number;
  match_percent?: number;
  image_url?: string;
}

export interface MenuRecommendation {
  pairingNumber: number;
  foodName: string;
  wineName: string;
  reasons: string[];
}

export interface SelectedMenuContext {
  wineNames?: string[];
  foodNames?: string[];
}

export interface MentionedFriend {
  id: number;
  nickname: string;
}

export interface ChatMessage {
  id: string | number;
  type: 'bot' | 'user';
  text: string;
  displayText?: string;
  card?: ChatCard | null;
  actions?: ChatAction[];
  recommendations?: WineCardData[]; // 리스트형 추천
  menuPairings?: MenuRecommendation[]; // 메뉴판 페어링
}

/** 세션 ID 생성 유틸리티 */
const createSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/** 기존 세션 ID를 가져오거나 새로 생성 */
const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return createSessionId();
  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return stored;
  const next = createSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
};

/** 메뉴판 페어링 인트로 랜덤 생성 */
const PAIRING_INTROS = [
  (name: string) =>
    `${name}님의 취향에 맞는 멋진 페어링을 찾았습니다!\n깊이 있는 풍미를 즐기시는 분께 특별히 추천드립니다.`,
  (name: string) =>
    `${name}님, 메뉴판에서 환상의 조합을 발견했습니다!\n오늘의 식사를 더욱 특별하게 만들어줄 페어링입니다.`,
  (name: string) =>
    `${name}님께 딱 맞는 페어링을 골라봤습니다!\n메뉴판 속에서 최고의 궁합을 찾았습니다.`,
  (name: string) =>
    `${name}님의 메뉴판을 분석해보았습니다!\n취향을 고려한 특별한 조합을 추천드립니다.`,
  (name: string) =>
    `${name}님, 소믈리에가 엄선한 페어링입니다!\n이 조합이라면 만족스러운 식사가 될 거예요.`,
];

function getRandomPairingIntro(nickname?: string): string {
  const name = nickname || '고객';
  const idx = Math.floor(Math.random() * PAIRING_INTROS.length);
  return PAIRING_INTROS[idx](name);
}

function stripMarkdown(text: string): string {
  return text.replace(/\*+/g, '').trim();
}

/** AI 응답에서 메뉴판 페어링 정보 파싱 */
function parseMenuPairings(responseText: string): MenuRecommendation[] {
  const recommendations: MenuRecommendation[] = [];
  const sections = responseText.split(/(?=\d+\.\s*\**\s*메뉴판\s*음식)/);

  sections.forEach((section) => {
    if (!section.trim()) return;
    const foodMatch = section.match(/메뉴판\s*음식[:\s*]+([^\n]+)/);
    const wineMatch = section.match(/메뉴판\s*와인[:\s*]+([^\n]+)/);
    const reasonsMatch = section.match(
      /추천\s*이유[:\s*]*([\s\S]+?)(?=\n\s*\d+\.\s*\**\s*메뉴판|$)/,
    );

    if (foodMatch && wineMatch) {
      let reasons: string[] = [];
      if (reasonsMatch) {
        reasons = reasonsMatch[1]
          .split(/\n/)
          .map((r) => r.replace(/^[\s\-•*]+/, '').trim())
          .map((r) => stripMarkdown(r))
          .filter((r) => r.length > 0)
          .slice(0, 3);
      }
      if (reasons.length === 0) reasons = ['메뉴와 잘 어울리는 조합입니다.'];

      recommendations.push({
        pairingNumber: recommendations.length + 1,
        foodName: stripMarkdown(foodMatch[1]),
        wineName: stripMarkdown(wineMatch[1]),
        reasons,
      });
    }
  });
  return recommendations;
}

const buildWelcomeMessage = (): ChatMessage => ({
  id: 'welcome',
  type: 'bot',
  text: '소믈리에에게 물어보세요. 음식이나 메뉴를 알려주시면 어울리는 와인을 추천해드릴게요.',
  card: null,
  actions: [],
});

export const useChat = () => {
  const nickname = useAuthStore((s) => s.user?.nickname);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedMenuContext, setSelectedMenuContext] = useState<SelectedMenuContext | null>(null);
  const [activeMode, setActiveMode] = useState<'general' | 'menu'>('general');

  /** 히스토리 데이터를 메시지 객체로 변환 */
  const mapHistoryToMessages = useCallback(
    (history: ChatMessageResponse[]): ChatMessage[] => {
      return history.map((msg) => {
        const base: ChatMessage = {
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
          card: msg.card ?? null,
          actions: msg.actions ?? [],
        };

        if (
          msg.role === 'user' &&
          (msg.content === '메뉴판 스캔 완료' || msg.content.includes('메뉴판 음식 목록:'))
        ) {
          base.displayText = '🍷 메뉴판으로 추천받기';
        }

        if (
          msg.role !== 'user' &&
          (msg.content.includes('메뉴판 음식') || msg.content.includes('메뉴판음식'))
        ) {
          const pairings = parseMenuPairings(msg.content);
          if (pairings.length > 0) {
            base.text = getRandomPairingIntro(nickname);
            base.menuPairings = pairings;
          }
        }
        return base;
      });
    },
    [nickname],
  );

  useEffect(() => {
    const activeSessionId = getOrCreateSessionId();
    setSessionId(activeSessionId);

    const fetchHistory = async () => {
      try {
        const history = await chatApi.getHistory(activeSessionId);
        setMessages(history.length > 0 ? mapHistoryToMessages(history) : [buildWelcomeMessage()]);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages([buildWelcomeMessage()]);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchHistory();
  }, [mapHistoryToMessages]);

  /** 스트림 데이터를 메시지에 적용 */
  const applyStreamChunk = useCallback((botMessageId: number, chunk: ChatStreamChunk) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== botMessageId) return msg;
        const nextText = chunk.content ?? chunk.answer;
        return {
          ...msg,
          text: nextText ? msg.text + nextText : msg.text,
          card: chunk.card !== undefined ? chunk.card : msg.card,
          actions: chunk.actions ?? msg.actions ?? [],
          recommendations: (chunk.cards as WineCardData[]) ?? msg.recommendations,
        };
      }),
    );
  }, []);

  const sendMessage = useCallback(
    async (
      text: string,
      displayText?: string,
      selectedMenu?: SelectedMenuContext,
      mentionedFriends?: MentionedFriend[],
    ) => {
      if (!text.trim()) return;

      const activeSessionId = sessionId || getOrCreateSessionId();
      if (!sessionId) setSessionId(activeSessionId);

      // 메뉴 모드 컨텍스트 결정
      const effectiveSelectedMenu =
        selectedMenu ?? (activeMode === 'menu' ? (selectedMenuContext ?? undefined) : undefined);
      if (selectedMenu) {
        setSelectedMenuContext(selectedMenu);
        setActiveMode('menu');
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        type: 'user',
        text,
        displayText,
      };

      const botMessageId = Date.now() + 1;
      const isDemoMenuRecommendation =
        text === DEMO_MENU_SCAN_TRIGGER && Boolean(selectedMenu || effectiveSelectedMenu);

      // 메뉴판 추천 데모
      if (isDemoMenuRecommendation) {
        setMessages((prev) => [
          ...prev,
          userMessage,
          {
            id: botMessageId,
            type: 'bot',
            text: DEMO_MENU_LOADING_MESSAGE,
            card: null,
            actions: [],
          },
        ]);
        setIsLoading(true);

        await new Promise((resolve) => window.setTimeout(resolve, 8000));

        const introText = getRandomPairingIntro(nickname);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  text: introText,
                  recommendations: [DEMO_MENU_WINE_CARD],
                  menuPairings: [DEMO_MENU_PAIRING],
                }
              : msg,
          ),
        );
        setIsLoading(false);
        return;
      }

      const botPlaceholder: ChatMessage = {
        id: botMessageId,
        type: 'bot',
        text: '',
        card: null,
        actions: [],
      };

      setMessages((prev) => [...prev, userMessage, botPlaceholder]);
      setIsLoading(true);

      let fullBotText = '';

      try {
        await chatApi.sendChatStream(
          text,
          activeSessionId,
          (chunk) => {
            const nextText = chunk.content ?? chunk.answer;
            if (nextText) fullBotText += nextText;
            applyStreamChunk(botMessageId, chunk);
          },
          effectiveSelectedMenu,
          mentionedFriends,
        );

        // 스트리밍 완료 후 메뉴판 페어링 추가 분석
        if (fullBotText.includes('메뉴판 음식') || fullBotText.includes('메뉴판음식')) {
          const pairings = parseMenuPairings(fullBotText);
          if (pairings.length > 0) {
            const introText = getRandomPairingIntro(nickname);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId ? { ...msg, text: introText, menuPairings: pairings } : msg,
              ),
            );
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  text: '메시지를 전송하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
                }
              : msg,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeMode, applyStreamChunk, nickname, sessionId, selectedMenuContext],
  );

  const startNewChat = useCallback(() => {
    const nextSessionId = createSessionId();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    }
    setSessionId(nextSessionId);
    setSelectedMenuContext(null);
    setActiveMode('general');
    setMessages([buildWelcomeMessage()]);
  }, []);

  const enterMenuMode = useCallback(() => {
    if (!selectedMenuContext) return;
    setActiveMode('menu');
  }, [selectedMenuContext]);

  const exitMenuMode = useCallback(() => {
    setActiveMode('general');
  }, []);

  return {
    messages,
    isLoading,
    isInitializing,
    activeMode,
    hasMenuContext: Boolean(selectedMenuContext),
    enterMenuMode,
    exitMenuMode,
    sendMessage,
    startNewChat,
  };
};
