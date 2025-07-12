import { generateQueryEmbedding, clearEmbeddingCache, getEmbeddingCacheStats } from './embedding-service';

describe('EmbeddingService', () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  test('should generate embedding for text', async () => {
    const text = 'What are your programming skills?';
    const embedding = await generateQueryEmbedding(text);
    
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536); // dimension for text-embedding-3-small
    expect(typeof embedding[0]).toBe('number');
  });

  test('should cache embeddings', async () => {
    const text = 'Test query for caching';
    
    // First call - cache miss
    const embedding1 = await generateQueryEmbedding(text);
    const stats1 = getEmbeddingCacheStats();
    expect(stats1.misses).toBe(1);
    
    // Second call - cache hit
    const embedding2 = await generateQueryEmbedding(text);
    const stats2 = getEmbeddingCacheStats();
    expect(stats2.hits).toBe(1);
    
    // Should return same embedding
    expect(embedding1).toEqual(embedding2);
  });

  test('should respect cache option', async () => {
    const text = 'Test without cache';
    
    // Call without cache
    await generateQueryEmbedding(text, { useCache: false });
    const stats1 = getEmbeddingCacheStats();
    expect(stats1.keys).toBe(0);
    
    // Call with cache
    await generateQueryEmbedding(text, { useCache: true });
    const stats2 = getEmbeddingCacheStats();
    expect(stats2.keys).toBe(1);
  });

  test('should handle different models', async () => {
    const text = 'Test with different model';
    
    const embedding = await generateQueryEmbedding(text, { 
      model: 'text-embedding-3-small' 
    });
    
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(1536);
  });

  test('should clear cache', async () => {
    const text = 'Test cache clearing';
    
    // Generate embedding to populate cache
    await generateQueryEmbedding(text);
    expect(getEmbeddingCacheStats().keys).toBe(1);
    
    // Clear cache
    clearEmbeddingCache();
    expect(getEmbeddingCacheStats().keys).toBe(0);
  });
});