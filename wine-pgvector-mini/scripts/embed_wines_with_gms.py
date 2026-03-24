from __future__ import annotations

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx
import psycopg
from dotenv import load_dotenv


DEFAULT_MODEL = "text-embedding-3-small"
DEFAULT_BASE_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"
ROOT_DIR = Path(__file__).resolve().parents[1]


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


def main() -> None:
    load_dotenv(ROOT_DIR / ".env")

    parser = argparse.ArgumentParser(description="Embed wine.embedding_text_ko with GMS and store vectors in PostgreSQL.")
    parser.add_argument("--db-host", default="127.0.0.1")
    parser.add_argument("--db-port", type=int, default=5432)
    parser.add_argument("--db-name", default="jupasu")
    parser.add_argument("--db-user", default="jupasu_user")
    parser.add_argument("--db-password", default="jupasu_pass")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--limit", type=int, default=0, help="0 means all rows without embedding")
    args = parser.parse_args()

    api_key = os.environ.get("GMS_API_KEY")
    if not api_key:
        raise SystemExit("GMS_API_KEY environment variable is required.")

    query = """
        SELECT id, embedding_text_ko
        FROM wine
        WHERE embedding_text_ko IS NOT NULL
          AND embedding_text_ko <> ''
          AND embedding IS NULL
        ORDER BY id
    """
    if args.limit > 0:
        query += f" LIMIT {args.limit}"

    with psycopg.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

        if not rows:
            print("No rows to embed.")
            return

        print(f"Embedding {len(rows)} wine rows with model {args.model}...")

        with httpx.Client() as client:
            for index, (wine_id, text) in enumerate(rows, start=1):
                embedding = fetch_embedding(client, api_key, args.model, text)
                vector = vector_literal(embedding)

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE wine
                        SET embedding = %s::vector,
                            embedding_model = %s,
                            embedding_generated_at = %s
                        WHERE id = %s
                        """,
                        (
                            vector,
                            args.model,
                            datetime.now(timezone.utc),
                            wine_id,
                        ),
                    )
                conn.commit()
                print(f"[{index}/{len(rows)}] updated wine id={wine_id}")


if __name__ == "__main__":
    main()
