import { API_PATH } from '@/constants/api-path';
import { authToken } from '@/features/auth/utils/auth-token';
import { api } from '@/lib/axios';
import { ChatMessageResponse, ChatStreamChunk } from '../types/chat.types';

/**
 * 스트림 데이터를 파싱하여 JSON 객체로 변환합니다.
 * [DONE] 메시지나 형식이 맞지 않는 경우를 안전하게 처리합니다.
 */
const parseStreamPayload = (raw: string): ChatStreamChunk | null => {
  if (!raw || raw === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(raw) as ChatStreamChunk;
  } catch {
    // JSON 형식이 아니지만 데이터가 포함된 경우 순수 텍스트로 처리
    if (raw.startsWith('{') || raw.includes(':')) {
      console.warn('알 수 없는 스트림 데이터 형식:', raw);
      return null;
    }

    return { content: raw };
  }
};

interface SelectedMenuContext {
  wineNames?: string[];
  foodNames?: string[];
}

export const chatApi = {
  /**
   * 세션 ID를 기반으로 채팅 이력을 조회합니다.
   */
  getHistory: async (sessionId?: string) => {
    const { data } = await api.get<{ data: ChatMessageResponse[] }>(`${API_PATH.AI.CHAT}/history`, {
      params: sessionId ? { session_id: sessionId } : undefined,
    });
    return data.data;
  },

  /**
   * 실시간 소믈리에 채팅 전송 (Streaming)
   * 
   * @param message - 사용자의 입력 메시지
   * @param sessionId - 현재 대화 세션의 ID
   * @param onChunk - 스트림 데이터 수신 시 실행될 콜백 함수
   * @param selectedMenu - 메뉴판 스캔 시 수집된 컨텍스트 정보
   */
  sendChatStream: async (
    message: string,
    sessionId: string,
    onChunk: (chunk: ChatStreamChunk) => void,
    selectedMenu?: SelectedMenuContext,
  ) => {
    const token = authToken.getAccess();
    // 프록시 설정을 위해 '/api' 접두사 사용
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
        ...(selectedMenu ? { selected_menu: selectedMenu } : {}),
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

      // 스트림 데이터를 디코딩하여 버퍼에 추가
      buffer += decoder.decode(value, { stream: true });
      
      // 개행 문자를 기준으로 데이터 조각을 분리하여 처리
      const parts = buffer.split(/\n\n|\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // SSE 이벤트 주석이나 빈 줄 무시
          if (!trimmedLine || trimmedLine.startsWith('event:')) continue;

          // 'data:' 접두사가 있는 실제 데이터만 파싱
          if (!trimmedLine.startsWith('data:')) continue;

          const data = trimmedLine.substring(5).trim();
          
          // 스트림 종료 신호 확인
          if (data === '[DONE]') {
            return;
          }

          // JSON 데이터 파싱 및 콜백 실행
          const parsed = parseStreamPayload(data);
          if (parsed) {
            onChunk(parsed);
          }
        }
      }
    }
  },
};
