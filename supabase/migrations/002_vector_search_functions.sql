-- Function for similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1024),
  match_count int DEFAULT 5,
  filter_type text DEFAULT NULL,
  filter_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE(
  id UUID,
  content_id TEXT,
  content_type TEXT,
  chunk_index INTEGER,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content_id,
    e.content_type,
    e.chunk_index,
    e.chunk_text,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM embeddings e
  WHERE 
    (filter_type IS NULL OR e.content_type = filter_type)
    AND (filter_metadata = '{}'::jsonb OR e.metadata @> filter_metadata)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for hybrid search (combining vector and full-text search)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(1024),
  match_count int DEFAULT 5,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  content_id TEXT,
  content_type TEXT,
  chunk_index INTEGER,
  chunk_text TEXT,
  metadata JSONB,
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      e.id,
      e.content_id,
      e.content_type,
      e.chunk_index,
      e.chunk_text,
      e.metadata,
      1 - (e.embedding <=> query_embedding) as vector_similarity
    FROM embeddings e
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  text_results AS (
    SELECT
      e.id,
      ts_rank(to_tsvector('english', e.chunk_text), plainto_tsquery('english', query_text)) as text_rank
    FROM embeddings e
    WHERE to_tsvector('english', e.chunk_text) @@ plainto_tsquery('english', query_text)
    LIMIT match_count * 2
  )
  SELECT
    vr.id,
    vr.content_id,
    vr.content_type,
    vr.chunk_index,
    vr.chunk_text,
    vr.metadata,
    (
      COALESCE(vr.vector_similarity * vector_weight, 0) +
      COALESCE(tr.text_rank * (1 - vector_weight), 0)
    ) as combined_score
  FROM vector_results vr
  LEFT JOIN text_results tr ON vr.id = tr.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Add full-text search index
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_text_fts 
ON embeddings USING GIN(to_tsvector('english', chunk_text));