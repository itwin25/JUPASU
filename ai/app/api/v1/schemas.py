from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Field


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


class SommelierTask(str, Enum):
    LABEL_SCAN = "LABEL_SCAN"
    MENU_SCAN = "MENU_SCAN"
    CHAT = "CHAT"


class RefineRequest(BaseModel):
    task: SommelierTask
    text_content: str
    user_id: Any


class RefineResponse(BaseModel):
    status: str = "success"
    data: Any
    raw_input: str
    provider: Optional[str] = None


class CustomChatRequest(BaseModel):
    message: str
    selected_wine: Optional[dict] = None
    selected_menu: Optional[dict] = None
    user_id: Any
    session_id: str # 고정값 제거: 호출 시 반드시 고유 세션 ID를 전달해야 함
    history: List[ChatMessage] = Field(default=[]) # 과거 대화 이력 필드 추가
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


# ─── 취향 리포트 AI 요약 ───────────────────────────────────────────

class TasteReportSummaryRequest(BaseModel):
    nickname: str
    avg_sweetness: float
    avg_acidity: float
    avg_body: float
    avg_tannin: float
    avg_alcohol: float


class TasteReportSummaryResponse(BaseModel):
    main_title: str
    taste_type_tag: str
    content: str
    best_description: str
    worst_description: str

