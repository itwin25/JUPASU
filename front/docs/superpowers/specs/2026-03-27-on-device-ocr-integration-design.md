# 온디바이스 OCR 통합 설계 (On-Device OCR Integration Design)

- **작성일**: 2026-03-27
- **상태**: 초안 (Draft)
- **주제**: 프론트엔드 서버 액션 기반 OCR과 병행하여 브라우저 환경에서 동작하는 온디바이스 OCR 엔진 추가

## 1. 배경 및 목적 (Context & Goals)
현재 와인/메뉴 스캔 기능은 Next.js 서버 액션을 통해 프론트엔드 서버에서 PaddleOCR 모델을 실행하여 결과를 추출합니다. 이는 높은 정확도를 제공하지만, 대량의 이미지 업로드로 인한 서버 부하와 네트워크 지연이 발생할 수 있습니다. 
본 설계의 목적은 **"빠른 스캔"** 옵션을 제공하기 위해 브라우저 내부(엣지 디바이스)에서 OCR을 수행하고, 결과 텍스트만 서버로 보내 정제함으로써 성능과 효율성을 극대화하는 것입니다.

### 핵심 목표
- 기존 서버 액션 기반 OCR(`ocr.action.ts`) 로직 100% 보존 및 유지.
- 브라우저 Web Worker와 `onnxruntime-web`을 이용한 독립적인 온디바이스 OCR 엔진 추가.
- 사용자가 UI에서 "빠른 스캔(로컬)"과 "정밀 스캔(서버)"을 명시적으로 선택할 수 있도록 UI 확장.

## 2. 아키텍처 및 시스템 구조 (Architecture)

### 2.1 하이브리드 OCR 워크플로우
1. **눈(Vision) - 로컬**: 브라우저 내 Web Worker에서 ONNX 모델을 사용하여 텍스트 영역 검출 및 판독 수행.
2. **뇌(Refining) - 서버**: 로컬에서 추출된 Raw 텍스트를 AI 백엔드 서버(FastAPI)의 LLM 엔진으로 전송하여 구조화된 데이터 생성.

### 2.2 주요 구성 요소
- **`ocr.worker.ts` (신규)**: `onnxruntime-web`을 탑재한 Web Worker. 메인 스레드 차단 없이 무거운 모델 추론(Inference) 담당.
- **`useOnDeviceOCR.ts` (신규)**: 워커의 생명주기를 관리하고 메인 스레드와 통신하는 커스텀 훅.
- **`Scanner.tsx` (수정)**: 기존 단일 스캔 버튼을 반으로 나누어 로컬/서버 스캔 기능을 각각 바인딩.

## 3. 상세 설계 (Details)

### 3.1 Web Worker 통신 규약
- **INPUT**: `INIT` (모델 경로), `PROCESS` (이미지 데이터, 해상도 정보)
- **OUTPUT**: `INIT_COMPLETE`, `PROCESS_COMPLETE` (추출된 텍스트 리스트), `ERROR` (에러 메시지)

### 3.2 모델 및 리소스 전략
- **모델**: `public/models/mobile/` 내 경량화된 `det_mobile.onnx`, `rec_mobile_ko.onnx` 사용.
- **런타임**: `onnxruntime-web` (WASM 기반, 가능 시 WebGPU 가속 활용).
- **최적화**: 이미지 전송 시 `Transferable Objects`를 사용하여 데이터 복사 비용 최소화.

### 3.3 UI/UX 변경 사항
- `Scanner.tsx`의 스캔 버튼 구역을 50:50으로 분할.
- 왼쪽 구역: **"빠른 스캔"** (온디바이스 실행, 즉각적인 피드백)
- 오른쪽 구역: **"정밀 스캔"** (기존 서버 액션 실행, 고정밀 결과)

## 4. 데이터 정제 및 통합 (Data Integration)
온디바이스 OCR로 추출된 Raw 텍스트는 기존 `ocr.action.ts`에서 사용하던 `callBackendRefine` 함수를 통해 백엔드 서버로 전달됩니다. 이를 통해 기존에 잘 구축된 LLM 정제 로직(`refiner.py`)을 그대로 재사용하여 데이터 일관성을 유지합니다.

## 5. 단계별 구현 계획 (Implementation Roadmap)
1. **모델 배치**: `onnxruntime-web` 및 모바일 전용 모델 파일 준비.
2. **워커 구현**: `ocr.worker.ts` 작성 및 ONNX 런타임 초기화 테스트.
3. **훅 개발**: `useOnDeviceOCR.ts` 개발 및 워커 메시징 연동.
4. **UI 연동**: `Scanner.tsx` 레이아웃 수정 및 두 스캔 방식의 병렬 연결.
5. **검증**: 저사양 모바일 기기에서의 성능 및 메모리 점유율 확인.
