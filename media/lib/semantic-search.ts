import { searchSimilar, getRelevantContext } from './vector-search';
import type { SearchResult } from './vector-store';

export interface SemanticSearchOptions {
  query: string;
  topK?: number;
  minScore?: number;
  filters?: {
    type?: string[];
    tags?: string[];
    dateRange?: { start?: string; end?: string };
  };
}

export interface SemanticSearchResult {
  results: SearchResult[];
  context: string;
  metadata: {
    queryLength: number;
    resultsFound: number;
    searchTime: number;
    averageScore: number;
  };
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

// Apply filters to search results
function applyFilters(
  results: SearchResult[],
  filters?: SemanticSearchOptions['filters']
): SearchResult[] {
  if (!filters) return results;
  
  return results.filter(result => {
    const metadata = result.chunk.metadata;
    
    // Type filter
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(metadata.contentType)) {
        return false;
      }
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const chunkTags = metadata.tags || [];
      const hasMatchingTag = filters.tags.some(tag => 
        chunkTags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    
    // Date range filter
    if (filters.dateRange && metadata.date) {
      const chunkDate = new Date(metadata.date);
      
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (chunkDate < startDate) return false;
      }
      
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (chunkDate > endDate) return false;
      }
    }
    
    return true;
  });
}

// Deduplicate results by content ID
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const result of results) {
    const contentId = result.chunk.metadata.contentId;
    const existing = seen.get(contentId);
    
    // Keep the result with higher score
    if (!existing || result.score > existing.score) {
      seen.set(contentId, result);
    }
  }
  
  return Array.from(seen.values());
}

// Rerank results based on additional criteria
function rerankResults(
  results: SearchResult[],
  query: string
): SearchResult[] {
  return results.map(result => {
    let boost = 1;
    const chunk = result.chunk;
    const queryLower = query.toLowerCase();
    
    // Boost if title contains query terms
    if (chunk.metadata.contentId && chunk.metadata.contentId.toLowerCase().includes(queryLower)) {
      boost *= 1.2;
    }
    
    // Boost featured content
    if (chunk.metadata.featured) {
      boost *= 1.1;
    }
    
    // Boost recent content
    if (chunk.metadata.date) {
      const age = Date.now() - new Date(chunk.metadata.date).getTime();
      const ageInDays = age / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) boost *= 1.15;
      else if (ageInDays < 90) boost *= 1.1;
      else if (ageInDays < 365) boost *= 1.05;
    }
    
    // Boost based on content type relevance
    const typeBoosts: Record<string, number> = {
      experiment: 1.1, // AI experiments are likely more relevant
      work: 1.05,
      timeline: 1.0,
      leadership: 0.95,
      contact: 0.9,
    };
    boost *= typeBoosts[chunk.metadata.contentType] || 1;
    
    return {
      ...result,
      score: Math.min(result.score * boost, 1), // Cap at 1
    };
  }).sort((a, b) => b.score - a.score);
}

// Main semantic search function
export async function semanticSearch(
  options: SemanticSearchOptions
): Promise<SemanticSearchResult> {
  const startTime = Date.now();
  const { query, topK = 5, minScore = 0.5, filters } = options;
  
  try {
    // Get initial results (fetch more for filtering)
    const initialTopK = filters ? topK * 3 : topK * 2;
    const rawResults = await searchSimilar(query, { 
      topK: initialTopK, 
      minScore: minScore * 0.8, // Lower threshold initially
    });
    
    // Apply filters
    let filteredResults = applyFilters(rawResults, filters);
    
    // Deduplicate
    filteredResults = deduplicateResults(filteredResults);
    
    // Rerank
    filteredResults = rerankResults(filteredResults, query);
    
    // Apply final score threshold and limit
    const finalResults = filteredResults
      .filter(r => r.score >= minScore)
      .slice(0, topK);
    
    // Build context
    const { context } = await getRelevantContext(query, {
      topK,
      minScore,
      diversityBoost: true,
    });
    
    // Calculate metadata
    const searchTime = Date.now() - startTime;
    const averageScore = finalResults.length > 0
      ? finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length
      : 0;
    
    return {
      results: finalResults,
      context,
      metadata: {
        queryLength: query.length,
        resultsFound: finalResults.length,
        searchTime,
        averageScore,
      },
    };
  } catch (error) {
    console.error('Semantic search error:', error);
    
    return {
      results: [],
      context: '',
      metadata: {
        queryLength: query.length,
        resultsFound: 0,
        searchTime: Date.now() - startTime,
        averageScore: 0,
      },
    };
  }
}

// Build a context window from search results
export function buildContextWindow(
  results: SearchResult[],
  maxTokens: number = 2000
): string {
  if (results.length === 0) return '';
  
  const sections: string[] = [];
  let currentTokens = 0;
  
  // Group by content type
  const grouped = results.reduce((acc, result) => {
    const type = result.chunk.metadata.contentType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);
  
  // Build context with type headers
  for (const [type, typeResults] of Object.entries(grouped)) {
    const header = `\n### ${type.toUpperCase()}\n`;
    const headerTokens = Math.ceil(header.length / 4);
    
    if (currentTokens + headerTokens > maxTokens) break;
    
    sections.push(header);
    currentTokens += headerTokens;
    
    for (const result of typeResults) {
      const chunk = result.chunk;
      const content = `- ${chunk.text} (relevance: ${(result.score * 100).toFixed(1)}%)\n`;
      const contentTokens = Math.ceil(content.length / 4);
      
      if (currentTokens + contentTokens > maxTokens) break;
      
      sections.push(content);
      currentTokens += contentTokens;
    }
  }
  
  return sections.join('');
}