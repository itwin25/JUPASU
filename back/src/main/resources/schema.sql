-- src/main/resources/schema.sql

-- 1. pg_trgm 확장 모듈 설치 (없으면 생성)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN 인덱스 생성 (없으면 생성)
CREATE INDEX IF NOT EXISTS idx_wine_name_kr_trgm ON wine USING gin (name_kr gin_trgm_ops);