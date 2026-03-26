import asyncio
import httpx
import sys

async def test_taste_report():
    print("Testing Taste Report AI Endpoint...")
    
    url = "http://localhost:8001/v1/taste-report/summary"
    headers = {
        "Content-Type": "application/json",
        "X-Internal-Api-Key": "dev-secret-key"
    }
    payload = {
        "nickname": "테스터",
        "avg_sweetness": 3.8,
        "avg_acidity": 2.2,
        "avg_body": 4.1,
        "avg_tannin": 1.5,
        "avg_alcohol": 12.5
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=20.0)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error connecting to AI Server: {e}")

if __name__ == "__main__":
    asyncio.run(test_taste_report())
