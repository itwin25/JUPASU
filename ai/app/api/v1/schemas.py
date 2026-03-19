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

class SommelierRequest(BaseModel):
    task: SommelierTask
    text_content: Optional[str] = None
    user_id: str
    session_id: str = "session-123"
    mentioned_friends: List[dict] = Field(default=[])
    stream: bool = False

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
    user_id: str
    session_id: str = "session-123"
    stream: bool = False
    mentioned_friends: List[dict] = Field(default=[])

class CustomChatResponse(BaseModel):
    answer: str
    status: str = "success"
    raw_ocr: Optional[str] = None
