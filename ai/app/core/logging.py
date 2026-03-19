import logging
import time
import json
from logging.handlers import RotatingFileHandler
from app.core.config import get_settings

# --- Advanced Performance Logger Setup ---
perf_logger = logging.getLogger("ai_performance")
perf_logger.setLevel(logging.INFO)
perf_logger.propagate = False

if not perf_logger.handlers:
    import os
    os.makedirs("logs", exist_ok=True)
    perf_handler = RotatingFileHandler("logs/ai_performance.log", maxBytes=10*1024*1024, backupCount=10)
    perf_handler.setFormatter(logging.Formatter('%(message)s'))
    perf_logger.addHandler(perf_handler)

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
        "model": settings.GEMINI_MODEL_NAME if settings.LLM_PROVIDER == "gemini" else settings.VLLM_MODEL_NAME,
        "performance": {
            "duration_sec": round(duration, 3),
            "input_len": len(prompt),
            "output_len": len(response_content),
            "token_usage": usage_metadata or "N/A"
        },
        "error_detail": error_msg
    }
    perf_logger.info(json.dumps(log_entry, ensure_ascii=False))
