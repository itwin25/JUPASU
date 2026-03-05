from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# --- Configuration Settings ---
class Settings(BaseSettings):
    APP_NAME: str = "Jupasu AI Server"
    APP_ENV: str = "development"
    DEBUG: bool = True
    GPU_SERVER_URL: str = "http://localhost:11434/api/generate"
    LLM_MODEL_NAME: str = "llama3"
    OPENAI_API_KEY: str | None = None
    
    # .env 파일을 자동으로 읽어오도록 설정
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()

# --- App Instance ---
app = FastAPI(title=get_settings().APP_NAME)

class LLMRequest(BaseModel):
    prompt: str

class LLMResponse(BaseModel):
    answer: str

@app.get("/health")
def health_check():
    return {"status": "ok", "env": get_settings().APP_ENV}

@app.post("/ai/chat", response_model=LLMResponse)
async def chat(request: LLMRequest):
    settings = get_settings()
    # TODO: settings.GPU_SERVER_URL 등을 활용하여 추론 요청 로직 구현
    return {"answer": f"Echo in {settings.APP_ENV} mode: {request.prompt}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
