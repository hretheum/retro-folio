import { getVectorStore, type SearchResult } from './vector-store';
import { generateQueryEmbedding } from './embedding-generator';
import { createClient } from 'redis';
import type { EmbeddedChunk } from './embedding-generator';

const EMBEDDINGS_CACHE_KEY = 'ai:embeddings';

// Load embeddings from cache and populate vector store
export async function loadEmbeddings(): Promise<boolean> {
  const vectorStore = getVectorStore();
  
  // First try to load from Redis vector store backup
  const loaded = await vectorStore.loadFromRedis();
  if (loaded) {
    return true;
  }
  
  // If not found, try to load from embeddings cache
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) return false;
  
  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    
    const data = await client.get(EMBEDDINGS_CACHE_KEY);
    await client.disconnect();
    
    if (!data) return false;
    
    const embeddingsData = JSON.parse(String(data));
    const embeddings: EmbeddedChunk[] = embeddingsData.embeddings;
    
    if (embeddings.length > 0) {
      await vectorStore.add(embeddings);
      console.log(`Loaded ${embeddings.length} embeddings into vector store`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to load embeddings:', error);
    return false;
  }
}

// Search for similar content
export async function searchSimilar(
  query: string,
  options: { topK?: number; minScore?: number } = {}
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);
  if (!queryEmbedding) {
    console.error('Failed to generate query embedding');
    return [];
  }
  
  // Ensure embeddings are loaded
  const vectorStore = getVectorStore();
  const stats = vectorStore.getStats();
  
  if (stats.totalVectors === 0) {
    console.log('Vector store is empty, attempting to load embeddings...');
    const loaded = await loadEmbeddings();
    if (!loaded) {
      console.error('No embeddings available');
      return [];
    }
  }
  
  // Search
  return vectorStore.search(queryEmbedding, options);
}

// Format search results as context for LLM
export function formatContext(results: SearchResult[], maxTokens: number = 2000): string {
  if (results.length === 0) return '';
  
  const contextParts: string[] = [];
  let currentTokens = 0;
  
  for (const result of results) {
    const chunk = result.chunk;
    const contextPart = `[${chunk.metadata.contentType.toUpperCase()} - ${chunk.metadata.contentId}]\n${chunk.text}\n`;
    
    // Rough token estimate
    const partTokens = Math.ceil(contextPart.length / 4);
    
    if (currentTokens + partTokens > maxTokens) {
      break;
    }
    
    contextParts.push(contextPart);
    currentTokens += partTokens;
  }
  
  return contextParts.join('\n---\n');
}

// Get relevant chunks with deduplication
export async function getRelevantContext(
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    maxTokens?: number;
    diversityBoost?: boolean;
  } = {}
): Promise<{ context: string; sources: SearchResult[] }> {
  const {
    topK = 5,
    minScore = 0.7,
    maxTokens = 2000,
    diversityBoost = true,
  } = options;
  
  // Search for more results if diversity boost is enabled
  const searchTopK = diversityBoost ? topK * 2 : topK;
  const results = await searchSimilar(query, { topK: searchTopK, minScore });
  
  if (!diversityBoost) {
    const context = formatContext(results, maxTokens);
    return { context, sources: results };
  }
  
  // Apply diversity boost - prefer different content types and sources
  const selected: SearchResult[] = [];
  const usedTypes = new Set<string>();
  const usedContents = new Set<string>();
  
  // First pass - select diverse results
  for (const result of results) {
    const contentType = result.chunk.metadata.contentType;
    const contentId = result.chunk.metadata.contentId;
    
    // Prefer results from different content types
    if (!usedTypes.has(contentType) || selected.length < topK / 2) {
      selected.push(result);
      usedTypes.add(contentType);
      usedContents.add(contentId);
      
      if (selected.length >= topK) break;
    }
  }
  
  // Second pass - fill remaining slots with highest scoring
  if (selected.length < topK) {
    for (const result of results) {
      const contentId = result.chunk.metadata.contentId;
      
      if (!usedContents.has(contentId)) {
        selected.push(result);
        usedContents.add(contentId);
        
        if (selected.length >= topK) break;
      }
    }
  }
  
  // Sort by score
  selected.sort((a, b) => b.score - a.score);
  
  const context = formatContext(selected, maxTokens);
  return { context, sources: selected };
}