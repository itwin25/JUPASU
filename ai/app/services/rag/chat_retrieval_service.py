import httpx
from app.services.rag.embedding_service import fetch_embedding
from app.db.repositories.chat_wine_repository import find_candidate_wines_by_embedding

# 쿼리 텍스트에서 와인 타입 키워드를 감지
# DB 타입 값(Enum)과 매핑: RED, WHITE, ROSE, SPARKLING, DESSERT, FORTIFIED
_WINE_TYPE_KEYWORDS: dict[str, list[str]] = {
    "SPARKLING": ["스파클링", "sparkling", "샴페인", "champagne", "프로세코", "prosecco",
                  "카바", "cava", "거품", "fizzy", "bubbly"],
    "RED":       ["레드", "red", "적포도주", "까베르네", "메를로", "피노누아", "시라",
                  "cabernet", "merlot", "pinot noir", "syrah", "shiraz"],
    "WHITE":     ["화이트", "white", "백포도주", "샤르도네", "소비뇽 블랑", "리슬링",
                  "chardonnay", "sauvignon blanc", "riesling"],
    "ROSE":      ["로제", "rosé", "rose", "핑크"],
    "DESSERT":   ["디저트", "dessert", "달콤한 디저트", "아이스 와인", "ice wine"],
    "FORTIFIED": ["주정강화", "fortified", "포트", "port", "셰리", "sherry", "마데이라"],
}

def detect_wine_type(query: str) -> str | None:
    """쿼리에서 와인 타입 키워드를 감지하여 DB Enum 값(대문자)을 반환. 없으면 None."""
    lower = query.lower()
    for wine_type, keywords in _WINE_TYPE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return wine_type
    return None


# TODO: 실제 Java 백엔드 추천 API 주소로 변경
BACKEND_RECOMMEND_API_URL = "http://localhost:8080/api/wines/recommend/rag"

def perform_hybrid_recommendation(user_id: str, query: str, friend_ids: list[str] = None) -> list[dict]:
    """
    1. 유저 질문을 임베딩하여 와인 30개 후보 추출 (정성/맥락 검색)
    2. 추출된 와인 ID 리스트를 Java 백엔드로 전송해 베이지안 재정렬 요청 (정량 평가)
    3. 최종 Top 와인 반환
    """
    # 1. 텍스트 임베딩
    print("⏳ [1단계] GMS 임베딩 API 통신 요청 중...")
    embedding = fetch_embedding(text=query)
    print("✅ [1단계] 임베딩 완료!")
    
    # 2. pgvector 검색 (타입 키워드 감지 후 필터 적용)
    print("⏳ [2단계] PostgreSQL DB pgvector 검색 연산 중...")
    detected_type = detect_wine_type(query)
    if detected_type:
        print(f"  🍷 와인 타입 감지: {detected_type} — 해당 타입으로만 검색합니다.")
    candidate_wines = find_candidate_wines_by_embedding(
        query_embedding=embedding, limit=30, wine_type=detected_type
    )
    candidate_ids = [wine["wine_id"] for wine in candidate_wines]
    print(f"✅ [2단계] DB 검색 완료! (찾은 와인 개수: {len(candidate_wines)})")
    
    if not candidate_ids:
        return []
    # 3. Java 백엔드 Re-ranking 호출
    print("⏳ [3단계] Java 백엔드 Re-ranking 통신 요청 중...")
    payload = {
        "userId": user_id,
        "friendIds": friend_ids or [],
        "candidateWineIds": candidate_ids
    }
    
    try:
        with httpx.Client() as client:
            response = client.post(BACKEND_RECOMMEND_API_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            print("✅ [3단계] Java 백엔드 응답 완료!")
            backend_result = response.json().get("data", {}).get("general", [])
            
            if backend_result:
                return backend_result
            
            # 백엔드가 빈 리스트를 반환한 경우 (취향 데이터 부족 등) pgvector 결과로 폴백
            print("⚠️ 백엔드 결과가 비어있어 pgvector 유사도 상위 결과로 대체합니다.")
            return candidate_wines[:5]
            
    except Exception as e:
        print(f"⚠️ 백엔드 통신 에러 발생: {e}")
        return candidate_wines[:5]
