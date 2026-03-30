from __future__ import annotations

import re
from typing import Any


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def _extract_tagged_foods(raw_input: str) -> list[str]:
    """사용자 입력 문장에서 #태그된 단어들을 추출합니다."""
    if not raw_input:
        return []
    # #으로 시작하는 한글, 영문, 숫자 단어 추출
    tags = re.findall(r"#([가-힣a-zA-Z0-9_]+)", raw_input)
    return _unique_preserve_order(tags)


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
    # taggedFoods 필드는 OCR 데이터가 아니므로 제외하고 추출
    if not selected_menu:
        return []
    # 태그 데이터 키를 제외한 순수 메뉴판 데이터만 필터링
    temp_menu = {k: v for k, v in selected_menu.items() if k != "taggedFoods"}
    return _extract_from_keys(
        temp_menu,
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

    # 1. 태그 데이터 (사용자 직접 입력 전용)
    tagged_from_msg = _extract_tagged_foods(normalized_input)
    # 프론트엔드에서 taggedFoods 필드로 보낸 데이터만 추출
    tagged_from_field = (
        _flatten_strings(selected_menu.get("taggedFoods")) if selected_menu else []
    )
    tagged_foods = _unique_preserve_order(tagged_from_msg + tagged_from_field)

    # 2. 메뉴판 데이터 (실제 OCR 스캔 결과 전용)
    # taggedFoods 필드를 제외한 나머지 키에서만 음식/와인 추출
    clean_menu_data = (
        {k: v for k, v in selected_menu.items() if k != "taggedFoods"}
        if selected_menu
        else {}
    )
    menu_foods = _extract_selected_menu_foods(clean_menu_data)
    menu_wines = _extract_selected_menu_wines(clean_menu_data)

    selected_wine_name = _extract_selected_wine_name(selected_wine)

    friend_info_lines: list[str] = []
    for friend in mentioned_friends or []:
        # 닉네임 추출
        name_list = _extract_from_keys(friend, ("nickname", "name", "username"))
        name_str = name_list[0] if name_list else "이름 모름"
        
        # [수정] 백엔드 AiService.java에서 'preference' 키로 데이터를 보냄
        pref = friend.get("preference")
        if isinstance(pref, dict) and pref:
            # 수치 데이터가 존재하면 상세 요약 추가
            s = pref.get('sweetness', '-')
            a = pref.get('acidity', '-')
            b = pref.get('body', '-')
            t = pref.get('tannin', '-')
            pref_desc = f"(취향수치 - 당도:{s}, 산도:{a}, 바디:{b}, 탄닌:{t})"
            friend_info_lines.append(f"{name_str} {pref_desc}")
        else:
            friend_info_lines.append(name_str)
    
    friend_names = _unique_preserve_order(friend_info_lines)

    # ... (음식 요약 로직 생략 없이 동일 유지)
    all_foods = _unique_preserve_order(tagged_foods + menu_foods)
    if all_foods:
        if len(all_foods) > 3:
            food_text = ", ".join(all_foods[:3]) + f" 외 {len(all_foods)-3}가지 메뉴"
        else:
            food_text = ", ".join(all_foods)
    else:
        food_text = ""

    summary_lines = [
        f"- 사용자 원문: {normalized_input or '없음'}",
        f"- 태그된 음식: {', '.join(tagged_foods) if tagged_foods else '없음'}",
        f"- 스캔된 메뉴판 음식: {', '.join(menu_foods) if menu_foods else '없음'}",
        f"- 메뉴판 와인: {', '.join(menu_wines) if menu_wines else '없음'}",
        f"- 언급된 친구 및 취향: {', '.join(friend_names) if friend_names else '없음'}",
    ]

    return {
        "raw_input": normalized_input,
        "food_text": food_text,
        "tagged_foods": tagged_foods,  # 명시적으로 분리
        "menu_foods": menu_foods,  # 명시적으로 분리
        "menu_wines": menu_wines,
        "selected_wine_name": selected_wine_name,
        "friend_names": friend_names,
        "summary": "\n".join(summary_lines),
    }
