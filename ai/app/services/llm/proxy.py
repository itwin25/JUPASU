import httpx
import json
from typing import AsyncGenerator
from app.core.config import get_settings

settings = get_settings()

class SglangProxy:
    """
    sglang 서버로 직접 요청을 전달하거나 스트리밍을 중계하는 프록시 클래스
    """
    def __init__(self):
        self.base_url = settings.LLM_API_BASE_URL

    async def chat_completions(self, payload: dict) -> dict:
        """
        비스트리밍 요청을 sglang 서버로 전달
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()

    async def chat_completions_stream(self, payload: dict) -> AsyncGenerator[str, None]:
        """
        스트리밍 요청을 sglang 서버로 전달하고 OpenAI SSE 규격으로 변환
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    
                    # sglang의 응답이 이미 OpenAI 규격을 따를 가능성이 높지만,
                    # 명시적으로 변환 로직이 필요한 경우 여기서 처리합니다.
                    # 여기서는 받은 그대로 (OpenAI 규격이라고 가정) 혹은 재구성하여 반환합니다.
                    if line.startswith("data: "):
                        yield f"{line}\n\n"
                    elif line == "data: [DONE]":
                        yield "data: [DONE]\n\n"

sglang_proxy = SglangProxy()
