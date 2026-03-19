from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel
from app.core.config import get_settings

from functools import lru_cache

@lru_cache()
def get_llm() -> BaseChatModel:
    """설정에 따라 적절한 LangChain LLM 객체를 반환합니다. (캐싱됨)"""
    settings = get_settings()
    
    if settings.LLM_PROVIDER == "local":
        return ChatOpenAI(
            model=settings.VLLM_MODEL_NAME,
            openai_api_base=settings.LLM_API_BASE_URL,
            openai_api_key="EMPTY",
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
