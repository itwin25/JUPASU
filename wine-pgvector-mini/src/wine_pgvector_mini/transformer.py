from __future__ import annotations

from dataclasses import dataclass
from typing import Any
import re
import unicodedata


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
    "canada": "캐나다",
    "switzerland": "스위스",
    "moldova": "몰도바",
    "canada": "캐나다",
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
    "central otago": "센트럴 오타고",
    "alsace": "알자스",
    "südtirol - alto adige": "쥐트티롤-알토 아디제",
    "sudtirol - alto adige": "쥐트티롤-알토 아디제",
    "montagny premier cru": "몽타니 프르미에 크뤼",
    "chianti classico": "키안티 클라시코",
    "piave": "피아베",
    "south eastern australia": "사우스 이스턴 오스트레일리아",
    "kumeu": "쿠메우",
    "willamette valley": "윌라멧 밸리",
    "bio-bio valley": "비오비오 밸리",
    "valais": "발레",
    "barossa": "바로사",
    "saint-julien": "생쥘리앙",
    "st-julien": "생쥘리앙",
    "pauillac": "포이약",
    "margaux": "마고",
    "saint-estèphe": "생테스테프",
    "saint-estephe": "생테스테프",
    "saint-émilion": "생테밀리옹",
    "saint-emilion": "생테밀리옹",
    "pomerol": "포므롤",
    "medoc": "메독",
    "médoc": "메독",
    "haut-médoc": "오메독",
    "haut-medoc": "오메독",
    "bianco di custoza": "비앙코 디 쿠스토자",
    "barbera d'asti": "바르베라 다스티",
    "barbera d asti": "바르베라 다스티",
    "pauillac": "포이약",
    "waiheke island": "와이헤케 아일랜드",
    "wachau": "바하우",
    "columbia valley": "컬럼비아 밸리",
    "colchagua valley": "콜차과 밸리",
    "nagambie lakes": "나감비 레이크스",
    "wine of canada": "캐나다",
    "mâcon-villages": "마콩 빌라주",
    "macon-villages": "마콩 빌라주",
    "rosso di montalcino": "로쏘 디 몬탈치노",
    "romanée-saint-vivant grand cru": "로마네 생 비방 그랑 크뤼",
    "romanee-saint-vivant grand cru": "로마네 생 비방 그랑 크뤼",
}

GRAPE_MAP_KO = {
    "Shiraz": "시라즈",
    "Cabernet Sauvignon": "카베르네 소비뇽",
    "Merlot": "메를로",
    "Pinot Noir": "피노 누아",
    "Chardonnay": "샤르도네",
    "Sauvignon Blanc": "소비뇽 블랑",
    "Riesling": "리슬링",
    "Carignan": "카리냥",
    "Vermentino": "베르멘티노",
    "Pinot Gris": "피노 그리",
    "Pinot Grigio": "피노 그리지오",
    "Grenache": "그르나슈",
    "Syrah": "시라즈",
    "Tempranillo": "템프라니요",
    "Malbec": "말벡",
    "Sangiovese": "산지오베제",
    "Nebbiolo": "네비올로",
    "Zinfandel": "진판델",
    "Moscato": "모스카토",
    "Gewurztraminer": "게뷔르츠트라미너",
    "Viognier": "비오니에",
    "Chenin Blanc": "슈냉 블랑",
    "Muscat Blanc": "뮈스카 블랑",
    "Pinot Blanc": "피노 블랑",
    "Raboso Piave": "라보소 피아베",
    "Cariñena": "카리녜나",
    "Carinena": "카리녜나",
    "Cabernet Franc": "카베르네 프랑",
    "Petit Verdot": "쁘띠 베르도",
    "Pinot Bianco": "피노 비안코",
    "Grauburgunder": "그라우부르군더",
    "Barbera": "바르베라",
    "Tocai Friulano": "토카이 프리울라노",
    "Corvina": "코르비나",
    "Rondinella": "론디넬라",
    "Molinara": "몰리나라",
    "Trebbiano": "트레비아노",
    "Garganega": "가르가네가",
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
    "strawberry": "딸기",
    "cranberry": "크랜베리",
    "raspberry": "라즈베리",
    "red currant": "레드커런트",
    "currant": "커런트",
    "apple": "사과",
    "green apple": "청사과",
    "pear": "배",
    "peach": "복숭아",
    "apricot": "살구",
    "yellow peach": "황도 복숭아",
    "citrus": "시트러스",
    "grapefruit": "자몽",
    "orange": "오렌지",
    "orange peel": "오렌지 껍질",
    "orange zest": "오렌지 제스트",
    "lime": "라임",
    "lemon": "레몬",
    "minerals": "미네랄",
    "mineral": "미네랄",
    "stone": "돌 향",
    "smoke": "훈연 향",
    "honey": "꿀",
    "beeswax": "밀랍",
    "rose": "장미",
    "violet": "제비꽃",
    "clove": "정향",
    "red cherry": "붉은 체리",
    "butter": "버터",
    "cocoa": "코코아",
    "leather": "가죽",
    "cedar": "삼나무",
    "mint": "민트",
    "oil": "오일리한 느낌",
    "anise": "아니스",
    "graphite": "흑연",
    "butterscotch": "버터스카치",
    "black currant": "블랙커런트",
    "blackcurrant": "블랙커런트",
    "tropical": "열대 과일",
    "pineapple": "파인애플",
    "mango": "망고",
    "bing cherry": "빙 체리",
    "ginger": "생강",
    "cream": "크리미한 풍미",
    "cheese": "치즈 풍미",
    "nectarine": "넥타린",
    "dried rose": "말린 장미",
    "jasmine": "자스민",
    "boysenberry": "보이즌베리",
    "smoked meats": "훈연 고기 향",
}

STYLE_TRANSLATIONS = {
    "South Australia Shiraz": "사우스 오스트레일리아 시라즈 스타일",
    "South Australia Cabernet Sauvignon": "사우스 오스트레일리아 카베르네 소비뇽 스타일",
    "Bourgogne Chardonnay": "부르고뉴 샤르도네 스타일",
    "French Rosé": "프렌치 로제 스타일",
    "French Rose": "프렌치 로제 스타일",
    "Alsace Pinot Gris": "알자스 피노 그리 스타일",
    "Central Otago Pinot Noir": "센트럴 오타고 피노 누아 스타일",
    "Bourgogne Pinot Noir": "부르고뉴 피노 누아 스타일",
    "Burgundy White": "부르고뉴 화이트 스타일",
    "New Zealand Bordeaux Blend": "뉴질랜드 보르도 블렌드 스타일",
    "Spanish Montsant Red": "스페인 몬산트 레드 스타일",
    "New Zealand Chardonnay": "뉴질랜드 샤르도네 스타일",
    "Northern Italy Pinot Blanc": "북이탈리아 피노 블랑 스타일",
    "Burgundy Côte Chalonnaise White": "부르고뉴 코트 샬로네즈 화이트 스타일",
    "Italian Chianti Classico Red": "이탈리아 키안티 클라시코 레드 스타일",
    "Northern Italy Red": "북이탈리아 레드 스타일",
    "Australian Rosé": "호주 로제 스타일",
    "Australian Rose": "호주 로제 스타일",
    "Australian Riesling": "호주 리슬링 스타일",
    "Washington State Merlot": "워싱턴주 메를로 스타일",
    "Tuscan Red": "토스카나 레드 스타일",
    "Burgundy Mâconnais White": "부르고뉴 마코네 화이트 스타일",
    "Burgundy Maconnais White": "부르고뉴 마코네 화이트 스타일",
    "Argentinian Bordeaux Blend": "아르헨티나 보르도 블렌드 스타일",
    "Chilean White Blend": "칠레 화이트 블렌드 스타일",
    "Austrian Pinot Gris": "오스트리아 피노 그리 스타일",
    "Burgundy Côte de Nuits Red": "부르고뉴 코트 드 뉘 레드 스타일",
    "Burgundy Cote de Nuits Red": "부르고뉴 코트 드 뉘 레드 스타일",
    "Australian Cabernet Sauvignon": "호주 카베르네 소비뇽 스타일",
    "Austrian Riesling": "오스트리아 리슬링 스타일",
    "Austrian Pinot Gris": "오스트리아 피노 그리 스타일",
    "French White": "프렌치 화이트 스타일",
    "Northern Italy White": "북부 이탈리아 화이트 스타일",
    "Argentinian Merlot": "아르헨티나 메를로 스타일",
    "New Zealand Sauvignon Blanc": "뉴질랜드 소비뇽 블랑 스타일",
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
        return ""

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

    return ""


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
    return COUNTRY_MAP_KO.get(country.lower(), _translate_free_text(country))


def _translate_region(region: str) -> str:
    if not region:
        return ""
    return REGION_MAP_KO.get(region.lower(), _translate_free_text(region))


def _translate_grape(grape: str) -> str:
    if not grape:
        return ""
    cleaned = grape.strip()
    cleaned = re.sub(r"^\d+%\s*", "", cleaned)
    cleaned = cleaned.replace("100% ", "").strip()
    direct = GRAPE_MAP_KO.get(cleaned)
    if direct:
        return direct

    translated = _translate_free_text(cleaned)
    return translated or cleaned


def _normalize_lookup_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_value.lower().strip()


def _lookup_normalized(mapping: dict[str, str], value: str) -> str | None:
    if not value:
        return None

    normalized_value = _normalize_lookup_key(value)
    for key, mapped in mapping.items():
        if _normalize_lookup_key(key) == normalized_value:
            return mapped
    return None


def _translate_free_text(text: str) -> str:
    if not text:
        return ""

    translated = text

    def replace_term(source: str, term: str, replacement: str) -> str:
        pattern = re.escape(term)
        if re.match(r"^[A-Za-zÀ-ÿ0-9 .,'’&-]+$", term):
            pattern = rf"(?<![A-Za-zÀ-ÿ]){pattern}(?![A-Za-zÀ-ÿ])"
        return re.sub(pattern, replacement, source, flags=re.IGNORECASE)

    replacement_maps = (
        NOTE_TRANSLATIONS,
        GRAPE_MAP_KO,
        REGION_MAP_KO,
        COUNTRY_MAP_KO,
    )

    for mapping in replacement_maps:
        for english, korean in sorted(mapping.items(), key=lambda item: len(item[0]), reverse=True):
            translated = replace_term(translated, english, korean)

    general_replacements = {
        "Rosé": "로제",
        "Rose": "로제",
        "White": "화이트",
        "Red": "레드",
        "Blend": "블렌드",
        "French": "프렌치",
        "Italian": "이탈리아",
        "Spanish": "스페인",
        "Australian": "호주",
        "Austrian": "오스트리아",
        "Argentinian": "아르헨티나",
        "Chilean": "칠레",
        "Hungary": "헝가리",
        "Northern": "북부",
        "South": "사우스",
        "Cote": "코트",
        "Côte": "코트",
        "Premier Cru": "프르미에 크뤼",
    }

    for english, korean in general_replacements.items():
        translated = replace_term(translated, english, korean)

    translated = re.sub(r"\s+", " ", translated).strip()
    return translated


def _join_foods_ko(foods: list[str]) -> str:
    if not foods:
        return "다양한 음식"
    if len(foods) == 1:
        return foods[0]
    if len(foods) == 2:
        return f"{foods[0]}와 {foods[1]}"
    return ", ".join(foods[:-1]) + f", {foods[-1]}"


def _build_origin_text(country: str, region: str) -> str:
    country = country.strip()
    region = region.strip()

    if country and region:
        normalized_country = re.sub(r"\s+", "", country)
        normalized_region = re.sub(r"\s+", "", region)
        if normalized_country == normalized_region:
            return country
        if country in region or region in country:
            shorter = country if len(country) <= len(region) else region
            return shorter
        return f"{country} {region}"

    return country or region


def _clean_description_text(text: str) -> str:
    cleaned = _text(text)
    if not cleaned:
        return ""
    cleaned = cleaned.replace("향의 향과 풍미", "향과 풍미")
    cleaned = cleaned.replace("풍미의 향과 풍미", "풍미가 두드러집니다")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _simplify_note_phrase(note_phrase: str) -> str:
    translated = _translate_note_phrase(note_phrase)
    if not translated:
        return ""
    if ": " not in translated:
        return translated

    group, keywords = translated.split(": ", 1)
    first_keywords = [item.strip() for item in keywords.split(",") if item.strip()][:3]
    if not first_keywords:
        return group
    return f"{group} 계열의 {', '.join(first_keywords)}"


def _translate_style(style: str) -> str:
    if not style:
        return ""
    direct = STYLE_TRANSLATIONS.get(style) or _lookup_normalized(STYLE_TRANSLATIONS, style)
    if direct:
        return direct

    translated = _translate_free_text(style)
    translated = translated.replace("n 로제", " 로제")
    translated = translated.replace("  ", " ").strip()
    if re.search(r"[A-Za-z]{3,}", translated):
        return ""
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
        return NOTE_TRANSLATIONS.get(note_phrase.lower(), _translate_free_text(note_phrase))

    group, keywords = note_phrase.split(": ", 1)
    translated_group = NOTE_GROUP_TRANSLATIONS.get(group, group)
    translated_keywords = []
    for keyword in keywords.split(","):
        token = keyword.strip()
        if not token:
            continue
        translated = NOTE_TRANSLATIONS.get(token.lower(), _translate_free_text(token))
        if re.search(r"[A-Za-z]{2,}", translated):
            continue
        translated_keywords.append(translated)

    if not translated_keywords:
        return translated_group
    return f"{translated_group}: {', '.join(translated_keywords)}"


def _build_taste_sentence(
    body: str,
    acidity: str,
    tannin: str,
    sweetness: str,
    foods: str,
) -> str:
    taste_parts: list[str] = []
    if body:
        taste_parts.append(f"{body} 바디감")
    if acidity:
        taste_parts.append(f"{acidity} 산미")
    if tannin:
        taste_parts.append(f"{tannin} 탄닌")
    if sweetness:
        taste_parts.append(f"{sweetness} 당도")

    if not taste_parts:
        return f"{foods} 같은 음식과 잘 어울립니다."

    return f"{', '.join(taste_parts)}의 특징을 가지며, {foods} 같은 음식과 잘 어울립니다."


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
    foods = _join_foods_ko(normalized["food_pairings_ko"][:4])

    translated_notes = []
    for note in normalized["top_notes"]:
        translated = _simplify_note_phrase(note)
        if translated:
            translated_notes.append(translated)

    if translated_notes:
        note_text = ", ".join(translated_notes[:3])
    else:
        note_text = "과실과 향신료 계열의 풍미"

    body = TASTE_MAP_KO.get(normalized["taste"]["boldness"], normalized["taste"]["boldness"])
    acidity = TASTE_MAP_KO.get(normalized["taste"]["acidity"], normalized["taste"]["acidity"])
    tannin = TASTE_MAP_KO.get(normalized["taste"]["tannic"], normalized["taste"]["tannic"])
    sweetness = TASTE_MAP_KO.get(normalized["taste"]["sweetness"], normalized["taste"]["sweetness"])

    sentence1 = (
        f"{normalized['display_name']}는 {_build_origin_text(normalized['country_ko'], normalized['region_ko'])}에서 생산된 "
        f"{normalized['wine_type_ko']}입니다."
    )
    sentence2 = (
        f"{grapes} 품종 기반으로, {note_text}의 향과 풍미가 두드러집니다."
    )
    sentence3 = _build_taste_sentence(body, acidity, tannin, sweetness, foods)

    style_sentence = ""
    if normalized["wine_style_ko"]:
        style_sentence = f"{normalized['wine_style_ko']}로 즐기기 좋은 와인입니다."
    elif normalized["description"]:
        style_sentence = _clean_description_text(normalized["description"])

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
