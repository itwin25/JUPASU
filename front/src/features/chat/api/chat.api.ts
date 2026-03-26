import { API_PATH } from '@/constants/api-path';
import { authToken } from '@/features/auth/utils/auth-token';
import { api } from '@/lib/axios';
import { ChatMessageResponse, ChatStreamChunk } from '../types/chat.types';

const parseStreamPayload = (raw: string): ChatStreamChunk | null => {
  if (!raw || raw === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(raw) as ChatStreamChunk;
  } catch {
    if (raw.startsWith('{') || raw.includes(':')) {
      console.warn('알 수 없는 스트림 데이터 형식:', raw);
      return null;
    }

    return { content: raw };
  }
};

export const chatApi = {
  getHistory: async (sessionId?: string) => {
    const { data } = await api.get<{ data: ChatMessageResponse[] }>(`${API_PATH.AI.CHAT}/history`, {
      params: sessionId ? { session_id: sessionId } : undefined,
    });
    return data.data;
  },

  sendChatStream: async (
    message: string,
    sessionId: string,
    onChunk: (chunk: ChatStreamChunk) => void,
  ) => {
    const token = authToken.getAccess();
    const url = `/api${API_PATH.AI.CHAT}`;

    console.log('API 요청 시도:', url, 'Session ID:', sessionId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported');
    }

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

          if (!trimmedLine.startsWith('data:')) continue;

          const data = trimmedLine.substring(5).trim();
          if (data === '[DONE]') {
            return;
          }

          const parsed = parseStreamPayload(data);
          if (parsed) {
            onChunk(parsed);
          }
        }
      }
    }
  },
};
