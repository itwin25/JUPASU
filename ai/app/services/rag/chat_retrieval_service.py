import httpx
from app.services.rag.embedding_service import fetch_embedding

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
BACKEND_RECOMMEND_API_URL = "http://backend:8080/api/wines/recommend/rag"

def perform_hybrid_recommendation(user_id: str, query: str, friend_ids: list[str] = None) -> list[dict]:
    """
    1. 유저 질문을 임베딩함
    2. 생성된 벡터와 필터 정보를 Java 백엔드로 전송하여 pgvector 검색 및 Re-ranking 요청
    3. 최종 Top 와인 반환
    """
    # 1. 텍스트 임베딩 생성 (AI 서버의 고유 역할)
    print("⏳ [1단계] GMS 임베딩 API 통신 요청 중...")
    embedding = fetch_embedding(text=query)
    print("✅ [1단계] 임베딩 완료!")
    
    # 2. 와인 타입 감지
    detected_type = detect_wine_type(query)
    
    # 3. Java 백엔드 호출 (벡터 검색 및 Re-ranking 위임)
    print("⏳ [2단계] Java 백엔드(pgvector 검색 + Re-ranking) 통신 요청 중...")
    
    # 벡터를 JSON 직렬화 가능한 리스트나 문자열로 변환
    # Spring의 pgvector 쿼리 형식이 "[0.1, 0.2, ...]" 형태를 기대하므로 리스트 그대로 전송
    payload = {
        "userId": user_id,
        "friendIds": friend_ids or [],
        "queryVector": str(embedding), # 리스트를 "[...]" 형태의 문자열로 변환
        "wineType": detected_type
    }
    
    try:
        with httpx.Client() as client:
            response = client.post(BACKEND_RECOMMEND_API_URL, json=payload, timeout=15.0)
            response.raise_for_status()
            print("✅ [2단계] Java 백엔드 응답 완료!")
            
            # WineQuickRecommendResponse.SituationResult 구조에서 와인 목록 추출
            # 백엔드 ApiResponse.success 데이터 구조에 맞게 파싱
            data = response.json().get("data", {})
            
            # SituationResult 리스트에서 와인들 추출 (현재는 첫 번째 결과만 사용하거나 전체 병합)
            situations = data.get("situations", [])
            all_wines = []
            for sit in situations:
                all_wines.extend(sit.get("wines", []))
                
            return all_wines
            
    except Exception as e:
        print(f"⚠️ 백엔드 통신 에러 발생: {e}")
        return []
