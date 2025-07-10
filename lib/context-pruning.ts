import { analyzeQueryIntent, getOptimalContextSize } from './chat-intelligence';
import { BaseMetadata } from './types';

export interface ContextChunk {
  id: string;
  content: string;
  metadata: BaseMetadata;
  score: number;
  tokens: number;
  source: string;
  stage?: string;
}

export interface AttentionWeights {
  query: number;
  content: number;
  metadata: number;
  position: number;
  novelty: number;
}

export interface PruningConfig {
  targetTokens: number;
  compressionRate: number;
  preserveCoherence: boolean;
  attentionWeights: AttentionWeights;
  minChunkSize: number;
  maxChunkSize: number;
  diversityThreshold: number;
}

export interface PruningResult {
  prunedChunks: ContextChunk[];
  originalTokens: number;
  finalTokens: number;
  compressionRate: number;
  coherenceScore: number;
  processingTime: number;
  qualityScore: number;
}

export class ContextPruner {
  private calculateAttentionScore(
    chunk: ContextChunk,
    userQuery: string,
    allChunks: ContextChunk[],
    config: PruningConfig
  ): number {
    const queryLower = userQuery.toLowerCase();
    const contentLower = chunk.content.toLowerCase();
    
    // Query relevance score
    const queryWords = queryLower.split(/\s+/);
    const queryRelevance = queryWords.reduce((score, word) => {
      if (contentLower.includes(word)) {
        return score + (1 / queryWords.length);
      }
      return score;
    }, 0);
    
    // Content quality score (length, completeness, structure)
    const contentQuality = Math.min(1, chunk.content.length / 200) * 0.5 + 
                          (chunk.content.includes('.') ? 0.3 : 0) +
                          (chunk.content.includes('?') || chunk.content.includes('!') ? 0.2 : 0);
    
    // Metadata importance score
    const metadataImportance = this.calculateMetadataImportance(chunk.metadata);
    
    // Position score (earlier chunks might be more important)
    const position = allChunks.indexOf(chunk);
    const positionScore = Math.max(0, 1 - (position / allChunks.length));
    
    // Novelty score (unique information)
    const noveltyScore = this.calculateNoveltyScore(chunk, allChunks);
    
    // Weighted combination
    const weights = config.attentionWeights;
    const totalScore = 
      queryRelevance * weights.query +
      contentQuality * weights.content +
      metadataImportance * weights.metadata +
      positionScore * weights.position +
      noveltyScore * weights.novelty;
    
    return Math.max(0, Math.min(1, totalScore));
  }
  
  private calculateMetadataImportance(metadata: BaseMetadata): number {
    let importance = 0;
    
    // Content type importance
    const contentTypeWeights: Record<string, number> = {
      'work': 0.9,
      'leadership': 0.8,
      'experiment': 0.7,
      'timeline': 0.6,
      'contact': 0.3
    };
    
    if (metadata.type && typeof metadata.type === 'string') {
      importance += contentTypeWeights[metadata.type] || 0.5;
    }
    
    // Featured content boost
    if ('featured' in metadata && metadata.featured) {
      importance += 0.2;
    }
    
    // Technology relevance
    if ('technologies' in metadata && Array.isArray(metadata.technologies)) {
      importance += Math.min(0.3, metadata.technologies.length * 0.1);
    }
    
    // Recency boost
    if (metadata.timestamp && typeof metadata.timestamp === 'number') {
      const now = Date.now();
      const yearsDiff = (now - metadata.timestamp) / (1000 * 60 * 60 * 24 * 365);
      importance += Math.max(0, 1 - yearsDiff / 3) * 0.2;
    }
    
    return Math.min(1, importance);
  }
  
  private calculateNoveltyScore(chunk: ContextChunk, allChunks: ContextChunk[]): number {
    const chunkWords = new Set(chunk.content.toLowerCase().split(/\s+/));
    
    let overlapScore = 0;
    let comparedChunks = 0;
    
    for (const otherChunk of allChunks) {
      if (otherChunk.id === chunk.id) continue;
      
      const otherWords = new Set(otherChunk.content.toLowerCase().split(/\s+/));
      const intersection = new Set([...chunkWords].filter(word => otherWords.has(word)));
      const union = new Set([...chunkWords, ...otherWords]);
      
      if (union.size > 0) {
        overlapScore += intersection.size / union.size;
        comparedChunks++;
      }
    }
    
    if (comparedChunks === 0) return 1;
    
    const avgOverlap = overlapScore / comparedChunks;
    return Math.max(0, 1 - avgOverlap);
  }
  
  private createPruningConfig(userQuery: string, targetTokens: number): PruningConfig {
    const queryIntent = analyzeQueryIntent(userQuery);
    const contextConfig = getOptimalContextSize(userQuery);
    
    const baseConfigs = {
      FACTUAL: {
        targetTokens,
        compressionRate: 0.4,
        preserveCoherence: true,
        attentionWeights: {
          query: 0.4,
          content: 0.3,
          metadata: 0.2,
          position: 0.05,
          novelty: 0.05
        },
        minChunkSize: 50,
        maxChunkSize: 300,
        diversityThreshold: 0.3
      },
      CASUAL: {
        targetTokens,
        compressionRate: 0.6,
        preserveCoherence: false,
        attentionWeights: {
          query: 0.5,
          content: 0.2,
          metadata: 0.1,
          position: 0.1,
          novelty: 0.1
        },
        minChunkSize: 30,
        maxChunkSize: 150,
        diversityThreshold: 0.2
      },
      EXPLORATION: {
        targetTokens,
        compressionRate: 0.3,
        preserveCoherence: true,
        attentionWeights: {
          query: 0.3,
          content: 0.4,
          metadata: 0.1,
          position: 0.1,
          novelty: 0.1
        },
        minChunkSize: 100,
        maxChunkSize: 500,
        diversityThreshold: 0.4
      },
      COMPARISON: {
        targetTokens,
        compressionRate: 0.35,
        preserveCoherence: true,
        attentionWeights: {
          query: 0.35,
          content: 0.3,
          metadata: 0.15,
          position: 0.1,
          novelty: 0.1
        },
        minChunkSize: 80,
        maxChunkSize: 400,
        diversityThreshold: 0.5
      },
      SYNTHESIS: {
        targetTokens,
        compressionRate: 0.25,
        preserveCoherence: true,
        attentionWeights: {
          query: 0.25,
          content: 0.4,
          metadata: 0.15,
          position: 0.1,
          novelty: 0.1
        },
        minChunkSize: 100,
        maxChunkSize: 600,
        diversityThreshold: 0.6
      }
    };
    
    return baseConfigs[queryIntent] || baseConfigs.FACTUAL;
  }
  
  private preserveContextCoherence(chunks: ContextChunk[]): ContextChunk[] {
    // Sort chunks by their original position/metadata to maintain logical flow
    const sortedChunks = [...chunks].sort((a, b) => {
      // First by content type priority
      const typeOrder: Record<string, number> = { 'work': 1, 'leadership': 2, 'experiment': 3, 'timeline': 4, 'contact': 5 };
      const aContentType = a.metadata?.contentType as string;
      const bContentType = b.metadata?.contentType as string;
      const aOrder = typeOrder[aContentType] || 999;
      const bOrder = typeOrder[bContentType] || 999;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
              // Then by date (newest first)
        if (a.metadata?.date && b.metadata?.date) {
          const aDate = a.metadata.date as string | number;
          const bDate = b.metadata.date as string | number;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
      
      // Finally by score
      return b.score - a.score;
    });
    
    // Ensure we have representative chunks from different content types
    const contentTypesSeen = new Set();
    const balancedChunks = [];
    
    // First pass: include at least one chunk from each content type
    for (const chunk of sortedChunks) {
      const contentType = chunk.metadata?.contentType;
      if (contentType && !contentTypesSeen.has(contentType)) {
        balancedChunks.push(chunk);
        contentTypesSeen.add(contentType);
      }
    }
    
    // Second pass: fill remaining slots with highest scoring chunks
    const remainingChunks = sortedChunks.filter(chunk => !balancedChunks.includes(chunk));
    balancedChunks.push(...remainingChunks);
    
    return balancedChunks;
  }
  
  private calculateCoherenceScore(chunks: ContextChunk[]): number {
    if (chunks.length <= 1) return 1;
    
    let coherenceScore = 0;
    let comparisons = 0;
    
    for (let i = 0; i < chunks.length - 1; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const chunk1 = chunks[i];
        const chunk2 = chunks[j];
        
        // Content similarity
        const words1 = new Set(chunk1.content.toLowerCase().split(/\s+/));
        const words2 = new Set(chunk2.content.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        
        const similarity = intersection.size / union.size;
        
        // Metadata coherence
        const metadataCoherence = this.calculateMetadataCoherence(chunk1.metadata, chunk2.metadata);
        
        coherenceScore += (similarity + metadataCoherence) / 2;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? coherenceScore / comparisons : 1;
  }
  
  private calculateMetadataCoherence(metadata1: any, metadata2: any): number {
    let coherence = 0;
    let factors = 0;
    
    // Content type coherence
    if (metadata1.contentType && metadata2.contentType) {
      coherence += metadata1.contentType === metadata2.contentType ? 1 : 0;
      factors++;
    }
    
    // Technology coherence
    if (metadata1.technologies && metadata2.technologies) {
      const tech1 = new Set(metadata1.technologies);
      const tech2 = new Set(metadata2.technologies);
      const intersection = new Set([...tech1].filter(tech => tech2.has(tech)));
      const union = new Set([...tech1, ...tech2]);
      
      coherence += union.size > 0 ? intersection.size / union.size : 0;
      factors++;
    }
    
    // Date coherence (similar time periods)
    if (metadata1.date && metadata2.date) {
      const date1 = new Date(metadata1.date);
      const date2 = new Date(metadata2.date);
      const timeDiff = Math.abs(date1.getTime() - date2.getTime());
      const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365);
      
      coherence += Math.max(0, 1 - yearsDiff / 2);
      factors++;
    }
    
    return factors > 0 ? coherence / factors : 0.5;
  }
  
  private applyDiversityPruning(chunks: ContextChunk[], threshold: number): ContextChunk[] {
    const pruned = [];
    const contentTypesSeen = new Set();
    const technologiesSeen = new Set();
    
    // Sort by attention score descending
    const sortedChunks = [...chunks].sort((a, b) => b.score - a.score);
    
    for (const chunk of sortedChunks) {
      const contentType = chunk.metadata?.contentType;
      const technologies = chunk.metadata?.technologies || [];
      
      // Calculate diversity score
      const isContentTypeDiverse = !contentTypesSeen.has(contentType);
      const techArray = Array.isArray(technologies) ? technologies : [];
      const hasDiverseTech = techArray.some(tech => !technologiesSeen.has(tech));
      
      const diversityScore = (isContentTypeDiverse ? 0.5 : 0) + (hasDiverseTech ? 0.5 : 0);
      
      // Include if diverse enough or high scoring
      if (diversityScore >= threshold || chunk.score > 0.8) {
        pruned.push(chunk);
        
        if (contentType) contentTypesSeen.add(contentType);
        techArray.forEach(tech => technologiesSeen.add(tech));
      }
    }
    
    return pruned;
  }
  
  private calculateQualityScore(
    originalChunks: ContextChunk[],
    prunedChunks: ContextChunk[],
    userQuery: string
  ): number {
    // Query coverage score
    const queryWords = userQuery.toLowerCase().split(/\s+/);
    const originalCoverage = this.calculateQueryCoverage(originalChunks, queryWords);
    const prunedCoverage = this.calculateQueryCoverage(prunedChunks, queryWords);
    
    const coverageRetention = Math.min(1, originalCoverage > 0 ? prunedCoverage / originalCoverage : 1);
    
    // Information density score
    const originalDensity = this.calculateInformationDensity(originalChunks);
    const prunedDensity = this.calculateInformationDensity(prunedChunks);
    
    const densityImprovement = Math.min(1, originalDensity > 0 ? prunedDensity / originalDensity : 1);
    
    // Metadata preservation score
    const metadataPreservation = Math.min(1, this.calculateMetadataPreservation(originalChunks, prunedChunks));
    
    // Weighted combination - ensure result is <= 1.0
    const qualityScore = (
      coverageRetention * 0.4 +
      densityImprovement * 0.3 +
      metadataPreservation * 0.3
    );
    
    return Math.min(1, Math.max(0, qualityScore));
  }
  
  private calculateQueryCoverage(chunks: ContextChunk[], queryWords: string[]): number {
    const coveredWords = new Set();
    
    for (const chunk of chunks) {
      const contentLower = chunk.content.toLowerCase();
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          coveredWords.add(word);
        }
      }
    }
    
    return coveredWords.size / queryWords.length;
  }
  
  private calculateInformationDensity(chunks: ContextChunk[]): number {
    if (chunks.length === 0) return 0;
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    const uniqueWords = new Set();
    
    for (const chunk of chunks) {
      const words = chunk.content.toLowerCase().split(/\s+/);
      words.forEach(word => uniqueWords.add(word));
    }
    
    return totalTokens > 0 ? uniqueWords.size / totalTokens : 0;
  }
  
  private calculateMetadataPreservation(
    originalChunks: ContextChunk[],
    prunedChunks: ContextChunk[]
  ): number {
    const originalContentTypes = new Set(originalChunks.map(c => c.metadata?.contentType).filter(Boolean));
    const prunedContentTypes = new Set(prunedChunks.map(c => c.metadata?.contentType).filter(Boolean));
    
    const contentTypePreservation = originalContentTypes.size > 0 
      ? prunedContentTypes.size / originalContentTypes.size 
      : 1;
    
    const originalTechnologies = new Set(
      originalChunks.flatMap(c => c.metadata?.technologies || [])
    );
    const prunedTechnologies = new Set(
      prunedChunks.flatMap(c => c.metadata?.technologies || [])
    );
    
    const technologyPreservation = originalTechnologies.size > 0
      ? prunedTechnologies.size / originalTechnologies.size
      : 1;
    
    return (contentTypePreservation + technologyPreservation) / 2;
  }
  
  public async prune(
    chunks: ContextChunk[],
    userQuery: string,
    targetTokens: number
  ): Promise<PruningResult> {
    const startTime = performance.now();
    
    if (chunks.length === 0) {
      return {
        prunedChunks: [],
        originalTokens: 0,
        finalTokens: 0,
        compressionRate: 0,
        coherenceScore: 1,
        processingTime: 0,
        qualityScore: 1
      };
    }
    
    const originalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    
    // If already under target, return as-is
    if (originalTokens <= targetTokens) {
      return {
        prunedChunks: chunks,
        originalTokens,
        finalTokens: originalTokens,
        compressionRate: 0,
        coherenceScore: 1,
        processingTime: performance.now() - startTime,
        qualityScore: 1
      };
    }
    
    try {
      const config = this.createPruningConfig(userQuery, targetTokens);
      
      // Step 1: Calculate attention scores for all chunks
      const chunksWithAttention = chunks.map(chunk => ({
        ...chunk,
        attentionScore: this.calculateAttentionScore(chunk, userQuery, chunks, config)
      }));
      
      // Step 2: Sort by attention score
      const sortedChunks = chunksWithAttention.sort((a, b) => b.attentionScore - a.attentionScore);
      
      // Step 3: Progressive pruning to reach target tokens
      let currentTokens = originalTokens;
      let prunedChunks: ContextChunk[] = sortedChunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        score: chunk.score, // Preserve original score
        tokens: chunk.tokens,
        source: chunk.source,
        stage: chunk.stage
      }));
      
      while (currentTokens > targetTokens && prunedChunks.length > 1) {
        // Remove the lowest scoring chunk
        const removedChunk = prunedChunks.pop();
        if (removedChunk) {
          currentTokens -= removedChunk.tokens;
        }
      }
      
      // Step 4: Apply diversity pruning if enabled
      if (config.diversityThreshold > 0) {
        prunedChunks = this.applyDiversityPruning(prunedChunks, config.diversityThreshold);
      }
      
      // Step 5: Preserve context coherence if enabled
      if (config.preserveCoherence) {
        prunedChunks = this.preserveContextCoherence(prunedChunks);
      }
      
      // Step 6: Final token adjustment
      const finalTokens = prunedChunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
      
      // Step 7: Calculate quality metrics
      const compressionRate = originalTokens > 0 ? 1 - (finalTokens / originalTokens) : 0;
      const coherenceScore = this.calculateCoherenceScore(prunedChunks);
      const qualityScore = this.calculateQualityScore(chunks, prunedChunks, userQuery);
      
      const processingTime = performance.now() - startTime;
      
      return {
        prunedChunks,
        originalTokens,
        finalTokens,
        compressionRate,
        coherenceScore,
        processingTime,
        qualityScore
      };
      
    } catch (error) {
      console.error('[ContextPruner] Pruning failed:', error);
      
      // Fallback: simple truncation
      const simpleTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
      const ratio = targetTokens / simpleTokens;
      const fallbackChunks = chunks.slice(0, Math.ceil(chunks.length * ratio));
      
      return {
        prunedChunks: fallbackChunks,
        originalTokens: simpleTokens,
        finalTokens: fallbackChunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
        compressionRate: 1 - ratio,
        coherenceScore: 0.5,
        processingTime: performance.now() - startTime,
        qualityScore: 0.5
      };
    }
  }
  
  public async validatePerformance(testCases: Array<{
    chunks: ContextChunk[];
    query: string;
    targetTokens: number;
  }>): Promise<{
    avgCompressionRate: number;
    avgCoherenceScore: number;
    avgQualityScore: number;
    avgProcessingTime: number;
  }> {
    const results = [];
    
    for (const testCase of testCases) {
      const result = await this.prune(testCase.chunks, testCase.query, testCase.targetTokens);
      results.push(result);
    }
    
    return {
      avgCompressionRate: results.reduce((sum, r) => sum + r.compressionRate, 0) / results.length,
      avgCoherenceScore: results.reduce((sum, r) => sum + r.coherenceScore, 0) / results.length,
      avgQualityScore: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length,
      avgProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    };
  }
}

// Export singleton instance
export const contextPruner = new ContextPruner();