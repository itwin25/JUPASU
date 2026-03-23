import logging
import time
import json
import sys
from app.core.config import get_settings

# --- Advanced Performance Logger Setup ---
# 모든 파일 기반 핸들러를 제거하고 오직 콘솔(stdout)만 사용합니다.
perf_logger = logging.getLogger("ai_performance")
perf_logger.setLevel(logging.INFO)
perf_logger.propagate = False

# 기존 핸들러가 있다면 제거 (중복 방지)
if perf_logger.handlers:
    for handler in perf_logger.handlers[:]:
        perf_logger.removeHandler(handler)

# 콘솔(표준 출력) 핸들러 추가
console_handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
perf_logger.addHandler(console_handler)

def log_performance_meta(
    prompt: str, 
    response_content: str = "", 
    duration: float = 0, 
    status: str = "success", 
    error_msg: str = None,
    session_id: str = "default",
    usage_metadata: any = None
):
    """최종 진화형 AI 트랜잭션 로깅 함수."""
    settings = get_settings()
    log_entry = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "session_id": session_id,
        "status": status,
        "provider": settings.LLM_PROVIDER,
        "model": settings.GEMINI_MODEL_NAME,
        "performance": {
            "duration_sec": round(duration, 3),
            "input_len": len(prompt),
            "output_len": len(response_content),
            "token_usage": usage_metadata or "N/A"
        },
        "error_detail": error_msg
    }
    # JSON 형태로 로그 출력
    perf_logger.info(json.dumps(log_entry, ensure_ascii=False))
