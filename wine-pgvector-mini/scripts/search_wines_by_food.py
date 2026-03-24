from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import httpx
import psycopg
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from wine_pgvector_mini.recommender import (  # noqa: E402
    CandidateWine,
    build_preference_profile,
    build_user_reason,
    display_country,
    display_region,
    display_type_label,
    sort_candidates,
    summarize_profile,
    to_display_percent,
)


DEFAULT_MODEL = "text-embedding-3-small"
DEFAULT_BASE_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"


def build_food_query_text(food_text: str) -> str:
    return (
        f"사용자가 찾는 음식은 {food_text}입니다. "
        "이 음식과 잘 어울리는 와인을 찾기 위해 바디감, 산미, 탄닌, 당도, 향, 풍미 강도, 음식 페어링 정보를 함께 고려합니다."
    )


def simplify_origin(country: str | None, region: str | None) -> str:
    display_country_text = display_country(country)
    display_region_text = display_region(region)
    if display_country_text and display_region_text:
        return f"{display_country_text} / {display_region_text}"
    return display_country_text or display_region_text or "산지 정보 없음"


def fetch_embedding(client: httpx.Client, api_key: str, model: str, text: str) -> list[float]:
    response = client.post(
        DEFAULT_BASE_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={
            "model": model,
            "input": text,
        },
        timeout=60.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["data"][0]["embedding"]


def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.12f}" for value in values) + "]"


def build_candidate(row: tuple[object, ...]) -> CandidateWine:
    (
        wine_id,
        name_kr,
        wine_type,
        country,
        region,
        price,
        body,
        acidity,
        tannin,
        sweetness,
        grape_variety,
        style,
        embedding_preview,
        embedding_text_ko,
        food_pairings,
        food_similarity,
    ) = row

    return CandidateWine(
        wine_id=int(wine_id),
        name_kr=str(name_kr or "이름 없는 와인"),
        wine_type=str(wine_type or ""),
        country=str(country) if country else None,
        region=str(region) if region else None,
        price=int(price) if price else None,
        body=float(body) if body is not None else None,
        acidity=float(acidity) if acidity is not None else None,
        tannin=float(tannin) if tannin is not None else None,
        sweetness=float(sweetness) if sweetness is not None else None,
        grape_variety=str(grape_variety) if grape_variety else None,
        style=str(style) if style else None,
        embedding_preview=str(embedding_preview or ""),
        embedding_text_ko=str(embedding_text_ko or ""),
        food_pairings=tuple(food_pairings or []),
        food_similarity=float(food_similarity or 0.0),
    )


def main() -> None:
    load_dotenv(ROOT_DIR / ".env")

    parser = argparse.ArgumentParser(description="Search wine recommendations by food and user preference.")
    parser.add_argument("food_text", help="Food description to search with")
    parser.add_argument("--db-host", default="127.0.0.1")
    parser.add_argument("--db-port", type=int, default=15432)
    parser.add_argument("--db-name", default="jupasu")
    parser.add_argument("--db-user", default="jupasu_user")
    parser.add_argument("--db-password", default="jupasu_pass")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--candidate-limit", type=int, default=30)
    parser.add_argument("--body", type=int, choices=range(1, 6))
    parser.add_argument("--acidity", type=int, choices=range(1, 6))
    parser.add_argument("--tannin", type=int, choices=range(1, 6))
    parser.add_argument("--sweetness", type=int, choices=range(1, 6))
    parser.add_argument("--preferred-type", action="append", help="Preferred wine type. Repeat or comma-separate. Example: RED,WHITE")
    parser.add_argument("--preferred-flavor", action="append", help="Preferred flavor enum. Repeat or comma-separate. Example: FRUIT,OAK")
    parser.add_argument("--price-min", type=int)
    parser.add_argument("--price-max", type=int)
    parser.add_argument("--debug", action="store_true", help="Show raw similarity and score breakdown")
    args = parser.parse_args()

    api_key = os.environ.get("GMS_API_KEY")
    if not api_key:
        raise SystemExit("GMS_API_KEY environment variable is required.")

    profile = build_preference_profile(args)
    query_text = build_food_query_text(args.food_text)

    with httpx.Client() as client:
        embedding = fetch_embedding(client, api_key, args.model, query_text)

    query_vector = vector_literal(embedding)

    with psycopg.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    w.id,
                    w.name_kr,
                    w.type,
                    w.country,
                    w.region,
                    w.price,
                    w.body,
                    w.acidity,
                    w.tannin,
                    w.sweetness,
                    w.grape_variety,
                    w.style,
                    LEFT(w.embedding_text_ko, 220) AS embedding_preview,
                    w.embedding_text_ko,
                    COALESCE(array_agg(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL), '{}') AS food_pairings,
                    1 - (w.embedding <=> %s::vector) AS food_similarity
                FROM wine w
                LEFT JOIN wine_food_pairing wfp ON wfp.wine_id = w.id
                LEFT JOIN food f ON f.id = wfp.food_id
                WHERE w.embedding IS NOT NULL
                GROUP BY
                    w.id, w.name_kr, w.type, w.country, w.region, w.price,
                    w.body, w.acidity, w.tannin, w.sweetness, w.grape_variety, w.style,
                    w.embedding_text_ko, w.embedding
                ORDER BY w.embedding <=> %s::vector
                LIMIT %s
                """,
                (query_vector, query_vector, args.candidate_limit),
            )
            candidates = [build_candidate(row) for row in cur.fetchall()]

    ranked = sort_candidates(args.food_text, candidates, profile)[: args.limit]

    if args.debug:
        print(f"[food_query] {args.food_text}")
        print(f"[query_text] {query_text}")
        print(f"[preference] {summarize_profile(profile)}")
        print()
        for rank, (wine, score) in enumerate(ranked, start=1):
            print(f"[{rank}] id={wine.wine_id} name={wine.name_kr}")
            print(f"    type={display_type_label(wine.wine_type)} origin={simplify_origin(wine.country, wine.region)}")
            print(f"    final_score={score.final_score:.4f}")
            print(f"    food_score={score.food_score:.4f} preference_score={score.preference_score:.4f} direct_pairing_score={score.direct_pairing_score:.4f}")
            print(f"    type_score={score.type_score} flavor_score={score.flavor_score} price_score={score.price_score}")
            print(f"    metric_scores={score.metric_scores}")
            print(f"    pairings={', '.join(wine.food_pairings) if wine.food_pairings else '없음'}")
            print(f"    preview={wine.embedding_preview}")
            print()
        return

    print(f"'{args.food_text}'와 어울리고 사용자 취향까지 반영한 와인 추천 결과입니다.")
    print(f"적용된 취향 조건: {summarize_profile(profile)}")
    print()

    for rank, (wine, score) in enumerate(ranked, start=1):
        origin_text = simplify_origin(wine.country, wine.region)
        print(f"{rank}. {wine.name_kr}")
        print(f"   타입: {display_type_label(wine.wine_type)}")
        print(f"   산지: {origin_text}")
        if wine.price:
            print(f"   가격: {wine.price:,}원")
        print(f"   추천 이유: {build_user_reason(args.food_text, wine, score, profile)}")
        print(f"   음식/취향 매칭률: {to_display_percent(score.final_score)}%")
        print()


if __name__ == "__main__":
    main()
