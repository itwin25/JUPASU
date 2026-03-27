export interface ChatMessageResponse {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  card?: ChatCard | null;
  actions?: ChatAction[];
  createdAt: string;
}

export interface SendChatRequest {
  message: string;
  session_id: string;
  selectedWine?: Record<string, unknown>;
  selectedMenu?: Record<string, unknown>;
}

export interface ChatCard {
  wine_id: number;
  name_kr: string;
  name_en?: string | null;
  subtitle?: string | null;
  price?: number | null;
  match_percent?: number | null;
  image_url?: string | null;
  detail_url?: string | null;
}

export interface ChatAction {
  type: string;
  label: string;
  wine_id?: number | null;
}

export interface ChatStreamChunk {
  content?: string;
  answer?: string;
  card?: ChatCard | null;
  cards?: ChatCard[] | null; // 리스트형 추천 필드 추가
  actions?: ChatAction[] | null;
  provider?: string;
}
