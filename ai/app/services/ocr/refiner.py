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


def _looks_like_noise(value: str) -> bool:
    normalized = _normalize_whitespace(value)
    if not normalized:
        return True
    if len(normalized) <= 1:
        return True
    if re.fullmatch(r"[0-9]{4}", normalized):
        return True
    if re.fullmatch(r"N\.?V\.?", normalized, flags=re.IGNORECASE):
        return True
    if re.fullmatch(r"[0-9.'\"()\-/:& ]+", normalized):
        return True
    return False


def _contains_hangul(value: str) -> bool:
    return bool(re.search(r"[가-힣]", value or ""))


def _extract_menu_candidates_from_text(ocr_text: str) -> Dict[str, Any]:
    raw_lines = re.split(r"[\n\r,;]+", ocr_text or "")
    candidates = [_normalize_whitespace(line) for line in raw_lines]
    candidates = [line for line in candidates if line and not _looks_like_noise(line)]

    food_names: list[str] = []
    wine_names: list[str] = []

    for candidate in candidates:
        if _contains_hangul(candidate):
            food_names.append(candidate)
            continue

        if len(candidate) < 4:
            continue

        if re.search(r"[A-Za-z]", candidate):
            wine_names.append(candidate)

    return {
        "wineNames": _dedupe_preserve_order(wine_names),
        "foodNames": _dedupe_preserve_order(food_names),
    }


def _merge_menu_info(primary: Dict[str, Any] | None, fallback: Dict[str, Any]) -> Dict[str, Any]:
    primary = primary or {}
    wine_names = _dedupe_preserve_order(list(primary.get("wineNames") or []) + list(fallback.get("wineNames") or []))
    food_names = _dedupe_preserve_order(list(primary.get("foodNames") or []) + list(fallback.get("foodNames") or []))
    return {
        "wineNames": wine_names,
        "foodNames": food_names,
    }

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

                refined = result if isinstance(result, dict) else result.model_dump()
                fallback = _extract_menu_candidates_from_text(ocr_text)
                merged = _merge_menu_info(refined, fallback)

                if not merged["wineNames"] and not merged["foodNames"]:
                    logger.warning("Menu OCR refinement returned empty result. OCR text: %s", ocr_text[:500])

                return merged

        except Exception as e:
            logger.error(f"Error during OCR refinement: {e}")
            if not is_menu:
                return {"winery": "", "wineName": "", "vintage": ""}
            return _extract_menu_candidates_from_text(ocr_text)

# 싱글톤 인스턴스
ocr_refiner = OCRRefiner()
