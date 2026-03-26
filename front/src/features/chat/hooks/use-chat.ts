import { useState, useCallback, useEffect } from 'react';
import { chatApi } from '../api/chat.api';
import { useAuthStore } from '@/stores/auth.store';

export interface ChatMessage {
  id: string | number;
  type: 'bot' | 'user';
  text: string;
  displayText?: string;
  options?: string[];
  recommendations?: WineCardData[];
  actions?: ActionData[];
  menuPairings?: MenuRecommendation[]; // 메뉴판 페어링
}

export interface WineCardData {
  wine_id?: number;
  name_kr?: string;
  name_en?: string;
  subtitle?: string;
  price?: number;
  match_percent?: number;
  image_url?: string;
}

export interface ActionData {
  label: string;
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

/** 마크다운 볼드(**) 제거 헬퍼 */
function stripMarkdown(text: string): string {
  return text.replace(/\*+/g, '').trim();
}

/**
 * AI 응답에서 메뉴판 페어링 정보 파싱
 * - 마크다운(**) 포함 여부와 무관하게 동작
 */
function parseMenuPairings(responseText: string): MenuRecommendation[] {
  const recommendations: MenuRecommendation[] = [];

  // "1. 메뉴판 음식:" 또는 "1. **메뉴판 음식:**" 단위로 분리
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
        // 줄 단위로 분리 후 앞의 불릿 마커(- * •)만 제거 (숫자는 보존)
        reasons = reasonsMatch[1]
          .split(/\n/)
          .map((r) => r.replace(/^[\s\-•*]+/, '').trim())
          .map((r) => stripMarkdown(r))
          .filter((r) => r.length > 0)
          .slice(0, 3);
      }

      if (reasons.length === 0) {
        reasons = ['메뉴와 잘 어울리는 조합입니다.'];
      }

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

export const useChat = () => {
  const nickname = useAuthStore((s) => s.user?.nickname);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedMenuContext, setSelectedMenuContext] = useState<SelectedMenuContext | null>(null);
  const [activeMode, setActiveMode] = useState<'general' | 'menu'>('general');

  useEffect(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSessionId);

    const fetchHistory = async () => {
      try {
        const history = await chatApi.getHistory();
        const formattedHistory: ChatMessage[] = history.map((msg) => {
          const base: ChatMessage = {
            id: msg.id,
            type: msg.role === 'user' ? 'user' : 'bot',
            text: msg.content,
          };

          // 메뉴 스캔 프롬프트는 짧은 표시 텍스트로 대체
          if (
            msg.role === 'user' &&
            (msg.content === '메뉴판 스캔 완료' || msg.content.includes('메뉴판 음식 목록:'))
          ) {
            base.displayText = '🍷 메뉴판으로 추천받기';
          }

          // 봇 응답에 메뉴판 페어링이 포함된 경우 파싱
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

        if (formattedHistory.length === 0) {
          setMessages([{ id: 'welcome', type: 'bot', text: '어떤 와인을 추천해드릴까요?' }]);
        } else {
          setMessages(formattedHistory);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages([{ id: 'welcome', type: 'bot', text: '어떤 와인을 추천해드릴까요?' }]);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchHistory();
  }, [nickname]);

  const sendMessage = useCallback(
    async (text: string, displayText?: string, selectedMenu?: SelectedMenuContext) => {
      if (!text.trim()) return;

      const effectiveSelectedMenu =
        selectedMenu ?? (activeMode === 'menu' ? (selectedMenuContext ?? undefined) : undefined);

      if (selectedMenu) {
        setSelectedMenuContext(selectedMenu);
        setActiveMode('menu');
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        type: 'user',
        text: text,
        displayText: displayText,
      };

      const botMessageId = Date.now() + 1;
      const botMessagePlaceholder: ChatMessage = {
        id: botMessageId,
        type: 'bot',
        text: '',
      };

      setMessages((prev) => [...prev, userMessage, botMessagePlaceholder]);
      setIsLoading(true);

      let fullText = '';

      try {
        await chatApi.sendChatStream(
          text,
          sessionId,
          (chunk, metadata) => {
            if (chunk) fullText += chunk;

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === botMessageId) {
                  const updated = { ...msg };
                  if (chunk) updated.text += chunk;

                  if (metadata) {
                    if (metadata.cards) updated.recommendations = metadata.cards;
                    if (metadata.actions) updated.actions = metadata.actions;
                  }
                  return updated;
                }
                return msg;
              }),
            );
          },
          effectiveSelectedMenu,
        );

        // 스트리밍 완료 후: 로컬 변수 기반으로 메뉴판 페어링 파싱
        if (fullText.includes('메뉴판 음식') || fullText.includes('메뉴판음식')) {
          const pairings = parseMenuPairings(fullText);
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
              ? { ...msg, text: '오류가 발생했습니다. 다시 시도해주세요.' }
              : msg,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeMode, sessionId, nickname, selectedMenuContext],
  );

  const enterMenuMode = useCallback(() => {
    if (!selectedMenuContext) return;
    setActiveMode('menu');
  }, [selectedMenuContext]);

  const exitMenuMode = useCallback(() => {
    setActiveMode('general');
  }, []);

  const startNewChat = useCallback(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSessionId);
    setSelectedMenuContext(null);
    setActiveMode('general');
    setMessages([
      { id: 'welcome', type: 'bot', text: '새로운 대화를 시작합니다. 어떤 와인을 추천해드릴까요?' },
    ]);
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
