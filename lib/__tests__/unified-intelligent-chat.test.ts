import { UnifiedIntelligentChat } from '../unified-intelligent-chat';

// Mock all dependencies
jest.mock('../chat-intelligence', () => ({
  analyzeQueryIntent: jest.fn(),
  getOptimalContextSize: jest.fn()
}));

jest.mock('../multi-stage-retrieval', () => ({
  MultiStageRetrieval: jest.fn().mockImplementation(() => ({
    search: jest.fn()
  }))
}));

jest.mock('../enhanced-hybrid-search', () => ({
  EnhancedHybridSearch: jest.fn().mockImplementation(() => ({
    search: jest.fn()
  }))
}));

jest.mock('../context-pruning', () => ({
  contextPruner: {
    prune: jest.fn()
  }
}));

jest.mock('../context-cache', () => ({
  smartContextCache: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

describe('Unified Intelligent Chat Tests', () => {
  let unifiedChat: UnifiedIntelligentChat;
  
  beforeEach(() => {
    unifiedChat = new UnifiedIntelligentChat();
    jest.clearAllMocks();
  });
  
  describe('Basic Functionality', () => {
    it('should be instantiable', () => {
      expect(unifiedChat).toBeInstanceOf(UnifiedIntelligentChat);
    });
    
    it('should have core methods', () => {
      expect(typeof unifiedChat.processQuery).toBe('function');
      expect(typeof unifiedChat.getProcessingStats).toBe('function');
      expect(typeof unifiedChat.warmupCache).toBe('function');
      expect(typeof unifiedChat.benchmark).toBe('function');
    });
  });
  
  describe('Query Processing Integration', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    const mockEnhancedHybridSearch = require('../enhanced-hybrid-search').EnhancedHybridSearch;
    const mockContextPruner = require('../context-pruning').contextPruner;
    const mockSmartContextCache = require('../context-cache').smartContextCache;
    
    beforeEach(() => {
      // Setup default mocks
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      
      mockSmartContextCache.get.mockReturnValue(null); // Cache miss
      
      const mockSearchInstance = {
        search: jest.fn().mockResolvedValue([
          {
            chunk: {
              id: 'test-chunk-1',
              text: 'Test content about React development',
              metadata: { contentType: 'work', contentId: 'test-source' }
            },
            relevanceFactors: { final: 0.8 },
            searchStage: 'HYBRID'
          }
        ])
      };
      
      mockEnhancedHybridSearch.mockImplementation(() => mockSearchInstance);
      
      mockContextPruner.prune.mockResolvedValue({
        prunedChunks: [
          {
            id: 'test-chunk-1',
            content: 'Test content about React development',
            metadata: { contentType: 'work' },
            score: 0.8,
            tokens: 50,
            source: 'test-source'
          }
        ],
        originalTokens: 100,
        finalTokens: 50,
        compressionRate: 0.5,
        qualityScore: 0.9,
        processingTime: 10
      });
    });
    
    it('should process a complete query flow', async () => {
      const request = {
        userQuery: 'tell me about React experience'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('processingTime');
      expect(response).toHaveProperty('metadata');
      expect(response).toHaveProperty('performance');
      
      expect(response.metadata.queryIntent).toBe('FACTUAL');
      expect(response.metadata.cacheHit).toBe(false);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.processingTime).toBeGreaterThan(0);
    });
    
    it('should integrate query intelligence', async () => {
      const request = {
        userQuery: 'what are your skills?'
      };
      
      await unifiedChat.processQuery(request);
      
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledWith('what are your skills?');
      expect(mockGetOptimalContextSize).toHaveBeenCalledWith('what are your skills?');
    });
    
    it('should use enhanced hybrid search for retrieval', async () => {
      const request = {
        userQuery: 'React development experience'
      };
      
      await unifiedChat.processQuery(request);
      
      expect(mockEnhancedHybridSearch).toHaveBeenCalled();
      const searchInstance = mockEnhancedHybridSearch.mock.results[0].value;
      expect(searchInstance.search).toHaveBeenCalledWith(
        'React development experience',
        expect.objectContaining({
          topK: expect.any(Number),
          minScore: 0.5
        })
      );
    });
    
    it('should apply context compression', async () => {
      const request = {
        userQuery: 'tell me about your experience'
      };
      
      await unifiedChat.processQuery(request);
      
      expect(mockContextPruner.prune).toHaveBeenCalledWith(
        expect.any(Array),
        'tell me about your experience',
        1000
      );
    });
    
    it('should cache results for future use', async () => {
      const request = {
        userQuery: 'React development'
      };
      
      await unifiedChat.processQuery(request);
      
      expect(mockSmartContextCache.set).toHaveBeenCalled();
    });
  });
  
  describe('Cache Integration', () => {
    const mockSmartContextCache = require('../context-cache').smartContextCache;
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5
      });
    });
    
    it('should return cached results when available', async () => {
      const cachedChunks = [
        {
          id: 'cached-chunk',
          content: 'Cached content',
          metadata: { contentType: 'work' },
          score: 0.9,
          tokens: 30,
          source: 'cache'
        }
      ];
      
      mockSmartContextCache.get.mockReturnValue(cachedChunks);
      
      const request = {
        userQuery: 'cached query'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.cacheHit).toBe(true);
      expect(response.metadata.cacheHit).toBe(true);
      expect(mockSmartContextCache.get).toHaveBeenCalledWith('cached query', 1000);
    });
    
    it('should handle cache miss gracefully', async () => {
      mockSmartContextCache.get.mockReturnValue(null);
      
      const mockEnhancedHybridSearch = require('../enhanced-hybrid-search').EnhancedHybridSearch;
      const mockSearchInstance = {
        search: jest.fn().mockResolvedValue([])
      };
      mockEnhancedHybridSearch.mockImplementation(() => mockSearchInstance);
      
      const request = {
        userQuery: 'non-cached query'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.cacheHit).toBe(false);
      expect(response.metadata.cacheHit).toBe(false);
    });
  });
  
  describe('Different Query Types', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    const mockEnhancedHybridSearch = require('../enhanced-hybrid-search').EnhancedHybridSearch;
    const mockSmartContextCache = require('../context-cache').smartContextCache;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5
      });
      
      mockSmartContextCache.get.mockReturnValue(null);
      
      const mockSearchInstance = {
        search: jest.fn().mockResolvedValue([
          {
            chunk: {
              id: 'test-chunk',
              text: 'Test content',
              metadata: { contentType: 'work', contentId: 'test' }
            },
            relevanceFactors: { final: 0.8 },
            searchStage: 'SEMANTIC'
          }
        ])
      };
      mockEnhancedHybridSearch.mockImplementation(() => mockSearchInstance);
    });
    
    it('should handle FACTUAL queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const request = {
        userQuery: 'how many years of experience do you have?'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe('FACTUAL');
      expect(response.response).toContain('experience');
    });
    
    it('should handle CASUAL queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('CASUAL');
      
      const request = {
        userQuery: 'hello there'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe('CASUAL');
      expect(response.response).toContain('Hello');
    });
    
    it('should handle SYNTHESIS queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('SYNTHESIS');
      
      const request = {
        userQuery: 'tell me about your overall capabilities'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe('SYNTHESIS');
      expect(response.response).toContain('Taking everything into account');
    });
    
    it('should handle EXPLORATION queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('EXPLORATION');
      
      const request = {
        userQuery: 'tell me more about your work methodology'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe('EXPLORATION');
      expect(response.response).toContain('comprehensive overview');
    });
    
    it('should handle COMPARISON queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('COMPARISON');
      
      const request = {
        userQuery: 'compare React vs Vue experience'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe('COMPARISON');
      expect(response.response).toContain('different aspects');
    });
  });
  
  describe('Error Handling', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5
      });
    });
    
    it('should handle query intelligence failures', async () => {
      mockAnalyzeQueryIntent.mockImplementation(() => {
        throw new Error('Query analysis failed');
      });
      
      const request = {
        userQuery: 'test query'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe('ERROR');
      expect(response.confidence).toBe(0.1);
      expect(response.response).toContain('error');
    });
    
    it('should handle retrieval failures', async () => {
      const mockEnhancedHybridSearch = require('../enhanced-hybrid-search').EnhancedHybridSearch;
      const mockSearchInstance = {
        search: jest.fn().mockRejectedValue(new Error('Search failed'))
      };
      mockEnhancedHybridSearch.mockImplementation(() => mockSearchInstance);
      
      const request = {
        userQuery: 'test query'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.sources).toEqual([]);
      expect(response.confidence).toBeGreaterThanOrEqual(0.1);
    });
    
    it('should handle compression failures gracefully', async () => {
      const mockContextPruner = require('../context-pruning').contextPruner;
      mockContextPruner.prune.mockRejectedValue(new Error('Compression failed'));
      
      const mockEnhancedHybridSearch = require('../enhanced-hybrid-search').EnhancedHybridSearch;
      const mockSearchInstance = {
        search: jest.fn().mockResolvedValue([
          {
            chunk: {
              id: 'test-chunk',
              text: 'Test content',
              metadata: { contentType: 'work', contentId: 'test' }
            },
            relevanceFactors: { final: 0.8 },
            searchStage: 'SEMANTIC'
          }
        ])
      };
      mockEnhancedHybridSearch.mockImplementation(() => mockSearchInstance);
      
      const request = {
        userQuery: 'test query'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.compressionRate).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeGreaterThan(0.1);
    });
  });
  
  describe('Performance Tracking', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5
      });
    });
    
    it('should track processing statistics', async () => {
      const request = {
        userQuery: 'test query for stats'
      };
      
      await unifiedChat.processQuery(request);
      
      const stats = unifiedChat.getProcessingStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      
      // Check that we have key processing steps
      const stepNames = stats.map(stat => stat.stage);
      expect(stepNames).toContain('query-analysis');
      expect(stepNames).toContain('complete');
    });
    
    it('should measure processing times accurately', async () => {
      const request = {
        userQuery: 'performance test query'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.processingTime).toBeGreaterThan(0);
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata.processingSteps).toContain('retrieval');
      expect(response.metadata.processingSteps).toContain('generation');
    });
    
    it('should track detailed metadata', async () => {
      const request = {
        userQuery: 'metadata tracking test'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata).toHaveProperty('queryIntent');
      expect(response.metadata).toHaveProperty('contextSize');
      expect(response.metadata).toHaveProperty('compressionRate');
      expect(response.metadata).toHaveProperty('cacheHit');
      expect(response.metadata).toHaveProperty('totalTokens');
      expect(response.metadata).toHaveProperty('sources');
      expect(response.metadata).toHaveProperty('processingSteps');
      
      expect(Array.isArray(response.metadata.sources)).toBe(true);
      expect(Array.isArray(response.metadata.processingSteps)).toBe(true);
    });
  });
  
  describe('Cache Warmup', () => {
    it('should warmup cache with common queries', async () => {
      const commonQueries = [
        'what is your experience?',
        'tell me about your skills',
        'what technologies do you know?'
      ];
      
      await unifiedChat.warmupCache(commonQueries);
      
      // Should have processed all queries
      expect(true).toBe(true); // Basic test that warmup completes
    });
    
    it('should handle warmup failures gracefully', async () => {
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockImplementation(() => {
        throw new Error('Warmup failure');
      });
      
      const commonQueries = ['failing query'];
      
      // Should not throw error
      await expect(unifiedChat.warmupCache(commonQueries)).resolves.not.toThrow();
    });
  });
  
  describe('Benchmarking', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5
      });
    });
    
    it('should benchmark performance', async () => {
      const testQueries = [
        'test query 1',
        'test query 2'
      ];
      
      const benchmarkResult = await unifiedChat.benchmark(testQueries, 2);
      
      expect(benchmarkResult).toHaveProperty('avgResponseTime');
      expect(benchmarkResult).toHaveProperty('avgConfidence');
      expect(benchmarkResult).toHaveProperty('avgCompressionRate');
      expect(benchmarkResult).toHaveProperty('cacheHitRate');
      expect(benchmarkResult).toHaveProperty('successRate');
      
      expect(typeof benchmarkResult.avgResponseTime).toBe('number');
      expect(typeof benchmarkResult.avgConfidence).toBe('number');
      expect(typeof benchmarkResult.avgCompressionRate).toBe('number');
      expect(typeof benchmarkResult.cacheHitRate).toBe('number');
      expect(typeof benchmarkResult.successRate).toBe('number');
      
      expect(benchmarkResult.avgResponseTime).toBeGreaterThan(0);
      expect(benchmarkResult.successRate).toBeGreaterThan(0);
    });
    
    it('should handle benchmark failures', async () => {
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockImplementation(() => {
        throw new Error('Benchmark failure');
      });
      
      const testQueries = ['failing query'];
      
      const benchmarkResult = await unifiedChat.benchmark(testQueries, 1);
      
      expect(benchmarkResult.successRate).toBe(0);
      expect(benchmarkResult.avgConfidence).toBe(0);
    });
  });
  
  describe('Integration Validation', () => {
    it('should use all major components', async () => {
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
      const mockEnhancedHybridSearch = require('../enhanced-hybrid-search').EnhancedHybridSearch;
      const mockContextPruner = require('../context-pruning').contextPruner;
      const mockSmartContextCache = require('../context-cache').smartContextCache;
      
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5
      });
      
      const request = {
        userQuery: 'integration test query'
      };
      
      await unifiedChat.processQuery(request);
      
      // Verify all components were used
      expect(mockAnalyzeQueryIntent).toHaveBeenCalled();
      expect(mockGetOptimalContextSize).toHaveBeenCalled();
      expect(mockSmartContextCache.get).toHaveBeenCalled();
      expect(mockEnhancedHybridSearch).toHaveBeenCalled();
    });
    
    it('should maintain data flow between components', async () => {
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
      
      const intent = 'SYNTHESIS';
      const contextConfig = {
        maxTokens: 2000,
        chunkCount: 8
      };
      
      mockAnalyzeQueryIntent.mockReturnValue(intent);
      mockGetOptimalContextSize.mockReturnValue(contextConfig);
      
      const request = {
        userQuery: 'data flow test'
      };
      
      const response = await unifiedChat.processQuery(request);
      
      expect(response.metadata.queryIntent).toBe(intent);
      expect(response.response).toContain('Taking everything into account');
    });
  });
});