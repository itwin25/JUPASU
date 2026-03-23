export interface ChatMessageResponse {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SendChatRequest {
  message: string;
  selectedWine?: Record<string, any>;
  selectedMenu?: Record<string, any>;
}
