from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


TYPE_LABELS = {
    "RED": "레드 와인",
    "WHITE": "화이트 와인",
    "ROSE": "로제 와인",
    "SPARKLING": "스파클링 와인",
    "DESSERT": "디저트 와인",
    "FORTIFIED": "주정 강화 와인",
}

COUNTRY_LABELS = {
    "Australia": "호주",
    "New Zealand": "뉴질랜드",
    "France": "프랑스",
    "Spain": "스페인",
    "Italy": "이탈리아",
    "United States": "미국",
    "USA": "미국",
    "Argentina": "아르헨티나",
    "Chile": "칠레",
    "South Africa": "남아프리카공화국",
    "Portugal": "포르투갈",
    "Germany": "독일",
    "Austria": "오스트리아",
    "Switzerland": "스위스",
    "Moldova": "몰도바",
}

REGION_LABELS = {
    "Central Otago": "센트럴 오타고",
    "Valais": "발레",
    "Bio-Bio Valley": "비오비오 밸리",
    "Willamette Valley": "윌라멧 밸리",
    "Moldova": "몰도바",
    "Bannockburn": "배넉번",
    "Alsace": "알자스",
    "Bordeaux": "보르도",
    "Bourgogne": "부르고뉴",
    "Rioja": "리오하",
    "Mendoza": "멘도사",
}

PAIRING_LABELS = {
    "사냥 동물": "풍미가 강한 육류 요리",
}

FLAVOR_LABELS = {
    "FRUIT": "과실향",
    "FLOWER": "꽃향",
    "BERRY": "베리향",
    "SPICE": "스파이스",
    "OAK": "오크향",
}

FLAVOR_KEYWORDS = {
    "FRUIT": [
        "과실",
        "복숭아",
        "사과",
        "배",
        "살구",
        "자두",
        "시트러스",
        "레몬",
        "라임",
        "오렌지",
        "자몽",
        "열대 과일",
    ],
    "FLOWER": [
        "꽃",
        "플로럴",
        "장미",
        "제비꽃",
        "블라썸",
        "자스민",
    ],
    "BERRY": [
        "베리",
        "블랙베리",
        "블루베리",
        "체리",
        "딸기",
        "라즈베리",
        "카시스",
        "검은 과실",
        "붉은 과실",
    ],
    "SPICE": [
        "스파이스",
        "후추",
        "시나몬",
        "정향",
        "팔각",
        "유칼립투스",
        "향신료",
    ],
    "OAK": [
        "오크",
        "바닐라",
        "초콜릿",
        "토스트",
        "시가 박스",
        "담배",
        "모카",
    ],
}

FOOD_HINTS = {
    "소고기": ["소고기", "스테이크", "갈비", "불고기", "한우", "비프", "버거"],
    "양고기": ["양고기", "양갈비", "램", "lamb"],
    "닭고기": ["닭고기", "치킨", "닭갈비", "삼계탕"],
    "돼지고기": ["돼지고기", "삼겹살", "목살", "포크", "보쌈", "제육"],
    "해산물": ["해산물", "새우", "굴", "조개", "생선", "회", "연어", "참치"],
    "파스타": ["파스타", "스파게티", "리조또", "라자냐"],
    "치즈": ["치즈", "브리", "고르곤졸라", "체다"],
    "매운 음식": ["매운", "마라", "짬뽕", "떡볶이", "불닭", "매콤"],
    "채식/샐러드": ["샐러드", "채식", "비건", "버섯 요리"],
    "디저트": ["디저트", "케이크", "초콜릿 디저트", "푸딩"],
    "과일 디저트": ["과일 디저트", "과일 타르트", "과일 케이크"],
    "사냥 동물": ["사냥", "오리", "사슴", "멧돼지", "훈제 오리"],
    "에피타이저/스낵": ["에피타이저", "스낵", "안주", "카나페", "핑거푸드"],
    "식전주": ["식전", "브런치", "가벼운 안주"],
    "염소 우유 치즈": ["염소 치즈", "고트 치즈"],
    "가공 식품": ["햄", "소시지", "베이컨", "육포", "살라미"],
}

FOOD_REASON_TEMPLATES = {
    "소고기": "고기 맛을 자연스럽게 받쳐줘서 식사와 함께 즐기기 좋아요",
    "양고기": "진한 육류의 풍미를 눌러버리지 않고 균형 있게 어우러져요",
    "닭고기": "너무 무겁지 않게 닭고기 맛을 살려줘서 편하게 곁들이기 좋아요",
    "돼지고기": "기름진 느낌을 과하게 만들지 않아 음식과 자연스럽게 어우러져요",
    "해산물": "해산물의 섬세한 맛을 해치지 않고 깔끔하게 이어줘요",
    "파스타": "식사와 함께 마셨을 때 소스의 풍미를 해치지 않아 잘 어울려요",
    "치즈": "치즈의 고소하고 짭짤한 맛과 자연스럽게 어우러져요",
    "매운 음식": "매운맛을 조금 더 편안하게 느끼게 해줘서 함께 즐기기 좋아요",
    "채식/샐러드": "맛이 과하게 튀지 않아 가벼운 식사와 함께 즐기기 좋아요",
    "디저트": "달콤한 디저트와 함께했을 때 맛이 따로 놀지 않고 부드럽게 이어져요",
    "과일 디저트": "과일 디저트의 산뜻한 느낌과 자연스럽게 어우러져요",
    "사냥 동물": "풍미가 강한 육류 요리와 함께해도 존재감이 잘 살아나요",
    "에피타이저/스낵": "가벼운 안주와 함께 편하게 즐기기 좋은 스타일이에요",
    "식전주": "식사 전 가볍게 분위기를 열어주기에 좋은 스타일이에요",
    "염소 우유 치즈": "염소 치즈 특유의 향과 부드럽게 어우러져요",
    "가공 식품": "짭짤한 가공육류와 함께했을 때도 부담 없이 즐기기 좋아요",
}

METRIC_LABELS = {
    "body": "바디감",
    "acidity": "산미",
    "tannin": "탄닌",
    "sweetness": "당도",
}

METRIC_STYLE_LABELS = {
    "body": {
        1: "가볍고 산뜻한 스타일",
        2: "비교적 가벼운 스타일",
        3: "무난한 무게감의 스타일",
        4: "제법 묵직한 스타일",
        5: "진하고 묵직한 스타일",
    },
    "acidity": {
        1: "산미가 거의 도드라지지 않는 편",
        2: "산미가 부드러운 편",
        3: "산미가 과하지 않게 균형 잡힌 편",
        4: "산미가 또렷한 편",
        5: "산미가 선명하고 상쾌한 편",
    },
    "tannin": {
        1: "탄닌이 거의 부담 없는 편",
        2: "탄닌이 부드러운 편",
        3: "탄닌이 적당한 편",
        4: "탄닌 존재감이 제법 있는 편",
        5: "탄닌이 확실하게 느껴지는 편",
    },
    "sweetness": {
        1: "드라이한 편",
        2: "단맛이 많지 않은 편",
        3: "은은한 단맛이 있는 편",
        4: "단맛이 느껴지는 편",
        5: "달콤한 편",
    },
}

BEGINNER_PREFERENCE_LABELS = {
    "body": {
        1: "가볍고 산뜻하게 마실 수 있는 스타일",
        2: "부담 없이 마시기 좋은 비교적 가벼운 스타일",
        3: "너무 무겁지 않은 균형 잡힌 스타일",
        4: "제법 진하고 존재감 있는 스타일",
        5: "맛이 진하고 무게감이 확실한 스타일",
    },
    "acidity": {
        1: "새콤한 느낌이 거의 없는 부드러운 스타일",
        2: "산뜻함이 살짝만 느껴지는 스타일",
        3: "상큼함이 과하지 않게 어우러지는 스타일",
        4: "상큼한 느낌이 또렷한 스타일",
        5: "상큼함이 선명하게 살아 있는 스타일",
    },
    "tannin": {
        1: "입안이 거의 떫지 않은 부드러운 스타일",
        2: "입안을 살짝 잡아주는 정도의 스타일",
        3: "부드러움과 존재감이 균형 잡힌 스타일",
        4: "입안을 제법 또렷하게 잡아주는 스타일",
        5: "입안을 단단하게 잡아주는 느낌이 분명한 스타일",
    },
    "sweetness": {
        1: "단맛이 거의 없는 깔끔한 스타일",
        2: "단맛이 많지 않아 편하게 마시기 좋은 스타일",
        3: "은은하게 부드러운 단맛이 있는 스타일",
        4: "달콤함이 제법 느껴지는 스타일",
        5: "달콤한 맛이 분명한 스타일",
    },
}

NOTE_REASON_MAP = {
    "블랙베리": "짙은 과실향이 살아 있어",
    "블루베리": "짙은 베리 향이 살아 있어",
    "체리": "붉은 과실 느낌이 살아 있어",
    "붉은 과실": "산뜻한 과실 느낌이 살아 있어",
    "검은 과실": "짙은 과실 느낌이 살아 있어",
    "자두": "농익은 과실 느낌이 살아 있어",
    "오크": "은은한 오크 풍미가 더해져",
    "바닐라": "부드러운 바닐라 느낌이 더해져",
    "초콜릿": "달콤쌉싸름한 초콜릿 느낌이 있어",
    "후추": "살짝 스파이시한 매력이 있어서",
    "시나몬": "은은한 향신료 느낌이 있어서",
    "꽃": "은은한 꽃향이 살아 있어",
    "플로럴": "은은한 꽃향이 살아 있어",
    "레몬": "상큼한 느낌이 살아 있어",
    "시트러스": "상큼한 느낌이 살아 있어",
}


@dataclass(frozen=True)
class PreferenceProfile:
    sweetness: int | None = None
    acidity: int | None = None
    body: int | None = None
    tannin: int | None = None
    preferred_wine_types: tuple[str, ...] = ()
    preferred_flavors: tuple[str, ...] = ()
    preferred_price_min: int | None = None
    preferred_price_max: int | None = None

    def has_preferences(self) -> bool:
        return any(
            value is not None
            for value in (
                self.sweetness,
                self.acidity,
                self.body,
                self.tannin,
                self.preferred_price_min,
                self.preferred_price_max,
            )
        ) or bool(self.preferred_wine_types) or bool(self.preferred_flavors)


@dataclass(frozen=True)
class CandidateWine:
    wine_id: int
    name_kr: str
    wine_type: str
    country: str | None
    region: str | None
    price: int | None
    body: float | None
    acidity: float | None
    tannin: float | None
    sweetness: float | None
    grape_variety: str | None
    style: str | None
    embedding_preview: str
    embedding_text_ko: str
    food_pairings: tuple[str, ...]
    food_similarity: float


@dataclass(frozen=True)
class ScoreBreakdown:
    final_score: float
    food_score: float
    preference_score: float
    direct_pairing_score: float
    type_score: float | None
    flavor_score: float | None
    price_score: float | None
    metric_scores: dict[str, float]


def normalize_type(value: str) -> str:
    return (value or "").strip().upper()


def parse_csv_args(values: Iterable[str] | None) -> tuple[str, ...]:
    if not values:
        return ()

    items: list[str] = []
    for value in values:
        for token in value.split(","):
            normalized = token.strip()
            if normalized:
                items.append(normalized)
    return tuple(items)


def clamp_metric(value: float | None) -> float | None:
    if value is None:
        return None
    if value <= 0:
        return None
    return max(1.0, min(5.0, float(value)))


def metric_match_score(preferred: int | None, actual: float | None) -> float | None:
    actual_value = clamp_metric(actual)
    if preferred is None or actual_value is None:
        return None
    return max(0.0, 1.0 - (abs(float(preferred) - actual_value) / 4.0))


def price_match_score(price: int | None, minimum: int | None, maximum: int | None) -> float | None:
    if price is None or price <= 0:
        return None
    if minimum is None and maximum is None:
        return None

    if minimum is None:
        if price <= maximum:
            return 1.0
        distance = price - maximum
        tolerance = max(int(maximum * 0.25), 30000)
        return max(0.0, 1.0 - (distance / tolerance))

    if maximum is None:
        if price >= minimum:
            return 1.0
        distance = minimum - price
        tolerance = max(int(minimum * 0.25), 30000)
        return max(0.0, 1.0 - (distance / tolerance))

    if minimum <= price <= maximum:
        return 1.0

    distance = minimum - price if price < minimum else price - maximum
    price_range = max(maximum - minimum, 30000)
    return max(0.0, 1.0 - (distance / price_range))


def flavor_match_score(preferred_flavors: tuple[str, ...], wine: CandidateWine) -> float | None:
    if not preferred_flavors:
        return None

    text = " ".join(
        part.lower()
        for part in (
            wine.embedding_text_ko or "",
            wine.embedding_preview or "",
            wine.style or "",
            wine.grape_variety or "",
        )
    )
    hits = 0
    for flavor in preferred_flavors:
        keywords = FLAVOR_KEYWORDS.get(flavor, [])
        if any(keyword.lower() in text for keyword in keywords):
            hits += 1
    return hits / len(preferred_flavors)


def infer_food_categories(food_text: str) -> set[str]:
    lowered = food_text.lower()
    categories: set[str] = set()
    for category, hints in FOOD_HINTS.items():
        if any(hint.lower() in lowered for hint in hints):
            categories.add(category)
    return categories


def primary_food_category(food_text: str, wine: CandidateWine | None = None) -> str | None:
    inferred = infer_food_categories(food_text)
    if wine:
        for pairing in wine.food_pairings:
            if pairing in inferred:
                return pairing
        for pairing in wine.food_pairings:
            if pairing in FOOD_REASON_TEMPLATES:
                return pairing
    if inferred:
        return sorted(inferred)[0]
    return None


def direct_pairing_score(food_text: str, pairings: tuple[str, ...]) -> float:
    if not pairings:
        return 0.0

    inferred = infer_food_categories(food_text)
    pairing_set = {pairing.strip() for pairing in pairings if pairing and pairing.strip()}

    if inferred and inferred & pairing_set:
        return 1.0

    lowered = food_text.lower()
    for pairing in pairing_set:
        if pairing.lower() in lowered:
            return 0.8

    return 0.0


def display_pairing(pairing: str) -> str:
    return PAIRING_LABELS.get(pairing, pairing)


def display_type_label(wine_type: str) -> str:
    return TYPE_LABELS.get(normalize_type(wine_type), wine_type)


def display_country(country: str | None) -> str | None:
    if not country:
        return None
    return COUNTRY_LABELS.get(country, country)


def display_region(region: str | None) -> str | None:
    if not region:
        return None
    return REGION_LABELS.get(region, region)


def to_display_percent(final_score: float) -> int:
    normalized = max(0.0, min(1.0, final_score))
    return round(60 + (normalized * 40))


def describe_metric(metric: str, value: float | None) -> str | None:
    actual = clamp_metric(value)
    if actual is None:
        return None
    rounded = max(1, min(5, int(round(actual))))
    return METRIC_STYLE_LABELS[metric][rounded]


def describe_metric_for_beginner(metric: str, value: int | None) -> str | None:
    if value is None:
        return None
    return BEGINNER_PREFERENCE_LABELS[metric][value]


def describe_preferred_flavors(profile: PreferenceProfile) -> str | None:
    if not profile.preferred_flavors:
        return None
    labels = [FLAVOR_LABELS.get(item, item) for item in profile.preferred_flavors[:2]]
    if len(labels) == 1:
        return labels[0]
    return f"{labels[0]}과 {labels[1]}"


def extract_note_reason(wine: CandidateWine) -> str | None:
    text = " ".join(
        part for part in (wine.embedding_text_ko, wine.embedding_preview, wine.style or "", wine.grape_variety or "") if part
    )
    for keyword, phrase in NOTE_REASON_MAP.items():
        if keyword in text:
            return phrase
    return None


def food_pairing_sentence(food_text: str, wine: CandidateWine, display_pairings: list[str], variant_seed: int) -> str:
    category = primary_food_category(food_text, wine)
    food_reason = FOOD_REASON_TEMPLATES.get(category, "음식과 와인의 맛이 한쪽으로 치우치지 않고 자연스럽게 어우러져요")
    templates = [
        food_reason,
        f"{food_reason} 그래서 식사와 함께 즐기기 좋아요",
        f"{food_reason} 한쪽 맛이 튀지 않아 비교적 편하게 곁들이기 좋아요",
    ]
    return templates[variant_seed % len(templates)]


def preferred_metric_sentence(profile: PreferenceProfile, wine: CandidateWine, breakdown: ScoreBreakdown) -> str | None:
    if not breakdown.metric_scores:
        return None

    best_metric, score = max(breakdown.metric_scores.items(), key=lambda item: item[1])
    if score < 0.7:
        return None

    preferred_value = getattr(profile, best_metric)
    metric_desc = describe_metric_for_beginner(best_metric, preferred_value)
    if preferred_value is None or metric_desc is None:
        return None

    return f"평소 {metric_desc}을 좋아하신다면, 이 와인도 그 취향에 잘 맞는 편이에요"


def pick_food_reason(food_text: str, wine: CandidateWine, breakdown: ScoreBreakdown, variant_seed: int) -> str:
    display_pairings = [display_pairing(pairing) for pairing in wine.food_pairings]

    if breakdown.direct_pairing_score >= 0.99 or breakdown.food_score >= 0.55:
        return food_pairing_sentence(food_text, wine, display_pairings, variant_seed)

    return "식사와 함께했을 때 맛이 한쪽으로 치우치지 않아 무난하게 즐기기 좋아요"


def pick_flavor_reason(wine: CandidateWine, breakdown: ScoreBreakdown, profile: PreferenceProfile) -> str | None:
    if breakdown.flavor_score is not None and breakdown.flavor_score >= 0.6:
        flavor_desc = describe_preferred_flavors(profile)
        if flavor_desc:
            return f"평소 좋아하시는 {flavor_desc} 느낌이 있어서 취향에도 잘 맞아요"
    return None


def pick_metric_reason(wine: CandidateWine, breakdown: ScoreBreakdown, profile: PreferenceProfile) -> str | None:
    return preferred_metric_sentence(profile, wine, breakdown)


def pick_type_reason(wine: CandidateWine, breakdown: ScoreBreakdown, profile: PreferenceProfile) -> str | None:
    if breakdown.type_score == 1.0 and profile.preferred_wine_types:
        return f"평소 좋아하시는 {TYPE_LABELS.get(normalize_type(wine.wine_type), wine.wine_type)} 계열이라 편하게 즐기시기 좋아요"
    return None


def pick_price_reason(wine: CandidateWine, breakdown: ScoreBreakdown) -> str | None:
    if breakdown.price_score is not None and breakdown.price_score >= 0.9 and wine.price:
        return f"가격도 부담이 적은 편이라 편하게 선택하시기 좋아요 ({wine.price:,}원)"
    return None


def pick_preference_reason(wine: CandidateWine, breakdown: ScoreBreakdown, profile: PreferenceProfile) -> str | None:
    for builder in (
        pick_metric_reason,
        pick_flavor_reason,
        pick_type_reason,
    ):
        reason = builder(wine, breakdown, profile)
        if reason:
            return reason

    return pick_price_reason(wine, breakdown)


def pick_signature_reason(wine: CandidateWine) -> str | None:
    note_reason = extract_note_reason(wine)
    if note_reason:
        return f"{note_reason} 이 와인 특유의 매력을 편하게 느끼실 수 있어요"

    body_desc = describe_metric("body", wine.body)
    if body_desc:
        return f"{body_desc}이라 식사와 함께 마셨을 때 부담이 크지 않아요"

    return None


def combine_preference_and_signature_reason(
    wine: CandidateWine,
    breakdown: ScoreBreakdown,
    profile: PreferenceProfile,
) -> str | None:
    signature_reason = pick_signature_reason(wine)
    preference_reason = pick_preference_reason(wine, breakdown, profile)

    if signature_reason and preference_reason:
        if "오크향" in preference_reason:
            return f"{signature_reason} 평소 오크향이 있는 스타일을 좋아하신다면 특히 잘 맞아요"
        if "레드 와인" in preference_reason:
            return f"{signature_reason} 평소 좋아하시는 레드 와인 계열이라 더 편하게 즐기시기 좋아요"
        return preference_reason

    return preference_reason or signature_reason


def pick_beginner_reason(wine: CandidateWine, breakdown: ScoreBreakdown) -> str:
    note_reason = extract_note_reason(wine)
    if note_reason:
        return f"{note_reason} 처음 드셔보셔도 비교적 쉽게 매력을 느끼실 수 있어요"

    if normalize_type(wine.wine_type) == "RED":
        return "너무 어렵거나 부담스럽지 않은 스타일이라 처음 드시는 분께도 추천드리기 좋아요"

    return "와인을 자주 드시지 않는 분도 편하게 즐기기 좋은 스타일이에요"


def build_preference_profile(args: object) -> PreferenceProfile:
    wine_types = tuple(normalize_type(value) for value in parse_csv_args(getattr(args, "preferred_type", None)))
    flavors = tuple(normalize_type(value) for value in parse_csv_args(getattr(args, "preferred_flavor", None)))
    return PreferenceProfile(
        sweetness=getattr(args, "sweetness", None),
        acidity=getattr(args, "acidity", None),
        body=getattr(args, "body", None),
        tannin=getattr(args, "tannin", None),
        preferred_wine_types=wine_types,
        preferred_flavors=flavors,
        preferred_price_min=getattr(args, "price_min", None),
        preferred_price_max=getattr(args, "price_max", None),
    )


def calculate_preference_score(profile: PreferenceProfile, wine: CandidateWine) -> tuple[float, dict[str, float], float | None, float | None, float | None]:
    metric_scores = {
        "body": metric_match_score(profile.body, wine.body),
        "acidity": metric_match_score(profile.acidity, wine.acidity),
        "tannin": metric_match_score(profile.tannin, wine.tannin),
        "sweetness": metric_match_score(profile.sweetness, wine.sweetness),
    }

    type_score = None
    if profile.preferred_wine_types:
        type_score = 1.0 if normalize_type(wine.wine_type) in profile.preferred_wine_types else 0.0

    flavor_score = flavor_match_score(profile.preferred_flavors, wine)
    price_score = price_match_score(wine.price, profile.preferred_price_min, profile.preferred_price_max)

    collected = [score for score in metric_scores.values() if score is not None]
    if type_score is not None:
        collected.append(type_score)
    if flavor_score is not None:
        collected.append(flavor_score)
    if price_score is not None:
        collected.append(price_score)

    if not collected:
        return 0.0, {key: value for key, value in metric_scores.items() if value is not None}, type_score, flavor_score, price_score

    return sum(collected) / len(collected), {key: value for key, value in metric_scores.items() if value is not None}, type_score, flavor_score, price_score


def score_candidate(food_text: str, wine: CandidateWine, profile: PreferenceProfile) -> ScoreBreakdown:
    pairing_score = direct_pairing_score(food_text, wine.food_pairings)
    preference_score, metric_scores, type_score, flavor_score, price_score = calculate_preference_score(profile, wine)

    food_weight = 0.7 if not profile.has_preferences() else 0.55
    preference_weight = 0.0 if not profile.has_preferences() else 0.35
    pairing_weight = 0.30 if not profile.has_preferences() else 0.10

    final_score = (
        wine.food_similarity * food_weight
        + preference_score * preference_weight
        + pairing_score * pairing_weight
    )

    return ScoreBreakdown(
        final_score=final_score,
        food_score=wine.food_similarity,
        preference_score=preference_score,
        direct_pairing_score=pairing_score,
        type_score=type_score,
        flavor_score=flavor_score,
        price_score=price_score,
        metric_scores=metric_scores,
    )


def sort_candidates(food_text: str, wines: Iterable[CandidateWine], profile: PreferenceProfile) -> list[tuple[CandidateWine, ScoreBreakdown]]:
    ranked = [(wine, score_candidate(food_text, wine, profile)) for wine in wines]
    ranked.sort(key=lambda item: item[1].final_score, reverse=True)
    return ranked


def summarize_profile(profile: PreferenceProfile) -> str:
    parts: list[str] = []
    if profile.preferred_wine_types:
        labels = [TYPE_LABELS.get(item, item) for item in profile.preferred_wine_types]
        parts.append(f"선호 타입: {', '.join(labels)}")
    for key in ("body", "acidity", "tannin", "sweetness"):
        value = getattr(profile, key)
        if value is not None:
            parts.append(f"{METRIC_LABELS[key]} {value}/5")
    if profile.preferred_flavors:
        labels = [FLAVOR_LABELS.get(item, item) for item in profile.preferred_flavors]
        parts.append(f"선호 향: {', '.join(labels)}")
    if profile.preferred_price_min is not None or profile.preferred_price_max is not None:
        minimum = profile.preferred_price_min or 0
        maximum = profile.preferred_price_max or "이상"
        parts.append(f"선호 가격대: {minimum:,}원~{maximum if isinstance(maximum, str) else f'{maximum:,}원'}")
    return " / ".join(parts) if parts else "선호 조건 없음"


def build_user_reason(food_text: str, wine: CandidateWine, breakdown: ScoreBreakdown, profile: PreferenceProfile) -> str:
    variant_seed = wine.wine_id % 4
    food_reason = pick_food_reason(food_text, wine, breakdown, variant_seed).rstrip(".")

    if profile.has_preferences():
        preference_reason = combine_preference_and_signature_reason(wine, breakdown, profile)
        if preference_reason:
            return f"{wine.name_kr}는 {food_text}와 잘 어울리는 와인이에요. {food_reason} {preference_reason.rstrip('.')}."
        return f"{food_reason}."

    beginner_reason = pick_beginner_reason(wine, breakdown).rstrip(".")
    return f"{wine.name_kr}는 {food_text}와 잘 어울리는 와인이에요. {food_reason} {beginner_reason}."
