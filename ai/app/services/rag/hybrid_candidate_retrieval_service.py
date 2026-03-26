import httpx

from app.db.repositories.chat_wine_repository import find_candidate_wines_by_embedding
from app.services.rag.chat_retrieval_service import detect_wine_type
from app.services.rag.embedding_service import fetch_embedding


BACKEND_RECOMMEND_API_URL = "http://localhost:8080/api/wines/recommend/rag"


def perform_hybrid_candidate_recommendation(
    user_id: str,
    query: str,
    friend_ids: list[str] | None = None,
) -> list[dict]:
    """
    로컬 개발용 하이브리드 추천 경로.
    1. 질문을 임베딩해 pgvector 후보를 먼저 추출
    2. 후보 ID만 백엔드에 보내 재정렬
    3. 백엔드 실패 시 pgvector 결과로 폴백
    """
    print("⏳ [1단계] GMS 임베딩 API 통신 요청 중...")
    embedding = fetch_embedding(text=query)
    print("✅ [1단계] 임베딩 완료!")

    print("⏳ [2단계] PostgreSQL DB pgvector 검색 연산 중...")
    detected_type = detect_wine_type(query)
    if detected_type:
        print(f"  🍷 와인 타입 감지: {detected_type} — 해당 타입으로만 검색합니다.")

    candidate_wines = find_candidate_wines_by_embedding(
        query_embedding=embedding,
        limit=30,
        wine_type=detected_type,
    )
    candidate_ids = [wine["wine_id"] for wine in candidate_wines]
    print(f"✅ [2단계] DB 검색 완료! (찾은 와인 개수: {len(candidate_wines)})")

    if not candidate_ids:
        return []

    print("⏳ [3단계] Java 백엔드 Re-ranking 통신 요청 중...")
    payload = {
        "userId": user_id,
        "friendIds": friend_ids or [],
        "candidateWineIds": candidate_ids,
    }

    try:
        with httpx.Client() as client:
            response = client.post(BACKEND_RECOMMEND_API_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            print("✅ [3단계] Java 백엔드 응답 완료!")
            backend_result = response.json().get("data", {}).get("general", [])

            if backend_result:
                return backend_result

            print("⚠️ 백엔드 결과가 비어있어 pgvector 유사도 상위 결과로 대체합니다.")
            return candidate_wines[:5]

    except Exception as exc:
        print(f"⚠️ 백엔드 통신 에러 발생: {exc}")
        return candidate_wines[:5]
