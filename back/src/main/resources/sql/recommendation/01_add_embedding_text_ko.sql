ALTER TABLE wine
ADD COLUMN IF NOT EXISTS embedding_text_ko TEXT;

COMMENT ON COLUMN wine.embedding_text_ko IS
'음식 기반 와인 추천 검색을 위한 한국어 임베딩 원문';
