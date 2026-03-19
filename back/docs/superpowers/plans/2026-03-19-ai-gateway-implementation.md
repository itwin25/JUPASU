# AI 통합 게이트웨이 구현 계획 (AI Gateway Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프론트엔드로부터 이미지를 받아 FastAPI OCR 서버로 전달하고, LLM 챗봇의 스트리밍 응답을 중계하는 기능을 구현함.

**Architecture:** Spring WebClient와 SseEmitter를 사용하여 동기(OCR) 및 비동기 스트리밍(LLM) 요청을 처리하는 통합 AI 도메인 구조.

**Tech Stack:** Java 21, Spring Boot 4.0.3, Spring WebFlux (WebClient), SseEmitter.

---

### Task 1: 프로젝트 설정 및 의존성 추가

**Files:**
- Modify: `build.gradle`
- Modify: `src/main/resources/application.properties`

- [ ] **Step 1: `build.gradle`에 WebFlux 의존성 추가**
- [ ] **Step 2: `application.properties`에 AI 서버 설정 추가**
```properties
ai.server.base-url=${AI_SERVER_URL:http://localhost:8000}
ai.server.connect-timeout=5000
ai.server.read-timeout=60000
```
- [ ] **Step 3: 빌드 및 의존성 로드 확인** (`./gradlew build`)
- [ ] **Step 4: Commit**

### Task 2: 공통 예외 및 DTO 정의

**Files:**
- Modify: `src/main/java/com/a505/jupasu/global/exception/ErrorCode.java`
- Create: `src/main/java/com/a505/jupasu/domain/ai/dto/response/OcrResponse.java`
- Create: `src/main/java/com/a505/jupasu/domain/ai/dto/request/ChatRequest.java`

- [ ] **Step 1: `ErrorCode.java`에 AI 관련 에러 코드 추가**
- [ ] **Step 2: OCR 및 Chat 요청/응답 DTO 작성**
- [ ] **Step 3: Commit**

### Task 3: WebClient 설정 및 서비스 구현 (OCR 기능)

**Files:**
- Create: `src/main/java/com/a505/jupasu/domain/ai/config/WebClientConfig.java`
- Create: `src/main/java/com/a505/jupasu/domain/ai/service/AiService.java`
- Create: `src/test/java/com/a505/jupasu/domain/ai/service/AiServiceTest.java`

- [ ] **Step 1: WebClient 빈(Bean) 설정 (타임아웃 포함)**
- [ ] **Step 2: Mock 서버를 활용한 OCR 호출 테스트 코드 작성 (Failing Test)**
- [ ] **Step 3: `AiService.ocr()` 메서드 구현 (Multipart 전송 로직)**
- [ ] **Step 4: 테스트 통과 확인**
- [ ] **Step 5: Commit**

### Task 4: AiController 및 LLM 스트리밍(SSE) 구현

**Files:**
- Create: `src/main/java/com/a505/jupasu/domain/ai/controller/AiController.java`
- Modify: `src/main/java/com/a505/jupasu/domain/ai/service/AiService.java`
- Create: `src/test/java/com/a505/jupasu/domain/ai/controller/AiControllerTest.java`

- [ ] **Step 1: SSE 스트리밍 호출에 대한 실패하는 테스트 코드 작성 (Failing Test)**
- [ ] **Step 2: OCR 엔드포인트 구현 (`POST /api/ai/ocr`)**
- [ ] **Step 3: `AiService.streamChat()` 메서드 구현 (FastAPI 스트림 수신)**
- [ ] **Step 4: `AiController`에 Chat SSE 엔드포인트 구현 (`POST /api/ai/chat`)**
- [ ] **Step 5: `SseEmitter` 타임아웃 및 에러 핸들러 설정**
- [ ] **Step 6: 테스트 통과 확인**
- [ ] **Step 7: Commit**

### Task 5: 통합 테스트 및 최종 검증

**Files:**
- Modify: `src/test/java/com/a505/jupasu/domain/ai/controller/AiControllerTest.java`

- [ ] **Step 1: 전체 시나리오 통합 테스트 보완**
- [ ] **Step 2: 전체 프로젝트 빌드 및 린트 체크**
- [ ] **Step 3: 설계 문서의 요구사항 충족 여부 최종 확인**
- [ ] **Step 4: Commit**
