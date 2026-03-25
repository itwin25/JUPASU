from app.db.database import get_db_connection

def find_candidate_wines_by_embedding(
    query_embedding: list[float],
    limit: int = 30,
    wine_type: str | None = None   # ex) "SPARKLING", "RED", "WHITE" ...
) -> list[dict]:
    """
    pgvector를 이용해 주어진 임베딩과 코사인 유사도가 높은 와인 N개를 찾습니다.
    wine_type이 주어지면 해당 타입으로만 필터링합니다.
    """
    query_vector = "[" + ",".join(f"{v:.12f}" for v in query_embedding) + "]"

    # WHERE 절 동적 구성
    type_filter = "AND w.type = %s" if wine_type else ""
    params = [query_vector, query_vector]
    if wine_type:
        params.insert(1, wine_type)   # vector 첫 번째 뒤, 두 번째 vector 앞에 삽입
    params.append(limit)

    candidates = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    w.id,
                    w.name_kr,
                    w.price,
                    w.type,
                    1 - (w.embedding <=> %s::vector) AS similarity_score
                FROM wine w
                WHERE w.embedding IS NOT NULL
                {type_filter}
                ORDER BY w.embedding <=> %s::vector
                LIMIT %s
                """,
                params
            )
            for row in cur.fetchall():
                candidates.append({
                    "wine_id": row[0],
                    "name_kr": row[1],
                    "price": row[2],
                    "type": row[3],
                    "similarity_score": float(row[4])
                })
    return candidates

