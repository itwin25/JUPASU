# PaddleOCR v5 & UVDoc 모델 ONNX 변환 및 최적화 최종 보고서

본 보고서는 PaddleOCR v5 Server 모델과 UVDoc 모델을 웹 환경(ONNX Runtime Web)에 최적화하여 변환한 결과를 정리한 것입니다.

## 1. 모델별 노드 최적화(Simplification) 결과

`onnx-simplifier`를 사용하여 불필요한 연산 그래프를 제거하고 상수를 결합하여 대폭 경량화하였습니다.

| 모델 구분 | 원본 노드 수 | 최적화 후 노드 수 | 감소율 | 최종 파일명 |
| :--- | :---: | :---: | :---: | :--- |
| **PP-OCRv5 Server Det** | 1,306 | **264** | **79.79%** | `det_server_v5_web_final.onnx` |
| **PP-OCRv5 Server Rec** | 1,119 | **274** | **75.51%** | `rec_server_v5_web_final.onnx` |
| **UVDoc (Unwarping)** | 651 | **223** | **65.74%** | `uvdoc_v5_web_final.onnx` |
| **합계** | **3,076** | **761** | **75.26%** | - |

## 2. 웹 호환성 및 성능 최적화 내역

웹 브라우저의 GPU 가속(WebGL/WebGPU) 시 발생하는 커널 오류와 성능 저하를 해결하기 위해 다음과 같은 특수 최적화를 적용하였습니다.

### 2.1. Ceil 연산자 제거 (Model Surgery)
- **문제:** `Ceil` 연산은 브라우저 GPU 가속에서 미지원되거나 오동작을 유발함.
- **해결:** `MaxPool` 노드의 `ceil_mode`를 `1`에서 **`0`**으로 강제 변경하여 내부 `Ceil` 연산을 제거함.

### 2.2. Resize 모드 최적화
- **문제:** `asymmetric` 좌표 변환 모드는 부동소수점 오차로 인해 `Ceil`을 유발함.
- **해결:** 웹 환경에서 가장 안정적인 **`half_pixel`** 모드로 변경하여 렌더링 호환성 확보.

### 2.3. Dynamic Shape & Constant Folding
- **문제:** 동적 인덱스 계산(`Gather`, `Slice`, `Shape`)은 런타임 오버헤드를 유발함.
- **해결:** `onnxsim`을 통해 모든 정적 인덱스를 상수로 고정(Folding)하고, 가변 입력 크기(`704px`, `960px` 등)에 유연하게 대응하도록 가변 형상(Dynamic Shape) 설정을 유지하면서도 내부 연산은 정형화함.

## 3. 최종 결과물 정보

### 3.1. 모델 파일 경로 (`models/onnx/web/`)
- `det_server_v5_web_final.onnx`: 텍스트 검출 (83.6 MiB)
- `rec_server_v5_web_final.onnx`: 텍스트 인식 (80.2 MiB)
- `uvdoc_v5_web_final.onnx`: 문서 보정 (30.1 MiB)

### 3.2. 사전 파일
- `dict.txt`: PP-OCRv5 Server Recognition용 사전 (18,383자 포함)

---
**프로젝트 완료일:** 2026년 3월 12일
**도구:** Gemini CLI (Senior Software Engineer)
