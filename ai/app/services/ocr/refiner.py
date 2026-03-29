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


# --- 텍스트 전처리 및 정제 유틸리티 ---
def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()

def _dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = _normalize_whitespace(value)
        if not normalized:
            continue
        key = normalized.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result

def _clean_menu_list(values: list[str]) -> list[str]:
    """메뉴 리스트에서 파편화된 중복 단어를 제거합니다. (예: '감바스' 제거, '감바스 알 아히요' 보존)"""
    unique_values = _dedupe_preserve_order(values)
    if len(unique_values) <= 1:
        return unique_values

    to_remove = set()
    # 모든 쌍을 비교하여 포괄 관계 확인
    for i, word_a in enumerate(unique_values):
        for j, word_b in enumerate(unique_values):
            if i == j: continue
            
            # 공백을 제거하고 비교하여 포함 여부 확인
            a_clean = word_a.replace(" ", "").casefold()
            b_clean = word_b.replace(" ", "").casefold()
            
            # word_a가 word_b에 포함되어 있고, word_b가 더 길다면 word_a는 파편임
            if a_clean in b_clean and len(b_clean) > len(a_clean):
                to_remove.add(word_a)
                break
                
    return [v for v in unique_values if v not in to_remove]

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
        
        # 3. 상세 설명조의 문구 필터링
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
        OCR 텍스트를 LLM을 통해 정제하고 지능적으로 교정하여 구조화된 데이터를 추출합니다.
        """
        try:
            llm = get_llm()
            cleaned_text = _clean_ocr_text(ocr_text)
            
            if not is_menu:
                # 1. 와인 라벨 정제 (오타 교정 능력 강화)
                structured_llm = llm.with_structured_output(WineInfo)
                system_prompt = """당신은 와인 라벨 OCR 텍스트를 정제하는 세계 최고의 소믈리에 전문가입니다.
[임무]
1. 불완전한 OCR 텍스트를 분석하여 정확한 와이너리, 와인 이름, 빈티지를 추론하세요.
2. 명백한 오타는 상식에 맞게 교정하세요. (예: 'Chateu' -> 'Chateau', 'Margux' -> 'Margaux')
3. 가격이나 불필요한 기호는 무시하고 오직 와인 정보에만 집중하세요.
"""
                user_prompt = f"다음 OCR 텍스트에서 가장 정확한 와인 정보를 추출하고 교정해줘:\n\n{cleaned_text}"
                
                result = await structured_llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                
                refined = result if isinstance(result, dict) else result.model_dump()
                
                if refined.get("vintage") and not re.match(r'^\d{4}$', str(refined["vintage"])):
                    refined["vintage"] = "N/A"
                return refined

            else:
                # 2. 메뉴판 정제 (지능형 필터링 및 오타 교정 강화)
                structured_llm = llm.with_structured_output(MenuInfo)
                system_prompt = """당신은 식당 메뉴판의 지저분한 OCR 텍스트를 읽고, 실제 주문 가능한 메뉴 리스트를 완벽하게 복원하는 미식 전문가입니다.

[핵심 원칙]
1. 오타 교정: OCR 과정에서 발생한 한글/영문 오타를 문맥에 맞게 지능적으로 수정하세요.
   - 예: "식슈카" -> "샥슈카", "앤어스테이크" -> "연어 스테이크", "트러플 명란구어" -> "트러플 명란구이"
2. 순수 이름 추출: 수식어나 상세 설명은 과감히 버리고 메뉴의 '이름'만 남기세요.
   - 예: "신선한 토마토로 만든 샥슈카" -> "샥슈카"
3. 엄격한 필터링: 주문할 수 없는 카테고리 제목이나 일반 명사는 리스트에서 제외하세요.
   - 제외 대상: "안주", "요리", "추천 메뉴", "WINE LIST", "음식 목록" 등
4. 중복 및 파편화 방지: "감바스"와 "감바스 알 아히요"가 있다면 가장 완전한 이름인 "감바스 알 아히요" 하나만 리스트에 넣으세요.

[분류 기준]
- wineNames: 레드, 화이트, 스파클링 등 모든 와인 제품명.
- foodNames: 와인을 제외한 모든 메인 요리, 안주, 사이드 메뉴의 이름.
"""
                user_prompt = f"다음 정제되지 않은 메뉴판 텍스트에서 실제 메뉴 이름들만 골라 오타를 수정하고 분류해줘:\n\n{cleaned_text}"
                
                result = await structured_llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])

                refined = result if isinstance(result, dict) else result.model_dump()

                # 결과 리스트 후처리 (로직 기반 중복 제거로 한 번 더 검증)
                refined["wineNames"] = _clean_menu_list(refined.get("wineNames", []))
                refined["foodNames"] = _clean_menu_list(refined.get("foodNames", []))

                if not refined.get("wineNames"):
                    fallback = _get_local_fallback(ocr_text)
                    if fallback["wineNames"]:
                        refined["wineNames"] = _clean_menu_list(list(set(refined.get("wineNames", []) + fallback["wineNames"])))
                
                return refined

        except Exception as e:
            logger.error(f"Error during OCR refinement: {e}")
            if not is_menu:
                return {"winery": "", "wineName": "", "vintage": ""}
            return {"wineNames": [], "foodNames": []}

# 싱글톤 인스턴스
ocr_refiner = OCRRefiner()
