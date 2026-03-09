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
  - **이유:** 122B급 대형 모델의 지능과 MoE(A10B)의 빠른 속도를 동시에 확보. H200의 FP8 가속 기능을 활용하여 최적의 추론 효율 달성.
- **배포 방식:** 
  - **vLLM (Tensor Parallelism TP=2)** 적용: 두 개의 GPU를 병렬로 사용하여 122B 모델을 안정적으로 구동.
  - **JupyterLab 통합:** 주피터 랩을 컨트롤 타워로 활용하여 vLLM 인스턴스 실행 및 실시간 모니터링 수행.
- **OCR 전략 재검토:** 
  - 서버 리소스(VRAM) 여유로 인해 서버 사이드 **TrOCR-large** 등의 고성능 OCR 모델 상시 가동 가능성 확보.

---
*이 문서는 Gemini CLI에 의해 자동 생성되었으며, 프로젝트의 기술적 의사결정 근거로 활용됩니다.*
