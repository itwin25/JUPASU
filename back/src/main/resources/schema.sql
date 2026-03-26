-- src/main/resources/schema.sql

-- 1. 확장 모듈 설치 (없으면 생성)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 컬럼 추가 (JPA ddl-auto가 실패하거나 확장이 먼저 필요한 경우 대비)
ALTER TABLE wine ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. 인덱스 생성 (없으면 생성)
CREATE INDEX IF NOT EXISTS idx_wine_name_kr_trgm ON wine USING gin (name_kr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_wine_embedding ON wine USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);