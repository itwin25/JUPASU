import httpx
from app.core.config import get_settings

settings = get_settings()

DEFAULT_MODEL = "text-embedding-3-small"
DEFAULT_BASE_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"

def fetch_embedding(text: str, model: str = DEFAULT_MODEL) -> list[float]:
    """
    들어온 텍스트(질문, 감성 등)를 GMS API를 이용해 벡터(Float 배열)로 변환합니다.
    """
    if not settings.GMS_API_KEY:
        raise ValueError("GMS_API_KEY가 설정되지 않았습니다. .env 폴더나 config를 확인하세요.")

    with httpx.Client() as client:
        response = client.post(
            DEFAULT_BASE_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.GMS_API_KEY}",
            },
            json={
                "model": model,
                "input": text,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["embedding"]
