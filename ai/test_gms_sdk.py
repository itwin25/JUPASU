import asyncio
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

async def test_gms_sdk():
    print("🚀 SSAFY GMS SDK (OpenAI 호환) 연결 테스트 시작...")
    load_dotenv('.env')
    
    # 설정값 확인
    api_key = os.getenv('GMS_API_KEY')
    model_name = os.getenv('GEMINI_MODEL_NAME', 'gemini-2.0-flash')
    
    if not api_key:
        print("❌ 에러: GMS_API_KEY가 설정되지 않았습니다.")
        return

    # 공식 SDK 방식 클라이언트 생성
    llm = ChatOpenAI(
        model=model_name,
        openai_api_base="https://gms.ssafy.io/gmsapi/api.openai.com/v1",
        api_key=api_key,
        temperature=0
    )
    
    try:
        print(f"📡 공식 SDK를 통한 요청 송신 중... (모델: {model_name})")
        response = await llm.ainvoke([HumanMessage(content="GMS SDK 방식으로 연결되었습니다. 짧게 인사해줘!")])
        print("\n✅ 공식 SDK 응답 수신 성공!")
        print("-" * 30)
        print(response.content)
        print("-" * 30)
    except Exception as e:
        print(f"\n❌ 통신 실패: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_gms_sdk())
