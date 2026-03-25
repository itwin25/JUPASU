"""
generate_embeddings.py
======================
와인 DB의 description + style(embedding_text_ko) 컬럼을 합쳐서
GMS API로 1536차원 임베딩을 생성하고 저장합니다.

사용법: python generate_embeddings.py [--batch-size N]
"""
import psycopg
import json
import os
import sys
import time
import argparse
from app.core.config import get_settings
from app.services.rag.embedding_service import fetch_embedding


def get_conn_str():
    s = get_settings()
    return f"host={s.POSTGRES_HOST} port={s.POSTGRES_PORT} user={s.POSTGRES_USER} password={s.POSTGRES_PASSWORD} dbname={s.POSTGRES_DB}"


def ensure_embedding_columns(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE EXTENSION IF NOT EXISTS vector;
            ALTER TABLE wine ADD COLUMN IF NOT EXISTS embedding_text_ko TEXT;
            ALTER TABLE wine ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);
        """)
        # ivfflat 인덱스는 데이터가 충분히 들어간 뒤 생성
        conn.commit()
    print("✅ [1/3] embedding 컬럼 준비 완료")


def load_style_from_json(json_path):
    """JSON 파일에서 name_kr → Wine style 매핑을 미리 빌드한다."""
    with open(json_path, "r", encoding="utf-8") as f:
        wines = json.load(f)
    mapping = {}
    for w in wines:
        name_kr = w.get("name_kr", "")
        style   = w.get("all_facts", {}).get("Wine style", "")
        mapping[name_kr] = style
    return mapping


def build_embedding_text(style: str, description: str) -> str:
    """style + description을 합친 임베딩 텍스트 생성"""
    parts = [p for p in [style, description] if p and p.strip()]
    return " ".join(parts).strip()


def run(batch_size: int = 50):
    conn_str = get_conn_str()
    json_path = os.path.join("..", "data", "vivino_ultra_results_kr_food.json")

    # 1. 컬럼 준비
    with psycopg.connect(conn_str) as conn:
        ensure_embedding_columns(conn)

    # 2. JSON에서 style 매핑 로드
    print("✅ [2/3] JSON에서 style 데이터 로드 중...")
    style_map = load_style_from_json(json_path)
    print(f"    → {len(style_map)}개 와인 style 로드 완료")

    # 3. 임베딩이 없는 와인 처리
    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name_kr, description
                FROM wine
                WHERE embedding IS NULL
                ORDER BY id
            """)
            rows = cur.fetchall()

        total = len(rows)
        if total == 0:
            print("✅ 이미 모든 와인에 임베딩이 생성되어 있습니다!")
            return

        print(f"✅ [3/3] 임베딩 미생성 와인 {total}개 처리 시작...")
        success = 0
        skip    = 0

        for i, (wine_id, name_kr, description) in enumerate(rows):
            style = style_map.get(name_kr, "")
            text  = build_embedding_text(style, description or "")

            if not text:
                skip += 1
                continue

            try:
                vector = fetch_embedding(text)
                vector_str = "[" + ",".join(map(str, vector)) + "]"

                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE wine SET embedding = %s::vector(1536), embedding_text_ko = %s WHERE id = %s",
                        (vector_str, text, wine_id)
                    )

                success += 1

                if success % batch_size == 0:
                    conn.commit()
                    print(f"  🍷 {success}/{total} 완료 (skip: {skip})...")

            except Exception as e:
                print(f"  ⚠️  {name_kr} 임베딩 오류: {e}")
                time.sleep(1)   # rate-limit 대비 잠시 대기
                continue

        conn.commit()

        # 4. ivfflat 인덱스 생성 (데이터가 다 들어간 뒤)
        with conn.cursor() as cur:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_wine_embedding_ivfflat
                ON wine USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 50);
            """)
        conn.commit()

    print(f"\n🎉 완료! 성공: {success}개 / 스킵(텍스트 없음): {skip}개 / 전체: {total}개")
    print("이제 python test_rag.py 를 실행해보세요!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=50)
    args = parser.parse_args()
    run(batch_size=args.batch_size)
