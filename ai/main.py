from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from PIL import Image
import io

# Core & Services
from core.config import get_settings
from services.llm.factory import get_llm
from services.ocr.engine import ocr_engine

# --- App Instance ---
app = FastAPI(title=get_settings().APP_NAME)

class LLMRequest(BaseModel):
    prompt: str

class LLMResponse(BaseModel):
    answer: str

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "provider": get_settings().LLM_PROVIDER,
        "ocr_model": get_settings().OCR_MODEL_NAME
    }

from langchain_core.prompts import ChatPromptTemplate

@app.post("/ai/chat", response_model=LLMResponse)
async def chat(request: LLMRequest):
    """
    제미나이를 통한 싱글턴(Single-turn) 대화 구현 엔드포인트입니다.
    이전 대화 맥락을 유지하지 않고 독립적인 질의응답을 수행합니다.
    """
    settings = get_settings()
    llm = get_llm()
    
    # 1. 프롬프트 템플릿 정의 (시스템 역할 부여)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "당신은 SSAFY 팀 프로젝트 '주파수'의 유능한 AI 어시스턴트입니다. 친절하고 전문적으로 답변해 주세요."),
        ("user", "{input}")
    ])
    
    # 2. LCEL(LangChain Expression Language) 체인 생성
    chain = prompt | llm
    
    # 3. 비동기 호출 및 결과 반환
    try:
        response = await chain.ainvoke({"input": request.prompt})
        return {"answer": response.content}
    except Exception as e:
        return {"answer": f"Gemini 호출 중 오류가 발생했습니다: {str(e)}"}

@app.post("/ai/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """이미지 파일을 업로드받아 텍스트를 추출합니다."""
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # TrOCR 엔진을 통해 텍스트 인식
    text = ocr_engine.recognize(image)
    
    return {"text": text}

if __name__ == "__main__":
    import uvicorn
    # 8001 포트 사용 (vLLM과 충돌 방지)
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
