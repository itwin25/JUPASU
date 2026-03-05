from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """헬스체크 엔드포인트가 정상인지 확인합니다."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_ai_chat_echo():
    """AI 채팅 API가 입력한 텍스트를 정상적으로 에코하는지 확인합니다."""
    payload = {"prompt": "Hello AI"}
    response = client.post("/ai/chat", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == "Echo: Hello AI"
