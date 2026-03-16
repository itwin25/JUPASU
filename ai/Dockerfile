# 1. 빌드 스테이지 (Builder)
FROM ghcr.io/astral-sh/uv:latest AS uv_bin
FROM python:3.12-slim AS builder

WORKDIR /app

# uv 바이너리 복사
COPY --from=uv_bin /uv /uvx /bin/

# 환경 변수 설정
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# 의존성 파일 먼저 복사 (레이어 캐싱 활용)
COPY pyproject.toml uv.lock ./

# 가상환경 생성 및 의존성 설치 (캐시 마운트 활용)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# 2. 실행 스테이지 (Runtime)
FROM python:3.12-slim

# 보안: 비특권 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app
RUN mkdir -p /app/logs && chown appuser:appuser /app/logs

# 빌드 스테이지에서 생성된 가상환경(.venv) 복사
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# [최적화] 소스 코드 레이어 분리 (캐시 효율 극대화)
# 변경 빈도가 낮은 핵심 설정과 서비스 로직부터 복사
COPY --chown=appuser:appuser core/ ./core/
COPY --chown=appuser:appuser services/ ./services/
# 가장 자주 바뀌는 메인 실행 파일 및 기타 메타데이터를 마지막에 복사
COPY --chown=appuser:appuser main.py ./

# 실행 환경 설정
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 보안: 사용자 전환
USER appuser

# 포트 설정
EXPOSE 8000

# [최적화] 헬스체크 추가 (API 상태 모니터링)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
