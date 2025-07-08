import { semanticSearchPinecone } from './pinecone-vector-store';
import { analyzeQueryIntent, getOptimalContextSize } from './chat-intelligence';

export type RetrievalStage = 'FINE' | 'MEDIUM' | 'COARSE';

export interface RetrievalStageConfig {
  stage: RetrievalStage;
  topK: number;
  minSimilarity: number;
  metadataFilters?: Record<string, any>;
  expansionFactors?: string[];
  diversityBoost: boolean;
}

export interface RetrievalResult {
  stage: RetrievalStage;
  chunks: Array<{
    content: string;
    metadata: any;
    score: number;
    source: string;
  }>;
  totalFound: number;
  relevanceScore: number;
  processingTime: number;
}

export interface MultiStageResult {
  bestStage: RetrievalStage;
  stages: RetrievalResult[];
  finalChunks: Array<{
    content: string;
    metadata: any;
    score: number;
    source: string;
    stage: RetrievalStage;
  }>;
  totalProcessingTime: number;
  confidence: number;
}

export class MultiStageRetrieval {
  private getStageConfiguration(userQuery: string): RetrievalStageConfig[] {
    const queryIntent = analyzeQueryIntent(userQuery);
    const contextConfig = getOptimalContextSize(userQuery);
    
    const baseConfigs: Record<string, RetrievalStageConfig[]> = {
      FACTUAL: [
        {
          stage: 'FINE',
          topK: 3,
          minSimilarity: 0.85,
          metadataFilters: { type: 'factual' },
          expansionFactors: [],
          diversityBoost: false
        },
        {
          stage: 'MEDIUM',
          topK: 6,
          minSimilarity: 0.75,
          metadataFilters: { type: 'experience' },
          expansionFactors: ['related', 'context'],
          diversityBoost: false
        }
      ],
      CASUAL: [
        {
          stage: 'FINE',
          topK: 2,
          minSimilarity: 0.80,
          metadataFilters: { type: 'personal' },
          expansionFactors: [],
          diversityBoost: false
        }
      ],
      EXPLORATION: [
        {
          stage: 'FINE',
          topK: 4,
          minSimilarity: 0.80,
          metadataFilters: { type: 'detailed' },
          expansionFactors: ['detailed', 'process'],
          diversityBoost: true
        },
        {
          stage: 'MEDIUM',
          topK: 8,
          minSimilarity: 0.70,
          metadataFilters: { type: 'experience' },
          expansionFactors: ['related', 'context', 'methodology'],
          diversityBoost: true
        },
        {
          stage: 'COARSE',
          topK: 12,
          minSimilarity: 0.60,
          metadataFilters: {},
          expansionFactors: ['background', 'overview'],
          diversityBoost: true
        }
      ],
      COMPARISON: [
        {
          stage: 'FINE',
          topK: 6,
          minSimilarity: 0.75,
          metadataFilters: { type: 'comparison' },
          expansionFactors: ['contrast', 'versus'],
          diversityBoost: true
        },
        {
          stage: 'MEDIUM',
          topK: 10,
          minSimilarity: 0.65,
          metadataFilters: { type: 'experience' },
          expansionFactors: ['different', 'similar', 'between'],
          diversityBoost: true
        },
        {
          stage: 'COARSE',
          topK: 14,
          minSimilarity: 0.55,
          metadataFilters: {},
          expansionFactors: ['background', 'context', 'overall'],
          diversityBoost: true
        }
      ],
      SYNTHESIS: [
        {
          stage: 'FINE',
          topK: 8,
          minSimilarity: 0.75,
          metadataFilters: { type: 'skills' },
          expansionFactors: ['abilities', 'competencies'],
          diversityBoost: true
        },
        {
          stage: 'MEDIUM',
          topK: 12,
          minSimilarity: 0.65,
          metadataFilters: { type: 'experience' },
          expansionFactors: ['achievements', 'projects', 'results'],
          diversityBoost: true
        },
        {
          stage: 'COARSE',
          topK: 16,
          minSimilarity: 0.55,
          metadataFilters: {},
          expansionFactors: ['background', 'overview', 'comprehensive'],
          diversityBoost: true
        }
      ]
    };
    
    return baseConfigs[queryIntent] || baseConfigs.CASUAL;
  }
  
  private async executeStage(
    userQuery: string, 
    config: RetrievalStageConfig
  ): Promise<RetrievalResult> {
    const startTime = performance.now();
    
    try {
      // Expand query if needed
      const expandedQuery = this.expandQuery(userQuery, config.expansionFactors);
      
      // Perform vector search
      const searchResults = await semanticSearchPinecone(expandedQuery, {
        topK: config.topK,
        minScore: config.minSimilarity,
        filter: config.metadataFilters
      });
      
      // Convert results to expected format
      const convertedResults = searchResults.map(result => ({
        content: result.chunk.text,
        metadata: result.chunk.metadata,
        score: result.score,
        source: result.chunk.metadata?.contentId || 'unknown'
      }));
      
      // Apply diversity boost if enabled
      const processedChunks = config.diversityBoost 
        ? this.applyDiversityBoost(convertedResults)
        : convertedResults;
      
      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(processedChunks);
      
      const processingTime = performance.now() - startTime;
      
      return {
        stage: config.stage,
        chunks: processedChunks,
        totalFound: processedChunks.length,
        relevanceScore,
        processingTime
      };
      
    } catch (error) {
      console.error(`Error in ${config.stage} stage:`, error);
      return {
        stage: config.stage,
        chunks: [],
        totalFound: 0,
        relevanceScore: 0,
        processingTime: performance.now() - startTime
      };
    }
  }
  
  private expandQuery(userQuery: string, expansionFactors: string[]): string {
    if (!expansionFactors || expansionFactors.length === 0) {
      return userQuery;
    }
    
    const expansionMap: Record<string, string[]> = {
      'related': ['similar', 'connected', 'associated'],
      'context': ['background', 'setting', 'environment'],
      'detailed': ['specific', 'particular', 'precise'],
      'process': ['method', 'approach', 'technique'],
      'methodology': ['system', 'framework', 'strategy'],
      'contrast': ['difference', 'comparison', 'distinction'],
      'versus': ['against', 'compared to', 'relative to'],
      'different': ['distinct', 'separate', 'unique'],
      'similar': ['alike', 'comparable', 'equivalent'],
      'between': ['among', 'within', 'across'],
      'abilities': ['skills', 'talents', 'capabilities'],
      'competencies': ['expertise', 'proficiency', 'knowledge'],
      'achievements': ['accomplishments', 'successes', 'results'],
      'projects': ['work', 'assignments', 'tasks'],
      'results': ['outcomes', 'impact', 'effects'],
      'background': ['history', 'experience', 'foundation'],
      'overview': ['summary', 'outline', 'general'],
      'comprehensive': ['complete', 'thorough', 'extensive']
    };
    
    let expandedQuery = userQuery;
    
    for (const factor of expansionFactors) {
      if (expansionMap[factor]) {
        const synonyms = expansionMap[factor];
        const randomSynonym = synonyms[Math.floor(Math.random() * synonyms.length)];
        expandedQuery += ` ${randomSynonym}`;
      }
    }
    
    return expandedQuery;
  }
  
  private applyDiversityBoost(chunks: Array<{ content: string; metadata: any; score: number; source: string }>): Array<{ content: string; metadata: any; score: number; source: string }> {
    if (chunks.length <= 1) return chunks;
    
    const diverseChunks = [];
    const usedSources = new Set();
    const usedTopics = new Set();
    
    // First pass: prioritize unique sources and topics
    for (const chunk of chunks) {
      const source = chunk.source;
      const topic = chunk.metadata?.topic || 'general';
      
      if (!usedSources.has(source) && !usedTopics.has(topic)) {
        diverseChunks.push(chunk);
        usedSources.add(source);
        usedTopics.add(topic);
      }
    }
    
    // Second pass: fill remaining slots with best scoring chunks
    const remainingChunks = chunks.filter(chunk => 
      !diverseChunks.some(dc => dc.source === chunk.source && dc.metadata?.topic === chunk.metadata?.topic)
    );
    
    for (const chunk of remainingChunks) {
      if (diverseChunks.length < chunks.length) {
        diverseChunks.push(chunk);
      }
    }
    
    return diverseChunks.sort((a, b) => b.score - a.score);
  }
  
  private calculateRelevanceScore(chunks: Array<{ content: string; metadata: any; score: number; source: string }>): number {
    if (chunks.length === 0) return 0;
    
    const avgScore = chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;
    const scoreVariance = chunks.reduce((sum, chunk) => sum + Math.pow(chunk.score - avgScore, 2), 0) / chunks.length;
    
    // Higher average score is better, lower variance is better
    const normalizedVariance = scoreVariance / (avgScore || 1);
    
    return Math.max(0, Math.min(1, avgScore - (normalizedVariance * 0.1)));
  }
  
  private mergeStageResults(stageResults: RetrievalResult[]): Array<{
    content: string;
    metadata: any;
    score: number;
    source: string;
    stage: RetrievalStage;
  }> {
    const allChunks = [];
    
    for (const result of stageResults) {
      for (const chunk of result.chunks) {
        allChunks.push({
          ...chunk,
          stage: result.stage
        });
      }
    }
    
    // Remove duplicates based on content similarity
    const uniqueChunks = this.removeDuplicateChunks(allChunks);
    
    // Sort by relevance score and stage priority
    const stageWeights = { FINE: 3, MEDIUM: 2, COARSE: 1 };
    
    return uniqueChunks.sort((a, b) => {
      const scoreA = a.score + (stageWeights[a.stage] * 0.1);
      const scoreB = b.score + (stageWeights[b.stage] * 0.1);
      return scoreB - scoreA;
    });
  }
  
  private removeDuplicateChunks(chunks: Array<{
    content: string;
    metadata: any;
    score: number;
    source: string;
    stage: RetrievalStage;
  }>): Array<{
    content: string;
    metadata: any;
    score: number;
    source: string;
    stage: RetrievalStage;
  }> {
    const seen = new Set();
    const unique = [];
    
    for (const chunk of chunks) {
      // Create a content hash for similarity detection
      const contentHash = this.createContentHash(chunk.content);
      
      if (!seen.has(contentHash)) {
        seen.add(contentHash);
        unique.push(chunk);
      }
    }
    
    return unique;
  }
  
  private createContentHash(content: string): string {
    // Simple hash based on first 100 chars and word count
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
    const prefix = normalized.substring(0, 100);
    const wordCount = normalized.split(' ').length;
    
    return `${prefix}-${wordCount}`;
  }
  
  private calculateConfidence(stageResults: RetrievalResult[]): number {
    if (stageResults.length === 0) return 0;
    
    const bestStage = stageResults.reduce((best, current) => 
      current.relevanceScore > best.relevanceScore ? current : best
    );
    
    const hasMultipleStages = stageResults.length > 1;
    const avgRelevance = stageResults.reduce((sum, r) => sum + r.relevanceScore, 0) / stageResults.length;
    const processingEfficiency = stageResults.reduce((sum, r) => sum + (r.totalFound / r.processingTime), 0) / stageResults.length;
    
    let confidence = bestStage.relevanceScore * 0.6; // Base confidence from best stage
    
    if (hasMultipleStages) {
      confidence += avgRelevance * 0.2; // Bonus for multiple stage validation
    }
    
    confidence += Math.min(0.2, processingEfficiency * 0.1); // Efficiency bonus
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  public async search(userQuery: string): Promise<MultiStageResult> {
    const totalStartTime = performance.now();
    
    try {
      const stageConfigs = this.getStageConfiguration(userQuery);
      const stageResults: RetrievalResult[] = [];
      
      let shouldContinue = true;
      
      // Execute stages sequentially with early termination
      for (const config of stageConfigs) {
        if (!shouldContinue) break;
        
        const stageResult = await this.executeStage(userQuery, config);
        stageResults.push(stageResult);
        
        // Early termination if FINE stage produces excellent results
        if (config.stage === 'FINE' && 
            stageResult.relevanceScore > 0.85 && 
            stageResult.totalFound >= 3) {
          shouldContinue = false;
        }
        
        // Early termination if MEDIUM stage produces good results
        if (config.stage === 'MEDIUM' && 
            stageResult.relevanceScore > 0.75 && 
            stageResult.totalFound >= 5) {
          shouldContinue = false;
        }
      }
      
      // Determine best stage
      const bestStage = stageResults.reduce((best, current) => 
        current.relevanceScore > best.relevanceScore ? current : best
      );
      
      // Merge results from all stages
      const finalChunks = this.mergeStageResults(stageResults);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(stageResults);
      
      const totalProcessingTime = performance.now() - totalStartTime;
      
      return {
        bestStage: bestStage.stage,
        stages: stageResults,
        finalChunks,
        totalProcessingTime,
        confidence
      };
      
    } catch (error) {
      console.error('Error in multi-stage retrieval:', error);
      
      // Fallback to simple search
      const fallbackResult = await this.fallbackSearch(userQuery);
      
      return {
        bestStage: 'FINE',
        stages: [fallbackResult],
        finalChunks: fallbackResult.chunks.map(chunk => ({ ...chunk, stage: 'FINE' as RetrievalStage })),
        totalProcessingTime: performance.now() - totalStartTime,
        confidence: 0.3
      };
    }
  }
  
  private async fallbackSearch(userQuery: string): Promise<RetrievalResult> {
    const startTime = performance.now();
    
    try {
      const searchResults = await semanticSearchPinecone(userQuery, {
        topK: 5,
        minScore: 0.7
      });
      
      const convertedResults = searchResults.map(result => ({
        content: result.chunk.text,
        metadata: result.chunk.metadata,
        score: result.score,
        source: result.chunk.metadata?.contentId || 'unknown'
      }));
      
      return {
        stage: 'FINE',
        chunks: convertedResults,
        totalFound: convertedResults.length,
        relevanceScore: 0.5,
        processingTime: performance.now() - startTime
      };
      
    } catch (error) {
      console.error('Fallback search failed:', error);
      return {
        stage: 'FINE',
        chunks: [],
        totalFound: 0,
        relevanceScore: 0,
        processingTime: performance.now() - startTime
      };
    }
  }
  
  public async validatePerformance(testQueries: string[]): Promise<{
    avgRelevanceImprovement: number;
    avgStagesUsed: number;
    avgResponseTime: number;
    avgConfidence: number;
  }> {
    const results = [];
    
    for (const query of testQueries) {
      const result = await this.search(query);
      results.push(result);
    }
    
    const avgRelevanceImprovement = results.reduce((sum, r) => 
      sum + (r.stages.reduce((max, s) => Math.max(max, s.relevanceScore), 0) * 100), 0
    ) / results.length;
    
    const avgStagesUsed = results.reduce((sum, r) => sum + r.stages.length, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.totalProcessingTime, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    return {
      avgRelevanceImprovement,
      avgStagesUsed,
      avgResponseTime,
      avgConfidence
    };
  }
}

// Export singleton instance
export const multiStageRetrieval = new MultiStageRetrieval();