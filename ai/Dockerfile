# 1. 빌드 스테이지 (Builder)
FROM ghcr.io/astral-sh/uv:latest AS uv_bin
FROM nvidia/cuda:12.8.0-base-ubuntu24.04 AS builder

# Ubuntu 24.04 환경 설정 및 Python 설치
RUN apt-get update && apt-get install -y python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# uv 바이너리 복사
COPY --from=uv_bin /uv /uvx /bin/

# 환경 변수 설정
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# 의존성 파일 복사
COPY pyproject.toml uv.lock ./

# 가상환경 생성 및 의존성 설치
RUN uv sync --frozen --no-install-project --no-dev

# 2. 실행 스테이지 (Runtime)
FROM nvidia/cuda:12.8.0-base-ubuntu24.04

# 필수 라이브러리 설치 (Ubuntu 24.04 최적화)
RUN apt-get update && apt-get install -y python3 libgl1-mesa-glx libglib2.0-0 && \
    ln -s /usr/bin/python3 /usr/bin/python

# 보안: 비특권 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app
RUN mkdir -p /app/logs && chown appuser:appuser /app/logs

# 빌드 스테이지에서 생성된 가상환경(.venv) 복사
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# 소스 코드 복사
COPY --chown=appuser:appuser app/ ./app/

# 실행 환경 설정
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app"

USER appuser
EXPOSE 18000

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "18000"]
