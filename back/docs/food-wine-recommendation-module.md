# 음식 기반 와인 추천 모듈 정리

## 목적
- 챗봇 전체 기능과 분리해서 음식 기반 와인 추천 기능만 독립적으로 동작하도록 준비한다.
- 사용자가 입력한 음식 텍스트를 기준으로 와인 후보를 찾고, 사용자 취향을 반영해 Best 1 와인을 반환한다.

## 현재 구조
1. 사용자 입력 음식 텍스트를 받는다.
2. 음식 텍스트를 임베딩한다.
3. PGVector로 와인 후보를 검색한다.
4. `TasteReport` 우선, `Preference` fallback으로 사용자 취향 데이터를 조회한다.
5. 음식 유사도 + 직접 페어링 + 취향 점수로 후보를 재정렬한다.
6. Best 1 와인을 추천 이유와 함께 응답으로 조립한다.

## 개인화 기준
- 1순위: `TasteReport`
  - 리뷰 기반 평균 취향값을 사용한다.
  - `avgSweetness`, `avgAcidity`, `avgBody`, `avgTannin`, `avgAlcohol`
- 2순위: `Preference`
  - 사용자가 직접 설정한 취향값을 fallback으로 사용한다.

## 관련 파일
- 서비스: `C:\Users\SSAFY\Desktop\S14P21A505\back\src\main\java\com\a505\jupasu\domain\wine\service\FoodWineRecommendationService.java`
- 후보 검색 리포지토리: `C:\Users\SSAFY\Desktop\S14P21A505\back\src\main\java\com\a505\jupasu\domain\wine\repository\FoodWineRecommendationQueryRepository.java`
- 요청 DTO: `C:\Users\SSAFY\Desktop\S14P21A505\back\src\main\java\com\a505\jupasu\domain\wine\dto\FoodWineRecommendationRequest.java`
- 응답 DTO: `C:\Users\SSAFY\Desktop\S14P21A505\back\src\main\java\com\a505\jupasu\domain\wine\dto\FoodWineRecommendationResponse.java`
- 점수 DTO: `C:\Users\SSAFY\Desktop\S14P21A505\back\src\main\java\com\a505\jupasu\domain\wine\dto\FoodWineScoreBreakdown.java`
- 테스트: `C:\Users\SSAFY\Desktop\S14P21A505\back\src\test\java\com\a505\jupasu\domain\wine\service\FoodWineRecommendationServiceTest.java`

## API 형태
- 엔드포인트: `POST /api/wines/recommendations/food`
- 현재 요청 요소
  - Body: `foodText`, `candidateLimit`
  - Query Param: `queryVector`

## 고정 호출 계약
다른 담당자는 내부 단계(`prepareContext`, `searchCandidates`, `rerankCandidates`)를 직접 조합하지 않고 아래 계약만 사용하면 된다.

### 서비스 진입점
- `FoodWineRecommendationService.recommend(Long userId, FoodWineRecommendationRequest request, String queryVector)`

### 컨트롤러 진입점
- `POST /api/wines/recommendations/food`

즉 호출자가 알아야 하는 입력은 아래 세 가지다.
- `userId`
- `foodText`
- `queryVector`

호출자는 추천 결과로 아래 네 가지만 받는다.
- `foodText`
- `recommendedWine`
- `reason`
- `matchPercent`

예시 요청 바디:

```json
{
  "foodText": "스테이크",
  "candidateLimit": 5
}
```

예시 응답 형태:

```json
{
  "foodText": "스테이크",
  "recommendedWine": {
    "wineId": 303,
    "nameKr": "캐릭 배너크번 피노 누아 2021",
    "nameEn": "Carrick Bannockburn Pinot Noir 2021",
    "wineType": "RED",
    "wineTypeLabel": "레드 와인",
    "country": "New Zealand",
    "region": "Central Otago",
    "price": 45754,
    "imageUrl": "https://example.com/wine.png",
    "detailUrl": "/wines/303"
  },
  "reason": "스테이크와 잘 어울리는 와인이에요. ...",
  "matchPercent": 82
}
```

## 점수 구성
- 음식 유사도
  - PGVector 검색 similarity
- 직접 페어링 점수
  - `food_pairings`와 음식 카테고리 직접 매칭
- 취향 점수
  - 바디, 산미, 탄닌, 당도
  - 선호 와인 타입
  - 선호 향 키워드
  - 가격대

현재 가중치:
- 취향 정보 있음
  - 음식 0.55
  - 취향 0.35
  - 직접 페어링 0.10
- 취향 정보 없음
  - 음식 0.70
  - 직접 페어링 0.30

## 지금 결과를 확인하는 방법

### 1. 음식 추천 모듈 테스트 결과 보기
인증과 무관하게 모듈 자체가 정상인지 가장 먼저 확인하는 방법이다.

실행:

```bash
cd back
./gradlew.bat test --tests com.a505.jupasu.domain.wine.service.FoodWineRecommendationServiceTest
```

결과 확인:
- 콘솔에서 `BUILD SUCCESSFUL` 확인
- HTML 리포트:
  - `C:\Users\SSAFY\Desktop\S14P21A505\back\build\reports\tests\test\index.html`

콘솔에 재정렬된 Best 1 결과까지 직접 보고 싶다면, up-to-date 캐시를 무시하고 아래처럼 실행한다.

```bash
cd back
./gradlew.bat test --tests com.a505.jupasu.domain.wine.service.FoodWineRecommendationServiceTest --rerun-tasks --info
```

이 테스트에서 확인하는 것:
- 직접 페어링 + 취향이 맞는 와인이 재정렬에서 1등이 되는지
- Best 1 응답 DTO가 정상 조립되는지

### 2. 실제 DB 검색 결과 보기
실제 임베딩/PGVector 검색 결과를 보고 싶으면 SQL 생성 스크립트를 사용한다.

예시:

```bash
python back/scripts/generate_food_search_sql.py "스테이크" --limit 5
docker cp "C:\Users\SSAFY\Desktop\S14P21A505\back\src\main\resources\sql\recommendation\05_test_food_search.sql" jupasu-postgres-local:/tmp/05_test_food_search.sql
docker exec -i jupasu-postgres-local sh -c "psql -U jupasu_user -d jupasu -f /tmp/05_test_food_search.sql"
```

이 방식으로 확인할 수 있는 것:
- top-k 후보 와인
- similarity
- `embedding_text_ko` 미리보기
- `food_pairings`

### 3. API 응답 결과 보기
이건 인증이 정상일 때 가능하다.

현재 API:
- `POST /api/wines/recommendations/food`

주의:
- 현재는 `queryVector`를 직접 넘겨야 한다.
- 인증 이슈가 해결된 뒤 실제 토큰으로 호출해 확인하면 된다.

## 현재 한계
- API가 아직 `foodText`만 받아서 내부에서 바로 임베딩하는 구조는 아니다.
- 로그인 API 쪽 이슈 때문에 엔드투엔드 호출 확인은 보류 상태다.
- 그래서 현재는
  - 서비스 단위 테스트
  - PGVector 검색 SQL 확인
  두 방식으로 기능을 검증하고 있다.

## 다음 단계
- `foodText`만 받아서 내부에서 임베딩까지 처리하도록 개선
- 인증 이슈가 정리되면 실제 API 응답 검증
- 이후 챗봇에서 이 모듈을 호출하는 방식으로 연결
