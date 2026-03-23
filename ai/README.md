# Jupasu AI Server (FastAPI)

본 프로젝트는 **와인 소믈리에 AI 에이전트** 및 **고성능 OCR 서비스**를 제공하는 FastAPI 기반 AI 메인 서버입니다. 별도의 GPU 가속 서버(예: NVIDIA H200)에서 가동되도록 최적화되어 있습니다.

## 🚀 핵심 기술 스택
- **Framework**: FastAPI (Python 3.12)
- **Dependency Manager**: `uv` (Fast & Modern)
- **AI Agent**: LangGraph, LangChain (Multi-turn reasoning)
- **LLM Engine**: vLLM (Remote GPU) / Google Gemini (Hybrid)
- **Vision**: PaddleOCR v5 (High-precision Menu/Label recognition)
- **Monitoring**: Prometheus & Instrumentator

## 📁 프로젝트 구조
```text
ai/
├── app/
│   ├── api/v1/         # API 라우터 및 스키마 (OpenAI 호환 및 커스텀)
│   ├── core/           # 공통 설정, 보안, 로깅 로직
│   ├── services/       # 핵심 도메인 로직 (OCR Engine, LLM Factory, Agent)
│   └── main.py         # 서버 엔트리 포인트
├── scripts/            # 모델 다운로드 및 데이터 수집 스크립트
├── tests/              # 통합 및 단위 테스트
├── Dockerfile          # GPU 최적화 빌드 설정
└── pyproject.toml      # 패키지 의존성 관리
```

## 🛠️ 개발 및 실행 가이드

### 1. 가상환경 구축 (uv)
```bash
cd ai
uv sync
```

### 2. 환경 변수 설정
`.env.example`을 복사하여 `.env` 파일을 생성하고, GPU 서버 주소 및 API 키를 입력합니다.
```bash
cp .env.example .env
```

### 3. 서버 실행 (Port: 18000)
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 18000 --reload
```

## 📡 주요 API 명세
- **Health Check**: `GET /health`
- **OpenAI Chat**: `POST /v1/chat/completions` (Standard Proxy)
- **Sommelier Chat**: `POST /v1/chat` (Advanced Agentic Workflow)
- **Menu OCR**: `POST /v1/vision/ocr/menu` (Image -> Structured Wines/Foods)
- **Label OCR**: `POST /v1/vision/ocr/label` (Image -> Winery/Vintage)

## 🐳 Docker 배포 (GPU 서버 전용)
```bash
docker compose -f docker-compose.ai.yml up -d --build
```

---
*본 문서는 프로젝트의 기술적 전환에 따라 Gemini CLI에 의해 최신화되었습니다.*
