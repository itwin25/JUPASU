import asyncio
from app.services.rag.chat_retrieval_service import perform_hybrid_recommendation

def run_test():
    # 1. 챗봇에 들어올 법한 유저의 자연어 질문
    test_query = "친구들이랑 마실 와인 추천해줘. 너무 달지 않았으면 좋겠어"
    
    print(f"🔍 [테스트 시작] 질문: {test_query}")
    
    # 2. 로직 실행 (지금은 Java 백엔드가 연결 안 되어서 코사인 유사도 임시 5개가 반환됨)
    results = perform_hybrid_recommendation(
        user_id="1",
        query=test_query,
        friend_ids=[2, 3]
    )
    
    # 3. 결과 출력
    print("\n🍷 [추출된 와인 결과]")
    for idx, wine in enumerate(results, 1):
        print(f"{idx}. {wine.get('nameKr', '?')} (매칭률: {wine.get('matchRate', 0)}%) / style: {wine.get('style', '-')}")

if __name__ == "__main__":
    run_test()
