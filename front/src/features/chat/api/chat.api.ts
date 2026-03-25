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
  sendChatStream: async (message: string, sessionId: string, onMessage: (text: string) => void) => {
    const token = authToken.getAccess();
    const url = `/api${API_PATH.AI.CHAT}`;

    // 디버깅을 위한 로그
    console.log('📢 API 요청 시도:', url, 'Session ID:', sessionId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ 
        message,
        session_id: sessionId // 세션 ID 추가
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

      // SSE 이벤트는 보통 \n\n 또는 \n으로 구분됨
      const parts = buffer.split(/\n\n|\n/);

      // 마지막 부분이 완성되지 않았을 수 있으므로 버퍼에 보관
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith('event:')) continue;

          if (trimmedLine.startsWith('data:')) {
            const data = trimmedLine.substring(5).trim();

            if (data === '[DONE]') {
              console.log('🏁 스트리밍 완료');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || parsed.answer;
              if (content) {
                onMessage(content);
              }
            } catch (e) {
              // JSON이 아닐 경우의 Fallback: 오직 중괄호로 시작하지 않는 순수 텍스트만 허용
              if (data && !data.startsWith('{') && !data.includes(':')) {
                onMessage(data);
              } else {
                console.warn('⚠️ 유효하지 않은 데이터 건너뜀:', data);
              }
            }
          }
        }
      }
    }
  },
};
