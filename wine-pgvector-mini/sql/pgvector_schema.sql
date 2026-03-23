CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS wine_embedding_documents (
    id BIGSERIAL PRIMARY KEY,
    wine_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    country TEXT,
    region TEXT,
    wine_type TEXT,
    grapes JSONB NOT NULL DEFAULT '[]'::jsonb,
    food_pairings JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating_average NUMERIC(3, 2),
    price_text TEXT,
    embedding_text TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wine_embedding_documents_embedding
ON wine_embedding_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_wine_embedding_documents_type
ON wine_embedding_documents (wine_type);

CREATE INDEX IF NOT EXISTS idx_wine_embedding_documents_country
ON wine_embedding_documents (country);

-- Example:
-- SELECT
--   id,
--   display_name,
--   1 - (embedding <=> :query_embedding) AS similarity
-- FROM wine_embedding_documents
-- ORDER BY embedding <=> :query_embedding
-- LIMIT 10;

