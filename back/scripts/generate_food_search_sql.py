from __future__ import annotations

import argparse
import os
from pathlib import Path

import httpx


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_SQL = (
    ROOT
    / "back"
    / "src"
    / "main"
    / "resources"
    / "sql"
    / "recommendation"
    / "05_test_food_search.sql"
)
DEFAULT_MODEL = "text-embedding-3-small"
DEFAULT_BASE_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"


def load_dotenv_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'").strip('"'))


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


def build_food_query_text(food_text: str) -> str:
    return (
        f"사용자가 찾는 음식은 {food_text}입니다. "
        "이 음식과 잘 어울리는 와인을 찾기 위해 바디감, 산미, 탄닌, 당도, 향, 풍미 강도, 음식 페어링 정보를 함께 고려합니다."
    )


def build_sql(vector: str, limit: int) -> str:
    return f"""WITH query AS (
    SELECT '{vector}'::vector AS embedding
)
SELECT
    w.id,
    w.name_kr,
    w.type,
    w.country,
    w.region,
    w.price,
    ROUND((1 - (w.embedding <=> query.embedding))::numeric, 4) AS similarity,
    LEFT(w.embedding_text_ko, 220) AS preview,
    COALESCE(array_agg(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL), '{{}}') AS food_pairings
FROM wine w
CROSS JOIN query
LEFT JOIN wine_food_pairing wfp ON wfp.wine_id = w.id
LEFT JOIN food f ON f.id = wfp.food_id
WHERE w.embedding IS NOT NULL
GROUP BY
    w.id, w.name_kr, w.type, w.country, w.region, w.price, w.embedding_text_ko, w.embedding, query.embedding
ORDER BY w.embedding <=> query.embedding
LIMIT {limit};
"""


def main() -> None:
    load_dotenv_file(ROOT / ".env")
    load_dotenv_file(ROOT / "back" / ".env")

    parser = argparse.ArgumentParser(description="Generate SQL to test PGVector wine search by food query.")
    parser.add_argument("food_text", help="Food text to search with")
    parser.add_argument("--output-sql", default=str(DEFAULT_OUTPUT_SQL))
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    api_key = os.environ.get("GMS_API_KEY")
    if not api_key:
        raise SystemExit("GMS_API_KEY environment variable is required.")

    query_text = build_food_query_text(args.food_text)
    with httpx.Client() as client:
        embedding = fetch_embedding(client, api_key, args.model, query_text)

    sql = build_sql(vector_literal(embedding), args.limit)
    output_path = Path(args.output_sql)
    output_path.write_text(sql, encoding="utf-8")
    print(f"Saved SQL to {output_path}")
    print(f"Food query: {args.food_text}")
    print(f"Search query text: {query_text}")


if __name__ == "__main__":
    main()
