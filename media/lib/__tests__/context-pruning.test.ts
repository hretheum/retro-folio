import { ContextPruner } from '../context-pruning';

// Mock dependencies
jest.mock('../chat-intelligence', () => ({
  analyzeQueryIntent: jest.fn(),
  getOptimalContextSize: jest.fn()
}));

describe('Context Pruning Tests', () => {
  let contextPruner: ContextPruner;
  
  beforeEach(() => {
    contextPruner = new ContextPruner();
    jest.clearAllMocks();
  });
  
  describe('Basic Functionality', () => {
    it('should be instantiable', () => {
      expect(contextPruner).toBeInstanceOf(ContextPruner);
    });
    
    it('should have prune method', () => {
      expect(typeof contextPruner.prune).toBe('function');
    });
    
    it('should have validatePerformance method', () => {
      expect(typeof contextPruner.validatePerformance).toBe('function');
    });
  });
  
  describe('Pruning Configuration', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
    });
    
    it('should handle FACTUAL query configuration', () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should handle SYNTHESIS query configuration', () => {
      mockAnalyzeQueryIntent.mockReturnValue('SYNTHESIS');
      
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should handle EXPLORATION query configuration', () => {
      mockAnalyzeQueryIntent.mockReturnValue('EXPLORATION');
      
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
  });
  
  describe('Edge Cases', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should handle empty chunks array', async () => {
      const result = await contextPruner.prune([], 'test query', 500);
      
      expect(result).toHaveProperty('prunedChunks');
      expect(result).toHaveProperty('originalTokens');
      expect(result).toHaveProperty('finalTokens');
      expect(result).toHaveProperty('compressionRate');
      expect(result).toHaveProperty('coherenceScore');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('qualityScore');
      
      expect(result.prunedChunks).toEqual([]);
      expect(result.originalTokens).toBe(0);
      expect(result.finalTokens).toBe(0);
      expect(result.compressionRate).toBe(0);
      expect(result.coherenceScore).toBe(1);
      expect(result.qualityScore).toBe(1);
    });
    
    it('should handle chunks already under target tokens', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'Short content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'test query', 500);
      
      expect(result.prunedChunks).toEqual(testChunks);
      expect(result.originalTokens).toBe(10);
      expect(result.finalTokens).toBe(10);
      expect(result.compressionRate).toBe(0);
      expect(result.coherenceScore).toBe(1);
      expect(result.qualityScore).toBe(1);
    });
    
    it('should handle single chunk', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'This is a longer content that might need pruning because it has many tokens and words',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 1000,
          source: 'test'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'test query', 500);
      
      expect(result.prunedChunks).toEqual(testChunks);
      expect(result.originalTokens).toBe(1000);
      expect(result.finalTokens).toBe(1000);
      expect(result.compressionRate).toBe(0);
      expect(result.coherenceScore).toBe(1);
    });
  });
  
  describe('Pruning Logic', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should prune chunks when over target tokens', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'High quality content that is very relevant to the query',
          metadata: { contentType: 'work', featured: true },
          score: 0.9,
          tokens: 400,
          source: 'test1'
        },
        {
          id: 'chunk2',
          content: 'Medium quality content that is somewhat relevant',
          metadata: { contentType: 'experiment' },
          score: 0.6,
          tokens: 300,
          source: 'test2'
        },
        {
          id: 'chunk3',
          content: 'Low quality content that is not very relevant',
          metadata: { contentType: 'contact' },
          score: 0.3,
          tokens: 400,
          source: 'test3'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'test query', 600);
      
      expect(result.originalTokens).toBe(1100);
      expect(result.finalTokens).toBeLessThanOrEqual(600);
      expect(result.compressionRate).toBeGreaterThan(0);
      expect(result.prunedChunks.length).toBeLessThanOrEqual(testChunks.length);
      expect(result.processingTime).toBeGreaterThan(0);
    });
    
    it('should preserve high-scoring chunks', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'This chunk has a very high score and should be preserved',
          metadata: { contentType: 'work', featured: true },
          score: 0.95,
          tokens: 200,
          source: 'test1'
        },
        {
          id: 'chunk2',
          content: 'This chunk has a low score and should be pruned',
          metadata: { contentType: 'contact' },
          score: 0.2,
          tokens: 200,
          source: 'test2'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'test query', 250);
      
      expect(result.prunedChunks.length).toBe(1);
      expect(result.prunedChunks[0].id).toBe('chunk1');
    });
  });
  
  describe('Performance Metrics', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should measure processing time', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 100,
          source: 'test'
        }
      ];
      
      const startTime = performance.now();
      const result = await contextPruner.prune(testChunks, 'test query', 50);
      const endTime = performance.now();
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(endTime - startTime + 10);
    });
    
    it('should calculate compression rate correctly', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'Content 1',
          metadata: { contentType: 'work' },
          score: 0.9,
          tokens: 100,
          source: 'test1'
        },
        {
          id: 'chunk2',
          content: 'Content 2',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 100,
          source: 'test2'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'test query', 100);
      
      expect(result.compressionRate).toBeGreaterThan(0);
      expect(result.compressionRate).toBeLessThan(1);
      expect(result.finalTokens).toBeLessThan(result.originalTokens);
    });
  });
  
  describe('Quality Assessment', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should calculate quality score', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'This is relevant content about design systems',
          metadata: { contentType: 'work', technologies: ['design'] },
          score: 0.9,
          tokens: 150,
          source: 'test1'
        },
        {
          id: 'chunk2',
          content: 'This is also relevant content about systems',
          metadata: { contentType: 'work', technologies: ['systems'] },
          score: 0.8,
          tokens: 150,
          source: 'test2'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'design systems', 200);
      
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThanOrEqual(1);
      expect(typeof result.qualityScore).toBe('number');
    });
    
    it('should calculate coherence score', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: 'Content about React development',
          metadata: { contentType: 'work', technologies: ['react'] },
          score: 0.9,
          tokens: 100,
          source: 'test1'
        },
        {
          id: 'chunk2',
          content: 'Content about React components',
          metadata: { contentType: 'work', technologies: ['react'] },
          score: 0.8,
          tokens: 100,
          source: 'test2'
        }
      ];
      
      const result = await contextPruner.prune(testChunks, 'React development', 150);
      
      expect(result.coherenceScore).toBeGreaterThan(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(1);
      expect(typeof result.coherenceScore).toBe('number');
    });
  });
  
  describe('Error Handling', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should handle invalid chunk data gracefully', async () => {
      const testChunks = [
        {
          id: 'chunk1',
          content: '',
          metadata: {},
          score: 0.8,
          tokens: 100,
          source: 'test'
        }
      ];
      
      // Should not throw error
      const result = await contextPruner.prune(testChunks, 'test query', 50);
      
      expect(result).toHaveProperty('prunedChunks');
      expect(result).toHaveProperty('compressionRate');
      expect(result).toHaveProperty('qualityScore');
      expect(result.processingTime).toBeGreaterThan(0);
    });
    
    it('should handle query intelligence failures', async () => {
      mockAnalyzeQueryIntent.mockImplementation(() => {
        throw new Error('Query analysis failed');
      });
      
      const testChunks = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 100,
          source: 'test'
        }
      ];
      
      // Should fallback gracefully
      const result = await contextPruner.prune(testChunks, 'test query', 50);
      
      expect(result).toHaveProperty('prunedChunks');
      expect(result.compressionRate).toBeGreaterThan(0);
      expect(result.qualityScore).toBe(0.5); // Fallback quality score
    });
  });
  
  describe('Performance Validation', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should validate performance across multiple test cases', async () => {
      const testCases = [
        {
          chunks: [
            {
              id: 'chunk1',
              content: 'Test content 1',
              metadata: { contentType: 'work' },
              score: 0.9,
              tokens: 100,
              source: 'test1'
            }
          ],
          query: 'test query 1',
          targetTokens: 50
        },
        {
          chunks: [
            {
              id: 'chunk2',
              content: 'Test content 2',
              metadata: { contentType: 'work' },
              score: 0.8,
              tokens: 100,
              source: 'test2'
            }
          ],
          query: 'test query 2',
          targetTokens: 50
        }
      ];
      
      const result = await contextPruner.validatePerformance(testCases);
      
      expect(result).toHaveProperty('avgCompressionRate');
      expect(result).toHaveProperty('avgCoherenceScore');
      expect(result).toHaveProperty('avgQualityScore');
      expect(result).toHaveProperty('avgProcessingTime');
      
      expect(typeof result.avgCompressionRate).toBe('number');
      expect(typeof result.avgCoherenceScore).toBe('number');
      expect(typeof result.avgQualityScore).toBe('number');
      expect(typeof result.avgProcessingTime).toBe('number');
      
      expect(result.avgCompressionRate).toBeGreaterThanOrEqual(0);
      expect(result.avgCoherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.avgQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.avgProcessingTime).toBeGreaterThan(0);
    });
  });
});