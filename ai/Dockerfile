# 1. 빌드 스테이지 (Builder)
FROM ghcr.io/astral-sh/uv:latest AS uv_bin
FROM python:3.12-slim AS builder

# 작업 디렉토리 설정
WORKDIR /app

# uv 바이너리 복사
COPY --from=uv_bin /uv /uvx /bin/

# 환경 변수 설정 (바이트코드 컴파일로 성능 최적화)
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# 의존성 파일 먼저 복사 (레이어 캐싱 활용)
COPY pyproject.toml uv.lock ./

# 가상환경 생성 및 의존성 설치 (개발용 제외, 프로젝트 소스 제외)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# 2. 실행 스테이지 (Runtime)
FROM python:3.12-slim

WORKDIR /app
RUN mkdir -p /app/logs

# 빌드 스테이지에서 생성된 가상환경(.venv) 복사
COPY --from=builder /app/.venv /app/.venv

# 프로젝트 소스 복사
COPY . .

# 가상환경 내 바이너리를 시스템 경로에 추가
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# 포트 설정
EXPOSE 8000

# 서버 실행 (프로덕션 환경이므로 reload 제외)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
