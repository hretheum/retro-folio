import { SmartContextCache } from '../context-cache';
import { ContextChunk } from '../context-pruning';

// Mock dependencies
jest.mock('../chat-intelligence', () => ({
  analyzeQueryIntent: jest.fn()
}));

describe('Smart Context Cache Tests', () => {
  let cache: SmartContextCache;
  
  beforeEach(() => {
    cache = new SmartContextCache({
      maxMemoryMB: 10,
      defaultTTL: 60000, // 1 minute for testing
      cleanupInterval: 5000, // 5 seconds for testing
      maxEntries: 100
    });
  });
  
  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
  });
  
  describe('Basic Functionality', () => {
    it('should be instantiable', () => {
      expect(cache).toBeInstanceOf(SmartContextCache);
    });
    
    it('should have core methods', () => {
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.set).toBe('function');
      expect(typeof cache.invalidate).toBe('function');
      expect(typeof cache.getStats).toBe('function');
    });
    
    it('should initialize with empty cache', () => {
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.memoryUsageMB).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });
  
  describe('Cache Operations', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should store and retrieve chunks', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      // Cache miss initially
      const result1 = cache.get('test query', 100);
      expect(result1).toBeNull();
      
      // Set value
      cache.set('test query', 100, testChunks);
      
      // Cache hit now
      const result2 = cache.get('test query', 100);
      expect(result2).toEqual(testChunks);
    });
    
    it('should handle cache hits and misses', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      // Initial miss
      cache.get('test query', 100);
      let stats = cache.getStats();
      expect(stats.totalMisses).toBe(1);
      expect(stats.totalHits).toBe(0);
      
      // Set and hit
      cache.set('test query', 100, testChunks);
      cache.get('test query', 100);
      
      stats = cache.getStats();
      expect(stats.totalHits).toBe(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
    
    it('should handle different context sizes', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('test query', 100, testChunks);
      cache.set('test query', 200, testChunks);
      
      const result1 = cache.get('test query', 100);
      const result2 = cache.get('test query', 200);
      
      expect(result1).toEqual(testChunks);
      expect(result2).toEqual(testChunks);
      expect(cache.getStats().totalEntries).toBe(2);
    });
  });
  
  describe('Memory Management', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should track memory usage', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'This is a longer content that should use more memory',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 50,
          source: 'test'
        }
      ];
      
      cache.set('test query', 100, testChunks);
      
      const stats = cache.getStats();
      expect(stats.memoryUsageMB).toBeGreaterThan(0);
      expect(stats.totalEntries).toBe(1);
    });
    
    it('should evict entries when memory limit is reached', () => {
      const largeChunks: ContextChunk[] = Array(10).fill(null).map((_, i) => ({
        id: `chunk${i}`,
        content: 'Very long content that uses lots of memory'.repeat(100),
        metadata: { contentType: 'work' },
        score: 0.8,
        tokens: 1000,
        source: `test${i}`
      }));
      
      // Add multiple entries
      for (let i = 0; i < 5; i++) {
        cache.set(`test query ${i}`, 100, largeChunks);
      }
      
      const stats = cache.getStats();
      expect(stats.memoryUsageMB).toBeLessThanOrEqual(10); // Should not exceed limit
      expect(stats.evictionCount).toBeGreaterThan(0);
    });
  });
  
  describe('TTL and Expiration', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should expire entries after TTL', async () => {
      const shortTTLCache = new SmartContextCache({
        defaultTTL: 100 // 100ms
      });
      
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      shortTTLCache.set('test query', 100, testChunks);
      
      // Should be available immediately
      expect(shortTTLCache.get('test query', 100)).toEqual(testChunks);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(shortTTLCache.get('test query', 100)).toBeNull();
      
      shortTTLCache.destroy();
    });
    
    it('should handle different TTL for different query types', () => {
      mockAnalyzeQueryIntent.mockReturnValueOnce('FACTUAL');
      mockAnalyzeQueryIntent.mockReturnValueOnce('CASUAL');
      
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('factual query', 100, testChunks);
      cache.set('casual query', 100, testChunks);
      
      expect(cache.getStats().totalEntries).toBe(2);
      expect(mockAnalyzeQueryIntent).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Cache Invalidation', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should clear all cache when invalidating without pattern', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('test query 1', 100, testChunks);
      cache.set('test query 2', 100, testChunks);
      
      expect(cache.getStats().totalEntries).toBe(2);
      
      cache.invalidate();
      
      expect(cache.getStats().totalEntries).toBe(0);
      expect(cache.getStats().memoryUsageMB).toBe(0);
    });
    
    it('should invalidate entries matching pattern', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content about React',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('React query', 100, testChunks);
      cache.set('Vue query', 100, testChunks);
      
      expect(cache.getStats().totalEntries).toBe(2);
      
      cache.invalidate('React');
      
      expect(cache.getStats().totalEntries).toBe(1);
      expect(cache.get('Vue query', 100)).toEqual(testChunks);
      expect(cache.get('React query', 100)).toBeNull();
    });
  });
  
  describe('Cache Optimization', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should have optimize method', () => {
      expect(typeof cache.optimize).toBe('function');
    });
    
    it('should clean up expired entries during optimization', async () => {
      const shortTTLCache = new SmartContextCache({
        defaultTTL: 50,
        cleanupInterval: 10000 // Long interval to control cleanup manually
      });
      
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      shortTTLCache.set('test query', 100, testChunks);
      expect(shortTTLCache.getStats().totalEntries).toBe(1);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Optimize should clean up expired entries
      shortTTLCache.optimize();
      
      expect(shortTTLCache.getStats().totalEntries).toBe(0);
      
      shortTTLCache.destroy();
    });
  });
  
  describe('Warmup and Benchmarking', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should warmup cache with common queries', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      const commonQueries = [
        { query: 'common query 1', contextSize: 100, chunks: testChunks },
        { query: 'common query 2', contextSize: 200, chunks: testChunks }
      ];
      
      cache.warmup(commonQueries);
      
      expect(cache.getStats().totalEntries).toBe(2);
      expect(cache.get('common query 1', 100)).toEqual(testChunks);
      expect(cache.get('common query 2', 200)).toEqual(testChunks);
    });
    
    it('should benchmark performance', async () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      const testQueries = [
        { query: 'test query 1', contextSize: 100, chunks: testChunks },
        { query: 'test query 2', contextSize: 200, chunks: testChunks }
      ];
      
      const benchmarkResult = await cache.benchmark(testQueries, 10);
      
      expect(benchmarkResult).toHaveProperty('avgCacheHitTime');
      expect(benchmarkResult).toHaveProperty('avgCacheMissTime');
      expect(benchmarkResult).toHaveProperty('hitRate');
      expect(benchmarkResult).toHaveProperty('memoryEfficiency');
      
      expect(typeof benchmarkResult.avgCacheHitTime).toBe('number');
      expect(typeof benchmarkResult.avgCacheMissTime).toBe('number');
      expect(typeof benchmarkResult.hitRate).toBe('number');
      expect(typeof benchmarkResult.memoryEfficiency).toBe('number');
    });
  });
  
  describe('Performance Validation', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should validate performance targets', () => {
      const validation = cache.validatePerformance();
      
      expect(validation).toHaveProperty('hitRateTarget');
      expect(validation).toHaveProperty('memoryUsageTarget');
      expect(validation).toHaveProperty('responseTimeTarget');
      expect(validation).toHaveProperty('cleanupWorking');
      
      expect(typeof validation.hitRateTarget).toBe('boolean');
      expect(typeof validation.memoryUsageTarget).toBe('boolean');
      expect(typeof validation.responseTimeTarget).toBe('boolean');
      expect(typeof validation.cleanupWorking).toBe('boolean');
    });
    
    it('should meet memory usage target', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Small content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('test query', 100, testChunks);
      
      const validation = cache.validatePerformance();
      expect(validation.memoryUsageTarget).toBe(true);
    });
  });
  
  describe('Export and Import', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should export cache data', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('test query', 100, testChunks);
      
      const exported = cache.export();
      
      expect(Array.isArray(exported)).toBe(true);
      expect(exported.length).toBe(1);
      expect(exported[0]).toHaveProperty('key');
      expect(exported[0]).toHaveProperty('chunks');
      expect(exported[0]).toHaveProperty('metadata');
    });
    
    it('should import cache data', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      const importData = [
        {
          key: 'FACTUAL:100:test',
          query: 'test',
          contextSize: 100,
          chunks: testChunks,
          metadata: {
            queryIntent: 'FACTUAL',
            originalTokens: 10,
            compressed: false,
            hitCount: 0
          }
        }
      ];
      
      cache.import(importData);
      
      expect(cache.getStats().totalEntries).toBe(1);
    });
  });
  
  describe('Error Handling', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should handle empty chunks gracefully', () => {
      expect(() => cache.set('test query', 100, [])).not.toThrow();
      expect(cache.get('test query', 100)).toEqual([]);
    });
    
    it('should handle invalid query gracefully', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      expect(() => cache.set('', 100, testChunks)).not.toThrow();
      expect(() => cache.get('', 100)).not.toThrow();
    });
    
    it('should handle query intelligence failures', () => {
      mockAnalyzeQueryIntent.mockImplementation(() => {
        throw new Error('Query analysis failed');
      });
      
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      // Should not throw error
      expect(() => cache.set('test query', 100, testChunks)).not.toThrow();
    });
  });
  
  describe('Cleanup and Destruction', () => {
    const mockAnalyzeQueryIntent = require('../chat-intelligence').analyzeQueryIntent;
    
    beforeEach(() => {
      mockAnalyzeQueryIntent.mockReturnValue('FACTUAL');
    });
    
    it('should cleanup resources on destroy', () => {
      const testChunks: ContextChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { contentType: 'work' },
          score: 0.8,
          tokens: 10,
          source: 'test'
        }
      ];
      
      cache.set('test query', 100, testChunks);
      expect(cache.getStats().totalEntries).toBe(1);
      
      cache.destroy();
      
      expect(cache.getStats().totalEntries).toBe(0);
      expect(cache.getStats().memoryUsageMB).toBe(0);
    });
  });
});