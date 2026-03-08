from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal

# LangChain Imports
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel

# --- Configuration Settings ---
class Settings(BaseSettings):
    APP_NAME: str = "Jupasu AI Server"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # LLM Provider: 'local' (vLLM/Ollama OpenAI API) or 'gemini'
    LLM_PROVIDER: Literal["local", "gemini"] = "local"
    
    # Local vLLM Config (OpenAI-compatible)
    VLLM_API_URL: str = "http://localhost:8000/v1"
    VLLM_MODEL_NAME: str = "my-local-model"
    
    # Gemini Config
    GOOGLE_API_KEY: str | None = None
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash" # 제미나이 최신 모델

    # LangSmith Config (Tracing & Debugging)
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "jupasu-ai-project"
    
    # .env 파일을 자동으로 읽어오도록 설정
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    settings = Settings()
    
    # LangSmith 설정을 환경 변수에 주입 (LangChain이 자동으로 이를 참조함)
    import os
    if settings.LANGSMITH_TRACING:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
        if settings.LANGSMITH_API_KEY:
            os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        
    return settings

# --- LLM Factory ---
def get_llm() -> BaseChatModel:
    """설정에 따라 적절한 LangChain LLM 객체를 반환합니다."""
    settings = get_settings()
    
    if settings.LLM_PROVIDER == "local":
        # vLLM은 OpenAI API 규격을 따르므로 ChatOpenAI를 사용합니다.
        return ChatOpenAI(
            model=settings.VLLM_MODEL_NAME,
            openai_api_base=settings.VLLM_API_URL,
            openai_api_key="EMPTY", # 로컬 서버는 키가 필요 없음
            temperature=0
        )
    elif settings.LLM_PROVIDER == "gemini":
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0
        )
    else:
        raise ValueError(f"지원하지 않는 LLM Provider입니다: {settings.LLM_PROVIDER}")

# --- App Instance ---
# 여기서 정의한 'app' 변수명이 uvicorn 실행 시 사용하는 ':app'의 대상이 됩니다.
app = FastAPI(title=get_settings().APP_NAME)

class LLMRequest(BaseModel):
    prompt: str

class LLMResponse(BaseModel):
    answer: str

@app.get("/health")
def health_check():
    return {"status": "ok", "provider": get_settings().LLM_PROVIDER}

@app.post("/ai/chat", response_model=LLMResponse)
async def chat(request: LLMRequest):
    # 공통 인터페이스인 invoke를 사용하여 어떤 모델이든 동일하게 처리 가능
    llm = get_llm()
    response = await llm.ainvoke(request.prompt)
    
    return {"answer": response.content}

if __name__ == "__main__":
    import uvicorn
    # uvicorn 실행 설정:
    # "main:app" -> main.py 파일(module) 내의 app 객체(variable)를 찾아 실행함
    # host="0.0.0.0" -> 외부(다른 기기)에서도 이 서버에 접속할 수 있도록 허용
    # port=8000 -> 8000번 포트로 서버를 개방
    # reload=True -> 소스 코드가 수정되면 서버를 자동으로 다시 시작 (개발 시 유용)
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) # 8000은 vLLM이 쓸 수 있으므로 8001로 변경
