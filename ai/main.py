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

@app.post("/ai/chat", response_model=LLMResponse)
async def chat(request: LLMRequest):
    llm = get_llm()
    response = await llm.ainvoke(request.prompt)
    return {"answer": response.content}

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
