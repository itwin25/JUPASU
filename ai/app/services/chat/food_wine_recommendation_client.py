from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings


FOOD_RECOMMENDATION_CUES = (
    "추천",
    "어울",
    "곁들",
    "같이",
    "마실",
    "어떤 와인",
    "무슨 와인",
)


def should_request_food_recommendation(raw_input: str, input_context: dict[str, Any]) -> bool:
    normalized_input = (raw_input or "").strip()
    food_text = (input_context.get("food_text") or "").strip()
    menu_foods = input_context.get("menu_foods") or []

    if menu_foods and food_text:
        return True

    if not food_text or food_text == normalized_input == "":
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
        return "- 음식 기반 와인 추천 결과: 없음"

    recommended_wine = recommendation.get("recommendedWine") or {}
    lines = [
        "- 음식 기반 와인 추천 결과:",
        f"  - 음식: {recommendation.get('foodText') or '없음'}",
        f"  - 추천 와인: {recommended_wine.get('nameKr') or '없음'}",
        f"  - 타입: {recommended_wine.get('wineTypeLabel') or recommended_wine.get('wineType') or '없음'}",
        f"  - 산지: {(recommended_wine.get('country') or '')} {(recommended_wine.get('region') or '')}".strip() or "없음",
        f"  - 가격: {recommended_wine.get('price') or '없음'}",
        f"  - 매칭률: {recommendation.get('matchPercent') or '없음'}",
        f"  - 추천 이유: {recommendation.get('reason') or '없음'}",
    ]
    return "\n".join(lines)
