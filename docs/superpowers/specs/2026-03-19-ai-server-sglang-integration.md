# AI 서버 sglang 통합 및 OpenAI 표준 연동 설계

**목표:** sglang 기반의 고성능 LLM 추론 엔진을 FastAPI 서버에 통합하고, 프론트엔드(OCR 정제) 및 백엔드(스트리밍 채팅)와의 연동을 완성함.

## 1. 아키텍처
- **Router (API Layer)**: OpenAI 호환 `/v1/chat/completions` 엔드포인트 제공. 요청 타입에 따라 `sommelier_agent` 호출 또는 `sglang` 직접 중계 결정.
- **Service (Agent Layer)**: `sommelier_agent.py`가 사용자 취향, 메뉴판 텍스트 등을 종합하여 컨텍스트가 풍부한 프롬프트 생성.
- **Provider (Inference Layer)**: `sglang` 서버를 최종 추론 엔진으로 사용.

## 2. API 엔드포인트 설계
### 2.1 Chat Completions (OpenAI Compatible)
- **Path**: `POST /v1/chat/completions`
- **Request**: `OpenAIRequest` (messages, stream, response_format, etc.)
- **Response**: 
  - `stream=False`: `OpenAIChatResponse` (JSON)
  - `stream=True`: `StreamingResponse` (SSE 포맷: `data: {...}`)

### 2.2 OCR (Vision) - 지능형 후처리 및 구조화
- **Label OCR Path**: `POST /v1/vision/ocr/label`
  - **Refined JSON Format**:
    ```json
    {
      "winery": "Chateau Margaux",
      "wineName": "Grand Vin",
      "vintage": "2015"
    }
    ```
- **Menu OCR Path**: `POST /v1/vision/ocr/menu`
  - **Refined JSON Format**:
    ```json
    {
      "wines": ["Name 1", "Name 2"],
      "foods": ["Dish 1", "Dish 2"]
    }
    ```
- **Response**: `{"original_text": "...", "refined": {...}, "type": "menu|label"}`

## 3. 핵심 로직
- **Smart Routing**: 
  - 프론트엔드의 `json_schema` 요청은 `sglang`의 최적화된 구조화 출력 기능을 활용하도록 직접 중계.
  - 백엔드의 채팅 요청은 `sommelier_agent`를 통해 컨텍스트를 주입한 후 `sglang` 호출.
- **Stream Wrapper**: `sglang`의 스트림 데이터를 백엔드가 기대하는 `choices[0].delta.content` 구조로 래핑하여 SSE 형태로 전송.

## 4. 데이터 흐름 (Sequence)
1. 클라이언트(Front/Back) -> FastAPI (`/v1/chat/completions`)
2. FastAPI -> `sommelier_agent` (의도 파악 및 컨텍스트 수집)
3. `sommelier_agent` -> `sglang` (최종 추론)
4. `sglang` -> FastAPI (스트리밍 데이터 수신)
5. FastAPI -> 클라이언트 (OpenAI SSE 규격으로 변환 및 중계)
