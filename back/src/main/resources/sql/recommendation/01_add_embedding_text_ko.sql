ALTER TABLE wine
ADD COLUMN IF NOT EXISTS rich_description TEXT;

COMMENT ON COLUMN wine.rich_description IS
'음식 기반 추천과 임베딩에 사용하는 와인 설명 텍스트';
