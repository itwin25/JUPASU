CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE wine
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wine_embedding_vector
ON wine
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
