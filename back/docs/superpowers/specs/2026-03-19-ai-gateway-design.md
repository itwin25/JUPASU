# AI 통합 게이트웨이 설계 문서 (AI Gateway Design Spec) - v1.1

이 문서는 Jupasu 프로젝트의 백엔드 서버에서 FastAPI GPU 서버로의 AI 요청(OCR, LLM Streaming)을 중계하는 게이트웨이 기능을 설계합니다. 리뷰 피드백을 반영하여 타임아웃 및 의존성 설정을 구체화하였습니다.

## 1. 개요
- **목적**: 프론트엔드의 AI 요청을 통합 관리하고, 외부 GPU 서버(FastAPI)와의 통신을 최적화하여 중계함.
- **주요 기능**:
    - 이미지 파일 업로드 및 OCR 결과 반환 (동기 방식)
    - LLM 챗봇 답변 스트리밍 전송 (비동기 SSE 방식)
- **대상 서버**: FastAPI (GPU 가속 서버)

## 2. 기술 스택 및 의존성
### 2.1 의존성 추가 (`build.gradle`)
```gradle
dependencies {
    // WebClient 사용을 위한 WebFlux 추가 (기존 MVC와 병행 사용)
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
}
```

## 3. 시스템 아키텍처 및 데이터 흐름

### 3.1 패키지 구조 (`com.a505.jupasu.domain.ai`)
- `controller/AiController.java`: API 엔드포인트 및 `SseEmitter` 관리
- `service/AiService.java`: 비즈니스 로직 및 WebClient 호출 관리
- `dto/request/ChatRequest.java`: LLM 요청 DTO
- `dto/response/OcrResponse.java`: OCR 결과 DTO
- `config/WebClientConfig.java`: WebClient 빈 설정

### 3.2 타임아웃 및 스트리밍 설정
#### [SseEmitter 타임아웃]
- **설정값**: 30,000ms (30초)
- **이벤트**: 
    - `onTimeout`: `emitter.completeWithError()` 호출 및 클라이언트에 `AI_PROCESSING_TIMEOUT` 전달
    - `onCompletion`: 연결 정상 종료 처리

#### [WebClient 타임아웃]
- **Connect Timeout**: 5,000ms (5초)
- **Read Timeout (Response)**: 60,000ms (60초, GPU 연산 고려)

## 4. 상세 데이터 흐름
#### [OCR 기능]
1. 프론트엔드 -> `POST /api/ai/ocr` (MultipartFile)
2. 백엔드 -> WebClient를 통한 FastAPI 호출 (`POST /v1/vision/ocr`)
3. FastAPI -> 백엔드 (OCR JSON 결과)
4. 백엔드 -> 프론트엔드 (`ApiResponse<OcrResponse>`)

#### [LLM 챗봇 기능]
1. 프론트엔드 -> `POST /api/ai/chat` (JSON)
2. 백엔드 -> `SseEmitter` 생성 및 즉시 반환
3. 백엔드 -> WebClient를 통한 FastAPI 스트림 호출 (`POST /v1/chat/completions`)
4. FastAPI -> 백엔드 (Chunk 단위 데이터 스트림)
5. 백엔드 -> `SseEmitter.send()`를 통해 프론트엔드로 실시간 전달

## 5. 환경 설정 (Configuration)
`application.properties`:
- `ai.server.base-url`: AI 서버 주소 (환경별 관리)
- `ai.server.connect-timeout=5000`
- `ai.server.read-timeout=60000`

## 6. 예외 처리 및 지역화 메시지
`global.exception.ErrorCode`에 정의될 항목:
- `AI_SERVER_ERROR`: (500, "AI 서버 응답 처리에 실패했습니다.")
- `AI_SERVER_UNAVAILABLE`: (503, "AI 서버와 통신할 수 없습니다.")
- `AI_PROCESSING_TIMEOUT`: (408, "AI 처리 시간이 초과되었습니다. 다시 시도해주세요.")

---
**수정일**: 2026-03-19
**상태**: 수정 완료 (재검토 요청)
