import { useState, useCallback, useEffect } from 'react';
import { chatApi } from '../api/chat.api';
import { ChatMessageResponse } from '../types/chat.types';

export interface ChatMessage {
  id: string | number;
  type: 'bot' | 'user';
  text: string;
  options?: string[];
  recommendation?: {
    name: string;
    category: string;
    price: string;
    match: number;
  };
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // 초기 채팅 내역 불러오기
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await chatApi.getHistory();
        const formattedHistory: ChatMessage[] = history.map((msg) => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
        }));

        if (formattedHistory.length === 0) {
          // 초기 환영 메시지
          setMessages([
            {
              id: 'welcome',
              type: 'bot',
              text: '어떤 와인을 추천해드릴까요?',
            },
          ]);
        } else {
          setMessages(formattedHistory);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages([
          {
            id: 'welcome',
            type: 'bot',
            text: '어떤 와인을 추천해드릴까요?',
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchHistory();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: text,
    };

    const botMessageId = Date.now() + 1;
    const botMessagePlaceholder: ChatMessage = {
      id: botMessageId,
      type: 'bot',
      text: '',
    };

    setMessages((prev) => [...prev, userMessage, botMessagePlaceholder]);
    setIsLoading(true);

    try {
      await chatApi.sendChatStream(text, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === botMessageId ? { ...msg, text: msg.text + chunk } : msg)),
        );
      });
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
  }, []);

  return {
    messages,
    isLoading,
    isInitializing,
    sendMessage,
  };
};
