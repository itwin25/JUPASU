import { useCallback, useEffect, useState } from 'react';
import { chatApi } from '../api/chat.api';
import { ChatAction, ChatCard, ChatMessageResponse, ChatStreamChunk } from '../types/chat.types';

const SESSION_STORAGE_KEY = 'chat_session_id';

export interface ChatMessage {
  id: string | number;
  type: 'bot' | 'user';
  text: string;
  card?: ChatCard | null;
  actions?: ChatAction[];
}

const createSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') {
    return createSessionId();
  }

  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  const next = createSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
};

const buildWelcomeMessage = (text?: string): ChatMessage => ({
  id: 'welcome',
  type: 'bot',
  text:
    text ?? '소믈리에에게 물어보세요. 음식이나 메뉴를 알려주시면 어울리는 와인을 추천해드릴게요.',
  card: null,
  actions: [],
});

const mapHistoryToMessages = (history: ChatMessageResponse[]): ChatMessage[] =>
  history.map((msg) => ({
    id: msg.id,
    type: msg.role === 'user' ? 'user' : 'bot',
    text: msg.content,
    card: msg.card ?? null,
    actions: msg.actions ?? [],
  }));

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

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
  }, []);

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
        };
      }),
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const activeSessionId = sessionId || getOrCreateSessionId();
      if (!sessionId) {
        setSessionId(activeSessionId);
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        type: 'user',
        text,
      };

      const botMessageId = Date.now() + 1;
      const botPlaceholder: ChatMessage = {
        id: botMessageId,
        type: 'bot',
        text: '',
        card: null,
        actions: [],
      };

      setMessages((prev) => [...prev, userMessage, botPlaceholder]);
      setIsLoading(true);

      try {
        await chatApi.sendChatStream(text, activeSessionId, (chunk) => {
          applyStreamChunk(botMessageId, chunk);
        });
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
    [applyStreamChunk, sessionId],
  );

  const startNewChat = useCallback(() => {
    const nextSessionId = createSessionId();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    }
    setSessionId(nextSessionId);
    setMessages([
      buildWelcomeMessage(
        '새 대화를 시작했어요. 음식이나 메뉴를 알려주시면 어울리는 와인을 추천해드릴게요.',
      ),
    ]);
  }, []);

  return {
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    startNewChat,
  };
};
