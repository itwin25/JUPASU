import logging
from typing import Any, List, Optional, Type, Dict, Union

from google import genai
from google.genai import types
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    HumanMessage,
    SystemMessage,
)
from langchain_core.outputs import ChatResult, ChatGeneration, ChatGenerationChunk
from langchain_core.runnables import Runnable
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class GmsMultiTurnGoogleGenAI(BaseChatModel):
    """
    멀티턴 대화와 시스템 지시문을 완벽하게 지원하는 
    고도화된 GMS용 LangChain 커스텀 모델 클래스 (v2)
    """
    api_key: str
    model_name: str = "gemini-2.5-flash-lite"
    base_url: str = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com"
    max_output_tokens: Optional[int] = 1024
    
    _client: Any = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._client = genai.Client(
            api_key=self.api_key,
            http_options={"base_url": self.base_url}
        )

    def _convert_messages_to_sdk_format(self, messages: List[BaseMessage]):
        """LangChain 메시지 리스트를 Google GenAI SDK 규격으로 변환"""
        contents = []
        system_instruction = None

        for msg in messages:
            if isinstance(msg, SystemMessage):
                # 시스템 메시지는 별도 파라미터로 분리
                system_instruction = msg.content
            elif isinstance(msg, HumanMessage):
                contents.append({"role": "user", "parts": [{"text": msg.content}]})
            elif isinstance(msg, AIMessage):
                contents.append({"role": "model", "parts": [{"text": msg.content}]})
            else:
                # 기타 메시지 타입(FunctionMessage 등)은 user로 처리하거나 무시
                role = "user" if msg.type == "human" else "model"
                contents.append({"role": role, "parts": [{"text": msg.content}]})

        return contents, system_instruction

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        # 1. 메시지 변환 및 시스템 지시문 추출
        contents, system_instruction = self._convert_messages_to_sdk_format(messages)
        
        # 2. SDK 설정 구성
        gms_config = kwargs.get("gms_config") or {}
        
        # Pydantic 객체나 dict 형태를 GenerateContentConfig로 변환 또는 병합
        config_params = {
            "max_output_tokens": self.max_output_tokens,
            "stop_sequences": stop,
        }
        
        if system_instruction:
            config_params["system_instruction"] = system_instruction
            
        # 기존 gms_config 내용 병합
        if isinstance(gms_config, dict):
            config_params.update(gms_config)
            
        final_config = types.GenerateContentConfig(**config_params)

        # 3. 모델 호출
        response = self._client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=final_config
        )
        
        text = response.text or ""
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])

    async def _astream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ):
        """비동기 스트리밍 지원 (순수 델타 스트리밍)"""
        contents, system_instruction = self._convert_messages_to_sdk_format(messages)
        
        config_params = {
            "max_output_tokens": self.max_output_tokens,
            "stop_sequences": stop,
        }
        if system_instruction:
            config_params["system_instruction"] = system_instruction
            
        gms_config = kwargs.get("gms_config") or {}
        if isinstance(gms_config, dict):
            config_params.update(gms_config)
            
        final_config = types.GenerateContentConfig(**config_params)

        stream = await self._client.aio.models.generate_content_stream(
            model=self.model_name,
            contents=contents,
            config=final_config
        )

        # [마중물 전송] 첫 토큰이 잘리는 현상을 방지하기 위해 빈 공백 하나를 먼저 내보냅니다.
        yield ChatGenerationChunk(message=AIMessageChunk(content=" "))

        async for chunk in stream:
            # Google GenAI SDK는 기본적으로 델타(새로 생성된 텍스트)를 제공합니다.
            # 누적 비교 로직을 넣으면 오히려 텍스트가 유실됩니다.
            try:
                chunk_text = chunk.text
                if chunk_text:
                    yield ChatGenerationChunk(message=AIMessageChunk(content=chunk_text))
            except Exception:
                # text 속성 접근 에러 시 candidates 직접 참조
                if chunk.candidates and chunk.candidates[0].content.parts:
                    part_text = chunk.candidates[0].content.parts[0].text
                    if part_text:
                        yield ChatGenerationChunk(message=AIMessageChunk(content=part_text))

    def with_structured_output(
        self,
        schema: Union[Dict, Type[BaseModel]],
        **kwargs: Any,
    ) -> Runnable:
        from langchain_core.output_parsers import JsonOutputParser
        
        llm_with_config = self.bind(
            gms_config={
                "response_mime_type": "application/json",
                "response_schema": schema if isinstance(schema, dict) else schema.model_json_schema()
            }
        )
        return llm_with_config | JsonOutputParser(pydantic_object=schema)

    @property
    def _llm_type(self) -> str:
        return "gms-multi-turn-google-genai"
