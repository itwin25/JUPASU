# OCR 프로젝트 개발 로그 (Development Log)

이 문서는 프로젝트의 핵심 기술 선정 과정과 아키텍처 진화에 대한 고민을 기록합니다.

---

### [2026-03-10] 모델 선정 전략: TrOCR에서 Florence-2-large로의 전환

#### 1. 기존 모델(TrOCR)의 한계점 인지
- **패턴 매칭의 한계:** 2021년 기술인 TrOCR은 이미지 속 글자 패턴을 학습된 데이터와 대조하는 방식에 가까워, 와인 라벨 특유의 독특한 캘리그라피나 화려한 폰트에서 오인식 발생률이 높을 것으로 예상됨.
- **문맥 이해 부족:** 주변 배경(라벨 문양, 병의 질감 등)과 글자의 관계를 파악하는 지능이 부족하여 복잡한 레이아웃 대응이 어려움.

#### 2. 최신 VLM(Florence-2) 도입 결정
- **기술적 도약:** 2024년 Microsoft에서 공개한 Florence-2는 단순 OCR을 넘어 '이미지 전체를 해석'하는 시각-언어 통합 모델(VLM)임.
- **시각 추론(Visual Reasoning):** 54억 개의 방대한 데이터셋으로 학습된 모델 지능을 바탕으로, 처음 보는 변형된 폰트라도 "글자의 맥락"을 추론하여 읽어내는 능력이 탁월함.
- **멀티태스크 확장성:** 태스크 프롬프트(`<OCR>`) 방식의 아키텍처를 사용하여, 추후 '와인 로고 탐지'나 '라벨 영역 설명' 등 추가 기능으로의 확장이 유연함.

#### 3. 기대 효과
- **정확도:** 단순 텍스트 인식을 넘어 라벨의 복잡한 디자인 노이즈 속에서도 와인 브랜드명을 정확하게 추출할 것으로 기대.
- **효율성:** `large` 모델임에도 불구하고 최신 아키텍처(DaViT) 덕분에 양자화 시 로컬 환경에서도 실용적인 성능을 보일 것으로 판단됨.

---

### [2026-03-10] 트러블슈팅: Florence-2 모델 로딩 오류 및 어텐션(Attention) 호환성 해결

#### 1. 문제 상황 (`_supports_sdpa` AttributeError)
- **오류 내용:** `Florence2ForConditionalGeneration object has no attribute '_supports_sdpa'`
- **발생 원인:** `transformers` 라이브러리와 Florence-2의 커스텀 모델 코드(`trust_remote_code=True`) 간의 내부 구조 충돌. 최신 `transformers`가 모델 로딩 시 SDPA(Scaled Dot Product Attention) 지원 여부를 자동 검사하는데, Florence-2의 클래스에 해당 속성이 정의되어 있지 않아 에러가 발생함.

#### 2. Florence-2의 어텐션 특징과 해결책
- **어텐션(Attention) 특징:** Florence-2는 DaViT(Dual Attention Vision Transformer) 등 복잡한 시각-언어 통합 구조를 사용하기 때문에, 내부적으로 표준화된 어텐션 모듈이 아닌 자체적인 구현체를 포함하고 있음. 이로 인해 `transformers`의 기본 어텐션 최적화(SDPA, Flash Attention 등) 자동 탐지 로직과 충돌하게 됨.
- **해결 조치 (`attn_implementation="eager"`):**
    - 모델 로드 시 `AutoModelForCausalLM.from_pretrained`의 인자로 `attn_implementation="eager"`를 명시적으로 전달.
    - **효과:** 프레임워크가 강제로 최적화된 어텐션(SDPA)을 적용하려 하지 않고, PyTorch의 기본(eager) 모드 연산으로 안전하게 수행(fallback)하도록 유도하여 호환성 문제를 우회함.

#### 3. 추가 조치 (4-bit 양자화 도입)
- 어텐션 문제 해결과 동시에, 로컬 환경에서의 모델 소형화 및 VRAM 최적화를 위해 `bitsandbytes` 라이브러리를 적용함.
- `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4")` 옵션을 통해 파라미터 수가 7.7억 개인 Florence-2-large 모델을 4-bit로 양자화하여 실용적인 벤치마크가 가능하도록 기반을 마련함.

---

### [2026-03-10] 전략 수정: Florence-2의 한계와 PaddleOCR로의 기술 스택 전환

#### 1. Florence-2 실무 적용의 장애물 (VLM의 한계)
- **ONNX 변환의 복잡성:** `optimum` 라이브러리의 표준 인터페이스가 Florence-2의 커스텀 아키텍처(`florence2_language`)를 인식하지 못함. 수동 변환 시에도 PyTorch Exporter가 복잡한 동적 텐서 형태(Dynamic Shape)를 추적하는 과정에서 지속적인 런타임 오류 발생.
- **모델 용량 부담:** Large 모델 기준 약 1.5GB에 달하는 용량은 모바일 가속이나 엣지 컴퓨팅 환경에서 배포 부담으로 작용. 양자화를 하더라도 절대적인 모델 파일 크기 축소에는 한계가 있음.
- **오버킬(Overkill) 판단:** 와인 라벨 인식은 '문맥 추론'보다 '정확한 텍스트 검출 및 판독'이 핵심인데, 이를 위해 7.7억 개의 파라미터를 사용하는 VLM은 비용 대비 효율이 낮다고 판단.

#### 2. 대안 모델: PaddleOCR 선정 이유
- **압도적인 경량성:** 수십 MB 단위(20MB~50MB)의 모델 크기로 Florence-2 대비 약 1/30 수준의 경량화 달성.
- **최적화된 Scene Text 인식:** 와인 병의 곡면을 따라 휘어진 텍스트(Curved Text)나 다양한 화려한 폰트 인식에 특화된 전용 알고리즘(PP-OCRv4 등) 제공.
- **ONNX/TensorRT 친화성:** 이미 산업계에서 널리 검증된 모델로, 라이브러리 차원의 ONNX 지원이 완벽하여 배포 안정성이 매우 높음.
- **추론 속도:** GPU 환경 기준 Florence-2(약 900ms) 대비 10배 이상 빠른 0.1s~0.3s 수준의 성능 기대.

#### 3. 향후 방향성
- Florence-2를 통한 VLM 실험은 기술 검증용으로 마무리하고, 실제 서비스 엔진은 **PaddleOCR**을 기반으로 구축.
- 추출된 텍스트 데이터를 와인 DB와 매칭하기 위한 후처리 및 검색 최적화 로직 개발에 집중하기로 함.
