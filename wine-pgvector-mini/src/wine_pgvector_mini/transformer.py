from __future__ import annotations

from dataclasses import dataclass
from typing import Any


TYPE_MAP = {
    "red": "red wine",
    "white": "white wine",
    "rose": "rose wine",
    "sparkling": "sparkling wine",
    "dessert": "dessert wine",
    "fortified": "fortified wine",
}

GRAPE_MAP = {
    "shiraz": "Shiraz",
    "syrah": "Shiraz",
    "shiraz/syrah": "Shiraz",
    "cabernet sauvignon": "Cabernet Sauvignon",
    "merlot": "Merlot",
    "pinot noir": "Pinot Noir",
    "chardonnay": "Chardonnay",
    "sauvignon blanc": "Sauvignon Blanc",
    "riesling": "Riesling",
}

FOOD_MAP = {
    "사냥 동물": "game meat",
    "소고기": "beef",
    "양고기": "lamb",
    "돼지고기": "pork",
    "닭고기": "chicken",
}

TYPE_MAP_KO = {
    "red wine": "레드 와인",
    "white wine": "화이트 와인",
    "rose wine": "로제 와인",
    "sparkling wine": "스파클링 와인",
    "dessert wine": "디저트 와인",
    "fortified wine": "주정 강화 와인",
}

FOOD_MAP_KO = {
    "game meat": "풍미가 강한 육류 요리",
    "beef": "소고기",
    "lamb": "양고기",
    "pork": "돼지고기",
    "chicken": "닭고기",
    "seafood": "해산물",
    "appetizers and snacks": "에피타이저와 스낵",
    "vegetarian dishes and salads": "채소 요리와 샐러드",
    "pasta": "파스타",
    "cheese": "치즈",
    "spicy food": "매운 음식",
    "goat cheese": "염소 우유 치즈",
    "aperitif dishes": "식전 메뉴",
    "desserts": "디저트",
    "fruit desserts": "과일 디저트",
    "processed foods": "가공육·가공 식품",
}

COUNTRY_MAP_KO = {
    "australia": "호주",
    "new zealand": "뉴질랜드",
    "france": "프랑스",
    "spain": "스페인",
    "italy": "이탈리아",
    "united states": "미국",
    "usa": "미국",
    "argentina": "아르헨티나",
    "chile": "칠레",
    "south africa": "남아프리카공화국",
    "portugal": "포르투갈",
    "germany": "독일",
    "austria": "오스트리아",
}

REGION_MAP_KO = {
    "langhorne creek": "랭혼 크릭",
    "hawke's bay": "호크스 베이",
    "bourgogne": "부르고뉴",
    "jura": "주라",
    "montsant": "몬산트",
    "marlborough": "말버러",
    "barossa valley": "바로사 밸리",
    "napa valley": "나파 밸리",
    "toscana": "토스카나",
    "rioja": "리오하",
    "mendoza": "멘도사",
    "champagne": "샹파뉴",
    "mosel": "모젤",
}

GRAPE_MAP_KO = {
    "Shiraz": "시라즈",
    "Cabernet Sauvignon": "카베르네 소비뇽",
    "Merlot": "메를로",
    "Pinot Noir": "피노 누아",
    "Chardonnay": "샤르도네",
    "Sauvignon Blanc": "소비뇽 블랑",
    "Riesling": "리슬링",
}

RAW_FOOD_TO_CANONICAL = {
    "소고기": "beef",
    "닭고기": "chicken",
    "양고기": "lamb",
    "사냥 동물": "game meat",
    "해산물": "seafood",
    "에피타이저/스낵": "appetizers and snacks",
    "돼지고기": "pork",
    "채식/샐러드": "vegetarian dishes and salads",
    "파스타": "pasta",
    "치즈": "cheese",
    "매운 음식": "spicy food",
    "염소 우유 치즈": "goat cheese",
    "식전주": "aperitif dishes",
    "디저트": "desserts",
    "과일 디저트": "fruit desserts",
    "가공 식품": "processed foods",
}

NOTE_TRANSLATIONS = {
    "blackberry": "블랙베리",
    "black fruit": "검은 과실",
    "dark fruit": "짙은 검은 과실",
    "plum": "자두",
    "black cherry": "블랙체리",
    "blueberry": "블루베리",
    "jam": "잼",
    "cassis": "카시스",
    "chocolate": "초콜릿",
    "oak": "오크",
    "cigar box": "시가 박스",
    "mocha": "모카",
    "tobacco": "담배 잎",
    "vanilla": "바닐라",
    "cinnamon": "시나몬",
    "pepper": "후추",
    "eucalyptus": "유칼립투스",
    "star anise": "팔각",
    "white pepper": "화이트 페퍼",
    "cherry": "체리",
    "red fruit": "붉은 과실",
    "earthy": "흙내음",
    "mushroom": "버섯",
    "toast": "토스트",
    "mandarin orange": "만다린 오렌지",
}

STYLE_TRANSLATIONS = {
    "South Australia Shiraz": "사우스 오스트레일리아 시라즈 스타일",
    "South Australia Cabernet Sauvignon": "사우스 오스트레일리아 카베르네 소비뇽 스타일",
    "Bourgogne Chardonnay": "부르고뉴 샤르도네 스타일",
}

NOTE_GROUP_TRANSLATIONS = {
    "Black Fruit": "검은 과실",
    "Oak": "오크",
    "Spices": "향신료",
    "Red Fruit": "붉은 과실",
    "Earth": "흙내음",
    "Non Oak": "비오크 풍미",
    "Citrus Fruit": "시트러스 과일",
    "Microbio": "발효 풍미",
    "Dried Fruit": "건과일",
    "Tree Fruit": "과수원 과일",
    "Tropical Fruit": "열대 과일",
    "Floral": "꽃 향",
    "Herbs": "허브",
    "Vegetal": "식물성 풍미",
}

TASTE_MAP_KO = {
    "very full-bodied": "매우 묵직한",
    "full-bodied": "묵직한",
    "medium-bodied": "중간 정도의",
    "light-bodied": "가벼운",
    "high acidity": "산미가 높은",
    "medium-plus acidity": "산미가 적당히 살아 있는",
    "soft acidity": "산미가 부드러운",
    "low acidity": "산미가 낮은",
    "sweet": "단맛이 있는",
    "off-dry": "은은한 단맛이 있는",
    "dry": "드라이한",
    "very dry": "매우 드라이한",
    "firm tannin": "탄닌이 강한",
    "noticeable tannin": "탄닌이 존재감 있는",
    "soft tannin": "탄닌이 부드러운",
    "low tannin": "탄닌이 약한",
}


@dataclass
class WineDocument:
    wine_name: str
    embedding_text: str
    metadata: dict[str, Any]


def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _parse_percent(value: Any) -> int | None:
    text = _text(value).replace("%", "")
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _band(metric: str, value: int | None) -> str:
    if value is None:
        return "unknown"

    if metric == "boldness":
        if value >= 85:
            return "very full-bodied"
        if value >= 65:
            return "full-bodied"
        if value >= 40:
            return "medium-bodied"
        return "light-bodied"

    if metric == "acidity":
        if value >= 75:
            return "high acidity"
        if value >= 50:
            return "medium-plus acidity"
        if value >= 30:
            return "soft acidity"
        return "low acidity"

    if metric == "sweetness":
        if value >= 70:
            return "sweet"
        if value >= 45:
            return "off-dry"
        if value >= 20:
            return "dry"
        return "very dry"

    if metric == "tannic":
        if value >= 75:
            return "firm tannin"
        if value >= 50:
            return "noticeable tannin"
        if value >= 25:
            return "soft tannin"
        return "low tannin"

    return "unknown"


def _normalize_grapes(raw: str) -> list[str]:
    grapes = []
    for item in raw.replace("/", ",").split(","):
        token = item.strip()
        if not token:
            continue
        grapes.append(GRAPE_MAP.get(token.lower(), token))

    deduped = []
    seen = set()
    for grape in grapes:
        key = grape.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(grape)
    return deduped


def _normalize_foods(items: list[str]) -> list[str]:
    foods = []
    for item in items:
        token = _text(item)
        if not token:
            continue
        foods.append(RAW_FOOD_TO_CANONICAL.get(token, FOOD_MAP.get(token, token)))
    return foods


def _translate_country(country: str) -> str:
    if not country:
        return ""
    return COUNTRY_MAP_KO.get(country.lower(), country)


def _translate_region(region: str) -> str:
    if not region:
        return ""
    return REGION_MAP_KO.get(region.lower(), region)


def _translate_grape(grape: str) -> str:
    if not grape:
        return ""
    return GRAPE_MAP_KO.get(grape, grape)


def _translate_style(style: str) -> str:
    if not style:
        return ""
    if style in STYLE_TRANSLATIONS:
        return STYLE_TRANSLATIONS[style]

    translated = style
    for english, korean in COUNTRY_MAP_KO.items():
        translated = translated.replace(english.title(), korean)
    for english, korean in REGION_MAP_KO.items():
        translated = translated.replace(english.title(), korean)
    for english, korean in GRAPE_MAP_KO.items():
        translated = translated.replace(english, korean)
    return translated


def _top_notes(notes: list[dict[str, Any]], limit: int = 3) -> list[str]:
    ranked = []
    for note in notes:
        mentions_raw = _text(note.get("mentions"))
        try:
            mentions = int(mentions_raw.split()[0]) if mentions_raw else 0
        except ValueError:
            mentions = 0
        ranked.append((mentions, _text(note.get("group")), _text(note.get("keyword"))))

    ranked.sort(key=lambda row: row[0], reverse=True)
    results = []
    for _, group, keyword in ranked[:limit]:
        if not group and not keyword:
            continue
        keywords = [part.strip() for part in keyword.split(",") if part.strip()][:3]
        if group and keywords:
            results.append(f"{group}: {', '.join(keywords)}")
        elif group:
            results.append(group)
    return results


def _translate_note_phrase(note_phrase: str) -> str:
    if not note_phrase:
        return ""

    if ": " not in note_phrase:
        return NOTE_TRANSLATIONS.get(note_phrase.lower(), note_phrase)

    group, keywords = note_phrase.split(": ", 1)
    translated_group = NOTE_GROUP_TRANSLATIONS.get(group, group)
    translated_keywords = []
    for keyword in keywords.split(","):
        token = keyword.strip()
        if not token:
            continue
        translated_keywords.append(NOTE_TRANSLATIONS.get(token.lower(), token))
    return f"{translated_group}: {', '.join(translated_keywords)}"


def normalize_wine(wine: dict[str, Any]) -> dict[str, Any]:
    facts = wine.get("all_facts") or {}
    taste = wine.get("taste_profile") or {}
    ratings = wine.get("ratings") or {}

    wine_type = TYPE_MAP.get(_text(wine.get("wine_type")).lower(), _text(wine.get("wine_type")) or "wine")
    grapes = _normalize_grapes(_text(facts.get("Grapes")))
    foods = _normalize_foods(wine.get("food_pairings") or [])

    country = _text(wine.get("country") or "")
    region = _text(wine.get("region") or facts.get("Region") or "")

    return {
        "wine_name": wine.get("wine_name") or "",
        "display_name": wine.get("name_kr") or wine.get("wine_name") or "Unknown wine",
        "winery": wine.get("winery") or facts.get("Winery") or "",
        "country": country,
        "country_ko": _translate_country(country),
        "region": region,
        "region_ko": _translate_region(region),
        "wine_type": wine_type,
        "wine_type_ko": TYPE_MAP_KO.get(wine_type, "와인"),
        "wine_style": facts.get("Wine style") or "",
        "wine_style_ko": _translate_style(_text(facts.get("Wine style"))),
        "grapes": grapes,
        "grapes_ko": [_translate_grape(grape) for grape in grapes],
        "food_pairings": foods,
        "food_pairings_ko": [FOOD_MAP_KO.get(item, item) for item in foods],
        "taste": {
            "acidity": _band("acidity", _parse_percent(taste.get("acidity"))),
            "boldness": _band("boldness", _parse_percent(taste.get("boldness"))),
            "sweetness": _band("sweetness", _parse_percent(taste.get("sweetness"))),
            "tannic": _band("tannic", _parse_percent(taste.get("tannic"))),
        },
        "top_notes": _top_notes(wine.get("taste_notes") or []),
        "rating_average": ratings.get("average"),
        "rating_count": ratings.get("count"),
        "price": wine.get("price") or "",
        "description": _text(wine.get("description")),
    }


def build_embedding_text(wine: dict[str, Any]) -> str:
    normalized = normalize_wine(wine)
    foods = ", ".join(normalized["food_pairings"]) or "rich dishes"
    grapes = ", ".join(normalized["grapes"]) or "unknown grapes"
    notes = "; ".join(normalized["top_notes"]) or "no dominant note data"

    lines = [
        f"Wine: {normalized['display_name']}",
        f"Original name: {normalized['wine_name']}",
        f"Type: {normalized['wine_type']}",
        f"Origin: {normalized['country']}, {normalized['region']}",
        f"Winery: {normalized['winery']}",
        f"Grapes: {grapes}",
        f"Style: {normalized['wine_style']}",
        (
            "Taste profile: "
            f"{normalized['taste']['boldness']}, "
            f"{normalized['taste']['acidity']}, "
            f"{normalized['taste']['sweetness']}, "
            f"{normalized['taste']['tannic']}"
        ),
        f"Aroma notes: {notes}",
        f"Pairs well with: {foods}",
        f"Rating: {normalized['rating_average']} from {normalized['rating_count']} ratings",
        f"Price: {normalized['price']}",
    ]

    if normalized["description"]:
        lines.append(f"Description: {normalized['description']}")

    lines.append(
        "Recommendation summary: "
        f"This is a {normalized['wine_type']} suited for {foods}. "
        f"It shows {normalized['taste']['boldness']} structure with {normalized['taste']['tannic']} and "
        "works especially well when the dish has strong savory intensity."
    )
    return "\n".join(lines)


def build_wine_narrative_ko(wine: dict[str, Any]) -> str:
    normalized = normalize_wine(wine)
    foods = ", ".join(normalized["food_pairings_ko"]) or "풍미가 진한 음식"
    notes = (
        ", ".join(_translate_note_phrase(note) for note in normalized["top_notes"])
        if normalized["top_notes"] else "풍부한 향"
    )
    body = TASTE_MAP_KO.get(normalized["taste"]["boldness"], normalized["taste"]["boldness"])
    tannin = TASTE_MAP_KO.get(normalized["taste"]["tannic"], normalized["taste"]["tannic"])

    return (
        f"{normalized['display_name']}는 {normalized['country_ko']} {normalized['region_ko']}에서 생산된 "
        f"{normalized['wine_type_ko']}입니다. "
        f"{notes}의 인상이 두드러지고, {foods}와 잘 어울리는 스타일입니다. "
        f"{body} 바디감과 {tannin} 질감이 있어 "
        "육류 중심의 음식과 매칭했을 때 장점이 잘 드러납니다."
    )


def build_embedding_text_ko(wine: dict[str, Any]) -> str:
    normalized = normalize_wine(wine)
    grapes = ", ".join(normalized["grapes_ko"]) if normalized["grapes_ko"] else "품종 정보가 확인되지 않은"
    foods = ", ".join(normalized["food_pairings_ko"][:4]) if normalized["food_pairings_ko"] else "다양한 음식"

    translated_notes = []
    for note in normalized["top_notes"]:
        translated = _translate_note_phrase(note)
        if translated:
            translated_notes.append(translated)

    if translated_notes:
        note_text = ", ".join(translated_notes)
    else:
        note_text = "과실과 향신료 계열의 풍미"

    body = TASTE_MAP_KO.get(normalized["taste"]["boldness"], normalized["taste"]["boldness"])
    acidity = TASTE_MAP_KO.get(normalized["taste"]["acidity"], normalized["taste"]["acidity"])
    tannin = TASTE_MAP_KO.get(normalized["taste"]["tannic"], normalized["taste"]["tannic"])
    sweetness = TASTE_MAP_KO.get(normalized["taste"]["sweetness"], normalized["taste"]["sweetness"])

    sentence1 = (
        f"{normalized['display_name']}는 {normalized['country_ko']} {normalized['region_ko']}에서 생산된 "
        f"{normalized['wine_type_ko']}입니다."
    )
    sentence2 = (
        f"{grapes} 품종 기반으로, {note_text}의 향과 풍미가 두드러집니다."
    )
    sentence3 = (
        f"{body} 바디감, {acidity} 산미, {tannin} 탄닌, {sweetness} 당도의 특징을 가지며, "
        f"{foods}와 잘 어울립니다."
    )

    style_sentence = ""
    if normalized["wine_style_ko"]:
        style_sentence = f"와인 스타일은 {normalized['wine_style_ko']}로 분류됩니다."
    elif normalized["description"]:
        style_sentence = normalized["description"]

    parts = [sentence1, sentence2, sentence3]
    if style_sentence:
        parts.append(style_sentence)
    return " ".join(parts)


def build_pgvector_document(wine: dict[str, Any]) -> WineDocument:
    normalized = normalize_wine(wine)
    metadata = {
        "wine_name": normalized["wine_name"],
        "display_name": normalized["display_name"],
        "country": normalized["country"],
        "region": normalized["region"],
        "wine_type": normalized["wine_type"],
        "grapes": normalized["grapes"],
        "food_pairings": normalized["food_pairings"],
        "rating_average": normalized["rating_average"],
        "price": normalized["price"],
    }
    return WineDocument(
        wine_name=normalized["display_name"],
        embedding_text=build_embedding_text(wine),
        metadata=metadata,
    )


def build_food_query_text(user_food: str) -> str:
    return (
        "User wants a wine recommendation for the following food.\n"
        f"Food: {user_food}\n"
        "Find wines whose body, acidity, tannin, sweetness, aroma, and flavor intensity match this dish."
    )
