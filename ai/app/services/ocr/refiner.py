import logging
import re
from typing import Dict, Any
from pydantic import BaseModel, Field
from app.core.config import get_settings
from app.services.llm.factory import get_llm

logger = logging.getLogger(__name__)

# --- 데이터 모델 정의 ---
class WineInfo(BaseModel):
    winery: str = Field(description="와이너리 또는 제조사 이름")
    wineName: str = Field(description="와인의 정식 이름")
    vintage: str = Field(description="생산 연도 (숫자 4자리, 없으면 빈 문자열)")

class MenuInfo(BaseModel):
    wineNames: list[str] = Field(default=[], description="메뉴판에서 추출된 와인 이름 리스트")
    foodNames: list[str] = Field(default=[], description="메뉴판에서 추출된 음식/안주 이름 리스트")


# --- 텍스트 전처리 유틸리티 ---
def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()

def _clean_ocr_text(text: str) -> str:
    """OCR 원문에서 가격, 용량, 설명글 노이즈를 제거하여 LLM의 가독성을 높입니다."""
    lines = re.split(r"[\n\r,;]+", text or "")
    cleaned_lines = []
    
    for line in lines:
        # 1. 가격 패턴 제거
        if not re.fullmatch(r"\b(19|20)\d{2}\b", line.strip()):
            line = re.sub(r"[₩\\$]?\d{1,3}(,\d{3})*(\.\d+)?", "", line)
            
        # 2. 용량 및 단위 제거
        line = re.sub(r"\d+(\s?ml|%)", "", line, flags=re.IGNORECASE)
        line = re.sub(r"\b(Glass|Bottle|Gl|Bt|G|B)\b", "", line, flags=re.IGNORECASE)
        
        # 3. 상세 설명조의 문구 필터링 (길이가 길면서 특정 단어 포함 시 제외)
        if re.search(r"(하여|함께|드리는|즐기는|사용하여|입힌|만든|어우러진|조화로운|신선한|풍미)", line):
            if len(line) > 15: continue

        line = re.sub(r"[:;,\-_.|]", " ", line)
        cleaned = _normalize_whitespace(line)
        
        # 이름 치고 너무 짧거나 긴 것은 제외
        if cleaned and 1 < len(cleaned) < 40:
            cleaned_lines.append(cleaned)
            
    return "\n".join(cleaned_lines)


# --- 와인 분류용 최소 키워드 (Fallback용) ---
WINE_MIN_KEYWORDS = [
    "샤또", "도메인", "까베르네", "쇼비뇽", "말벡", "쉬라즈", "레드", "화이트", "스파클링", "샴페인",
    "Chateau", "Domaine", "Sauvignon", "Cabernet", "Shiraz", "Merlot", "Malbec"
]

def _get_local_fallback(text: str) -> Dict[str, Any]:
    """LLM 결과가 부실할 때 사용할 로컬 분류기"""
    lines = _clean_ocr_text(text).split("\n")
    wines = []
    foods = []
    for line in lines:
        if any(kw.lower() in line.lower() for kw in WINE_MIN_KEYWORDS):
            wines.append(line)
        elif re.search(r"[가-힣A-Za-z]", line):
            foods.append(line)
    return {"wineNames": wines, "foodNames": foods}


class OCRRefiner:
    def __init__(self):
        self.settings = get_settings()

    async def refine_wine_info(self, ocr_text: str, is_menu: bool = False) -> Dict[str, Any]:
        """
        OCR 텍스트를 전처리한 후 LLM을 통해 구조화된 데이터를 추출합니다.
        """
        try:
            llm = get_llm()
            cleaned_text = _clean_ocr_text(ocr_text)
            
            if not is_menu:
                # 1. 와인 라벨 정제
                structured_llm = llm.with_structured_output(WineInfo)
                system_prompt = "너는 와인 라벨 OCR 텍스트에서 와이너리, 와인 이름, 생산 연도를 추출하는 전문가야."
                user_prompt = f"다음 OCR 텍스트에서 정보를 추출해줘:\n\n{cleaned_text}"
                
                result = await structured_llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                
                refined = result if isinstance(result, dict) else result.model_dump()
                
                if refined.get("vintage") and not re.match(r'^\d{4}$', str(refined["vintage"])):
                    refined["vintage"] = "N/A"
                return refined

            else:
                # 2. 메뉴판 정제 (전문가 지침 강화)
                structured_llm = llm.with_structured_output(MenuInfo)
                system_prompt = """당신은 식당 메뉴판 OCR 텍스트에서 와인 리스트와 음식 메뉴를 완벽하게 분리하는 전문가입니다.

[핵심 지침]
1. 와인(wineNames): 한국어/영어 와인 이름. (와이너리, 품종, 빈티지 포함). 가격/용량/점수는 절대 포함하지 마세요.
2. 음식(foodNames): 
   - **오직 메뉴의 '이름'만 추출하세요.**
   - "~를 사용하여 만든", "~와 잘 어울리는" 같은 **상세 설명이나 문장은 절대 포함하지 마세요.**
   - 예: "노르웨이산 연어로 만든 스테이크" -> "연어 스테이크"
3. 누락 방지: 메뉴판에 있는 실제 판매 메뉴들을 최대한 찾아내세요.
4. 노이즈 제거: 원산지 정보, 페이지 번호, 제목은 무시하세요.
"""
                user_prompt = f"다음 정제된 메뉴판 텍스트에서 '이름'만 골라 와인(wineNames)과 음식(foodNames)으로 분류해줘:\n\n{cleaned_text}"
                
                result = await structured_llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])

                refined = result if isinstance(result, dict) else result.model_dump()

                # Fallback: LLM이 와인을 하나도 못 찾았는데 원문에 와인 키워드가 있는 경우 보완
                if not refined.get("wineNames"):
                    fallback = _get_local_fallback(ocr_text)
                    if fallback["wineNames"]:
                        refined["wineNames"] = list(set(refined.get("wineNames", []) + fallback["wineNames"]))
                
                return refined

        except Exception as e:
            logger.error(f"Error during OCR refinement: {e}")
            if not is_menu:
                return {"winery": "", "wineName": "", "vintage": ""}
            return {"wineNames": [], "foodNames": []}

# 싱글톤 인스턴스
ocr_refiner = OCRRefiner()
