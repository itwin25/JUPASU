import os
from typing import Any, List, Optional, Type, Dict, Union
from google import genai
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration
from langchain_core.runnables import Runnable
from pydantic import BaseModel

class GmsGoogleGenAI(BaseChatModel):
    """
    SSAFY GMS 가이드에 따라 공식 google-genai SDK를 사용하는 
    LangChain 호환 커스텀 모델 클래스입니다.
    """
    api_key: str
    model_name: str = "gemini-2.5-flash-lite"
    base_url: str = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com"
    max_output_tokens: Optional[int] = 1024
    
    _client: Any = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 공식 SDK 클라이언트 초기화 (가이드 내용 반영)
        self._client = genai.Client(
            api_key=self.api_key,
            http_options={"base_url": self.base_url}
        )

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        # 1. 메시지 변환 (LangChain -> Google SDK)
        last_message = messages[-1].content
        
        # 2. 모델 호출용 설정 구성 (기존 gms_config가 있으면 확장)
        gms_config = kwargs.get("gms_config") or {}
        
        # 3. 중요: 생성 토큰 한도 명시적 설정
        # 이 설정을 보고 모델은 답변의 상세도를 스스로 조절함
        if self.max_output_tokens:
            if isinstance(gms_config, dict):
                gms_config["max_output_tokens"] = self.max_output_tokens
            else:
                gms_config = {"max_output_tokens": self.max_output_tokens}
        
        response = self._client.models.generate_content(
            model=self.model_name,
            contents=last_message,
            config=gms_config
        )
        
        text = response.text or ""
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])

    def with_structured_output(
        self,
        schema: Union[Dict, Type[BaseModel]],
        **kwargs: Any,
    ) -> Runnable:
        """
        공식 SDK의 구조화된 출력 기능을 활용합니다.
        """
        from langchain_core.output_parsers import JsonOutputParser
        
        # 내부 충돌 방지를 위해 gms_config라는 이름으로 바인딩
        llm_with_config = self.bind(
            gms_config={
                "response_mime_type": "application/json",
                "response_schema": schema if isinstance(schema, dict) else schema.model_json_schema()
            }
        )
        
        return llm_with_config | JsonOutputParser(pydantic_object=schema)

    @property
    def _llm_type(self) -> str:
        return "gms-google-genai"
