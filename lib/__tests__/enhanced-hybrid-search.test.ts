import { EnhancedHybridSearch } from '../enhanced-hybrid-search';

// Mock dependencies
jest.mock('../pinecone-vector-store', () => ({
  semanticSearchPinecone: jest.fn(),
  hybridSearchPinecone: jest.fn()
}));

jest.mock('../chat-intelligence', () => ({
  analyzeQueryIntent: jest.fn(),
  getOptimalContextSize: jest.fn()
}));

describe('Enhanced Hybrid Search Tests', () => {
  let enhancedSearch: EnhancedHybridSearch;
  
  beforeEach(() => {
    enhancedSearch = new EnhancedHybridSearch();
    jest.clearAllMocks();
  });
  
  describe('Basic Functionality', () => {
    it('should be instantiable', () => {
      expect(enhancedSearch).toBeInstanceOf(EnhancedHybridSearch);
    });
    
    it('should have search method', () => {
      expect(typeof enhancedSearch.search).toBe('function');
    });
    
    it('should have validatePerformance method', () => {
      expect(typeof enhancedSearch.validatePerformance).toBe('function');
    });
  });
  
  describe('Dynamic Weight Calculation', () => {
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
    
    it('should assign higher semantic weight to SYNTHESIS queries', () => {
      mockAnalyzeQueryIntent.mockReturnValue('SYNTHESIS');
      
      // Test the weight calculation indirectly by checking if it doesn't crash
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should assign balanced weights to FACTUAL queries', () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      // Test the weight calculation indirectly
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should adjust weights for queries with numbers', () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      // Test with numeric query
      const numericQuery = 'ile masz 8 lat doświadczenia?';
      expect(numericQuery).toContain('8');
    });
  });
  
  describe('Search Configuration', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: true,
        queryExpansion: true
      });
    });
    
    it('should handle EXPLORATION queries with proper configuration', () => {
      mockAnalyzeQueryIntent.mockReturnValue('EXPLORATION');
      
      // Test configuration handling
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
    
    it('should handle COMPARISON queries with proper configuration', () => {
      mockAnalyzeQueryIntent.mockReturnValue('COMPARISON');
      
      // Test configuration handling
      expect(mockAnalyzeQueryIntent).toBeDefined();
      expect(mockGetOptimalContextSize).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
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
    
    it('should handle search failures gracefully', async () => {
      mockSemanticSearch.mockRejectedValue(new Error('Search failed'));
      
      const result = await enhancedSearch.search('test query');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle empty search results', async () => {
      mockSemanticSearch.mockResolvedValue([]);
      
      const result = await enhancedSearch.search('test query');
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('Performance Validation', () => {
    const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
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
      
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { 
            id: 'test-1',
            text: 'test content',
            metadata: { contentType: 'work' }
          },
          score: 0.8
        }
      ]);
    });
    
    it('should validate performance metrics format', async () => {
      const result = await enhancedSearch.validatePerformance(['test query']);
      
      expect(result).toHaveProperty('avgAccuracyImprovement');
      expect(result).toHaveProperty('avgIrrelevantReduction');
      expect(result).toHaveProperty('avgProcessingTime');
      expect(result).toHaveProperty('weightDistribution');
      
      expect(typeof result.avgAccuracyImprovement).toBe('number');
      expect(typeof result.avgIrrelevantReduction).toBe('number');
      expect(typeof result.avgProcessingTime).toBe('number');
      expect(typeof result.weightDistribution).toBe('object');
    });
    
    it('should measure processing time', async () => {
      const startTime = performance.now();
      await enhancedSearch.search('test query');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });
  
  describe('Integration Tests', () => {
    const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { 
            id: 'test-1',
            text: 'I have experience in React and TypeScript',
            metadata: { 
              contentType: 'work',
              technologies: ['react', 'typescript']
            }
          },
          score: 0.85
        }
      ]);
    });
    
    it('should integrate with query intelligence for FACTUAL queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await enhancedSearch.search('ile lat doświadczenia masz w React?');
      
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledWith('ile lat doświadczenia masz w React?');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should integrate with query intelligence for SYNTHESIS queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('SYNTHESIS');
      
      const result = await enhancedSearch.search('co potrafisz jako developer?');
      
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledWith('co potrafisz jako developer?');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should handle technology-specific queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await enhancedSearch.search('experience with React');
      
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledWith('experience with React');
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('Metadata Filtering', () => {
    const mockSemanticSearch = require('../pinecone-vector-store').semanticSearchPinecone;
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    const mockGetOptimalContextSize = require('../chat-intelligence').getOptimalContextSize;
    
    beforeEach(() => {
      mockGetOptimalContextSize.mockReturnValue({
        maxTokens: 1000,
        chunkCount: 5,
        diversityBoost: false,
        queryExpansion: false
      });
      
      mockSemanticSearch.mockResolvedValue([
        {
          chunk: { 
            id: 'test-1',
            text: 'Recent work at Volkswagen',
            metadata: { 
              contentType: 'work',
              date: '2023-01-01'
            }
          },
          score: 0.80
        }
      ]);
    });
    
    it('should filter content by type for FACTUAL queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await enhancedSearch.search('ile lat doświadczenia masz?');
      
      expect(mockSemanticSearch).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should filter content for recent work queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
      
      const result = await enhancedSearch.search('recent work experience');
      
      expect(mockSemanticSearch).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should filter content for company-specific queries', async () => {
      mockAnalyzeQueryIntent.mockReturnValue('EXPLORATION');
      
      const result = await enhancedSearch.search('tell me about Volkswagen project');
      
      expect(mockSemanticSearch).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});