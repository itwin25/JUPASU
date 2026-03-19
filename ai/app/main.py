from fastapi import FastAPI
from app.core.config import get_settings
from app.api.v1.endpoints import router as v1_router
from prometheus_fastapi_instrumentator import Instrumentator

# --- App Instance ---
app = FastAPI(
    title=get_settings().APP_NAME,
    description="Jupasu AI Sommelier & OCR Service",
    version="1.0.0"
)

# Prometheus Monitoring
Instrumentator().instrument(app).expose(app)

# v1 라우터 등록
app.include_router(v1_router, prefix="/v1")

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "app_name": get_settings().APP_NAME,
        "env": get_settings().APP_ENV
    }

if __name__ == "__main__":
    import uvicorn
    # 외부 GPU 서버 가동을 위해 host를 0.0.0.0으로 설정
    uvicorn.run("app.main:app", host="0.0.0.0", port=18000, reload=True)
