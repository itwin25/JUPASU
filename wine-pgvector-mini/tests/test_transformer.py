from wine_pgvector_mini.transformer import (
    build_embedding_text_ko,
    build_food_query_text,
    build_pgvector_document,
    build_wine_narrative_ko,
    normalize_wine,
)


SAMPLE_WINE = {
    "wine_name": "Anvers Anvers The Warrior Shiraz 2005",
    "winery": "Anvers",
    "country": "Australia",
    "region": "Langhorne Creek",
    "wine_type": "Red",
    "all_facts": {
        "Winery": "Anvers",
        "Grapes": "Shiraz/Syrah",
        "Region": "Langhorne Creek",
        "Wine style": "South Australia Shiraz",
    },
    "food_pairings": ["사냥 동물", "소고기", "양고기"],
    "taste_profile": {
        "acidity": "62%",
        "boldness": "97%",
        "sweetness": "44%",
        "tannic": "61%",
    },
    "taste_notes": [
        {"group": "Black Fruit", "keyword": "blackberry, plum, black cherry", "mentions": "17 mentions"},
        {"group": "Oak", "keyword": "chocolate, oak, cigar box", "mentions": "15 mentions"},
    ],
    "ratings": {"average": 4.2, "count": 268},
    "price": "₩221,840",
    "name_kr": "안베르 안베르 더 워리어 시라즈 2005",
    "description": "Full-bodied red wine with berry fruit and spice.",
}


def test_normalize_wine():
    normalized = normalize_wine(SAMPLE_WINE)

    assert normalized["wine_type"] == "red wine"
    assert normalized["wine_type_ko"] == "레드 와인"
    assert normalized["country_ko"] == "호주"
    assert normalized["region_ko"] == "랭혼 크릭"
    assert normalized["grapes"] == ["Shiraz"]
    assert normalized["grapes_ko"] == ["시라즈"]
    assert normalized["food_pairings"] == ["game meat", "beef", "lamb"]
    assert normalized["taste"]["boldness"] == "very full-bodied"


def test_build_pgvector_document():
    document = build_pgvector_document(SAMPLE_WINE)

    assert document.wine_name == "안베르 안베르 더 워리어 시라즈 2005"
    assert "Pairs well with: game meat, beef, lamb" in document.embedding_text
    assert document.metadata["wine_type"] == "red wine"


def test_build_food_query_text():
    query_text = build_food_query_text("steak with black pepper sauce")

    assert "steak with black pepper sauce" in query_text
    assert "body, acidity, tannin, sweetness, aroma" in query_text


def test_build_wine_narrative_ko():
    narrative = build_wine_narrative_ko(SAMPLE_WINE)

    assert "호주 랭혼 크릭" in narrative
    assert "레드 와인" in narrative
    assert "소고기" in narrative
    assert "양고기" in narrative


def test_build_embedding_text_ko():
    text = build_embedding_text_ko(SAMPLE_WINE)

    assert "호주 랭혼 크릭" in text
    assert "레드 와인" in text
    assert "시라즈 품종 기반" in text
    assert "사냥육, 소고기, 양고기" in text
    assert "사우스 오스트레일리아 시라즈 스타일" in text
