import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { ChatMessageResponse } from '../types/chat.types';
import { authToken } from '@/features/auth/utils/auth-token';
import { env } from '@/lib/env';

export const chatApi = {
  /**
   * 전체 채팅 내역 조회
   */
  getHistory: async () => {
    const { data } = await api.get<{ data: ChatMessageResponse[] }>(`${API_PATH.AI.CHAT}/history`);
    return data.data;
  },

  /**
   * 실시간 소믈리에 채팅 전송 (Streaming)
   */
  sendChatStream: async (
    message: string, 
    sessionId: string, 
    onMessage: (text: string, metadata?: any) => void
  ) => {
    const token = authToken.getAccess();
    const url = `${env.API_BASE_URL}${API_PATH.AI.CHAT}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ 
        message,
        session_id: sessionId
      }),
    });

    if (!response.ok) throw new Error('Failed to send message');
    if (!response.body) throw new Error('ReadableStream not supported');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\n\n|\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith('event:')) continue;

          if (trimmedLine.startsWith('data:')) {
            const dataString = trimmedLine.substring(5).trim();

            if (dataString === '[DONE]') return;

            try {
              const parsed = JSON.parse(dataString);
              // 텍스트 내용 처리
              const content = parsed.content || parsed.answer;
              if (content) {
                onMessage(content);
              }
              // 메타데이터(카드, 액션 등) 처리
              if (parsed.cards || parsed.actions) {
                onMessage('', { cards: parsed.cards, actions: parsed.actions });
              }
            } catch (e) {
              // JSON이 아닐 경우 순수 텍스트로 취급
              if (dataString && !dataString.startsWith('{')) {
                onMessage(dataString);
              }
            }
          }
        }
      }
    }
  },
};
