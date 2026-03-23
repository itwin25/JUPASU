# Wine PGVector Mini

음식 기반 와인 추천 기능을 빠르게 실험하기 위한 독립 미니 프로젝트입니다.

기존 `ai`, `back`, `front` 구조와 분리해서 아래 흐름을 먼저 검증하는 목적입니다.

- 최종 Vivino JSON을 로컬 PostgreSQL에 적재
- 와인 데이터를 임베딩용 한국어 문장으로 변환
- GMS를 통해 와인 임베딩 생성
- 음식 문장으로 후보 와인 검색
- 사용자 취향(`Preference` 스타일 1~5 점수)을 반영해 재정렬

## 목표

이 미니 프로젝트는 최종적으로 아래 추천 구조를 검증합니다.

1. 음식과 잘 어울리는 와인을 먼저 찾는다.
2. 그 후보들 중에서 사용자 취향과 더 잘 맞는 순서로 다시 정렬한다.
3. 사용자에게는 이해하기 쉬운 추천 결과와 추천 이유를 보여준다.

즉, 단순한 벡터 검색이 아니라 `음식 궁합 + 사용자 취향`을 함께 반영하는 추천 실험용 프로젝트입니다.

## 현재 구현 범위

현재 구현된 기능은 아래와 같습니다.

- 와인 JSON -> 정규화 -> `embedding_text_ko` 생성
- 로컬 PostgreSQL `wine` 테이블 적재
- GMS OpenAI 호환 임베딩 API를 이용한 `wine.embedding` 생성
- 음식 문장 기반 pgvector 검색
- 사용자 취향 기반 재정렬 로직
- 챗봇형 응답을 위한 Best 1 추천 문장 생성

아직 하지 않은 일은 아래와 같습니다.

- 백엔드 API에 직접 연결
- 실제 사용자 `Preference` 엔티티 조회와 자동 연동
- 추천 결과 설명문 최종 고도화

## 고도화 과정

이번 미니 프로젝트는 처음부터 완성된 추천 품질을 목표로 하기보다, 아래 순서로 점진적으로 고도화했습니다.

### 1. JSON -> 검색용 텍스트 생성

처음에는 Vivino JSON을 그대로 쓰기보다, 검색에 필요한 정보만 담은 `embedding_text_ko`를 만드는 작업부터 시작했습니다.

- 와인명
- 국가 / 지역
- 와인 타입
- 품종
- 대표 향 / 풍미
- 바디감 / 산미 / 탄닌 / 당도
- 음식 페어링

이 단계의 목표는 `예쁜 문장`이 아니라 `검색 단서가 풍부한 문장`을 만드는 것이었습니다.

### 2. GMS 임베딩 + pgvector 검색 연결

그다음에는 생성한 `embedding_text_ko`를 GMS 임베딩 API로 보내 `wine.embedding`을 만들고, 음식 문장을 기준으로 pgvector 검색이 가능하도록 연결했습니다.

이 단계에서는:

- 와인 데이터 전체 임베딩
- 음식 문장 임베딩
- 후보 와인 top-k 검색

까지를 먼저 확인했습니다.

### 3. 음식만 맞는 추천의 한계 확인

초기에는 음식 문장 기반 유사도만으로 추천했기 때문에, 아래 문제가 있었습니다.

- 스테이크인데도 기대와 다른 와인이 나올 수 있음
- 사용자의 취향이 반영되지 않음
- 검색 결과는 나와도 추천 서비스 느낌이 약함

그래서 `음식 검색 -> 사용자 취향 재정렬` 구조로 방향을 바꿨습니다.

### 4. 사용자 취향(Preference) 반영

백엔드의 `Preference.java` 구조를 기준으로 아래 값을 1~5 척도로 비교하도록 설계했습니다.

- body
- acidity
- tannin
- sweetness
- preferredWineTypes
- preferredFlavors
- preferredPriceMin / preferredPriceMax

즉, 음식으로 후보를 먼저 찾고 그다음 사용자 취향으로 다시 순서를 조정하는 구조로 고도화했습니다.

### 5. 추천 결과 5개 -> Best 1 방향으로 변경

처음에는 top-k 후보를 여러 개 보여주는 방식으로 테스트했지만, 실제 챗봇 UX에서는 아래 문제가 있었습니다.

- 정보량이 많아 사용자가 결정하기 어려움
- 추천 이유가 비슷해 보임
- `그래서 뭘 고르면 되는데?`라는 느낌이 강함

그래서 현재는 `내부적으로는 여러 후보를 검색하고`, `사용자에게는 가장 적합한 1개를 먼저 추천`하는 방향으로 전환했습니다.

### 6. 추천 이유 문장 고도화

추천 이유도 여러 번 수정했습니다.

처음 문제:

- 설명이 딱딱하고 개발자 로그처럼 보임
- `탄닌`, `바디감` 같은 표현이 초보자에게 어려움
- 같은 추천 이유가 반복됨
- 음식과 왜 맞는지 설명이 약함

개선 방향:

- 초보자도 이해하기 쉬운 표현 사용
- 음식별 설명 축 분리
  - 스테이크: 고기 맛을 받쳐준다
  - 크림 파스타: 느끼함을 덜어준다
  - 매운 음식: 매운맛을 조금 더 편안하게 느끼게 해준다
  - 치즈: 고소하고 짭짤한 맛과 어우러진다
- 추천 이유는 `음식 이유 1개 + 취향/입문자 이유 1개`만 선택
- 사용자에게는 챗봇형 톤으로 전달

### 7. 내부 점수 -> 사용자 표시용 매칭률

내부 `final_score`는 랭킹용이라 그대로 보여주면 낮아 보이는 문제가 있었습니다.

예:

- `0.5491`

이 값은 내부 비교에는 괜찮지만, 사용자에게는 추천도가 낮아 보일 수 있습니다.

그래서 현재는:

- 내부 계산: `final_score`
- 사용자 표시: `음식/취향 매칭률`

로 나누어 사용하고 있습니다.

### 8. 현재 상태

현재는 아래까지 확인된 상태입니다.

- 검색/랭킹 파이프라인 동작
- 음식 + 취향 기반 재정렬
- 챗봇형 Best 1 응답 구조
- 추천 이유 문장 실험

다만 추천 이유 문장은 계속 손봐야 하는 상태이며, 현재 미니 프로젝트의 가장 큰 목적은 `추천 구조 검증`입니다.

## 디렉터리 구조

- `src/wine_pgvector_mini/transformer.py`
  - 와인 JSON을 정규화하고 `embedding_text_ko`를 생성합니다.
- `src/wine_pgvector_mini/recommender.py`
  - 음식 점수, 취향 점수, 직접 페어링 점수를 합쳐 최종 추천 점수를 계산합니다.
- `scripts/embed_wines_with_gms.py`
  - `embedding_text_ko`를 GMS 임베딩 API로 보내 `wine.embedding`을 채웁니다.
- `scripts/search_wines_by_food.py`
  - 음식 문장으로 후보 와인을 검색하고 취향 점수로 재정렬합니다.
- `scripts/generate_embedding_update_sql.py`
  - JSON으로부터 `embedding_text_ko` 업데이트 SQL을 생성합니다.
- `sql/import_vivino_to_local_db.sql`
  - 최종 와인 JSON을 로컬 DB에 적재합니다.
- `sql/alter_wine_add_embedding_columns.sql`
  - `embedding_text_ko`, `embedding`, `embedding_model`, `embedding_generated_at` 컬럼을 추가합니다.
- `tests/test_transformer.py`
  - 변환 로직 테스트
- `tests/test_recommender.py`
  - 추천 점수 로직 테스트

## 데이터 적재 기준

최종 와인 데이터는 아래 JSON을 기준으로 로컬 Docker PostgreSQL에 적재했습니다.

- 와인 수: `3569`
- 음식 카테고리 수: `16`
- 와인-음식 페어링 수: `12241`

와인 테이블에는 아래 주요 필드가 들어갑니다.

- `name_kr`, `name_en`
- `type`
- `country`, `region`, `winery`
- `grape_variety`
- `price`
- `body`, `acidity`, `tannin`, `sweetness`
- `description`, `style`
- `embedding_text_ko`
- `embedding`

## 임베딩 텍스트 생성

사용자에게 보여줄 설명문이 아니라, 검색 단서가 풍부한 임베딩 전용 문장을 만듭니다.

예시 구조:

```text
{와인명}는 {국가} {지역}에서 생산된 {와인타입}입니다.
{품종} 품종 기반으로, {대표 향/풍미}가 두드러집니다.
{바디감}, {산미}, {탄닌}, {당도}의 특징을 가지며, {어울리는 음식}과 잘 어울립니다.
```

핵심은 문장을 화려하게 만드는 것이 아니라, 검색에 필요한 정보가 잘 들어가도록 만드는 것입니다.

## GMS 임베딩 사용 방식

임베딩 생성은 GMS를 통해 OpenAI 호환 엔드포인트로 호출합니다.

- 엔드포인트: `https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings`
- 기본 모델: `text-embedding-3-small`

`.env` 예시:

```env
GMS_KEY=your_gms_key
```

임베딩 실행 예시:

```bash
cd wine-pgvector-mini
python scripts/embed_wines_with_gms.py --db-port 15432 --limit 10
python scripts/embed_wines_with_gms.py --db-port 15432
```

## 음식 기반 검색 로직

기본 검색 흐름은 아래와 같습니다.

1. 사용자가 입력한 음식 문장을 임베딩한다.
2. `wine.embedding`과 pgvector 유사도 검색을 수행한다.
3. top-k 후보 와인을 가져온다.
4. 음식 점수와 사용자 취향 점수로 다시 정렬한다.
5. 사용자에게는 Best 1만 우선 추천한다.

예시:

```bash
python scripts/search_wines_by_food.py "스테이크"
```

## 챗봇형 Best 1 추천 방식

현재 미니 프로젝트는 검색 결과 여러 개를 그대로 나열하기보다, 챗봇 UI에 맞게 `가장 적합한 1개`를 먼저 추천하는 방향으로 실험 중입니다.

이 구조를 선택한 이유는 아래와 같습니다.

- 추천 후보 5개를 한 번에 보여주면 사용자가 오히려 결정하기 어려워짐
- 챗봇 말풍선 UI에서는 소믈리에가 하나를 큐레이션해주는 방식이 더 자연스러움
- 한 개를 추천할수록 추천 이유를 더 짧고 설득력 있게 만들 수 있음

현재 사용자에게 보여주는 정보는 아래와 같습니다.

- 추천 와인 1개
- 추천 이유
- 음식/취향 매칭률
- 가격
- 산지

내부적으로는 여러 후보를 검색한 뒤, 최종적으로는 Best 1만 보여줍니다.

## 사용자 취향 반영 로직

검색된 후보 와인을 그대로 보여주지 않고, 사용자 취향으로 다시 정렬합니다.

현재는 백엔드 `Preference.java` 구조를 참고해 아래 축을 반영합니다.

- `body` (1~5)
- `acidity` (1~5)
- `tannin` (1~5)
- `sweetness` (1~5)
- `preferredWineTypes`
- `preferredFlavors`
- `preferredPriceMin`, `preferredPriceMax`

### 1~5 점수 비교 방식

수치 취향은 아래 식으로 점수를 계산합니다.

```text
항목 일치도 = 1 - (|사용자 선호값 - 와인값| / 4)
```

예를 들어 사용자가 바디감을 `5`로 선호하고, 와인의 바디가 `4.0`이면:

```text
1 - (|5 - 4.0| / 4) = 0.75
```

### 향 선호 반영 방식

현재는 아래 향 카테고리를 지원합니다.

- `FRUIT`
- `FLOWER`
- `BERRY`
- `SPICE`
- `OAK`

와인의 `embedding_text_ko`, `style`, `grape_variety` 안에 해당 키워드가 있는지 보고 점수를 줍니다.

### 직접 페어링 점수

음식 임베딩 유사도 외에도, `wine_food_pairing`에 해당 음식 카테고리가 직접 연결되어 있으면 추가 점수를 줍니다.

예:

- `스테이크` -> `소고기`
- `양갈비` -> `양고기`
- `크림 파스타` -> `파스타`
- `매운 닭갈비` -> `닭고기`, `매운 음식`

### 추천 이유 생성 규칙

현재 추천 이유는 `음식 이유 1개 + 취향 이유 1개` 구조를 기본으로 합니다.

- 취향 정보가 있는 경우
  - 음식과 왜 잘 맞는지 1문장
  - 사용자의 취향과 왜 맞는지 1문장
- 취향 정보가 없는 경우
  - 음식과 왜 잘 맞는지 1문장
  - 처음 마시는 사람도 왜 편한지 1문장

즉, 한 번에 많은 이유를 나열하기보다 가장 설명력이 높은 이유 두 개만 선택하도록 설계했습니다.

## 종합 추천 점수

최종 추천 점수는 아래 세 가지를 합쳐 계산합니다.

- 음식 임베딩 점수
- 사용자 취향 점수
- 직접 페어링 점수

취향 정보가 없을 때:

```text
final_score = food_score * 0.70 + direct_pairing_score * 0.30
```

취향 정보가 있을 때:

```text
final_score = food_score * 0.55 + preference_score * 0.35 + direct_pairing_score * 0.10
```

이 구조를 사용한 이유는 아래와 같습니다.

- 음식 궁합이 추천의 출발점이기 때문
- 취향은 재정렬에 강하게 반영하되, 음식 궁합을 완전히 덮어쓰지는 않도록 하기 위해
- 데이터에 직접 존재하는 음식 페어링은 가볍게 가산점으로 활용하기 위해

### 사용자 표시용 매칭률

내부 계산은 `final_score`로 유지하지만, 사용자에게는 직관적인 퍼센트 형태로 보여주기 위해 표시용 점수를 따로 씁니다.

```text
matchPercent = 60 + (final_score * 40)
```

예:

- `final_score = 0.5491`
- 사용자 표시: `82%`

즉, 내부 점수는 랭킹용이고 사용자에게는 `음식/취향 매칭률`로 보여줍니다.

## 실행 예시

음식만 반영:

```bash
python scripts/search_wines_by_food.py "스테이크" --limit 1
```

음식 + 취향 반영:

```bash
python scripts/search_wines_by_food.py "스테이크" --limit 1 --body 5 --tannin 4 --sweetness 2 --preferred-type RED --preferred-flavor OAK --price-min 30000 --price-max 80000
```

디버그 모드:

```bash
python scripts/search_wines_by_food.py "스테이크" --body 5 --tannin 4 --preferred-type RED --preferred-flavor OAK --debug
```

디버그 모드에서는 아래 값을 함께 볼 수 있습니다.

- `food_score`
- `preference_score`
- `direct_pairing_score`
- `type_score`
- `flavor_score`
- `price_score`
- `metric_scores`

## 검증 방법

임베딩 완료 건수 확인:

```bash
python -c "import psycopg; conn=psycopg.connect(host='127.0.0.1', port=15432, dbname='jupasu', user='jupasu_user', password='jupasu_pass'); cur=conn.cursor(); cur.execute('select count(*) from wine where embedding is not null'); print(cur.fetchone()[0]); conn.close()"
```

추천 스코어 로직 검증:

```bash
python -m py_compile scripts/search_wines_by_food.py src/wine_pgvector_mini/recommender.py tests/test_recommender.py
```

추천 결과 품질 확인:

```bash
python scripts/search_wines_by_food.py "스테이크" --limit 1
python scripts/search_wines_by_food.py "스테이크" --limit 1 --body 5 --tannin 4 --preferred-type RED --preferred-flavor OAK
python scripts/search_wines_by_food.py "크림 파스타" --limit 1
python scripts/search_wines_by_food.py "매운 닭갈비" --limit 1
python scripts/search_wines_by_food.py "치즈 플래터" --limit 1
```

위 시나리오로 아래 항목을 확인하면 좋습니다.

- 추천 이유가 초보자도 이해하기 쉬운지
- 음식별 설명이 너무 비슷하지 않은지
- 취향이 있을 때와 없을 때 문장이 구분되는지
- 추천 와인이 실제 음식과 납득 가능하게 연결되는지

## 현재 한계

현재 미니 프로젝트는 추천 구조를 빠르게 검증하기 위한 단계라 아래 한계가 있습니다.

- 추천 이유가 여전히 비슷하게 느껴질 수 있음
- 음식별 설명 문구가 충분히 풍부하지 않음
- 후보 간 차별점을 더 강하게 드러내는 로직이 부족함
- 최종 소믈리에 멘트 품질은 추가 보정이 더 필요함

즉, 지금은 `검색/랭킹 구조 검증`에는 충분하지만 `최종 사용자 문장 품질`은 계속 다듬어야 하는 상태입니다.

## 다음 단계

다음으로 이어서 할 만한 작업은 아래와 같습니다.

- 백엔드 `Preference` 조회값을 이 추천 로직에 직접 연결
- 사용자별 취향 DTO -> 추천 파라미터 변환기 추가
- 추천 결과 설명문을 백엔드 응답 포맷에 맞게 정리
- 음식 텍스트와 취향을 함께 반영한 API 엔드포인트 구현
