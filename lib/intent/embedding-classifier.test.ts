import { MockEmbeddingIntentClassifier } from './embedding-classifier-mock';

describe('EmbeddingIntentClassifier', () => {
  let classifier: MockEmbeddingIntentClassifier;
  
  beforeAll(async () => {
    classifier = new MockEmbeddingIntentClassifier();
    await classifier.initialize();
  });
  
  describe('Intent Classification', () => {
    test('should classify SYNTHESIS intent', async () => {
      const queries = [
        "What are your main programming skills?",
        "Tell me about your technical expertise",
        "What can you do best?"
      ];
      
      for (const query of queries) {
        const result = await classifier.classifyIntent(query);
        
        expect(result.intent).toBe('SYNTHESIS');
        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.method).toBe('embedding');
        expect(result.debugInfo).toBeDefined();
      }
    });
    
    test('should classify EXPLORATION intent', async () => {
      const queries = [
        "Tell me more about your project",
        "Can you elaborate on your role",
        "Explain how you handled the challenge"
      ];
      
      for (const query of queries) {
        const result = await classifier.classifyIntent(query);
        
        expect(result.intent).toBe('EXPLORATION');
        expect(result.confidence).toBeGreaterThan(0.4);
      }
    });
    
    test('should classify FACTUAL intent', async () => {
      const queries = [
        "How many years of experience do you have?",
        "When did you work at Google?",
        "What was the team size?"
      ];
      
      for (const query of queries) {
        const result = await classifier.classifyIntent(query);
        
        expect(result.intent).toBe('FACTUAL');
        expect(result.confidence).toBeGreaterThan(0.4);
      }
    });
    
    test('should handle ambiguous queries', async () => {
      const query = "Can you tell me something?";
      const result = await classifier.classifyIntent(query);
      
      expect(['CASUAL', 'EXPLORATION']).toContain(result.intent);
      expect(result.confidence).toBeLessThan(0.9);
    });
  });
  
  describe('Performance', () => {
    test('should classify within 200ms', async () => {
      const query = "What technologies do you know?";
      const start = Date.now();
      
      await classifier.classifyIntent(query);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
    
    test('should handle batch classification', async () => {
      const queries = [
        "What are your skills?",
        "Tell me about Python",
        "How many projects?"
      ];
      
      const results = await classifier.classifyBatch(queries);
      
      expect(results).toHaveLength(3);
      expect(results[0].intent).toBeDefined();
      expect(results[1].intent).toBeDefined();
      expect(results[2].intent).toBeDefined();
    });
  });
  
  describe('Debug Information', () => {
    test('should include debug info when requested', async () => {
      const query = "What are your programming skills?";
      const result = await classifier.classifyIntent(query, { includeDebugInfo: true });
      
      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo!.topMatches).toBeDefined();
      expect(result.debugInfo!.processingTime).toBeGreaterThan(0);
      expect(result.debugInfo!.dynamicThreshold).toBeGreaterThan(0);
    });
    
    test('should exclude debug info when not requested', async () => {
      const query = "Hello there";
      const result = await classifier.classifyIntent(query, { includeDebugInfo: false });
      
      expect(result.debugInfo).toBeUndefined();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle empty queries gracefully', async () => {
      const result = await classifier.classifyIntent('');
      
      expect(result.intent).toBe('CASUAL');
      expect(result.confidence).toBe(0);
    });
    
    test('should handle very long queries', async () => {
      const longQuery = "This is a very long query that contains many words and should still be classified properly even though it's quite lengthy and might contain various different types of content that could potentially match different intent patterns";
      const result = await classifier.classifyIntent(longQuery);
      
      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });
});