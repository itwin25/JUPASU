import asyncio
import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.services.llm.gms_client import GmsGeminiChat

class WineInfo(BaseModel):
    winery: str = Field(description="와이너리 이름")
    wine_name: str = Field(description="와인 이름")
    year: int = Field(description="빈티지")

async def test_structured():
    print("🚀 GMS 구조화된 출력 테스트 시작...")
    load_dotenv('.env')
    api_key = os.getenv('GMS_API_KEY')
    
    llm = GmsGeminiChat(api_key=api_key)
    structured_llm = llm.with_structured_output(WineInfo)
    
    try:
        print("📡 분석 요청 중...")
        result = await structured_llm.ainvoke("2019년산 모젤 지방의 리슬링 와인 정보 추출해줘")
        print("\n✅ 구조화 데이터 수신 성공!")
        print(f"결과: {result}")
    except Exception as e:
        print(f"\n❌ 테스트 실패: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_structured())
