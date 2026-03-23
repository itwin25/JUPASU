from wine_pgvector_mini.recommender import (
    CandidateWine,
    PreferenceProfile,
    direct_pairing_score,
    sort_candidates,
)


def make_candidate(
    wine_id: int,
    *,
    wine_type: str = "RED",
    body: float = 3.0,
    acidity: float = 3.0,
    tannin: float = 3.0,
    sweetness: float = 3.0,
    pairings: tuple[str, ...] = ("소고기",),
    similarity: float = 0.7,
    text: str = "오크와 블랙베리 향이 있는 레드 와인",
) -> CandidateWine:
    return CandidateWine(
        wine_id=wine_id,
        name_kr=f"와인 {wine_id}",
        wine_type=wine_type,
        country="프랑스",
        region="보르도",
        price=50000,
        body=body,
        acidity=acidity,
        tannin=tannin,
        sweetness=sweetness,
        grape_variety="Cabernet Sauvignon",
        style="보르도 스타일",
        embedding_preview=text,
        embedding_text_ko=text,
        food_pairings=pairings,
        food_similarity=similarity,
    )


def test_direct_pairing_score_matches_food_hint() -> None:
    assert direct_pairing_score("스테이크", ("소고기", "치즈")) == 1.0


def test_preference_reranks_candidate_order() -> None:
    profile = PreferenceProfile(
        body=5,
        tannin=4,
        preferred_wine_types=("RED",),
        preferred_flavors=("OAK",),
    )
    lighter = make_candidate(1, body=2.0, tannin=2.0, similarity=0.8, text="가벼운 과실향 중심 와인")
    fuller = make_candidate(2, body=4.8, tannin=4.2, similarity=0.72, text="오크와 블랙베리 향이 있는 묵직한 레드 와인")

    ranked = sort_candidates("스테이크", [lighter, fuller], profile)

    assert ranked[0][0].wine_id == 2
