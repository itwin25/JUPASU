from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel, Field
from PIL import Image
import io
import time
import json
import logging
from typing import List, Optional
from logging.handlers import RotatingFileHandler

# Core & Services
from core.config import get_settings
from services.llm.factory import get_llm
from services.ocr.engine import ocr_engine
from services.sommelier.sommelier_agent import sommelier_agent

from prometheus_fastapi_instrumentator import Instrumentator


# --- Advanced Performance Logger Setup ---
perf_logger = logging.getLogger("ai_performance")
perf_logger.setLevel(logging.INFO)
perf_logger.propagate = False

if not perf_logger.handlers:
    perf_handler = RotatingFileHandler("logs/ai_performance.log", maxBytes=10*1024*1024, backupCount=10)
    perf_handler.setFormatter(logging.Formatter('%(message)s'))
    perf_logger.addHandler(perf_handler)

def log_performance_meta(
    prompt: str, 
    response_content: str = "", 
    duration: float = 0, 
    status: str = "success", 
    error_msg: str = None,
    session_id: str = "default",
    usage_metadata: any = None
):
    """최종 진화형 AI 트랜잭션 로깅 함수."""
    settings = get_settings()
    log_entry = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "session_id": session_id,
        "status": status,
        "provider": settings.LLM_PROVIDER,
        "model": settings.GEMINI_MODEL_NAME if settings.LLM_PROVIDER == "gemini" else settings.VLLM_MODEL_NAME,
        "performance": {
            "duration_sec": round(duration, 3),
            "input_len": len(prompt),
            "output_len": len(response_content),
            "token_usage": usage_metadata or "N/A"
        },
        "error_detail": error_msg
    }
    perf_logger.info(json.dumps(log_entry, ensure_ascii=False))

# --- App Instance ---
app = FastAPI(title=get_settings().APP_NAME)
Instrumentator().instrument(app).expose(app)

class ChatRequest(BaseModel):
    user_query: str = Field(..., description="사용자의 질문 또는 명령")
    ocr_text: Optional[str] = Field(default=None, description="메뉴판 이미지에서 추출된 전처리 텍스트")
    user_id: str = Field(default="guest-user")
    friend_ids: List[str] = Field(default=[])
    session_id: str = Field(default="session-123")

class ChatResponse(BaseModel):
    answer: str

@app.get("/health")
def health_check():
    return {"status": "ok", "agent": "Wine Sommelier Agent Active"}

@app.on_event("startup")
async def startup():
    pass

@app.post("/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    구조화된 입력을 받는 통합 AI 에이전트 엔드포인트.
    질문과 OCR 텍스트를 분리하여 더 정확한 분석을 수행합니다.
    """
    start_time = time.time()
    
    # 1. 그래프 상태 초기화 (구조화된 입력 반영)
    initial_state = {
        "user_query": request.user_query,
        "ocr_text": request.ocr_text,
        "user_id": request.user_id,
        "friend_ids": request.friend_ids,
        "tasks": [],
        "retry_count": 0,
        "friends_preferences": [],
        "wine_details": []
    }
    
    try:
        # 2. Sommelier Agent 실행
        result = await sommelier_agent.ainvoke(initial_state)
        duration = time.time() - start_time
        
        answer = result.get("final_recommendation", "죄송합니다. 답변을 생성하지 못했습니다.")
        
        # 3. 로깅 (user_query 기반)
        log_performance_meta(
            prompt=request.user_query[:50],
            response_content=answer,
            duration=duration,
            status="success",
            session_id=request.session_id
        )
        
        return {"answer": answer}
        
    except Exception as e:
        duration = time.time() - start_time
        log_performance_meta(
            prompt=request.user_query[:50],
            duration=duration,
            status="error",
            error_msg=str(e),
            session_id=request.session_id
        )
        return {"answer": f"에이전트 오류 발생: {str(e)}"}

@app.post("/ai/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """이미지 전처리가 서버에서 필요한 경우를 위한 백업 엔드포인트."""
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    text = ocr_engine.recognize(image)
    return {"text": text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
