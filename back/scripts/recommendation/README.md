# Food Wine Recommendation Prototype

이 폴더는 `wine-pgvector-mini`에서 검증한 음식 기반 와인 추천 원형을
본 프로젝트 기준으로 참조하기 위해 옮겨둔 프로토타입 보관 위치입니다.

포함 파일:

- `recommender_prototype.py`
  - 음식 + 사용자 취향 점수 계산
  - 추천 이유 생성
  - 매칭률 계산
- `search_wines_by_food.py`
  - 음식 문장을 임베딩하고 PGVector로 후보를 검색한 뒤
    프로토타입 추천 엔진으로 재정렬하는 CLI 스크립트

주의:

- 현재 운영용 백엔드 로직은 아닙니다.
- Java 서비스로 옮길 때 참고할 기준 구현입니다.
- `wine-pgvector-mini` 원본은 실험 및 검증을 위해 유지합니다.

취향 데이터 사용 방향:

- 1차 점수 계산 기준은 `Preference`보다 `TasteReport`가 더 적합합니다.
- 이유:
  - `TasteReport`는 `Preference` + 실제 리뷰 이력을 함께 반영한 평균 취향값을 가지고 있습니다.
  - 따라서 사용자의 실제 마신 이력까지 반영된 개인화 점수를 만들기 좋습니다.
- 권장 방식:
  - `TasteReport`가 있으면 `avgSweetness`, `avgAcidity`, `avgBody`, `avgTannin`, `avgAlcohol`를 우선 사용
  - `TasteReport`가 없으면 `Preference`를 fallback으로 사용
  - `Preference.preferSummary`와 `TasteReport.content`는 추천 이유 문장 생성에 활용
