import logging
import re
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.config import get_settings
from app.services.llm.factory import get_llm

logger = logging.getLogger(__name__)

# --- 프론트엔드 요구 양식에 맞춘 Pydantic 모델 ---
class WineInfo(BaseModel):
    winery: str = Field(description="와이너리 또는 제조사 이름")
    wineName: str = Field(description="와인의 정식 이름")
    vintage: str = Field(description="생산 연도 (숫자 4자리, 없으면 빈 문자열)")

class MenuInfo(BaseModel):
    wineNames: list[str] = Field(default=[], description="메뉴판에서 추출된 와인 이름 리스트")
    foodNames: list[str] = Field(default=[], description="메뉴판에서 추출된 음식/안주 이름 리스트")

class OCRRefiner:
    def __init__(self):
        self.settings = get_settings()

    async def refine_wine_info(self, ocr_text: str, is_menu: bool = False) -> Dict[str, Any]:
        """
        OCR 텍스트를 LLM을 통해 정제하여 구조화된 JSON으로 반환합니다.
        """
        try:
            llm = get_llm()
            
            if not is_menu:
                # 1. 와인 라벨 정제
                structured_llm = llm.with_structured_output(WineInfo)
                system_prompt = "너는 와인 라벨 OCR 텍스트에서 와이너리, 와인 이름, 생산 연도를 추출하는 전문가야."
                user_prompt = f"다음 OCR 텍스트에서 정보를 추출해줘:\n\n{ocr_text}"
                
                result = await structured_llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                
                # 결과가 dict면 그대로 사용, Pydantic 모델이면 model_dump() 호출
                refined = result if isinstance(result, dict) else result.model_dump()
                
                # 빈티지 후처리 (숫자 4자리 검증)
                if refined.get("vintage"):
                    clean_vintage = str(refined["vintage"]).strip()
                    if not re.match(r'^\d{4}$', clean_vintage):
                        refined["vintage"] = "N/A"
                return refined

            else:
                # 2. 메뉴판 정제
                structured_llm = llm.with_structured_output(MenuInfo)
                system_prompt = "너는 식당 메뉴판 OCR 텍스트에서 와인 리스트와 음식 메뉴를 분리하는 전문가야."
                user_prompt = f"다음 메뉴판 텍스트에서 와인(wineNames)과 음식(foodNames)을 구분해줘:\n\n{ocr_text}"
                
                result = await structured_llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                
                return result.model_dump()

        except Exception as e:
            logger.error(f"Error during OCR refinement: {e}")
            if not is_menu:
                return {"winery": "", "wineName": "", "vintage": ""}
            return {"wineNames": [], "foodNames": []}

# 싱글톤 인스턴스
ocr_refiner = OCRRefiner()
