from __future__ import annotations

import re
from typing import Any


FOOD_REQUEST_SUFFIXES = (
    "와 어울리는 와인 추천해줘",
    "랑 어울리는 와인 추천해줘",
    "와 어울리는 와인 추천",
    "랑 어울리는 와인 추천",
    "어울리는 와인 추천해줘",
    "어울리는 와인 추천",
    "어울리는 와인",
    "추천해줘",
    "추천",
)


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def _extract_food_text(raw_input: str) -> str:
    normalized = _normalize_text(raw_input)
    if not normalized:
        return ""

    for suffix in FOOD_REQUEST_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
            break

    for particle in ("이랑", "랑", "과", "와"):
        if normalized.endswith(particle):
            normalized = normalized[: -len(particle)].strip()
            break

    normalized = re.sub(r"[?.!,]+$", "", normalized).strip()
    return normalized


def _unique_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = _normalize_text(value)
        if not normalized:
            continue
        key = normalized.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result


def _flatten_strings(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        normalized = _normalize_text(value)
        return [normalized] if normalized else []
    if isinstance(value, (list, tuple, set)):
        result: list[str] = []
        for item in value:
            result.extend(_flatten_strings(item))
        return result
    if isinstance(value, dict):
        result: list[str] = []
        for item in value.values():
            result.extend(_flatten_strings(item))
        return result
    return []


def _extract_from_keys(payload: dict[str, Any] | None, keys: tuple[str, ...]) -> list[str]:
    if not payload:
        return []

    lowered = {str(key).lower(): value for key, value in payload.items()}
    result: list[str] = []
    for key in keys:
        if key in lowered:
            result.extend(_flatten_strings(lowered[key]))
    return _unique_preserve_order(result)


def _extract_selected_menu_foods(selected_menu: dict[str, Any] | None) -> list[str]:
    return _extract_from_keys(
        selected_menu,
        (
            "foodnames",
            "foods",
            "selectedfoods",
            "menuitems",
            "menus",
            "menu",
            "foodname",
            "menuname",
            "name",
            "title",
        ),
    )


def _extract_selected_menu_wines(selected_menu: dict[str, Any] | None) -> list[str]:
    return _extract_from_keys(
        selected_menu,
        (
            "winenames",
            "wines",
            "selectedwines",
            "winename",
            "selectedwine",
        ),
    )


def _extract_selected_wine_name(selected_wine: dict[str, Any] | None) -> str:
    if not selected_wine:
        return ""
    names = _extract_from_keys(
        selected_wine,
        (
            "name_kr",
            "namekr",
            "name_en",
            "nameen",
            "winename",
            "name",
            "title",
        ),
    )
    return names[0] if names else ""


def build_chat_input_context(
    raw_input: str,
    selected_menu: dict[str, Any] | None,
    selected_wine: dict[str, Any] | None,
    mentioned_friends: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    normalized_input = _normalize_text(raw_input)
    menu_foods = _extract_selected_menu_foods(selected_menu)
    menu_wines = _extract_selected_menu_wines(selected_menu)
    selected_wine_name = _extract_selected_wine_name(selected_wine)

    friend_names_raw: list[str] = []
    for friend in mentioned_friends or []:
        friend_names_raw.extend(_extract_from_keys(friend, ("nickname", "name", "username")))
    friend_names = _unique_preserve_order(friend_names_raw)

    # 음식 텍스트 구성 및 요약 (가독성 향상)
    if menu_foods:
        if len(menu_foods) > 3:
            display_foods = ", ".join(menu_foods[:3]) + f" 외 {len(menu_foods)-3}가지 메뉴"
        else:
            display_foods = ", ".join(menu_foods)
        food_text = display_foods
    else:
        food_text = _extract_food_text(normalized_input)

    summary_lines = [
        f"- 사용자 원문: {normalized_input or '없음'}",
        f"- 추천 파이프라인용 음식 텍스트: {food_text or '없음'}",
        f"- 메뉴판에서 추출한 음식: {', '.join(menu_foods) if menu_foods else '없음'}",
        f"- 메뉴판에서 추출한 와인: {', '.join(menu_wines) if menu_wines else '없음'}",
        f"- 사용자가 선택한 와인: {selected_wine_name or '없음'}",
        f"- 함께 언급된 친구: {', '.join(friend_names) if friend_names else '없음'}",
    ]

    return {
        "raw_input": normalized_input,
        "food_text": food_text,
        "menu_foods": menu_foods,
        "menu_wines": menu_wines,
        "selected_wine_name": selected_wine_name,
        "friend_names": friend_names,
        "summary": "\n".join(summary_lines),
    }
