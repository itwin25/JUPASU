from fastapi.testclient import TestClient
from app.main import app, get_settings

client = TestClient(app)

def test_health_check():
    """헬스체크 엔드포인트가 정상인지 확인하며 환경 설정값이 포함되었는지 검증합니다."""
    response = client.get("/health")
    settings = get_settings()
    
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "env": settings.APP_ENV
    }

def test_ai_chat_echo():
    """AI 채팅 API가 현재 설정된 환경 모드와 함께 텍스트를 에코하는지 확인합니다."""
    payload = {"prompt": "Hello AI"}
    response = client.post("/ai/chat", json=payload)
    settings = get_settings()
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == f"Echo in {settings.APP_ENV} mode: Hello AI"
