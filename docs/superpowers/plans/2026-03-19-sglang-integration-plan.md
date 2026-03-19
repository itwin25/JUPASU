# AI 서버 sglang 통합 및 OpenAI 표준 연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sglang 기반의 고성능 LLM 추론 엔진을 FastAPI 서버에 통합하고, 프론트엔드 및 백엔드와의 OpenAI 표준 연동을 완성함.

**Architecture:** 
- `app/api/v1/` 라우터를 통해 모든 요청을 통합 관리.
- `json_schema` 요청은 sglang으로 직접 중계하여 성능 최적화.
- 일반 채팅 요청은 `sommelier_agent`를 통해 풍부한 컨텍스트 주입 후 추론.
- OpenAI SSE(Server-Sent Events) 규격을 준수하는 스트리밍 래퍼 구현.

**Tech Stack:** FastAPI, sglang (Inference), LangGraph (Agent), Pydantic, httpx (Async Client)

---

### Task 1: 환경 설정 및 공통 스키마 정의

**Files:**
- Modify: `ai/app/core/config.py`
- Modify: `ai/.env.example`
- Create: `ai/app/api/v1/schemas.py`

- [ ] **Step 1: config.py 업데이트**
  - `VLLM_` 접두사를 `LLM_` 또는 `SGLANG_`으로 변경하거나 병행 지원하도록 수정.
  - sglang 서버 주소를 위한 `LLM_API_BASE_URL` 추가.

- [ ] **Step 2: OpenAI 호환 Pydantic 모델 정의 (`schemas.py`)**
  - `ChatCompletionRequest`, `ChatCompletionResponse`, `ChatCompletionStreamResponse` 등 정의.

- [ ] **Step 3: .env.example 업데이트**
  - 새로운 설정값들을 반영.

- [ ] **Step 4: Commit**
  - `git add . && git commit -m "chore: update config and schemas for sglang integration"`

---

### Task 2: 지능형 후처리가 포함된 OCR 엔드포인트 구현

**Files:**
- Modify: `ai/app/services/ocr/engine.py`
- Create: `ai/app/services/ocr/refiner.py`
- Create: `ai/app/api/v1/endpoints.py`

- [ ] **Step 1: ocr/engine.py 확장**
  - `recognize_menu()`와 `recognize_label()` 메서드 추가.

- [ ] **Step 2: ocr/refiner.py 생성 (LLM 연동)**
  - sglang을 호출하여 OCR 텍스트를 교정하는 `refine_menu_text()` 및 `refine_label_text()` 구현.
  - 구조화된 출력(JSON Schema)을 사용하여 신뢰도 높은 데이터 추출.

- [ ] **Step 3: API 엔드포인트 통합**
  - `/v1/vision/ocr/menu` 및 `/v1/vision/ocr/label`에서 OCR 엔진 실행 후 Refiner 호출하도록 구성.

- [ ] **Step 4: 테스트 코드로 검증**
  - 실제 이미지 업로드 시 LLM이 오타를 잘 잡는지 확인.

---

### Task 3: OpenAI 호환 Chat 엔드포인트 구현 (Smart Routing)

**Files:**
- Modify: `ai/app/api/v1/endpoints.py`
- Create: `ai/app/services/llm/proxy.py`

- [ ] **Step 1: /v1/chat/completions 엔드포인트 작성**
  - 요청에 `response_format` (json_schema)이 있으면 `proxy.py`를 통해 sglang 직접 호출.
  - 일반 요청은 `sommelier_agent` 호출 로직 준비.

- [ ] **Step 2: 스트리밍 응답 (SSE) 래퍼 구현**
  - sglang의 원시 스트림을 OpenAI SSE 포맷(`data: {...}`)으로 변환하는 Generator 함수 작성.

- [ ] **Step 3: Commit**
  - `git commit -m "feat: implement openai compatible chat endpoint with smart routing"`

---

### Task 4: Sommelier Agent 고도화 및 sglang 연결

**Files:**
- Modify: `ai/app/services/sommelier/sommelier_agent.py`
- Modify: `ai/app/services/llm/factory.py`

- [ ] **Step 1: factory.py 업데이트**
  - sglang 서버를 호출하는 `ChatOpenAI` 객체 반환 로직 확인 및 수정.

- [ ] **Step 2: sommelier_agent.py Mock 로직 제거**
  - `gather_context_node`에서 실제 DB(또는 임시 서비스) 호출 및 LLM 추론 로직 활성화.
  - sglang의 구조화된 출력 기능을 사용하도록 프롬프트 최적화.

- [ ] **Step 3: 통합 테스트**
  - `python ai/tests/run_sommelier_test.py` 실행하여 sglang 연동 확인.

---

### Task 5: 최종 검증 및 문서 업데이트

- [ ] **Step 1: 전체 테스트 수행**
  - 백엔드와 동일한 요청을 날려 스트리밍 파싱이 잘 되는지 최종 확인.

- [ ] **Step 2: README.md 및 API 가이드 업데이트**
  - 새로운 엔드포인트 구조 설명 추가.
