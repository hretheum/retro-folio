import { semanticSearchPinecone, hybridSearchPinecone } from './pinecone-vector-store';
import { analyzeQueryIntent, getOptimalContextSize } from './chat-intelligence';
import type { SearchResult } from './vector-store';

export interface HybridSearchConfig {
  semanticWeight: number;
  lexicalWeight: number;
  topK: number;
  metadataFilters: Record<string, any>;
  boostFactors: {
    recency: number;
    relevance: number;
    diversity: number;
  };
  queryExpansion: boolean;
  diversityThreshold: number;
}

export interface EnhancedSearchResult extends SearchResult {
  searchStage: 'SEMANTIC' | 'LEXICAL' | 'HYBRID';
  relevanceFactors: {
    semantic: number;
    lexical: number;
    metadata: number;
    final: number;
  };
  diversityScore: number;
}

export class EnhancedHybridSearch {
  private calculateDynamicWeights(userQuery: string): { semantic: number; lexical: number } {
    const queryIntent = analyzeQueryIntent(userQuery);
    const contextConfig = getOptimalContextSize(userQuery);
    
    const baseWeights = {
      FACTUAL: { semantic: 0.6, lexical: 0.4 },
      CASUAL: { semantic: 0.5, lexical: 0.5 },
      EXPLORATION: { semantic: 0.8, lexical: 0.2 },
      COMPARISON: { semantic: 0.7, lexical: 0.3 },
      SYNTHESIS: { semantic: 0.9, lexical: 0.1 }
    };
    
    let weights = baseWeights[queryIntent] || baseWeights.CASUAL;
    
    // Adjust based on query characteristics
    const queryLength = userQuery.length;
    const wordCount = userQuery.split(/\s+/).length;
    const hasSpecificTerms = /\b(specific|konkretnie|exactly|dokładnie|precisely|precyzyjnie)\b/i.test(userQuery);
    const hasNumbers = /\d/.test(userQuery);
    
    if (hasNumbers || hasSpecificTerms) {
      // Factual queries benefit from more lexical matching
      weights.lexical = Math.min(0.6, weights.lexical + 0.2);
      weights.semantic = 1 - weights.lexical;
    }
    
    if (queryLength > 100 || wordCount > 15) {
      // Long queries benefit from more semantic understanding
      weights.semantic = Math.min(0.9, weights.semantic + 0.1);
      weights.lexical = 1 - weights.semantic;
    }
    
    if (contextConfig.diversityBoost) {
      // Diversity queries benefit from balanced approach
      weights.semantic = Math.min(0.8, weights.semantic + 0.05);
      weights.lexical = Math.max(0.2, weights.lexical - 0.05);
    }
    
    return {
      semantic: Math.round(weights.semantic * 100) / 100,
      lexical: Math.round(weights.lexical * 100) / 100
    };
  }
  
  private createMetadataFilters(userQuery: string): Record<string, any> {
    const queryIntent = analyzeQueryIntent(userQuery);
    const queryLower = userQuery.toLowerCase();
    
    const filters: Record<string, any> = {};
    
    // Content type filtering based on query intent
    switch (queryIntent) {
      case 'FACTUAL':
        filters.contentType = { $in: ['work', 'timeline'] };
        break;
      case 'EXPLORATION':
        filters.contentType = { $in: ['work', 'experiment', 'leadership'] };
        break;
      case 'SYNTHESIS':
        filters.contentType = { $in: ['work', 'leadership', 'experiment'] };
        break;
      case 'COMPARISON':
        filters.contentType = { $in: ['work', 'timeline'] };
        break;
    }
    
    // Technology/skill filtering
    const techKeywords = [
      'react', 'typescript', 'javascript', 'node', 'aws', 'docker',
      'kubernetes', 'figma', 'design', 'ux', 'ui', 'frontend', 'backend'
    ];
    
    const mentionedTech = techKeywords.filter(tech => 
      queryLower.includes(tech.toLowerCase())
    );
    
    if (mentionedTech.length > 0) {
      filters.technologies = { $in: mentionedTech };
    }
    
    // Date filtering for recent work
    if (queryLower.includes('recent') || queryLower.includes('latest') || 
        queryLower.includes('current') || queryLower.includes('now')) {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      filters.date = { $gte: twoYearsAgo.toISOString() };
    }
    
    // Company filtering
    const companies = ['volkswagen', 'vw', 'polsat', 'allegro', 'startup'];
    const mentionedCompanies = companies.filter(company => 
      queryLower.includes(company.toLowerCase())
    );
    
    if (mentionedCompanies.length > 0) {
      // Use text matching for company names in content
      filters.$text = { $search: mentionedCompanies.join(' ') };
    }
    
    return filters;
  }
  
  private calculateBoostFactors(userQuery: string): HybridSearchConfig['boostFactors'] {
    const queryIntent = analyzeQueryIntent(userQuery);
    const queryLower = userQuery.toLowerCase();
    
    const baseBoosts = {
      FACTUAL: { recency: 0.1, relevance: 0.9, diversity: 0.1 },
      CASUAL: { recency: 0.2, relevance: 0.6, diversity: 0.2 },
      EXPLORATION: { recency: 0.3, relevance: 0.4, diversity: 0.3 },
      COMPARISON: { recency: 0.2, relevance: 0.5, diversity: 0.3 },
      SYNTHESIS: { recency: 0.2, relevance: 0.6, diversity: 0.2 }
    };
    
    let boosts = baseBoosts[queryIntent] || baseBoosts.CASUAL;
    
    // Adjust based on query characteristics
    if (queryLower.includes('recent') || queryLower.includes('latest')) {
      boosts.recency = Math.min(0.4, boosts.recency + 0.2);
    }
    
    if (queryLower.includes('different') || queryLower.includes('various')) {
      boosts.diversity = Math.min(0.4, boosts.diversity + 0.2);
    }
    
    // Normalize to ensure sum <= 1
    const sum = boosts.recency + boosts.relevance + boosts.diversity;
    if (sum > 1) {
      boosts.recency = boosts.recency / sum;
      boosts.relevance = boosts.relevance / sum;
      boosts.diversity = boosts.diversity / sum;
    }
    
    return boosts;
  }
  
  private createSearchConfig(userQuery: string): HybridSearchConfig {
    const weights = this.calculateDynamicWeights(userQuery);
    const metadataFilters = this.createMetadataFilters(userQuery);
    const boostFactors = this.calculateBoostFactors(userQuery);
    const contextConfig = getOptimalContextSize(userQuery);
    
    return {
      semanticWeight: weights.semantic,
      lexicalWeight: weights.lexical,
      topK: contextConfig.chunkCount,
      metadataFilters,
      boostFactors,
      queryExpansion: contextConfig.queryExpansion,
      diversityThreshold: contextConfig.diversityBoost ? 0.3 : 0.1
    };
  }
  
  private async performSemanticSearch(
    query: string, 
    config: HybridSearchConfig
  ): Promise<EnhancedSearchResult[]> {
    const results = await semanticSearchPinecone(query, {
      topK: config.topK,
      filter: config.metadataFilters,
      minScore: 0.5
    });
    
    return results.map(result => ({
      ...result,
      searchStage: 'SEMANTIC' as const,
      relevanceFactors: {
        semantic: result.score,
        lexical: 0,
        metadata: this.calculateMetadataScore(result, config),
        final: result.score * config.semanticWeight
      },
      diversityScore: this.calculateDiversityScore(result, results)
    }));
  }
  
  private calculateMetadataScore(result: SearchResult, config: HybridSearchConfig): number {
    const metadata = result.chunk.metadata;
    let score = 0;
    
    // Recency boost
    if (metadata.date) {
      const date = new Date(metadata.date);
      const now = new Date();
      const yearsDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
      score += Math.max(0, 1 - yearsDiff / 5) * config.boostFactors.recency;
    }
    
    // Featured content boost
    if (metadata.featured) {
      score += 0.1;
    }
    
    // Technology relevance boost
    if (metadata.technologies && Array.isArray(metadata.technologies)) {
      score += Math.min(0.2, metadata.technologies.length * 0.05);
    }
    
    return Math.min(1, score);
  }
  
  private calculateDiversityScore(result: SearchResult, allResults: SearchResult[]): number {
    const currentMetadata = result.chunk.metadata;
    
    let diversityScore = 1;
    
    // Check content type diversity
    const sameContentType = allResults.filter(r => 
      r.chunk.metadata.contentType === currentMetadata.contentType
    ).length;
    
    if (sameContentType > 1) {
      diversityScore -= 0.1 * (sameContentType - 1);
    }
    
    // Check technology diversity
    if (currentMetadata.technologies && Array.isArray(currentMetadata.technologies)) {
      const techOverlap = allResults.reduce((overlap, r) => {
        if (r.chunk.metadata.technologies && Array.isArray(r.chunk.metadata.technologies)) {
          const common = currentMetadata.technologies.filter(tech => 
            r.chunk.metadata.technologies.includes(tech)
          );
          return overlap + common.length;
        }
        return overlap;
      }, 0);
      
      diversityScore -= Math.min(0.3, techOverlap * 0.05);
    }
    
    return Math.max(0, diversityScore);
  }
  
  private async performLexicalSearch(
    query: string, 
    config: HybridSearchConfig
  ): Promise<EnhancedSearchResult[]> {
    // Simple lexical matching using metadata text search
    const results = await semanticSearchPinecone(query, {
      topK: config.topK * 2, // Get more results for lexical reranking
      filter: config.metadataFilters,
      minScore: 0.3
    });
    
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const lexicalResults = results.map(result => {
      const textLower = result.chunk.text.toLowerCase();
      let lexicalScore = 0;
      
      // Calculate lexical matching score
      queryWords.forEach(word => {
        if (textLower.includes(word)) {
          lexicalScore += 1 / queryWords.length;
        }
      });
      
      // Boost exact phrase matches
      if (textLower.includes(query.toLowerCase())) {
        lexicalScore += 0.3;
      }
      
      return {
        ...result,
        searchStage: 'LEXICAL' as const,
        relevanceFactors: {
          semantic: result.score,
          lexical: lexicalScore,
          metadata: this.calculateMetadataScore(result, config),
          final: lexicalScore * config.lexicalWeight
        },
        diversityScore: this.calculateDiversityScore(result, results)
      };
    });
    
    // Sort by lexical score and return top K
    return lexicalResults
      .sort((a, b) => b.relevanceFactors.lexical - a.relevanceFactors.lexical)
      .slice(0, config.topK);
  }
  
  private mergeAndRankResults(
    semanticResults: EnhancedSearchResult[],
    lexicalResults: EnhancedSearchResult[],
    config: HybridSearchConfig
  ): EnhancedSearchResult[] {
    // Combine all results
    const allResults = new Map<string, EnhancedSearchResult>();
    
    // Add semantic results
    semanticResults.forEach(result => {
      allResults.set(result.chunk.id, result);
    });
    
    // Add or merge lexical results
    lexicalResults.forEach(result => {
      const existing = allResults.get(result.chunk.id);
      if (existing) {
        // Merge scores
        existing.relevanceFactors.final = 
          existing.relevanceFactors.semantic * config.semanticWeight +
          result.relevanceFactors.lexical * config.lexicalWeight;
        existing.relevanceFactors.lexical = result.relevanceFactors.lexical;
        existing.searchStage = 'HYBRID';
      } else {
        allResults.set(result.chunk.id, {
          ...result,
          searchStage: 'HYBRID' as const,
          relevanceFactors: {
            ...result.relevanceFactors,
            final: result.relevanceFactors.lexical * config.lexicalWeight
          }
        });
      }
    });
    
    // Convert to array and apply diversity filtering
    let finalResults = Array.from(allResults.values());
    
    // Apply diversity filtering if enabled
    if (config.diversityThreshold > 0) {
      finalResults = this.applyDiversityFiltering(finalResults, config.diversityThreshold);
    }
    
    // Apply boost factors
    finalResults = finalResults.map(result => ({
      ...result,
      relevanceFactors: {
        ...result.relevanceFactors,
        final: result.relevanceFactors.final + 
               result.relevanceFactors.metadata * config.boostFactors.relevance +
               result.diversityScore * config.boostFactors.diversity
      }
    }));
    
    // Sort by final score
    return finalResults
      .sort((a, b) => b.relevanceFactors.final - a.relevanceFactors.final)
      .slice(0, config.topK);
  }
  
  private applyDiversityFiltering(
    results: EnhancedSearchResult[], 
    threshold: number
  ): EnhancedSearchResult[] {
    const filtered = [];
    const usedContentTypes = new Set();
    const usedTechnologies = new Set();
    
    // First pass: select diverse results
    for (const result of results) {
      const contentType = result.chunk.metadata.contentType;
      const technologies = result.chunk.metadata.technologies || [];
      
      const isContentTypeDiverse = !usedContentTypes.has(contentType);
      const isTechDiverse = technologies.length === 0 || 
                           technologies.some(tech => !usedTechnologies.has(tech));
      
      if (isContentTypeDiverse && isTechDiverse) {
        filtered.push(result);
        usedContentTypes.add(contentType);
        technologies.forEach(tech => usedTechnologies.add(tech));
      } else if (result.relevanceFactors.final > threshold) {
        filtered.push(result);
      }
    }
    
    // Second pass: fill remaining slots with best remaining results
    const remaining = results.filter(r => !filtered.includes(r));
    const additionalCount = Math.min(remaining.length, results.length - filtered.length);
    
    filtered.push(...remaining.slice(0, additionalCount));
    
    return filtered;
  }
  
  public async search(
    userQuery: string, 
    options: {
      topK?: number;
      minScore?: number;
      namespace?: string;
    } = {}
  ): Promise<EnhancedSearchResult[]> {
    const config = this.createSearchConfig(userQuery);
    
    // Override topK if provided
    if (options.topK) {
      config.topK = options.topK;
    }
    
    const startTime = performance.now();
    
    try {
      // Perform parallel searches
      const [semanticResults, lexicalResults] = await Promise.all([
        this.performSemanticSearch(userQuery, config),
        this.performLexicalSearch(userQuery, config)
      ]);
      
      // Merge and rank results
      const finalResults = this.mergeAndRankResults(
        semanticResults,
        lexicalResults,
        config
      );
      
      const processingTime = performance.now() - startTime;
      
      console.log(`[EnhancedHybridSearch] Completed in ${processingTime.toFixed(2)}ms`, {
        query: userQuery,
        config: {
          semanticWeight: config.semanticWeight,
          lexicalWeight: config.lexicalWeight,
          topK: config.topK
        },
        results: {
          semantic: semanticResults.length,
          lexical: lexicalResults.length,
          final: finalResults.length
        }
      });
      
      return finalResults;
      
    } catch (error) {
      console.error('[EnhancedHybridSearch] Search failed:', error);
      
      // Fallback to basic semantic search
      const fallbackResults = await semanticSearchPinecone(userQuery, {
        topK: config.topK,
        minScore: options.minScore || 0.5
      });
      
      return fallbackResults.map(result => ({
        ...result,
        searchStage: 'SEMANTIC' as const,
        relevanceFactors: {
          semantic: result.score,
          lexical: 0,
          metadata: 0,
          final: result.score
        },
        diversityScore: 0.5
      }));
    }
  }
  
  public async validatePerformance(testQueries: string[]): Promise<{
    avgAccuracyImprovement: number;
    avgIrrelevantReduction: number;
    avgProcessingTime: number;
    weightDistribution: { semantic: number; lexical: number };
  }> {
    const results = [];
    
    for (const query of testQueries) {
      const startTime = performance.now();
      const searchResults = await this.search(query);
      const processingTime = performance.now() - startTime;
      
      results.push({
        query,
        results: searchResults,
        processingTime,
        config: this.createSearchConfig(query)
      });
    }
    
    const avgAccuracyImprovement = results.reduce((sum, r) => {
      const hybridCount = r.results.filter(res => res.searchStage === 'HYBRID').length;
      return sum + (hybridCount / r.results.length * 100);
    }, 0) / results.length;
    
    const avgIrrelevantReduction = results.reduce((sum, r) => {
      const highQualityCount = r.results.filter(res => res.relevanceFactors.final > 0.7).length;
      return sum + (highQualityCount / r.results.length * 100);
    }, 0) / results.length;
    
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    
    const avgSemanticWeight = results.reduce((sum, r) => sum + r.config.semanticWeight, 0) / results.length;
    const avgLexicalWeight = results.reduce((sum, r) => sum + r.config.lexicalWeight, 0) / results.length;
    
    return {
      avgAccuracyImprovement,
      avgIrrelevantReduction,
      avgProcessingTime,
      weightDistribution: {
        semantic: Math.round(avgSemanticWeight * 100) / 100,
        lexical: Math.round(avgLexicalWeight * 100) / 100
      }
    };
  }
}

// Export singleton instance
export const enhancedHybridSearch = new EnhancedHybridSearch();