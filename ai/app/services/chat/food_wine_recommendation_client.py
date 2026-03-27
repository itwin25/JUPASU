from __future__ import annotations

import asyncio
import re
from typing import Any

import httpx

from app.core.config import get_settings


FOOD_RECOMMENDATION_CUES = (
    "와인",
    "음식",
    "메뉴",
    "먹을",
    "마실",
    "어울리는",
    "추천",
)


def should_request_food_recommendation(raw_input: str, input_context: dict[str, Any]) -> bool:
    # 메뉴판 스캔 컨텍스트(와인 목록이 있음)는 별도 경로로 처리
    menu_wines = input_context.get("menu_wines") or []
    if menu_wines:
        return False

    normalized_input = (raw_input or "").strip()
    food_text = (input_context.get("food_text") or "").strip()
    menu_foods = input_context.get("menu_foods") or []

    if menu_foods and food_text:
        return True

    if not food_text:
        return False

    return any(cue in normalized_input for cue in FOOD_RECOMMENDATION_CUES)


async def fetch_query_vector(food_text: str) -> str:
    settings = get_settings()
    if not settings.GMS_API_KEY:
        raise ValueError("GMS_API_KEY is required for food recommendation embedding.")

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            settings.FOOD_RECOMMENDATION_EMBEDDING_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.GMS_API_KEY}",
            },
            json={
                "model": settings.FOOD_RECOMMENDATION_EMBEDDING_MODEL,
                "input": food_text,
            },
        )
        response.raise_for_status()
        payload = response.json()
        embedding = payload["data"][0]["embedding"]
        return "[" + ",".join(f"{value:.12f}" for value in embedding) + "]"


async def request_food_wine_recommendation(
    *,
    user_id: str | int,
    food_text: str,
    candidate_limit: int = 20,
) -> dict[str, Any] | None:
    settings = get_settings()
    query_vector = await fetch_query_vector(food_text)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.BACKEND_API_BASE_URL}/api/wines/recommendations/food/internal",
            params={
                "userId": user_id,
            },
            headers={
                "Content-Type": "application/json",
                "X-Internal-Api-Key": settings.BACKEND_INTERNAL_API_KEY or settings.INTERNAL_API_KEY,
            },
            json={
                "foodText": food_text,
                "candidateLimit": candidate_limit,
                "queryVector": query_vector,
            },
        )
        if response.is_error:
            raise httpx.HTTPStatusError(
                f"food recommendation request failed: {response.status_code} {response.text}",
                request=response.request,
                response=response,
            )
        response.raise_for_status()
        payload = response.json()
        return payload.get("data")


def build_food_recommendation_summary(recommendation: dict[str, Any] | None) -> str:
    if not recommendation:
        return "- 음식 기반 추천 결과: 없음"

    recommended_wine = recommendation.get("recommendedWine") or {}
    lines = [
        "- 음식 기반 추천 결과:",
        f"  - 음식: {recommendation.get('foodText') or '없음'}",
        f"  - 추천 와인: {recommended_wine.get('nameKr') or '없음'}",
        f"  - 와인 타입: {recommended_wine.get('wineTypeLabel') or recommended_wine.get('wineType') or '없음'}",
        f"  - 산지: {((recommended_wine.get('country') or '') + ' ' + (recommended_wine.get('region') or '')).strip() or '없음'}",
        f"  - 가격: {recommended_wine.get('price') or '없음'}",
        f"  - 매칭률: {recommendation.get('matchPercent') or '없음'}",
        f"  - 추천 이유: {recommendation.get('reason') or '없음'}",
    ]
    return "\n".join(lines)


def _normalize_entity_text(value: str | None) -> str:
    if not value:
        return ""
    lowered = str(value).lower().strip()
    lowered = lowered.replace("&", " and ")
    lowered = re.sub(r"\b(?:n\.?v\.?|reserve|reserva|grand|gran|brut|extra|dry|rose|rosé|blanc|de|la|le)\b", " ", lowered)
    lowered = re.sub(r"[^a-z0-9가-힣]+", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    return lowered


def _tokenize_entity_text(value: str | None) -> set[str]:
    normalized = _normalize_entity_text(value)
    if not normalized:
        return set()
    return {token for token in normalized.split(" ") if len(token) >= 2}


def _menu_wine_match_score(menu_wines: list[str], recommended_wine: dict[str, Any]) -> float:
    if not menu_wines or not recommended_wine:
        return 0.0

    candidate_names = [
        recommended_wine.get("nameKr"),
        recommended_wine.get("nameEn"),
    ]
    candidate_tokens = set()
    for candidate_name in candidate_names:
        candidate_tokens.update(_tokenize_entity_text(candidate_name))

    if not candidate_tokens:
        return 0.0

    best_score = 0.0
    for menu_wine in menu_wines:
        menu_tokens = _tokenize_entity_text(menu_wine)
        if not menu_tokens:
            continue

        overlap = candidate_tokens & menu_tokens
        if not overlap:
            continue

        overlap_score = len(overlap) / max(1, min(len(candidate_tokens), len(menu_tokens)))
        if overlap_score > best_score:
            best_score = overlap_score

    return best_score


async def request_menu_pairing_recommendations(
    *,
    user_id: str | int,
    menu_foods: list[str],
    menu_wines: list[str],
    target_foods: list[str] | None = None,
    excluded_wine_names: list[str] | None = None,
    candidate_limit: int = 20,
    max_pairings: int = 3,
) -> list[dict[str, Any]]:
    selected_foods = target_foods or menu_foods
    unique_foods = []
    seen_foods: set[str] = set()
    for food in selected_foods:
        normalized_food = food.strip()
        if not normalized_food:
            continue
        key = normalized_food.casefold()
        if key in seen_foods:
            continue
        seen_foods.add(key)
        unique_foods.append(normalized_food)

    if not unique_foods:
        return []

    excluded_wine_tokens = {
        _normalize_entity_text(wine_name)
        for wine_name in (excluded_wine_names or [])
        if _normalize_entity_text(wine_name)
    }

    tasks = [
        request_food_wine_recommendation(
            user_id=user_id,
            food_text=food,
            candidate_limit=candidate_limit,
        )
        for food in unique_foods[:max_pairings + 2]
    ]
    responses = await asyncio.gather(*tasks, return_exceptions=True)

    pairings: list[dict[str, Any]] = []
    for food, response in zip(unique_foods, responses):
        if isinstance(response, Exception) or not response:
            continue

        recommended_wine = response.get("recommendedWine") or {}
        normalized_name_kr = _normalize_entity_text(recommended_wine.get("nameKr"))
        normalized_name_en = _normalize_entity_text(recommended_wine.get("nameEn"))
        if excluded_wine_tokens and (
            normalized_name_kr in excluded_wine_tokens or normalized_name_en in excluded_wine_tokens
        ):
            continue

        menu_match_score = _menu_wine_match_score(menu_wines, recommended_wine)
        base_match_percent = response.get("matchPercent") or 0
        composite_score = float(base_match_percent) + (menu_match_score * 15.0)

        pairings.append(
            {
                "foodName": food,
                "recommendation": response,
                "menuWineMatched": menu_match_score >= 0.5,
                "menuMatchScore": round(menu_match_score, 4),
                "compositeScore": round(composite_score, 4),
            }
        )

    pairings.sort(
        key=lambda item: (
            item.get("menuWineMatched", False),
            item.get("compositeScore", 0.0),
            (item.get("recommendation") or {}).get("matchPercent", 0),
        ),
        reverse=True,
    )

    seen_wine_ids: set[int] = set()
    deduped_pairings: list[dict[str, Any]] = []
    for pairing in pairings:
        recommended_wine = (pairing.get("recommendation") or {}).get("recommendedWine") or {}
        wine_id = recommended_wine.get("wineId")
        if wine_id and wine_id in seen_wine_ids:
            continue
        if wine_id:
            seen_wine_ids.add(wine_id)
        deduped_pairings.append(pairing)
        if len(deduped_pairings) >= max_pairings:
            break

    return deduped_pairings
