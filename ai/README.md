# Jupasu AI Server (FastAPI)

이 프로젝트는 `uv`를 사용한 Python 3.12 기반의 FastAPI 서버입니다. LLM 관련 기능을 제공하며, 백엔드(Java/Spring)와의 협업을 위한 기본 구조입니다.

## 1. 전제 조건 (Prerequisites)
- **Python 3.12 이상**
- **uv** (Python 패키지 매니저)

### uv 설치 방법 (설치되어 있지 않은 경우)
```bash
# MacOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 2. 프로젝트 설정 및 가상환경 구축
`ai` 디렉토리로 이동한 뒤 다음 명령어를 입력하면 `uv`가 자동으로 가상환경(`.venv`)을 생성하고 필요한 패키지를 설치합니다.

```bash
cd ai
uv sync
```

## 3. 서버 실행
개발 모드로 서버를 실행하여 코드 변경 사항을 실시간으로 반영합니다.

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 4. API 확인 및 테스트 (수동)
서버가 실행되면 아래 URL을 통해 API 문서를 확인하고 테스트할 수 있습니다.

- **Swagger UI (OpenAPI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Redoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## 5. 자동화 테스트 실행 (권장)
다른 개발 환경에서 서버가 정상적으로 작동하는지 즉시 검증하려면 아래 명령어를 실행하세요. 별도의 서버 실행 없이도 핵심 기능을 테스트할 수 있습니다.

```bash
cd ai
uv run pytest
```

## 6. 주요 파일 구조
- `main.py`: FastAPI 애플리케이션의 엔트리 포인트. API 엔드포인트 정의.
- `tests/`: 서버 로직을 검증하는 자동화 테스트 코드.
- `pyproject.toml`: `uv` 설정 파일 및 프로젝트 의존성 관리.
- `uv.lock`: 패키지 버전 잠금 파일 (수정 금지).
