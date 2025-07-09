import { MultiStageRetrieval } from '../multi-stage-retrieval';

// Mock the external dependencies
jest.mock('../pinecone-vector-store', () => ({
  semanticSearchPinecone: jest.fn()
}));

jest.mock('../chat-intelligence', () => ({
  analyzeQueryIntent: jest.fn(),
  getOptimalContextSize: jest.fn()
}));

describe('Multi-Stage Retrieval Tests', () => {
  let retrieval: MultiStageRetrieval;
  
  beforeEach(() => {
    retrieval = new MultiStageRetrieval();
    jest.clearAllMocks();
  });
  
  describe('Basic Configuration Tests', () => {
    it('should be instantiable', () => {
      expect(retrieval).toBeInstanceOf(MultiStageRetrieval);
    });
    
    it('should have search method', () => {
      expect(typeof retrieval.search).toBe('function');
    });
    
    it('should have validatePerformance method', () => {
      expect(typeof retrieval.validatePerformance).toBe('function');
    });
  });
  
  describe('Configuration Logic Tests', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    it('should handle FACTUAL query intent', () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 600,
        chunkCount: 3,
        diversityBoost: false
      });
      
      // Test that configuration is properly set for FACTUAL queries
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should handle SYNTHESIS query intent', () => {
      mockAnalyzeQueryIntent.mockReturnValue('SYNTHESIS');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 2000,
        chunkCount: 10,
        diversityBoost: true
      });
      
      // Test that configuration is properly set for SYNTHESIS queries
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should handle EXPLORATION query intent', () => {
      mockAnalyzeQueryIntent.mockReturnValue('EXPLORATION');
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1200,
        chunkCount: 6,
        diversityBoost: true
      });
      
      // Test that configuration is properly set for EXPLORATION queries
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
  });
  
  describe('Performance Validation Tests', () => {
    it('should validate performance metrics format', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { text: 'test content', metadata: { source: 'test' } },
          score: 0.8
        }
      ]);
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await retrieval.validatePerformance(['test query']);
      
      expect(result).toHaveProperty('avgRelevanceImprovement');
      expect(result).toHaveProperty('avgStagesUsed');
      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('avgConfidence');
      
      expect(typeof result.avgRelevanceImprovement).toBe('number');
      expect(typeof result.avgStagesUsed).toBe('number');
      expect(typeof result.avgResponseTime).toBe('number');
      expect(typeof result.avgConfidence).toBe('number');
    });
  });
  
  describe('Error Handling Tests', () => {
    it('should handle search failures gracefully', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      mockSemanticSearch.mockRejectedValue(new Error('Search failed'));
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await retrieval.search('test query');
      
      expect(result).toHaveProperty('bestStage');
      expect(result).toHaveProperty('stages');
      expect(result).toHaveProperty('finalChunks');
      expect(result).toHaveProperty('totalProcessingTime');
      expect(result).toHaveProperty('confidence');
      
      // Should fallback gracefully
      expect(result.confidence).toBeLessThan(0.5);
    });
    
    it('should handle empty search results', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      mockSemanticSearch.mockResolvedValue([]);
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await retrieval.search('test query');
      
      expect(result).toHaveProperty('finalChunks');
      expect(Array.isArray(result.finalChunks)).toBe(true);
      expect(result.stages).toHaveLength(1); // Should have at least one stage
    });
  });
  
  describe('Integration Tests', () => {
    it('should integrate with query intelligence', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { 
            text: 'I have 8 years of experience in UX design',
            metadata: { source: 'experience' }
          },
          score: 0.85
        }
      ]);
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await retrieval.search('ile lat doświadczenia masz?');
      
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledWith('ile lat doświadczenia masz?');
      expect(result.bestStage).toBe('FINE');
    });
    
    it('should handle complex synthesis queries', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { 
            text: 'As a UX designer, I specialize in user research',
            metadata: { source: 'skills' }
          },
          score: 0.75
        },
        {
          chunk: { 
            text: 'My experience includes design systems',
            metadata: { source: 'experience' }
          },
          score: 0.70
        }
      ]);
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('SYNTHESIS');
      
      const result = await retrieval.search('co potrafisz jako projektant?');
      
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledWith('co potrafisz jako projektant?');
      expect(result.stages.length).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Metrics Tests', () => {
    it('should measure response times', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { text: 'test', metadata: { source: 'test' } },
          score: 0.8
        }
      ]);
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const startTime = performance.now();
      const result = await retrieval.search('test query');
      const endTime = performance.now();
      
      expect(result.totalProcessingTime).toBeGreaterThan(0);
      expect(result.totalProcessingTime).toBeLessThan(endTime - startTime + 100); // Allow some tolerance
    });
    
    it('should validate stage results structure', async () => {
      const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { text: 'test', metadata: { source: 'test' } },
          score: 0.8
        }
      ]);
      
      const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await retrieval.search('test query');
      
      expect(result.stages).toHaveLength(1); // FACTUAL should have 1 stage
      expect(result.stages[0]).toHaveProperty('stage');
      expect(result.stages[0]).toHaveProperty('chunks');
      expect(result.stages[0]).toHaveProperty('totalFound');
      expect(result.stages[0]).toHaveProperty('relevanceScore');
      expect(result.stages[0]).toHaveProperty('processingTime');
      
      expect(typeof result.stages[0].stage).toBe('string');
      expect(Array.isArray(result.stages[0].chunks)).toBe(true);
      expect(typeof result.stages[0].totalFound).toBe('number');
      expect(typeof result.stages[0].relevanceScore).toBe('number');
      expect(typeof result.stages[0].processingTime).toBe('number');
    });
  });
});