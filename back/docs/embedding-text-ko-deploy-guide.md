# embedding_text_ko / embedding 배포 반영 가이드

이 문서는 운영/배포 DB에 `wine.embedding_text_ko`와 `wine.embedding`을 반영하기 위한 최소 절차를 정리한다.

## 목적

- 음식 기반 와인 추천을 위한 검색용 한국어 문서를 `wine` 테이블에 저장한다.
- 같은 문서를 GMS 임베딩으로 변환해 PGVector 검색에 활용한다.

## 1. embedding_text_ko 스키마 반영

운영 DB에 아래 SQL을 먼저 반영한다.

- [01_add_embedding_text_ko.sql](/C:/Users/SSAFY/Desktop/S14P21A505/back/src/main/resources/sql/recommendation/01_add_embedding_text_ko.sql)

핵심 내용:

```sql
ALTER TABLE wine
ADD COLUMN IF NOT EXISTS embedding_text_ko TEXT;
```

## 2. embedding_text_ko 백필 SQL 생성

최종 Vivino JSON 파일을 기준으로 `embedding_text_ko` 업데이트 SQL을 생성한다.

실행 예시:

```bash
python back/scripts/generate_embedding_text_ko_update_sql.py "C:/Users/SSAFY/Downloads/vivino_ultra_results_kr_food.json" "C:/Users/SSAFY/Desktop/S14P21A505/back/src/main/resources/sql/recommendation/02_backfill_embedding_text_ko.sql"
```

기본 경로를 그대로 쓸 때는 더 짧게 실행할 수 있다.

```bash
python back/scripts/generate_embedding_text_ko_update_sql.py
```

생성되는 SQL 특징:

- `name_en` 또는 `name_kr` 기준으로 와인을 찾는다.
- `embedding_text_ko`가 비어 있는 행만 업데이트한다.
- 재실행해도 기존 값이 있으면 덮어쓰지 않도록 설계했다.

## 3. embedding_text_ko 운영 DB 반영 순서

1. `01_add_embedding_text_ko.sql` 실행
2. 생성된 `02_backfill_embedding_text_ko.sql` 검토
3. 샘플 몇 건 수동 확인
4. 운영 DB에 백필 SQL 실행

터미널에서 직접 적용하려면 아래 스크립트를 쓸 수 있다.

```bash
python back/scripts/apply_sql_file.py 01_add_embedding_text_ko.sql --db-host <host> --db-port <port> --db-name <db> --db-user <user> --db-password <password>
python back/scripts/apply_sql_file.py 02_backfill_embedding_text_ko.sql --db-host <host> --db-port <port> --db-name <db> --db-user <user> --db-password <password>
```

로컬 Docker DB 기준 기본 포트는 `15432`를 권장한다. Windows에 별도 PostgreSQL 서비스가 실행 중이면 `5432`와 충돌할 수 있다.

## 4. embedding_text_ko 검증 SQL

```sql
SELECT COUNT(*) AS total_count FROM wine;

SELECT COUNT(*) AS filled_count
FROM wine
WHERE embedding_text_ko IS NOT NULL
  AND embedding_text_ko <> '';

SELECT id, name_kr, LEFT(embedding_text_ko, 300)
FROM wine
WHERE embedding_text_ko IS NOT NULL
ORDER BY id
LIMIT 5;
```

## 5. embedding 벡터 컬럼 추가

`embedding_text_ko`를 채운 뒤에는 벡터 저장용 컬럼도 준비한다.

- [03_add_embedding_vector_columns.sql](/C:/Users/SSAFY/Desktop/S14P21A505/back/src/main/resources/sql/recommendation/03_add_embedding_vector_columns.sql)

핵심 내용:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE wine
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;
```

## 6. embedding 배치 실행

아래 스크립트로 `embedding_text_ko`를 GMS 임베딩으로 변환해 저장할 수 있다.

- [embed_embedding_text_ko_with_gms.py](/C:/Users/SSAFY/Desktop/S14P21A505/back/scripts/embed_embedding_text_ko_with_gms.py)

샘플 실행:

```bash
python back/scripts/embed_embedding_text_ko_with_gms.py --db-host <host> --db-port <port> --db-name <db> --db-user <user> --db-password <password> --limit 10
```

권장 반영 순서:

1. `03_add_embedding_vector_columns.sql` 실행
2. `--limit 10`으로 샘플 임베딩 생성
3. 샘플 row 확인
4. 전체 배치 실행

터미널 예시:

```bash
python back/scripts/apply_sql_file.py 03_add_embedding_vector_columns.sql --db-host <host> --db-port <port> --db-name <db> --db-user <user> --db-password <password>
python back/scripts/embed_embedding_text_ko_with_gms.py --db-host <host> --db-port <port> --db-name <db> --db-user <user> --db-password <password> --limit 10
```

호스트 DB 포트가 Docker DB와 충돌하는 환경이라면, DB에 직접 접속하지 않고 임베딩 UPDATE SQL을 생성한 뒤 Docker 컨테이너 안에서 적용하는 방식도 사용할 수 있다.

- [generate_embedding_vector_update_sql.py](/C:/Users/SSAFY/Desktop/S14P21A505/back/scripts/generate_embedding_vector_update_sql.py)

샘플 실행:

```bash
python back/scripts/generate_embedding_vector_update_sql.py --limit 10
```

기본 출력 파일:

- [04_backfill_embedding_vectors.sql](/C:/Users/SSAFY/Desktop/S14P21A505/back/src/main/resources/sql/recommendation/04_backfill_embedding_vectors.sql)

## 7. embedding 검증 SQL

```sql
SELECT COUNT(*) AS embedded_count
FROM wine
WHERE embedding IS NOT NULL;

SELECT id, name_kr, embedding_model, embedding_generated_at
FROM wine
WHERE embedding IS NOT NULL
ORDER BY id
LIMIT 5;
```

## 8. 다음 단계

위 반영이 끝나면 아래 순서로 다음 단계를 진행하면 된다.

1. PGVector 검색 API 추가
2. `Preference` 기준 재정렬
3. 챗봇 Best 1 추천 응답 구현
