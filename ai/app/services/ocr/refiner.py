import httpx
import json
import logging
import re
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class OCRRefiner:
    def __init__(self):
        self.settings = get_settings()
        self.api_url = f"{self.settings.LLM_API_BASE_URL}/chat/completions"

    async def refine_wine_info(self, ocr_text: str, is_menu: bool = False) -> dict:
        """
        OCR 텍스트를 LLM(sglang/vLLM)을 통해 정제하여 프론트엔드 규격에 맞게 반환합니다.
        """
        # 프론트엔드(ocr.action.ts)와 동일한 시스템 및 사용자 프롬프트 구성
        system_content = '너는 와인 라벨 OCR 텍스트에서 와이너리, 와인 이름, 생산 연도를 추출하여 JSON으로 변환하는 전문가야.'
        user_content = f"다음은 와인 라벨에서 추출된 텍스트들이야. 이 정보들 중에서 와이너리(제조사), 와인 이름, 빈티지(생산 연도)를 찾아줘.\n\n[OCR Text]\n{ocr_text}"
        
        if is_menu:
            system_content = '너는 식당 메뉴판 OCR 텍스트에서 와인 리스트와 음식 메뉴를 분리하여 JSON으로 변환하는 전문가야.'
            user_content = f"다음은 메뉴판에서 추출된 텍스트들이야. 이 중에서 와인 이름들과 음식 이름들을 구분해서 리스트로 만들어줘.\n\n[OCR Text]\n{ocr_text}"

        # 프론트엔드 response_format과 동일한 구조 (sglang/vLLM 지원 규격)
        if not is_menu:
            json_schema = {
                "type": "object",
                "properties": {
                    "winery": {"type": "string", "description": "와이너리 또는 제조사 이름"},
                    "wine_name": {"type": "string", "description": "와인의 정식 이름"},
                    "vintage": {"type": "string", "description": "생산 연도 (숫자 4자리)"}
                },
                "required": ["winery", "wine_name", "vintage"]
            }
        else:
            json_schema = {
                "type": "object",
                "properties": {
                    "wine_names": {"type": "array", "items": {"type": "string"}},
                    "food_names": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["wine_names", "food_names"]
            }

        async with httpx.AsyncClient() as client:
            try:
                # sglang의 guided_json 기능을 활용하여 구조화된 응답 강제
                payload = {
                    "model": self.settings.LLM_MODEL_NAME,
                    "messages": [
                        {"role": "system", "content": system_content},
                        {"role": "user", "content": user_content}
                    ],
                    "temperature": 0,
                    "extra_body": {
                        "guided_json": json_schema
                    }
                }
                
                response = await client.post(self.api_url, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                
                # sglang/vLLM은 message content에 JSON 문자열을 담아 반환함
                content = result["choices"][0]["message"]["content"]
                refined = json.loads(content) if isinstance(content, str) else content
                
                # 프론트엔드와 동일한 vintage 후처리 (숫자만 허용)
                if not is_menu and refined.get("vintage"):
                    clean_vintage = str(refined["vintage"]).strip()
                    if not re.match(r'^\d+$', clean_vintage):
                        refined["vintage"] = ""
                
                return refined
                
            except Exception as e:
                logger.error(f"Error during OCR refinement: {e}")
                if not is_menu:
                    return {"winery": "", "wineName": "", "vintage": ""}
                return {"wines": [], "foods": []}

# 싱글톤 인스턴스
ocr_refiner = OCRRefiner()
