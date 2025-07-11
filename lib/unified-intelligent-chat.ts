import { analyzeQueryIntent, getOptimalContextSize } from './chat-intelligence';
import { MultiStageRetrieval } from './multi-stage-retrieval';
import { EnhancedHybridSearch } from './enhanced-hybrid-search';
import { contextPruner, ContextChunk } from './context-pruning';
import { smartContextCache } from './context-cache';

export interface ChatRequest {
  userQuery: string;
  conversationId?: string;
  userId?: string;
  metadata?: {
    language?: string;
    context?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface ChatResponse {
  response: string;
  confidence: number;
  processingTime: number;
  metadata: {
    queryIntent: string;
    contextSize: number;
    compressionRate: number;
    cacheHit: boolean;
    totalTokens: number;
    sources: string[];
    processingSteps: string[];
  };
  performance: {
    retrievalTime: number;
    compressionTime: number;
    cacheTime: number;
    generationTime: number;
  };
}

export interface ProcessingStats {
  stage: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  details?: any;
}

export class UnifiedIntelligentChat {
  private multiStageRetrieval: MultiStageRetrieval;
  private enhancedHybridSearch: EnhancedHybridSearch;
  private processingStats: ProcessingStats[];
  
  constructor() {
    this.multiStageRetrieval = new MultiStageRetrieval();
    this.enhancedHybridSearch = new EnhancedHybridSearch();
    this.processingStats = [];
  }
  
  private logProcessingStep(stage: string, startTime: number, success: boolean, details?: any): ProcessingStats {
    const endTime = performance.now();
    const stat: ProcessingStats = {
      stage,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      details
    };
    
    this.processingStats.push(stat);
    return stat;
  }
  
  private async retrieveContext(
    userQuery: string,
    targetTokens: number
  ): Promise<{
    chunks: ContextChunk[];
    processingTime: number;
    cacheHit: boolean;
    sources: string[];
  }> {
    const retrievalStart = performance.now();
    
    // Check cache first
    const cacheStart = performance.now();
    const cachedResult = smartContextCache.get(userQuery, targetTokens);
    const cacheTime = performance.now() - cacheStart;
    
    if (cachedResult) {
      this.logProcessingStep('cache-hit', cacheStart, true, {
        chunks: cachedResult.length,
        tokens: cachedResult.reduce((sum, chunk) => sum + chunk.tokens, 0)
      });
      
      return {
        chunks: cachedResult,
        processingTime: cacheTime,
        cacheHit: true,
        sources: [...new Set(cachedResult.map(chunk => chunk.source))]
      };
    }
    
    this.logProcessingStep('cache-miss', cacheStart, true);
    
    // Perform retrieval
    const searchStart = performance.now();
    
    try {
      // Use enhanced hybrid search as primary retrieval method
      const searchResults = await this.enhancedHybridSearch.search(userQuery, {
        topK: Math.ceil(targetTokens / 200), // Estimate chunks needed
        minScore: 0.5
      });
      
      // Convert search results to ContextChunk format
      const chunks: ContextChunk[] = searchResults.map(result => ({
        id: result.chunk.id,
        content: result.chunk.text,
        metadata: result.chunk.metadata,
        score: result.relevanceFactors.final,
        tokens: Math.ceil(result.chunk.text.length / 4), // Rough token estimation
        source: result.chunk.metadata?.contentId || 'unknown',
        stage: result.searchStage
      }));
      
      const searchTime = performance.now() - searchStart;
      this.logProcessingStep('hybrid-search', searchStart, true, {
        resultsFound: chunks.length,
        searchStage: searchResults[0]?.searchStage || 'NONE'
      });
      
      // Fallback to multi-stage retrieval if hybrid search fails or returns insufficient results
      if (chunks.length === 0) {
        const fallbackStart = performance.now();
        
        const multiStageResult = await this.multiStageRetrieval.search(userQuery);
        const fallbackChunks: ContextChunk[] = multiStageResult.finalChunks.map((chunk, index) => ({
          id: `fallback-${Date.now()}-${index}`,
          content: chunk.content,
          metadata: chunk.metadata,
          score: chunk.score,
          tokens: Math.ceil(chunk.content.length / 4),
          source: chunk.source,
          stage: chunk.stage
        }));
        
        const fallbackTime = performance.now() - fallbackStart;
        this.logProcessingStep('multi-stage-fallback', fallbackStart, true, {
          resultsFound: fallbackChunks.length,
          bestStage: multiStageResult.bestStage
        });
        
        // Cache the fallback results
        if (fallbackChunks.length > 0) {
          smartContextCache.set(userQuery, targetTokens, fallbackChunks);
        }
        
        return {
          chunks: fallbackChunks,
          processingTime: performance.now() - retrievalStart,
          cacheHit: false,
          sources: [...new Set(fallbackChunks.map(chunk => chunk.source))]
        };
      }
      
      // Cache the hybrid search results
      smartContextCache.set(userQuery, targetTokens, chunks);
      
      return {
        chunks,
        processingTime: performance.now() - retrievalStart,
        cacheHit: false,
        sources: [...new Set(chunks.map(chunk => chunk.source))]
      };
      
    } catch (error) {
      console.error('[UnifiedIntelligentChat] Retrieval failed:', error);
      this.logProcessingStep('retrieval-error', searchStart, false, { error: error.message });
      
      return {
        chunks: [],
        processingTime: performance.now() - retrievalStart,
        cacheHit: false,
        sources: []
      };
    }
  }
  
  private async compressContext(
    chunks: ContextChunk[],
    userQuery: string,
    targetTokens: number
  ): Promise<{
    compressedChunks: ContextChunk[];
    compressionRate: number;
    processingTime: number;
    qualityScore: number;
  }> {
    const compressionStart = performance.now();
    
    if (chunks.length === 0) {
      this.logProcessingStep('compression-skip', compressionStart, true, { reason: 'no-chunks' });
      return {
        compressedChunks: [],
        compressionRate: 0,
        processingTime: 0,
        qualityScore: 1
      };
    }
    
    const originalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    
    // Skip compression if already under target
    if (originalTokens <= targetTokens) {
      this.logProcessingStep('compression-skip', compressionStart, true, { 
        reason: 'under-target',
        originalTokens,
        targetTokens
      });
      
      return {
        compressedChunks: chunks,
        compressionRate: 0,
        processingTime: performance.now() - compressionStart,
        qualityScore: 1
      };
    }
    
    try {
      const pruningResult = await contextPruner.prune(chunks, userQuery, targetTokens);
      
      this.logProcessingStep('context-pruning', compressionStart, true, {
        originalTokens: pruningResult.originalTokens,
        finalTokens: pruningResult.finalTokens,
        compressionRate: pruningResult.compressionRate,
        qualityScore: pruningResult.qualityScore
      });
      
      return {
        compressedChunks: pruningResult.prunedChunks,
        compressionRate: pruningResult.compressionRate,
        processingTime: pruningResult.processingTime,
        qualityScore: pruningResult.qualityScore
      };
      
    } catch (error) {
      console.error('[UnifiedIntelligentChat] Compression failed:', error);
      this.logProcessingStep('compression-error', compressionStart, false, { error: error.message });
      
      // Fallback: simple truncation
      const fallbackChunks = chunks.slice(0, Math.ceil(chunks.length * (targetTokens / originalTokens)));
      
      return {
        compressedChunks: fallbackChunks,
        compressionRate: 1 - (targetTokens / originalTokens),
        processingTime: performance.now() - compressionStart,
        qualityScore: 0.7
      };
    }
  }
  
  private async generateResponse(
    userQuery: string,
    context: ContextChunk[],
    queryIntent: string
  ): Promise<{
    response: string;
    confidence: number;
    processingTime: number;
  }> {
    const generationStart = performance.now();
    
    try {
      // Build context string from compressed chunks
      const contextText = context
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .map(chunk => `[${chunk.source}] ${chunk.content}`)
        .join('\n\n');
      
      // Create intent-specific system prompt
      const systemPrompts = {
        FACTUAL: "You are a professional assistant. Answer factually and concisely based on the provided context. If the context doesn't contain the answer, say so clearly.",
        CASUAL: "You are a friendly assistant. Provide a natural, conversational response based on the context.",
        EXPLORATION: "You are an insightful assistant. Provide a comprehensive, detailed response that explores the topic thoroughly based on the context.",
        COMPARISON: "You are an analytical assistant. Compare and contrast the information in the context to provide a balanced perspective.",
        SYNTHESIS: "You are a strategic assistant. Synthesize the information from the context to provide a comprehensive overview and insights."
      };
      
      const systemPrompt = systemPrompts[queryIntent] || systemPrompts.FACTUAL;
      
      // Simulate response generation (in real implementation, this would call OpenAI API)
      const mockResponses = {
        FACTUAL: `Based on my experience and background: ${userQuery.includes('experience') ? 'I have 8+ years of frontend development experience with React, TypeScript, and modern web technologies.' : 'I can help you with that based on my background.'}`,
        CASUAL: `Hi! ${userQuery.includes('hello') || userQuery.includes('hi') ? 'Hello there! How can I help you today?' : 'Thanks for your question! Let me help you with that.'}`,
        EXPLORATION: `Let me give you a comprehensive overview: ${contextText.slice(0, 200)}...`,
        COMPARISON: `Looking at the different aspects: ${contextText.slice(0, 150)}...`,
        SYNTHESIS: `Taking everything into account: ${contextText.slice(0, 180)}...`
      };
      
      const response = mockResponses[queryIntent] || mockResponses.FACTUAL;
      
      // Calculate confidence based on context quality and coverage
      const avgScore = context.length > 0 
        ? context.reduce((sum, chunk) => sum + chunk.score, 0) / context.length 
        : 0;
      
      const confidence = Math.min(0.95, Math.max(0.3, avgScore + (context.length > 0 ? 0.2 : -0.3)));
      
      const processingTime = performance.now() - generationStart;
      
      this.logProcessingStep('response-generation', generationStart, true, {
        responseLength: response.length,
        confidence,
        contextChunks: context.length
      });
      
      return {
        response,
        confidence,
        processingTime
      };
      
    } catch (error) {
      console.error('[UnifiedIntelligentChat] Response generation failed:', error);
      this.logProcessingStep('generation-error', generationStart, false, { error: error.message });
      
      return {
        response: "I apologize, but I encountered an error while generating a response. Please try again.",
        confidence: 0.1,
        processingTime: performance.now() - generationStart
      };
    }
  }
  
  public async processQuery(request: ChatRequest): Promise<ChatResponse> {
    const overallStart = performance.now();
    this.processingStats = []; // Reset stats for this query
    
    try {
      // Step 1: Analyze query intent and get optimal context size
      const intelligenceStart = performance.now();
      const queryIntent = analyzeQueryIntent(request.userQuery);
      const contextConfig = getOptimalContextSize(request.userQuery);
      
      this.logProcessingStep('query-analysis', intelligenceStart, true, {
        intent: queryIntent,
        targetTokens: contextConfig.maxTokens,
        chunkCount: contextConfig.chunkCount
      });
      
      // Step 2: Retrieve context
      const retrieval = await this.retrieveContext(
        request.userQuery,
        contextConfig.maxTokens
      );
      
      // Step 3: Compress context if needed
      const compression = await this.compressContext(
        retrieval.chunks,
        request.userQuery,
        contextConfig.maxTokens
      );
      
      // Step 4: Generate response
      const generation = await this.generateResponse(
        request.userQuery,
        compression.compressedChunks,
        queryIntent
      );
      
      // Calculate final tokens
      const finalTokens = compression.compressedChunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
      
      const totalProcessingTime = performance.now() - overallStart;
      
      this.logProcessingStep('complete', overallStart, true, {
        totalTime: totalProcessingTime,
        finalTokens,
        confidence: generation.confidence
      });
      
      return {
        response: generation.response,
        confidence: generation.confidence,
        processingTime: totalProcessingTime,
        metadata: {
          queryIntent,
          contextSize: compression.compressedChunks.length,
          compressionRate: compression.compressionRate,
          cacheHit: retrieval.cacheHit,
          totalTokens: finalTokens,
          sources: retrieval.sources,
          processingSteps: this.processingStats.map(stat => 
            `${stat.stage}: ${stat.duration.toFixed(2)}ms (${stat.success ? 'success' : 'failed'})`
          )
        },
        performance: {
          retrievalTime: retrieval.processingTime,
          compressionTime: compression.processingTime,
          cacheTime: retrieval.cacheHit ? retrieval.processingTime : 0,
          generationTime: generation.processingTime
        }
      };
      
    } catch (error) {
      console.error('[UnifiedIntelligentChat] Query processing failed:', error);
      
      return {
        response: "I apologize, but I encountered an error while processing your query. Please try again.",
        confidence: 0.1,
        processingTime: performance.now() - overallStart,
        metadata: {
          queryIntent: 'ERROR',
          contextSize: 0,
          compressionRate: 0,
          cacheHit: false,
          totalTokens: 0,
          sources: [],
          processingSteps: ['error: ' + error.message]
        },
        performance: {
          retrievalTime: 0,
          compressionTime: 0,
          cacheTime: 0,
          generationTime: 0
        }
      };
    }
  }
  
  public getProcessingStats(): ProcessingStats[] {
    return [...this.processingStats];
  }
  
  public async warmupCache(commonQueries: string[]): Promise<void> {
    console.log('[UnifiedIntelligentChat] Warming up cache with common queries...');
    
    for (const query of commonQueries) {
      try {
        await this.processQuery({ userQuery: query });
        console.log(`[UnifiedIntelligentChat] Warmed up: "${query}"`);
      } catch (error) {
        console.error(`[UnifiedIntelligentChat] Warmup failed for "${query}":`, error);
      }
    }
    
    console.log('[UnifiedIntelligentChat] Cache warmup completed');
  }
  
  public async benchmark(
    testQueries: string[],
    iterations: number = 10
  ): Promise<{
    avgResponseTime: number;
    avgConfidence: number;
    avgCompressionRate: number;
    cacheHitRate: number;
    successRate: number;
  }> {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      for (const query of testQueries) {
        try {
          const response = await this.processQuery({ userQuery: query });
          results.push({
            success: response.confidence > 0.3,
            responseTime: response.processingTime,
            confidence: response.confidence,
            compressionRate: response.metadata.compressionRate,
            cacheHit: response.metadata.cacheHit
          });
        } catch (error) {
          results.push({
            success: false,
            responseTime: 0,
            confidence: 0,
            compressionRate: 0,
            cacheHit: false
          });
        }
      }
    }
    
    return {
      avgResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      avgCompressionRate: results.reduce((sum, r) => sum + r.compressionRate, 0) / results.length,
      cacheHitRate: results.filter(r => r.cacheHit).length / results.length,
      successRate: results.filter(r => r.success).length / results.length
    };
  }
}

// Export singleton instance
export const unifiedIntelligentChat = new UnifiedIntelligentChat();