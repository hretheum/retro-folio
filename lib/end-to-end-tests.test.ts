// Mock dla funkcji search
jest.mock('./pinecone-vector-store', () => ({
  semanticSearchPinecone: jest.fn().mockResolvedValue([
    {
      chunk: {
        id: 'chunk-1',
        text: 'TypeScript is a typed superset of JavaScript.',
        metadata: {
          contentType: 'work',
          technologies: ['typescript', 'javascript'],
          date: '2023-01-01',
          contentId: 'content-1'
        }
      },
      score: 0.95
    },
    {
      chunk: {
        id: 'chunk-2',
        text: 'Best practices for TypeScript development.',
        metadata: {
          contentType: 'experiment',
          technologies: ['typescript'],
          date: '2023-06-01',
          contentId: 'content-2'
        }
      },
      score: 0.85
    }
  ]),
  hybridSearchPinecone: jest.fn().mockResolvedValue([
    {
      chunk: {
        id: 'chunk-3',
        text: 'OAuth2 authentication implementation guide.',
        metadata: {
          contentType: 'work',
          technologies: ['oauth2', 'authentication'],
          date: '2023-03-15',
          contentId: 'content-3'
        }
      },
      score: 0.9
    }
  ])
}));

// End-to-End Tests for Intelligent Context Management System

import { getOptimalContextSize } from './chat-intelligence';
import { multiStageRetrieval } from './multi-stage-retrieval';
import { enhancedHybridSearch } from './enhanced-hybrid-search';
import { contextPruner, type ContextChunk } from './context-pruning';
import { smartContextCache } from './context-cache';
import { unifiedIntelligentChat } from './unified-intelligent-chat';

describe('End-to-End Tests for Intelligent Context Management System', () => {
  describe('Phase 1: Dynamic Context Sizing', () => {
    test('Simple Query Context Sizing', () => {
      const result = getOptimalContextSize("What is TypeScript?", 4000);
      expect(result.maxTokens).toBeGreaterThanOrEqual(400);
      expect(result.maxTokens).toBeLessThan(2000);
      expect(result.topKMultiplier).toBeGreaterThan(0.6);
    });

    test('Complex Technical Query Sizing', () => {
      const complexQuery = "Explain the implementation of a distributed consensus algorithm using Raft protocol with leader election and log replication";
      const result = getOptimalContextSize(complexQuery, 8000);
      expect(result.maxTokens).toBeGreaterThan(1000);
      expect(result.maxTokens).toBeLessThan(6000);
      expect(result.topKMultiplier).toBeGreaterThan(0.5);
    });

    test('Memory Constraint Handling', () => {
      const result = getOptimalContextSize("Simple question", 1000);
      expect(result.maxTokens).toBeLessThanOrEqual(2000);
      expect(result.topKMultiplier).toBeGreaterThan(0.7);
    });
  });

  describe('Phase 2: Multi-Stage Retrieval & Hybrid Search', () => {
    test('Multi-Stage Retrieval', async () => {
      const retrievalResults = await multiStageRetrieval.search("How to implement authentication?");
      expect(retrievalResults).toBeDefined();
      expect(retrievalResults.finalChunks).toBeDefined();
      expect(retrievalResults.finalChunks.length).toBeLessThanOrEqual(15);
      expect(retrievalResults.confidence).toBeGreaterThan(0);
    });

    test('Enhanced Hybrid Search', async () => {
      const searchResults = await enhancedHybridSearch.search("TypeScript best practices", {
        topK: 10,
        minScore: 0.5
      });
      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Phase 3: Context Compression & Caching', () => {
    test('Context Pruning', async () => {
      const chunks: ContextChunk[] = [];
      
      // Create multiple chunks
      for (let i = 0; i < 10; i++) {
        const content = "This is a long context that should be compressed. ".repeat(5) +
                       (i === 5 ? "This is important information about the query. " : "") +
                       "This is some additional context that might be less relevant. ".repeat(2);
        
        chunks.push({
          id: `test-${i}`,
          content: content,
          metadata: { source: 'test', contentType: i % 2 === 0 ? 'work' : 'experiment' },
          score: i === 5 ? 0.9 : 0.5, // Higher score for chunk with important info
          tokens: content.split(' ').length,
          source: 'test'
        });
      }
      
      const totalTokens = chunks.reduce((sum, c) => sum + c.tokens, 0);
      console.log('Debug - total tokens before pruning:', totalTokens);

      const prunedResult = await contextPruner.prune(
        chunks,
        "What is the important information?",
        200 // target tokens
      );
      
      console.log('Debug - original tokens:', prunedResult.originalTokens);
      console.log('Debug - final tokens:', prunedResult.finalTokens);
      console.log('Debug - compression rate:', prunedResult.compressionRate);
      console.log('Debug - chunks before:', chunks.length);
      console.log('Debug - chunks after:', prunedResult.prunedChunks.length);
      
      expect(prunedResult.compressionRate).toBeGreaterThan(0.3);
      expect(prunedResult.qualityScore).toBeGreaterThan(0.6);
      expect(prunedResult.prunedChunks.length).toBeLessThan(chunks.length);
    });

    test('Smart Context Caching', async () => {
      const testKey = 'e2e-test-query-' + Date.now();
      const testChunks = [
        { 
          id: 'test-1',
          content: 'test context',
          metadata: { source: 'test' },
          score: 1.0,
          tokens: 2,
          source: 'test'
        }
      ];
      
      // Test cache set
      await smartContextCache.set(testKey, 100, testChunks);
      
      // Test cache get
      const cached = await smartContextCache.get(testKey, 100);
      expect(cached).toBeDefined();
      expect(cached).toHaveLength(1);
      expect(cached![0].content).toBe('test context');
      
      // Test cache stats
      const stats = smartContextCache.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('Full Pipeline Integration', async () => {
      const testQuery = "How do I implement OAuth2 authentication in TypeScript?";
      
      // Test optimal context size
      const contextSize = getOptimalContextSize(testQuery, 4000);
      expect(contextSize.maxTokens).toBeGreaterThan(0);
      
      // Test retrieval
      const retrievalResults = await multiStageRetrieval.search(testQuery);
      expect(retrievalResults.finalChunks.length).toBeGreaterThan(0);
      
      // Test hybrid search
      const searchResults = await enhancedHybridSearch.search(testQuery);
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('Performance Under Load', async () => {
      const queries = [
        "What is React?",
        "How to use TypeScript?",
        "Explain async/await",
        "What are design patterns?",
        "How to optimize performance?"
      ];
      
      const startTime = Date.now();
      const promises = queries.map(async query => {
        const start = Date.now();
        const result = getOptimalContextSize(query, 3000);
        return {
          query,
          processingTime: Date.now() - start,
          success: result.maxTokens > 0
        };
      });
      
      const loadResults = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const avgTime = loadResults.reduce((sum, r) => sum + r.processingTime, 0) / loadResults.length;
      const successRate = loadResults.filter(r => r.success).length / loadResults.length;
      
      expect(avgTime).toBeLessThan(100);
      expect(successRate).toBeGreaterThan(0.8);
      expect(totalTime).toBeLessThan(500);
    });
  });
});