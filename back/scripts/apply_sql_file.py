from __future__ import annotations

import argparse
from pathlib import Path

import psycopg


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RECOMMENDATION_SQL_DIR = ROOT / "src" / "main" / "resources" / "sql" / "recommendation"


def resolve_sql_path(value: str) -> Path:
    candidate = Path(value)
    if candidate.is_file():
        return candidate

    fallback = DEFAULT_RECOMMENDATION_SQL_DIR / value
    if fallback.is_file():
        return fallback

    raise FileNotFoundError(f"SQL file not found: {value}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply a SQL file to PostgreSQL from the terminal.")
    parser.add_argument(
        "sql_file",
        help="Absolute SQL path or file name under back/src/main/resources/sql/recommendation",
    )
    parser.add_argument("--db-host", default="127.0.0.1")
    parser.add_argument("--db-port", type=int, default=15432)
    parser.add_argument("--db-name", default="jupasu")
    parser.add_argument("--db-user", default="jupasu_user")
    parser.add_argument("--db-password", default="jupasu_pass")
    args = parser.parse_args()

    sql_path = resolve_sql_path(args.sql_file)
    sql_text = sql_path.read_text(encoding="utf-8")

    with psycopg.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(sql_text)
        conn.commit()

    print(f"Applied SQL: {sql_path}")


if __name__ == "__main__":
    main()
