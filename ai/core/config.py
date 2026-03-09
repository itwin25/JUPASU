from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal

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
    GEMINI_MODEL_NAME: str = "gemini-2.0-flash"

    # LangSmith Config (Tracing & Debugging)
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "jupasu-ai-project"
    
    # OCR Config
    OCR_MODEL_NAME: str = "microsoft/trocr-base-handwritten"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    settings = Settings()
    
    # LangSmith 설정을 환경 변수에 주입
    import os
    if settings.LANGSMITH_TRACING:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
        if settings.LANGSMITH_API_KEY:
            os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        
    return settings
