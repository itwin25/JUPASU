from fastapi import Header, HTTPException
from app.core.config import get_settings

def verify_internal_api_key(x_internal_api_key: str = Header(..., alias="X-Internal-Api-Key")):
    """
    헤더의 X-Internal-Api-Key를 검증하는 의존성 함수입니다.
    설정된 INTERNAL_API_KEY와 일치하지 않으면 403 에러를 발생시킵니다.
    """
    settings = get_settings()
    if x_internal_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=403, 
            detail="Could not validate internal API key."
        )
