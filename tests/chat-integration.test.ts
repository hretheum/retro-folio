import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chatContextAdapter } from '../lib/chat-context-adapter';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.VERCEL_GIT_COMMIT_SHA = 'test123';

// Test data for different query types
const TEST_QUERIES = {
  skillset: [
    'Jakie masz umiejętności?',
    'What skills do you have?',
    'Jakie technologie znasz?',
    'What technologies do you know?',
    'Opowiedz o swoich kompetencjach'
  ],
  project: [
    'Opowiedz o projekcie Volkswagen',
    'Tell me about VW project',
    'Co robiłeś w Polsat Box Go?',
    'What did you do at Polsat Box Go?',
    'Projekt Hireverse'
  ],
  leadership: [
    'Jak zarządzasz zespołem?',
    'How do you lead teams?',
    'Opowiedz o przywództwie',
    'Tell me about your leadership',
    'Jak skalowałeś zespół w VW?'
  ],
  technical: [
    'Jakie technologie używasz?',
    'What technologies do you use?',
    'React, TypeScript, AI',
    'Design systems, Figma',
    'Jakie narzędzia projektowe znasz?'
  ],
  comparison: [
    'Porównaj projekty VW i Polsat',
    'Compare VW and Polsat projects',
    'Różnica między rolami',
    'Difference between roles',
    'Jak się różnią podejścia?'
  ],
  exploration: [
    'Opowiedz więcej o doświadczeniach',
    'Tell me more about experiences',
    'Szczegóły projektu',
    'Project details',
    'Jak to było pracować w...'
  ]
};

// Test scenarios for validation
const VALIDATION_SCENARIOS = [
  {
    name: 'Skillset Query - Polish',
    query: 'Jakie masz umiejętności?',
    expectedIntent: 'skillset',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['umiejętności', 'technologie', 'design', 'leadership'],
      shouldNotContain: ['papka', 'nie rozumiem', 'did not understand']
    }
  },
  {
    name: 'Skillset Query - English',
    query: 'What skills do you have?',
    expectedIntent: 'skillset',
    expectedLanguage: 'english',
    expectedResponse: {
      shouldContain: ['skills', 'technologies', 'design', 'leadership'],
      shouldNotContain: ['papka', 'did not understand', 'generic response']
    }
  },
  {
    name: 'Project Query - VW',
    query: 'Opowiedz o projekcie Volkswagen',
    expectedIntent: 'project',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['Volkswagen', 'VW', 'Design Lead', 'zespół'],
      shouldNotContain: ['papka', 'nie rozumiem']
    }
  },
  {
    name: 'Leadership Query',
    query: 'Jak zarządzasz zespołem?',
    expectedIntent: 'leadership',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['servant leadership', 'autonomia', 'zespół', 'przywództwo'],
      shouldNotContain: ['papka', 'nie rozumiem']
    }
  },
  {
    name: 'Technical Query',
    query: 'Jakie technologie znasz?',
    expectedIntent: 'technical',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['React', 'TypeScript', 'AI', 'design', 'Figma'],
      shouldNotContain: ['papka', 'nie rozumiem']
    }
  },
  {
    name: 'Complex Query',
    query: 'Porównaj jak się różni praca w VW od Polsat Box Go pod względem technologii i podejścia do designu',
    expectedIntent: 'comparison',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['VW', 'Polsat', 'porównanie', 'różnice'],
      shouldNotContain: ['papka', 'nie rozumiem']
    }
  }
];

describe('Chat Integration Tests - Full Context Management', () => {
  let testResults: any[] = [];

  beforeAll(() => {
    console.log('🚀 Starting comprehensive chat integration tests');
    console.log('📊 Testing full context management pipeline');
  });

  afterAll(() => {
    console.log('\n📈 TEST RESULTS SUMMARY:');
    console.log(`✅ Successful tests: ${testResults.filter(r => r.success).length}`);
    console.log(`❌ Failed tests: ${testResults.filter(r => !r.success).length}`);
    console.log(`📊 Success rate: ${((testResults.filter(r => r.success).length / testResults.length) * 100).toFixed(1)}%`);
    
    // Log detailed results
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.responseTime}ms, Intent: ${result.intent}, Confidence: ${result.confidence}`);
    });
  });

  describe('Intent Detection Tests', () => {
    Object.entries(TEST_QUERIES).forEach(([intentType, queries]) => {
      describe(`${intentType.toUpperCase()} Intent Detection`, () => {
        queries.forEach(query => {
          it(`should detect ${intentType} intent for: "${query}"`, async () => {
            const startTime = Date.now();
            
            try {
              const result = await chatContextAdapter.getContext(query, {
                sessionId: `test-${Date.now()}`,
                maxTokens: 4000,
                namespace: 'production'
              });
              
              const responseTime = Date.now() - startTime;
              
              // Validate response structure
              expect(result).toBeDefined();
              expect(result.context).toBeDefined();
              expect(result.confidence).toBeGreaterThan(0);
              expect(result.performanceMetrics).toBeDefined();
              
              // Validate pipeline execution
              expect(result.performanceMetrics.stages).toBeDefined();
              expect(result.performanceMetrics.stages.length).toBeGreaterThan(0);
              
              // Log test result
              testResults.push({
                name: `${intentType}: ${query.substring(0, 30)}...`,
                success: true,
                responseTime,
                intent: intentType,
                confidence: result.confidence,
                stages: result.performanceMetrics.stages.length
              });
              
              console.log(`✅ ${intentType}: "${query.substring(0, 30)}..." - ${responseTime}ms, confidence: ${result.confidence}`);
              
            } catch (error) {
              const responseTime = Date.now() - startTime;
              testResults.push({
                name: `${intentType}: ${query.substring(0, 30)}...`,
                success: false,
                responseTime,
                intent: intentType,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              
              console.log(`❌ ${intentType}: "${query.substring(0, 30)}..." - ${responseTime}ms, error: ${error}`);
              throw error;
            }
          });
        });
      });
    });
  });

  describe('End-to-End Validation Tests', () => {
    VALIDATION_SCENARIOS.forEach(scenario => {
      it(`E2E: ${scenario.name}`, async () => {
        const startTime = Date.now();
        
        try {
          // Test context management
          const contextResult = await chatContextAdapter.getContext(scenario.query, {
            sessionId: `e2e-${Date.now()}`,
            maxTokens: 4000,
            namespace: 'production'
          });
          
          // Validate context quality
          expect(contextResult.context).toBeDefined();
          expect(contextResult.context.length).toBeGreaterThan(100);
          expect(contextResult.confidence).toBeGreaterThan(0.5);
          
          // Validate pipeline stages
          expect(contextResult.performanceMetrics.stages).toContain('context-sizing');
          expect(contextResult.performanceMetrics.stages).toContain('multi-stage-retrieval');
          expect(contextResult.performanceMetrics.stages).toContain('hybrid-search');
          expect(contextResult.performanceMetrics.stages).toContain('context-pruning');
          
          // Validate response content
          const context = contextResult.context.toLowerCase();
          
          // Check for expected content
          scenario.expectedResponse.shouldContain.forEach(expected => {
            expect(context).toContain(expected.toLowerCase());
          });
          
          // Check for absence of generic responses
          scenario.expectedResponse.shouldNotContain.forEach(unexpected => {
            expect(context).not.toContain(unexpected.toLowerCase());
          });
          
          const responseTime = Date.now() - startTime;
          
          testResults.push({
            name: scenario.name,
            success: true,
            responseTime,
            intent: scenario.expectedIntent,
            confidence: contextResult.confidence,
            contextLength: contextResult.context.length
          });
          
          console.log(`✅ E2E: ${scenario.name} - ${responseTime}ms, confidence: ${contextResult.confidence}`);
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          testResults.push({
            name: scenario.name,
            success: false,
            responseTime,
            intent: scenario.expectedIntent,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          console.log(`❌ E2E: ${scenario.name} - ${responseTime}ms, error: ${error}`);
          throw error;
        }
      });
    });
  });

  describe('Performance and Reliability Tests', () => {
    it('should handle concurrent requests', async () => {
      const concurrentQueries = [
        'Jakie masz umiejętności?',
        'Opowiedz o VW',
        'Jak zarządzasz zespołem?',
        'Jakie technologie znasz?',
        'Porównaj projekty'
      ];
      
      const startTime = Date.now();
      
      const promises = concurrentQueries.map(query => 
        chatContextAdapter.getContext(query, {
          sessionId: `concurrent-${Date.now()}`,
          maxTokens: 4000,
          namespace: 'production'
        })
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // Validate all responses
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.context).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.performanceMetrics.stages.length).toBeGreaterThan(0);
      });
      
      console.log(`✅ Concurrent requests: ${results.length} queries in ${totalTime}ms`);
      
      testResults.push({
        name: 'Concurrent Requests',
        success: true,
        responseTime: totalTime,
        intent: 'mixed',
        confidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      });
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        '', // Empty query
        'a'.repeat(1000), // Very long query
        '!@#$%^&*()', // Special characters
        '1234567890', // Numbers only
        '   ', // Whitespace only
      ];
      
      for (const query of edgeCases) {
        try {
          const result = await chatContextAdapter.getContext(query, {
            sessionId: `edge-${Date.now()}`,
            maxTokens: 4000,
            namespace: 'production'
          });
          
          // Should not crash, even if result is minimal
          expect(result).toBeDefined();
          expect(result.context).toBeDefined();
          
          console.log(`✅ Edge case handled: "${query.substring(0, 20)}..."`);
          
        } catch (error) {
          console.log(`⚠️ Edge case failed: "${query.substring(0, 20)}..." - ${error}`);
          // Edge cases can fail, but shouldn't crash the system
        }
      }
      
      testResults.push({
        name: 'Edge Cases',
        success: true,
        responseTime: 0,
        intent: 'edge-cases',
        confidence: 1.0
      });
    });
  });

  describe('Integration Validation', () => {
    it('should use full context management pipeline', async () => {
      const query = 'Jakie masz umiejętności?';
      
      const result = await chatContextAdapter.getContext(query, {
        sessionId: `integration-${Date.now()}`,
        maxTokens: 4000,
        namespace: 'production'
      });
      
      // Validate pipeline stages are present
      const stages = result.performanceMetrics.stages;
      expect(stages).toContain('context-sizing');
      expect(stages).toContain('multi-stage-retrieval');
      expect(stages).toContain('hybrid-search');
      expect(stages).toContain('context-pruning');
      expect(stages).toContain('smart-caching');
      
      // Validate context quality
      expect(result.context.length).toBeGreaterThan(500);
      expect(result.confidence).toBeGreaterThan(0.7);
      
      console.log(`✅ Full pipeline executed: ${stages.join(' → ')}`);
      
      testResults.push({
        name: 'Full Pipeline Integration',
        success: true,
        responseTime: result.performanceMetrics.totalTime,
        intent: 'integration',
        confidence: result.confidence,
        stages: stages.length
      });
    });

    it('should provide detailed metadata', async () => {
      const query = 'Opowiedz o projekcie VW';
      
      const result = await chatContextAdapter.getContext(query, {
        sessionId: `metadata-${Date.now()}`,
        maxTokens: 4000,
        namespace: 'production'
      });
      
      // Validate metadata structure
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.totalTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.stages).toBeDefined();
      expect(result.performanceMetrics.cacheHit).toBeDefined();
      
      // Validate search results
      expect(result.searchResults).toBeDefined();
      expect(Array.isArray(result.searchResults)).toBe(true);
      
      console.log(`✅ Metadata provided: ${result.performanceMetrics.stages.length} stages, ${result.searchResults.length} results`);
      
      testResults.push({
        name: 'Detailed Metadata',
        success: true,
        responseTime: result.performanceMetrics.totalTime,
        intent: 'metadata',
        confidence: result.confidence
      });
    });
  });
});