# Jupasu AI 프로젝트 전략 가이드 (3주 완성 로드맵)

## 1. 프로젝트 개요
- **목표:** 취업용 포트폴리오를 위한 고성능 AI 에이전트 서버 구축
- **기간:** 3주 (토이 프로젝트)
- **핵심 기술 스택:** FastAPI, LangChain, LangGraph, vLLM, LangSmith, TrOCR/Edge-OCR

## 2. 프로젝트 아키텍처 (Service-Oriented)
- **모듈화 전략:** 관심사 분리를 통한 유지보수성 및 전문성 확보
  - `core/`: 공통 설정 (Pydantic Settings), 의존성 주입
  - `services/llm/`: LLM 팩토리 (vLLM, Gemini 하이브리드 지원)
  - `services/ocr/`: ML 추론 엔진 (Lazy Loading 적용)
  - `main.py`: API 엔드포인트 및 앱 초기화 전용

## 3. LLM 전략 (Qwen 3.5 & Hybrid)
- **메인 모델:** **Qwen 3.5 9B / 27B** (최신 오픈 소스 모델)
  - **이유:** Berkeley Function Calling Leaderboard(BFCL) 기준, 소형 모델 중 최정상급 툴 콜링 성능 보유.
- **운영 전략 (Hybrid):**
  - **개발용:** Google Gemini 2.0 (빠른 로직 검증)
  - **배포/기술 증명용:** 로컬 vLLM (OpenAI 호환 API 엔드포인트 구성)
- **양자화 가이드:**
  - 16GB VRAM 기준: **Qwen 3.5 27B (4-bit 양자화)** 추천 (지능 극대화)
  - 안정성 우선: **Qwen 3.5 9B (8-bit 양자화)** (속도 및 긴 문맥 처리 유리)

## 4. OCR 구현 및 Edge-AI 전략
- **초기 구현:** 서버 사이드 **TrOCR (microsoft/trocr-base-handwritten)** 탑재
  - 싱글톤 패턴 및 지연 로딩(Lazy Loading)으로 VRAM 효율적 관리.
- **고도화 전략 (Edge-AI):** 
  - **문제 해결:** 이미지 업로드 Latency 및 서버 GPU 비용 최적화.
  - **방안:** 클라이언트(모바일/웹)단에서 **PaddleOCR-Mobile** 등을 활용해 1차 텍스트 추출 수행.
  - **서버 역할:** 추출된 텍스트를 LLM(Qwen 3.5)으로 정제 및 분석하는 지능형 오케스트레이션에 집중.

## 5. 인프라 및 모니터링
- **서버:** FastAPI (8001 포트 사용, vLLM 8000 포트 점유 대비)
- **디버깅:** **LangSmith** 실시간 트레이싱 연동 완료.
- **브라우저 제어:** AUR 기반 Google Chrome 및 Chromium 설치 및 제어 권한 확보.

## 6. 구현 로드맵
### [1주차] Core & OCR Workflow
- 프로젝트 구조화(Refactoring) 및 OCR 엔드포인트 구축
- Gemini를 이용한 LangGraph 에이전트 기본 루프 설계

### [2주차] 로컬 모델 및 Edge 최적화
- vLLM을 통한 Qwen 3.5 로컬 배포 및 툴 콜링 테스트
- Edge-OCR 연동 시나리오 검증

### [3주차] 완성도 및 폴리싱
- 에러 핸들링 강화 및 성능 지표(Latency, Token Usage) 문서화

## 7. 기획 변경 및 업데이트 로그

### [2026-03-09] 하이엔드 인프라 도입 및 모델 상향 전략 (Update)
- **인프라 상향:** **2x NVIDIA H200 (141GB x 2 = 282GB VRAM, NVLink)** 확보.
- **최종 모델 확정:** **Qwen3.5-122B-A10B-FP8**
- **배포 방식:** **vLLM (TP=2)** 및 **JupyterLab** 통합 관리.

### [2026-03-09] 멀티턴 대화 전환 및 지능형 메모리 관리 전략 (Update)
- **대화 방식 확장:** 싱글턴에서 **멀티턴**으로 확장, `session_id` 기반 컨텍스트 유지.
- **메모리 최적화:** **슬라이딩 윈도우 및 요약(Summarization)** 기법 도입 로드맵 수립.

### [2026-03-09] 고도화된 하이브리드 로깅 및 분석 시스템 구축 (Update)
- **로깅 아키텍처:** **로컬 JSON 메타데이터 + LangSmith 정밀 추적** 하이브리드 체계.
- **기술적 최적화:** 핸들러 중복 방지 및 로그 전파 차단 적용.

### [2026-03-09] 비동기 루프 기반 순환형 LangGraph 에이전트 설계 (Update)
- **순환형 구조:** `analyze_menu` 단계의 지능형 재시도 루프.
- **비동기 병렬 처리:** `asyncio.gather` 및 **Barrier Sync**를 통한 데이터 무결성 보장.

### [2026-03-09] 에이전트 지능 최적화 및 퓨샷 러닝 도입 (Update)
- **언어 최적화:** 모든 @tool 및 시스템 프롬프트를 **영어로 작성**하여 모델 추론 정밀도 극대화.
- **한글 보충 주석:** 개발 가독성을 위해 소스 코드 내 상세 한국어 주석 병기.

### [2026-03-09] Query Refinement 레이어 및 AI 동적 오케스트레이션 도입 (Update)
- **Query Refinement:** 사용자 입력을 분석하여 전문적인 지시문(`RefinedInput`)으로 정제하는 전방 레이어 구축.
- **AI 동적 오케스트레이션:** 정제된 데이터를 기반으로 분석 태스크를 모델이 스스로 결정.

### [2026-03-09] 지능형 인텔리전트 라우팅 및 리소스 최적화 전략 (Update)
- **리소스 최적화 전략:** `is_general_chat` 플래그를 도입하여 단순 인사나 일반 지식 질문 시 무거운 연산(DB 조회, OCR 분석)을 사전에 차단하는 **Fast-path** 구조 설계.
- **논리적 판단 근거:** 
  - **제거법(Elimination):** 메뉴/친구/추천 요청이 모두 감지되지 않을 경우 일반 대화로 분류.
  - **퓨샷 가이드:** AI에게 명확한 상황별 분류 예시를 학습시켜 판단 오차 최소화.
- **UX 개선:** 가벼운 요청에 대해 불필요한 대기 시간을 제거함으로써 즉각적인 시스템 응답성 확보.

### [2026-03-09] LangGraph 아키텍처 리팩토링 및 안티 패턴 제거 (Update)
- **Fan-in 버그(Race Condition) 해결:** 여러 개의 병렬 노드(Fan-out)가 하나의 노드로 수렴(Fan-in)할 때, 병합 노드가 중복 실행되는 LangGraph의 구조적 결함(버그) 발견.
- **해결책 (asyncio.gather):** 단순 I/O 병렬 작업은 그래프 노드를 쪼개기보다, 단일 수집 노드(`gather_context_node`) 내부에서 파이썬의 `asyncio.gather`를 사용하여 묶어 처리하는 모범 사례(Best Practice) 적용. 시각적 관측성(Observability) 일부 상실이라는 트레이드오프가 있으나, 시스템의 안정성 및 상태 관리 복잡도 감소를 위해 채택함.
- **명명 규칙 (Naming Convention) 개선:** 역할을 온전히 담지 못했던 `pairing_engine` 노드를 `generate_final_response`로 변경하여, 다양한 데이터(취향, 메뉴, 스펙 등)를 종합(Synthesis)하고 최종 사용자 응답을 생성하는 터미널 노드로서의 본연의 책임을 명확히 함.
- **성능 및 프롬프트 최적화:** 
  - LLM 자율 호출(ReAct)이 아닌, 내부 명시적 호출 함수들에서 불필요한 `@tool` 데코레이터를 제거하여 스키마 파싱 오버헤드 감소.
  - 최종 노드에 데이터 주입 시 단순 JSON 덤프 방식을 폐기하고, **XML 태그**(`<UserPreference>`, `<MenuWines>` 등)를 도입하여 프롬프트 내 데이터 경계를 명확히 하고 환각(Hallucination) 현상을 방지.

### [2026-03-10] 에이전트 입력 스키마 및 검색 아키텍처 고도화 (Update)
- **명시적 멘션(Explicit Mentions) 방식 도입:** LLM의 NER(개체명 인식)에 의존하여 동석자를 파악하던 방식을 폐기하고, 프론트엔드에서 `@멘션`을 통해 추출한 고유 ID(`fid`) 기반의 `mentioned_friends` 리스트를 에이전트에 직접 주입. 
  - **효과:** 동명이인 오류 및 Hallucination 원천 차단, DB 조회 100% 성공률 보장, LLM 파라미터 경량화로 속도 향상.
- **OCR 텍스트 분리 전송 및 정제:** `raw_ocr` 필드를 통해 메뉴판 텍스트를 독립적으로 수신한 뒤, 내부에서 Pydantic 스키마(`MenuExtraction`)를 사용해 순수 와인명과 음식명만 깔끔하게 정제. 불필요한 이미지 데이터를 에이전트에서 걷어냄.
- **하이브리드 와인 검색 전략 (Fast-pass + Fallback):** 
  - 로컬 모델의 자원 한계(VRAM/Latency)를 고려하여 모든 검색에 LLM을 동원하는 대신 2단계 검색 도입.
  - **1단계 (Fast-pass):** 빠르고 가벼운 Vector/Fuzzy DB 일괄 검색을 통해 신뢰도 85% 이상인 와인은 즉시 통과.
  - **2단계 (Fallback):** 오타나 축약어로 인해 1차 검색에 실패한 소수의 와인들에 대해서만 **LangGraph 기반의 자가 치유(Self-Healing) 서브 에이전트**를 가동하여 쿼리 재작성 및 검색 수행. (정확도와 속도의 최적 타협점)

---
*이 문서는 Gemini CLI에 의해 자동 생성되었으며, 프로젝트의 기술적 의사결정 근거로 활용됩니다.*
