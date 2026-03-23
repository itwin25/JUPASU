from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal

# --- Configuration Settings ---
class Settings(BaseSettings):
    """
    애플리케이션의 모든 설정을 관리하는 클래스입니다.
    """
    APP_NAME: str = "Jupasu AI Server"
    APP_ENV: str = "development"
    DEBUG: bool = True
    INTERNAL_API_KEY: str = "dev-secret-key"
    
    # LLM Provider: 'local', 'gemini', 'gms' 또는 'gms-sdk'
    LLM_PROVIDER: Literal["local", "gemini", "gms", "gms-sdk"] = "gms-sdk"
    
    # Remote GPU Server (local 사용 시)
    LLM_API_BASE_URL: str = "http://localhost:8000/v1"
    LLM_MODEL_NAME: str = "selected-model-name-later"
    
    # Gemini Config
    GOOGLE_API_KEY: str | None = None
    GMS_API_KEY: str | None = None  # SSAFY GMS용 키 추가
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash-lite"

    # LangSmith Config
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "Jupasu"
    
    # OCR Config (비활성화 상태)
    OCR_MODEL_NAME: str = "microsoft/trocr-base-handwritten"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    settings = Settings()
    
    import os
    if settings.LANGSMITH_TRACING:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
        if settings.LANGSMITH_API_KEY:
            os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        
    return settings
