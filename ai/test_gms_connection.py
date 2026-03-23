import asyncio
import os
from dotenv import load_dotenv
from app.services.llm.gms_client import GmsGeminiChat
from langchain_core.messages import HumanMessage

async def test_gms():
    print("🚀 SSAFY GMS Gemini 연결 테스트 시작...")
    
    # 설정 로드
    load_dotenv('.env')
    api_key = os.getenv('GOOGLE_API_KEY')
    model_name = os.getenv('GEMINI_MODEL_NAME', 'gemini-2.5-flash-lite')
    
    if not api_key:
        print("❌ 에러: GOOGLE_API_KEY가 설정되지 않았습니다.")
        return

    # 커스텀 클라이언트 생성
    llm = GmsGeminiChat(api_key=api_key, model_name=model_name)
    
    try:
        print(f"📡 요청 송신 중... (모델: {model_name})")
        response = await llm.ainvoke([HumanMessage(content="안녕하세요! 자기소개 부탁드려요.")])
        print("\n✅ 응답 수신 성공!")
        print("-" * 30)
        print(response.content)
        print("-" * 30)
    except Exception as e:
        print(f"\n❌ 통신 실패: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_gms())
