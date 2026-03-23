import os
import requests
from dotenv import load_dotenv

def test_gms_rest():
    print("🚀 GMS REST API (알려주신 URL) 최종 테스트 시작...")
    load_dotenv('.env')
    api_key = os.getenv('GMS_API_KEY')
    url = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
    
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    
    payload = {
        "contents": [{"parts": [{"text": "안녕! 정확한 URL로 요청 보냈어. 응답해줘!"}]}]
    }

    try:
        print(f"📡 요청 송신 중: {url}")
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("\n✅ REST API 응답 수신 성공!")
        print("-" * 30)
        print(data['candidates'][0]['content']['parts'][0]['text'])
        print("-" * 30)
    except Exception as e:
        print(f"\n❌ 통신 실패: {str(e)}")

if __name__ == "__main__":
    test_gms_rest()
