// Central Mock Utilities for Test Consistency
import { ContextChunk } from '../../context-pruning';

// Standard test data structures
export const mockContextChunk: ContextChunk = {
  id: 'test-chunk-1',
  content: 'Test content for context management',
  metadata: {
    contentType: 'work',
    contentId: 'test-content-1',
    source: 'test',
    timestamp: Date.now()
  },
  score: 0.8,
  tokens: 50,
  source: 'test',
  stage: 'FINE'
};

export const mockSearchResult = {
  chunk: {
    id: 'test-chunk-1',
    text: 'Test content for semantic search',
    metadata: {
      contentType: 'work',
      contentId: 'test-content-1',
      source: 'test'
    }
  },
  score: 0.8,
  confidence: 0.85
};

export const mockEnhancedSearchResult = {
  ...mockSearchResult,
  searchStage: 'SEMANTIC' as const,
  relevanceFactors: {
    semantic: 0.8,
    lexical: 0.7,
    metadata: 0.6,
    final: 0.75
  },
  diversityScore: 0.9
};

// Standard mock configurations
export const defaultContextConfig = {
  maxTokens: 1000,
  chunkCount: 5,
  diversityBoost: true,
  queryExpansion: true,
  compressionTarget: 0.7
};

export const defaultQueryIntents = {
  FACTUAL: 'FACTUAL',
  CASUAL: 'CASUAL', 
  EXPLORATION: 'EXPLORATION',
  COMPARISON: 'COMPARISON',
  SYNTHESIS: 'SYNTHESIS'
} as const;

// Mock response generators
export function createMockChatResponse(overrides = {}) {
  return {
    response: 'Test response from AI',
    confidence: 0.8,
    processingTime: 1000,
    metadata: {
      queryIntent: 'FACTUAL',
      contextSize: 3,
      compressionRate: 0.2,
      cacheHit: false,
      totalTokens: 150,
      sources: ['test-source'],
      processingSteps: ['query-analysis', 'retrieval', 'generation']
    },
    ...overrides
  };
}

export function createMockPruningResult(overrides = {}) {
  return {
    prunedChunks: [mockContextChunk],
    originalTokens: 200,
    finalTokens: 150,
    compressionRate: 0.25,
    coherenceScore: 0.9,
    processingTime: 50,
    qualityScore: 0.85,
    ...overrides
  };
}

export function createMockMultiStageResult(overrides = {}) {
  return {
    bestStage: 'FINE' as const,
    stages: [
      {
        stage: 'FINE' as const,
        chunks: [
          {
            content: 'Test content',
            metadata: { contentType: 'work' },
            score: 0.9,
            source: 'test'
          }
        ],
        totalFound: 1,
        relevanceScore: 0.9,
        processingTime: 100
      }
    ],
    finalChunks: [
      {
        content: 'Test content',
        metadata: { contentType: 'work' },
        score: 0.9,
        source: 'test',
        stage: 'FINE' as const
      }
    ],
    totalProcessingTime: 100,
    confidence: 0.9,
    ...overrides
  };
}

// Mock factory functions
export function createMockAnalyzeQueryIntent(returnValue = 'FACTUAL') {
  return jest.fn().mockReturnValue(returnValue);
}

export function createMockGetOptimalContextSize(config = defaultContextConfig) {
  return jest.fn().mockReturnValue(config);
}

export function createMockSemanticSearch(results = [mockSearchResult]) {
  return jest.fn().mockResolvedValue(results);
}

export function createMockEnhancedHybridSearch() {
  return {
    search: jest.fn().mockResolvedValue([mockEnhancedSearchResult])
  };
}

export function createMockContextPruner() {
  return {
    prune: jest.fn().mockResolvedValue(createMockPruningResult())
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
    search: jest.fn().mockResolvedValue(createMockMultiStageResult())
  };
}

// Test data generators
export function generateTestChunks(count = 3): ContextChunk[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockContextChunk,
    id: `test-chunk-${i + 1}`,
    content: `Test content ${i + 1}`,
    score: 0.9 - (i * 0.1),
    tokens: 50 + (i * 10)
  }));
}

export function generateTestQueries() {
  return {
    factual: [
      'Ile lat doświadczenia masz?',
      'Jakie technologie znasz?',
      'Gdzie pracowałeś wcześniej?'
    ],
    casual: [
      'Cześć!',
      'Jak się masz?',
      'Co słychać?'
    ],
    exploration: [
      'Opowiedz o projekcie Volkswagen',
      'Jak wyglądała praca w Polsat Box?',
      'Opisz swoje doświadczenie z React'
    ],
    comparison: [
      'Porównaj VW vs Polsat',
      'Różnice między projektami',
      'Co było trudniejsze?'
    ],
    synthesis: [
      'Jakie są twoje umiejętności?',
      'Podsumuj swoje doświadczenie',
      'Kim jesteś jako developer?'
    ]
  };
}

// Performance test utilities
export function expectPerformanceWithinLimits(result: any, maxTime = 2000) {
  expect(result.processingTime).toBeLessThan(maxTime);
  expect(result.processingTime).toBeGreaterThan(0);
}

export function expectValidConfidence(confidence: number) {
  expect(confidence).toBeGreaterThanOrEqual(0);
  expect(confidence).toBeLessThanOrEqual(1);
  expect(typeof confidence).toBe('number');
}

export function expectValidCompressionRate(rate: number) {
  expect(rate).toBeGreaterThanOrEqual(0);
  expect(rate).toBeLessThanOrEqual(1);
  expect(typeof rate).toBe('number');
}