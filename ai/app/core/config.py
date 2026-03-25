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
    BACKEND_API_BASE_URL: str = "http://localhost:8080"
    BACKEND_INTERNAL_API_KEY: str | None = None
    FOOD_RECOMMENDATION_EMBEDDING_MODEL: str = "text-embedding-3-small"
    FOOD_RECOMMENDATION_EMBEDDING_URL: str = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"
    
    # Gemini Config
    GOOGLE_API_KEY: str | None = None
    GMS_API_KEY: str | None = None  # SSAFY GMS용 키 추가
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash-lite"

    # LangSmith Config
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "Jupasu"
    
    # Database Config (pgvector)
    # docker-compose.yml 기준으로 설정된 기본값. 환경변수(.env)로 덮어쓸 수 있음
    POSTGRES_USER: str = "jupasu_user"
    POSTGRES_PASSWORD: str = "jupasu_pass"
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 15432
    POSTGRES_DB: str = "jupasu"
    @property
    def sync_database_url(self) -> str:
        # DB 연결용 URL을 자동으로 만들어주는 프로퍼티
        return f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # OCR Config (비활성화 상태)
    OCR_MODEL_NAME: str = "microsoft/trocr-base-handwritten"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    settings = Settings()

    if not settings.BACKEND_INTERNAL_API_KEY:
        settings.BACKEND_INTERNAL_API_KEY = settings.INTERNAL_API_KEY
    
    import os
    if settings.LANGSMITH_TRACING:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
        if settings.LANGSMITH_API_KEY:
            os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        
    return settings
