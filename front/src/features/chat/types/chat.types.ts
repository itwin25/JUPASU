export interface ChatMessageResponse {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SendChatRequest {
  message: string;
  session_id: string; // 세션 ID 추가
  selectedWine?: Record<string, any>;
  selectedMenu?: Record<string, any>;
}
