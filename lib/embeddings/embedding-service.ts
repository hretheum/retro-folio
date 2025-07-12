import OpenAI from 'openai';
import crypto from 'crypto';
import NodeCache from 'node-cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache with 1 hour TTL
const embeddingCache = new NodeCache({ stdTTL: 3600 });

export interface EmbeddingOptions {
  model?: string;
  useCache?: boolean;
}

export async function generateQueryEmbedding(
  text: string, 
  options: EmbeddingOptions = {}
): Promise<number[]> {
  const { 
    model = 'text-embedding-3-small',
    useCache = true 
  } = options;
  
  // Generate cache key
  const cacheKey = crypto
    .createHash('md5')
    .update(`${model}:${text}`)
    .digest('hex');
  
  // Check cache
  if (useCache) {
    const cached = embeddingCache.get<number[]>(cacheKey);
    if (cached) {
      console.log('[EMBEDDING] Cache hit for:', text.substring(0, 50));
      return cached;
    }
  }
  
  try {
    console.log('[EMBEDDING] Generating embedding for:', text.substring(0, 50));
    const startTime = Date.now();
    
    const response = await openai.embeddings.create({
      model,
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    const duration = Date.now() - startTime;
    
    console.log(`[EMBEDDING] Generated in ${duration}ms`);
    
    // Cache the result
    if (useCache) {
      embeddingCache.set(cacheKey, embedding);
    }
    
    return embedding;
  } catch (error) {
    console.error('[EMBEDDING] Error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export function clearEmbeddingCache(): void {
  embeddingCache.flushAll();
  console.log('[EMBEDDING] Cache cleared');
}

export function getEmbeddingCacheStats() {
  return {
    keys: embeddingCache.keys().length,
    hits: embeddingCache.getStats().hits,
    misses: embeddingCache.getStats().misses,
    hitRate: embeddingCache.getStats().hits / 
             (embeddingCache.getStats().hits + embeddingCache.getStats().misses)
  };
}