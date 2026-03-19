from pydantic import BaseModel, Field
from typing import List, Optional, Any

# --- OpenAI Compatible Request/Response Schemas ---

class ChatMessage(BaseModel):
    """OpenAI API 호환 메시지 구조"""
    role: str = Field(..., description="메시지 작성자의 역할 (system, user, assistant)")
    content: str = Field(..., description="메시지 내용")

class ChatCompletionRequest(BaseModel):
    """OpenAI API 호환 채팅 완료 요청 구조"""
    model: str = Field(..., description="사용할 모델 ID")
    messages: List[ChatMessage] = Field(..., description="대화를 구성하는 메시지 목록")
    temperature: Optional[float] = Field(default=1.0, description="샘플링 온도")
    top_p: Optional[float] = Field(default=1.0, description="Top-p 샘플링")
    n: Optional[int] = Field(default=1, description="생성할 답변의 수")
    stream: Optional[bool] = Field(default=False, description="스트리밍 여부")
    stop: Optional[Any] = Field(default=None, description="생성 중단 시퀀스")
    max_tokens: Optional[int] = Field(default=None, description="최대 생성 토큰 수")
    presence_penalty: Optional[float] = Field(default=0.0, description="존재 패널티")
    frequency_penalty: Optional[float] = Field(default=0.0, description="빈도 패널티")
    user: Optional[str] = Field(default=None, description="사용자 식별자")
    response_format: Optional[dict] = Field(default=None, description="응답 형식 (json_schema 등)")

class ChatCompletionChoice(BaseModel):
    """채팅 완료 응답의 선택지 구조"""
    index: int
    message: ChatMessage
    finish_reason: Optional[str] = None

class Usage(BaseModel):
    """토큰 사용량 정보"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatCompletionResponse(BaseModel):
    """OpenAI API 호환 채팅 완료 응답 구조"""
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: Usage

# --- Wine Information Structured Schemas ---

class WineInfo(BaseModel):
    """와인 정보 구조화 스키마"""
    winery: str = Field(..., alias="Winery", description="와이너리 명칭")
    wine_name: str = Field(..., alias="WineName", description="와인 이름")
    vintage: str = Field(..., alias="Vintage", description="생산 연도 (빈티지)")

class WineStructuredResponse(BaseModel):
    """구조화된 와인 정보 응답 스키마"""
    wines: List[WineInfo] = Field(..., description="추출된 와인 정보 목록")
