import httpx
from typing import List, Optional, Dict, Any

from app.db.repositories.chat_wine_repository import find_candidate_wines_by_embedding
from app.services.rag.chat_retrieval_service import detect_wine_type
from app.services.rag.embedding_service import fetch_embedding


BACKEND_RECOMMEND_API_URL = "http://backend:8080/api/wines/recommend/rag"


def perform_hybrid_candidate_recommendation(
    user_id: str,
    food_text: str,
    friend_ids: list[str] | None = None,
) -> list[dict]:
    """
    하이브리드 추천 경로 (음식 정보가 있을 때).
    1. 정제된 음식 키워드(food_text)만 임베딩해 pgvector 후보 추출
    2. 후보 ID만 백엔드에 보내 재정렬
    """
    print(f"⏳ [1단계] GMS 임베딩 API 통신 요청 중... (검색어: {food_text})")
    embedding = fetch_embedding(text=food_text)
    print("✅ [1단계] 임베딩 완료!")

    print("⏳ [2단계] PostgreSQL DB pgvector 검색 연산 중...")
    detected_type = detect_wine_type(food_text)
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

    return _request_backend_rerank(user_id, friend_ids, candidate_ids)


def perform_profile_candidate_recommendation(
    user_id: str,
    friend_ids: list[str] | None = None,
) -> list[dict]:
    """
    프로필 기반 추천 경로 (음식 정보가 없고 친구만 언급되었을 때).
    1. 별도의 RAG/임베딩 없이 백엔드에 직접 '그룹 취향 기반 추천' 요청
    """
    print(f"🍷 [추천] 음식 정보 없음: 그룹 통합 취향 프로필 기반 추천을 요청합니다.")
    return _request_backend_rerank(user_id, friend_ids, [])


def _request_backend_rerank(user_id: str, friend_ids: list[str] | None, candidate_ids: list[int]) -> list[dict]:
    """백엔드에 최종 재정렬 및 추천 요청"""
    print("⏳ [통신] Java 백엔드 Re-ranking 요청 중...")
    payload = {
        "userId": user_id,
        "friendIds": friend_ids or [],
        "candidateWineIds": candidate_ids,
    }

    try:
        with httpx.Client() as client:
            response = client.post(BACKEND_RECOMMEND_API_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            print("✅ [통신] Java 백엔드 응답 완료!")
            data = response.json().get("data", {})
            
            # 백엔드 상황에 따라 리스트가 담긴 키가 다를 수 있음 (유연한 대응)
            result = data.get("personalized") or data.get("general") or data.get("recommendations") or []
            
            # 만약 data 자체가 리스트인 경우에 대한 대응
            if not result and isinstance(data, list):
                result = data
                
            return result
    except Exception as exc:
        print(f"⚠️ 백엔드 통신 에러 발생: {exc}")
        return []
