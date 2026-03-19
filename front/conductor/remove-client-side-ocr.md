# 브라우저 OCR 관련 코드 제거 및 서버 OCR 전환 계획

## 목적

브라우저(Client-side)에서 실행되는 Web Worker 기반 OCR 로직을 완전히 제거하고, 모든 OCR 요청을 프론트엔드 서버(`src/app/api/ocr/route.ts`)로 일원화하여 성능 최적화 및 유지보수성을 높입니다.

## 변경 사항

### 1. Hook 수정: `src/features/scan/hooks/useOCR.ts`

- Web Worker 관련 로직(`workerRef`, `initOCR`, `executeOCR`) 삭제
- 이미지 전처리(`preprocessImage`) 및 모델 캐싱(`modelCache`) 관련 임포트 및 코드 삭제
- 기존 `executeServerOCR`을 `executeOCR`로 이름을 변경하거나, 서버 전용 훅으로 단순화
- `OCRState`에서 클라이언트 모델 로딩 관련 상태(`isLoaded`) 제거 및 간소화

### 2. 컴포넌트 수정: `src/features/scan/components/Scanner.tsx`

- `useOCR` 훅의 바뀐 인터페이스 반영 (`initOCR`, `isLoaded` 제거)
- 클라이언트 측 분석 테스트 버튼 및 관련 로직(`processClientOCRResults`) 삭제
- 모든 촬영 및 파일 업로드 시 서버 OCR(`executeServerOCR` 또는 개편된 `executeOCR`)만 호출하도록 수정
- 서버로부터 받은 `box` 좌표 데이터를 활용한 UI 렌더링 유지 및 최적화

### 3. 페이지 수정: `src/app/(main)/scan/page.tsx`

- `useOCR` 훅에서 더 이상 사용하지 않는 `initOCR`, `isLoaded` 등 제거
- 서버 OCR 호출 로직 확인 및 정리

### 4. 파일 삭제

- `src/features/scan/worker/ocr.worker.ts` (Web Worker 스크립트)
- `src/features/scan/utils/preprocess.ts` (클라이언트 전처리 유틸리티)
- `src/utils/model-cache.ts` (브라우저 모델 캐싱 로직)

## 검증 계획

1. **빌드 확인**: `npm run build`를 통해 제거된 파일에 대한 참조 오류가 없는지 확인
2. **기능 테스트**:
   - 카메라 촬영 시 서버 API(`/api/ocr`)가 정상 호출되는지 확인
   - 파일 업로드 시 서버 API가 정상 호출되는지 확인
   - 서버에서 반환된 텍스트와 박스 좌표가 화면에 올바르게 표시되는지 확인
3. **콘솔 로그 확인**: 클라이언트 워커 관련 로그가 사라지고 서버 OCR 로그만 출력되는지 확인
