const createVectorStoreMigration = `
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for storing emergency response document embeddings
CREATE TABLE IF NOT EXISTS emergency_response_embeddings (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(768)
);

-- Create a function to search for similar documents
CREATE OR REPLACE FUNCTION match_emergency_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    emergency_response_embeddings.id,
    emergency_response_embeddings.content,
    emergency_response_embeddings.metadata,
    1 - (emergency_response_embeddings.embedding <=> query_embedding) AS similarity
  FROM emergency_response_embeddings
  WHERE 1 - (emergency_response_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY emergency_response_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create an index for faster similarity searches
CREATE INDEX IF NOT EXISTS emergency_response_embeddings_embedding_idx
ON emergency_response_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
`;

module.exports = { createVectorStoreMigration };
