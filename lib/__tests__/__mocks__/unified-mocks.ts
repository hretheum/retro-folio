// Unified Mock Strategy for All Tests
import { ContextChunk } from '../../context-pruning';
import type { SearchResult } from '../../vector-store';

// Standard mock data structures
export const mockContextChunk: ContextChunk = {
  id: 'test-chunk-1',
  content: 'Test content for context management',
  metadata: {
    contentType: 'work',
    contentId: 'test-content-1',
    timestamp: Date.now()
  },
  score: 0.8,
  tokens: 50,
  source: 'test',
  stage: 'FINE'
};

export const mockSearchResult: SearchResult = {
  chunk: {
    id: 'test-chunk-1',
    text: 'Test content for semantic search',
    metadata: {
      contentType: 'work',
      contentId: 'test-content-1',
      source: 'test'
    }
  },
  score: 0.8
};

// Mock factory functions
export function createMockAnalyzeQueryIntent(returnValue = 'FACTUAL') {
  return jest.fn().mockReturnValue(returnValue);
}

export function createMockGetOptimalContextSize(config = {
  maxTokens: 1000,
  chunkCount: 5,
  diversityBoost: true,
  queryExpansion: true,
  topKMultiplier: 1.0
}) {
  return jest.fn().mockReturnValue(config);
}

export function createMockSemanticSearch(results = [mockSearchResult]) {
  return jest.fn().mockResolvedValue({
    results,
    context: 'Test context',
    metadata: {
      queryLength: 10,
      resultsFound: results.length,
      searchTime: 100,
      averageScore: 0.8
    }
  });
}

export function createMockEnhancedHybridSearch() {
  return {
    search: jest.fn().mockResolvedValue([{
      chunk: mockSearchResult.chunk,
      score: 0.8,
      relevanceFactors: {
        semantic: 0.8,
        lexical: 0.7,
        metadata: 0.6,
        final: 0.75
      },
      searchStage: 'SEMANTIC' as const,
      diversityScore: 0.9
    }])
  };
}

export function createMockContextPruner() {
  return {
    prune: jest.fn().mockResolvedValue({
      prunedChunks: [mockContextChunk],
      originalTokens: 200,
      finalTokens: 150,
      compressionRate: 0.25,
      coherenceScore: 0.9,
      processingTime: 50,
      qualityScore: 0.85
    })
  };
}

export function createMockSmartContextCache() {
  return {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn().mockReturnValue({
      hitRate: 0.7,
      totalRequests: 100,
      totalHits: 70
    })
  };
}

export function createMockMultiStageRetrieval() {
  return {
    search: jest.fn().mockResolvedValue({
      bestStage: 'FINE' as const,
      stages: [
        {
          stage: 'FINE' as const,
          chunks: [mockContextChunk],
          totalFound: 1,
          relevanceScore: 0.9,
          processingTime: 100
        }
      ],
      finalChunks: [mockContextChunk],
      totalProcessingTime: 100,
      confidence: 0.9
    })
  };
}

export function createMockOpenAI() {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test response from AI'
            }
          }]
        })
      }
    }
  };
}

export function createMockPinecone() {
  return {
    searchSimilar: jest.fn().mockResolvedValue([mockSearchResult])
  };
}

// Error mock functions
export function createMockErrorSemanticSearch() {
  return jest.fn().mockRejectedValue(new Error('Search failed'));
}

export function createMockErrorContextPruner() {
  return {
    prune: jest.fn().mockRejectedValue(new Error('Pruning failed'))
  };
}

// Test utilities
export function expectPerformanceWithinLimits(result: any, maxTime = 2000) {
  expect(result.processingTime || result.totalProcessingTime).toBeLessThan(maxTime);
}

export function expectValidConfidence(confidence: number) {
  expect(confidence).toBeGreaterThanOrEqual(0);
  expect(confidence).toBeLessThanOrEqual(1);
}

export function expectValidCompressionRate(rate: number) {
  expect(rate).toBeGreaterThanOrEqual(0);
  expect(rate).toBeLessThanOrEqual(1);
}

// Mock setup utilities
export function setupUnifiedMocks() {
  // Mock external dependencies
  jest.mock('../../pinecone-vector-store', () => ({
    searchSimilar: createMockPinecone().searchSimilar,
    getRelevantContext: jest.fn().mockResolvedValue({
      context: 'Test context',
      sources: ['test-source']
    })
  }));

  jest.mock('../../openai', () => ({
    estimateTokens: jest.fn().mockReturnValue(10),
    createChatCompletion: jest.fn().mockResolvedValue({
      response: 'Test response',
      confidence: 0.8,
      processingTime: 1000
    })
  }));

  jest.mock('../../context-cache', () => ({
    smartContextCache: createMockSmartContextCache()
  }));
}

// Cleanup utilities
export function cleanupMocks() {
  jest.clearAllMocks();
  jest.resetAllMocks();
}