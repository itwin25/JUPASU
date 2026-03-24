from pydantic import BaseModel, Field
from typing import List, Optional, Any
from enum import Enum

# --- OpenAI Compatible Schemas ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: Optional[bool] = False
    response_format: Optional[dict] = None
    user: Optional[str] = None

class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: Optional[str] = None

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: Usage

# --- Sommelier Custom Schemas ---

class SommelierTask(str, Enum):
    LABEL_SCAN = "LABEL_SCAN"
    MENU_SCAN = "MENU_SCAN"
    CHAT = "CHAT"

class RefineRequest(BaseModel):
    """
    이미 추출된 텍스트를 LLM으로 정제 요청
    - task: LABEL_SCAN (라벨 정제) 또는 MENU_SCAN (메뉴판 정제)
    - text_content: OCR로 추출된 원본 텍스트
    """
    task: SommelierTask
    text_content: str
    user_id: Any

class RefineResponse(BaseModel):
    """정제된 구조화 데이터 응답"""
    status: str = "success"
    data: Any # Wine 정보 객체 또는 Menu 리스트
    raw_input: str
    provider: Optional[str] = None

class CustomChatRequest(BaseModel):
    """
    고도화된 채팅 요청 스키마
    - message: 사용자의 질문
    - selected_wine: 사용자가 DB에서 선택한 확정 와인 정보
    - selected_menu: 사용자가 확정한 메뉴판 와인/음식 목록
    """
    message: str
    selected_wine: Optional[dict] = None 
    selected_menu: Optional[dict] = None
    user_id: Any
    session_id: str = "session-123"
    stream: bool = False
    mentioned_friends: List[dict] = Field(default=[])

class ChatCardData(BaseModel):
    wine_id: Optional[int] = None
    name_kr: Optional[str] = None
    name_en: Optional[str] = None
    subtitle: Optional[str] = None
    price: Optional[int] = None
    match_percent: Optional[int] = None
    image_url: Optional[str] = None
    detail_url: Optional[str] = None


class ChatActionData(BaseModel):
    type: str
    label: str
    wine_id: Optional[int] = None


class CustomChatResponse(BaseModel):
    answer: str
    status: str = "success"
    raw_ocr: Optional[str] = None
    provider: Optional[str] = None
    card: Optional[ChatCardData] = None
    actions: List[ChatActionData] = Field(default=[])
