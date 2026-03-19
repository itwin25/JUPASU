from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal

# --- Configuration Settings ---
# Pydantic Settings를 사용하여 환경 변수와 .env 파일을 관리합니다.
class Settings(BaseSettings):
    """
    애플리케이션의 모든 설정을 관리하는 클래스입니다.
    기본값(Default)을 정의하며, .env 파일이나 OS 환경 변수에 값이 있으면 해당 값이 우선 적용됩니다.
    """
    APP_NAME: str = "Jupasu AI Server"
    APP_ENV: str = "development"
    DEBUG: bool = True
    INTERNAL_API_KEY: str = "dev-secret-key"
    
    # LLM Provider: 'local' (vLLM/Ollama OpenAI API) 또는 'gemini' (Google 상용 모델)
    LLM_PROVIDER: Literal["local", "gemini"] = "local"
    
    # Remote GPU Server (vLLM) Config
    # 대여받은 H200 GPU 서버의 IP와 포트(기본 8000)를 설정합니다.
    VLLM_API_URL: str = "http://your-gpu-server-ip:8000/v1"

    # LLM API Base URL (OpenAI API Compatible)
    LLM_API_BASE_URL: str = "http://70.12.130.111:8000/v1"
    
    # 사용할 모델명 (vLLM 서버 기동 시 설정한 --served-model-name과 일치해야 함)
    VLLM_MODEL_NAME: str = "selected-model-name-later"
    
    # Gemini Config (Google Cloud용)
    GOOGLE_API_KEY: str | None = None
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"  # 제미나이 최신 모델 (2.5 버전)

    # LangSmith Config (추론 과정 시각화 및 디버깅 도구)
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "Jupasu"
    
    # OCR Config (TrOCR 모델 설정)
    OCR_MODEL_NAME: str = "microsoft/trocr-base-handwritten"
    
    # [핵심] Pydantic이 .env 파일을 찾아서 읽어오도록 지시하는 설정입니다.
    # env_file=".env": 현재 디렉토리의 .env 파일을 읽음
    # extra="ignore": 클래스에 정의되지 않은 변수가 .env에 있어도 에러를 내지 않음
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# 설정 객체를 싱글톤처럼 관리하기 위해 캐싱합니다. (반복해서 파일을 읽지 않음)
@lru_cache()
def get_settings():
    """
    설정 객체를 반환하는 팩토리 함수입니다.
    최초 호출 시 .env 파일을 읽어 Settings 객체를 생성하고, 이후에는 캐시된 객체를 반환합니다.
    """
    settings = Settings()
    
    # [중요] LangChain 라이브러리 연동 로직
    # LangChain은 자체적으로 OS 환경 변수(os.environ)를 직접 참조하기 때문에,
    # 우리가 .env에서 읽어온 설정값을 OS 환경 변수에 강제로 주입(Relay)해 주는 과정입니다.
    import os
    if settings.LANGSMITH_TRACING:
        # LangChain이 인식하는 표준 환경 변수명으로 매핑하여 주입
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
        if settings.LANGSMITH_API_KEY:
            os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        
    return settings
