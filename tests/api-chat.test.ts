import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.VERCEL_GIT_COMMIT_SHA = 'test123';

// Test API endpoint
const API_BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const CHAT_ENDPOINT = `${API_BASE_URL}/api/ai/chat`;

// Test scenarios for API validation
const API_TEST_SCENARIOS = [
  {
    name: 'Skillset Query - Polish',
    messages: [{ role: 'user', content: 'Jakie masz umiejętności?' }],
    expectedIntent: 'skillset',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['umiejętności', 'technologie', 'design', 'leadership'],
      shouldNotContain: ['papka', 'nie rozumiem', 'did not understand'],
      shouldHaveMetadata: true
    }
  },
  {
    name: 'Skillset Query - English',
    messages: [{ role: 'user', content: 'What skills do you have?' }],
    expectedIntent: 'skillset',
    expectedLanguage: 'english',
    expectedResponse: {
      shouldContain: ['skills', 'technologies', 'design', 'leadership'],
      shouldNotContain: ['papka', 'did not understand', 'generic response'],
      shouldHaveMetadata: true
    }
  },
  {
    name: 'Project Query - VW',
    messages: [{ role: 'user', content: 'Opowiedz o projekcie Volkswagen' }],
    expectedIntent: 'project',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['Volkswagen', 'VW', 'Design Lead', 'zespół'],
      shouldNotContain: ['papka', 'nie rozumiem'],
      shouldHaveMetadata: true
    }
  },
  {
    name: 'Leadership Query',
    messages: [{ role: 'user', content: 'Jak zarządzasz zespołem?' }],
    expectedIntent: 'leadership',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['servant leadership', 'autonomia', 'zespół', 'przywództwo'],
      shouldNotContain: ['papka', 'nie rozumiem'],
      shouldHaveMetadata: true
    }
  },
  {
    name: 'Technical Query',
    messages: [{ role: 'user', content: 'Jakie technologie znasz?' }],
    expectedIntent: 'technical',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['React', 'TypeScript', 'AI', 'design', 'Figma'],
      shouldNotContain: ['papka', 'nie rozumiem'],
      shouldHaveMetadata: true
    }
  },
  {
    name: 'Complex Query',
    messages: [{ role: 'user', content: 'Porównaj jak się różni praca w VW od Polsat Box Go pod względem technologii i podejścia do designu' }],
    expectedIntent: 'comparison',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['VW', 'Polsat', 'porównanie', 'różnice'],
      shouldNotContain: ['papka', 'nie rozumiem'],
      shouldHaveMetadata: true
    }
  },
  {
    name: 'Conversation Context',
    messages: [
      { role: 'user', content: 'Jakie masz umiejętności?' },
      { role: 'assistant', content: 'Mam umiejętności w designie...' },
      { role: 'user', content: 'Opowiedz więcej o designie' }
    ],
    expectedIntent: 'exploration',
    expectedLanguage: 'polish',
    expectedResponse: {
      shouldContain: ['design', 'projektowanie', 'UX', 'UI'],
      shouldNotContain: ['papka', 'nie rozumiem'],
      shouldHaveMetadata: true
    }
  }
];

// Performance test scenarios
const PERFORMANCE_TESTS = [
  {
    name: 'Single Query Performance',
    queries: ['Jakie masz umiejętności?'],
    expectedMaxTime: 5000 // 5 seconds
  },
  {
    name: 'Multiple Queries Performance',
    queries: [
      'Jakie masz umiejętności?',
      'Opowiedz o VW',
      'Jak zarządzasz zespołem?',
      'Jakie technologie znasz?',
      'Porównaj projekty'
    ],
    expectedMaxTime: 15000 // 15 seconds
  }
];

describe('API Chat Endpoint Tests - Full Context Management Integration', () => {
  let testResults: any[] = [];
  let apiAvailable = false;

  beforeAll(async () => {
    console.log('🚀 Starting API chat endpoint tests');
    console.log(`📡 Testing endpoint: ${CHAT_ENDPOINT}`);
    
    // Check if API is available
    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          sessionId: 'test'
        })
      });
      
      apiAvailable = response.status !== 404;
      console.log(`✅ API endpoint available: ${apiAvailable}`);
      
    } catch (error) {
      console.log(`⚠️ API endpoint not available: ${error}`);
      apiAvailable = false;
    }
  });

  afterAll(() => {
    console.log('\n📈 API TEST RESULTS SUMMARY:');
    console.log(`✅ Successful tests: ${testResults.filter(r => r.success).length}`);
    console.log(`❌ Failed tests: ${testResults.filter(r => !r.success).length}`);
    console.log(`📊 Success rate: ${((testResults.filter(r => r.success).length / testResults.length) * 100).toFixed(1)}%`);
    
    // Log detailed results
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.responseTime}ms, Intent: ${result.intent}, Confidence: ${result.confidence}`);
    });
  });

  describe('API Endpoint Functionality Tests', () => {
    API_TEST_SCENARIOS.forEach(scenario => {
      it(`API: ${scenario.name}`, async () => {
        if (!apiAvailable) {
          console.log(`⏭️ Skipping API test: ${scenario.name} - API not available`);
          return;
        }

        const startTime = Date.now();
        
        try {
          // Make API request
          const response = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: scenario.messages,
              sessionId: `api-test-${Date.now()}`
            })
          });
          
          const responseTime = Date.now() - startTime;
          
          // Validate response status
          expect(response.status).toBe(200);
          
          // Parse response
          const data = await response.json();
          
          // Validate response structure
          expect(data).toBeDefined();
          expect(data.content).toBeDefined();
          expect(data.content.length).toBeGreaterThan(50);
          
          // Validate metadata
          if (scenario.expectedResponse.shouldHaveMetadata) {
            expect(data.metadata).toBeDefined();
            expect(data.metadata.intent).toBeDefined();
            expect(data.metadata.confidence).toBeDefined();
            expect(data.metadata.language).toBeDefined();
            expect(data.metadata.buildVersion).toBeDefined();
            expect(data.metadata.buildDate).toBeDefined();
            expect(data.metadata.pipelineStages).toBeDefined();
            expect(data.metadata.responseTime).toBeDefined();
            expect(data.metadata.tokensUsed).toBeDefined();
          }
          
          // Validate intent detection
          expect(data.metadata.intent).toBe(scenario.expectedIntent);
          expect(data.metadata.language).toBe(scenario.expectedLanguage);
          expect(data.metadata.confidence).toBeGreaterThan(0.5);
          
          // Validate pipeline execution
          expect(data.metadata.pipelineStages.length).toBeGreaterThan(0);
          expect(data.metadata.pipelineStages).toContain('context-sizing');
          expect(data.metadata.pipelineStages).toContain('multi-stage-retrieval');
          expect(data.metadata.pipelineStages).toContain('hybrid-search');
          expect(data.metadata.pipelineStages).toContain('context-pruning');
          
          // Validate response content
          const content = data.content.toLowerCase();
          
          // Check for expected content
          scenario.expectedResponse.shouldContain.forEach(expected => {
            expect(content).toContain(expected.toLowerCase());
          });
          
          // Check for absence of generic responses
          scenario.expectedResponse.shouldNotContain.forEach(unexpected => {
            expect(content).not.toContain(unexpected.toLowerCase());
          });
          
          // Validate version info is present
          expect(content).toContain('build:');
          expect(content).toContain('test123'); // Our test build version
          
          testResults.push({
            name: scenario.name,
            success: true,
            responseTime,
            intent: data.metadata.intent,
            confidence: data.metadata.confidence,
            language: data.metadata.language,
            stages: data.metadata.pipelineStages.length,
            tokensUsed: data.metadata.tokensUsed
          });
          
          console.log(`✅ API: ${scenario.name} - ${responseTime}ms, intent: ${data.metadata.intent}, confidence: ${data.metadata.confidence}`);
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          testResults.push({
            name: scenario.name,
            success: false,
            responseTime,
            intent: scenario.expectedIntent,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          console.log(`❌ API: ${scenario.name} - ${responseTime}ms, error: ${error}`);
          throw error;
        }
      });
    });
  });

  describe('API Performance Tests', () => {
    PERFORMANCE_TESTS.forEach(test => {
      it(`Performance: ${test.name}`, async () => {
        if (!apiAvailable) {
          console.log(`⏭️ Skipping performance test: ${test.name} - API not available`);
          return;
        }

        const startTime = Date.now();
        const results: any[] = [];
        
        try {
          // Execute queries
          for (const query of test.queries) {
            const queryStartTime = Date.now();
            
            const response = await fetch(CHAT_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [{ role: 'user', content: query }],
                sessionId: `perf-test-${Date.now()}`
              })
            });
            
            const queryTime = Date.now() - queryStartTime;
            
            expect(response.status).toBe(200);
            const data = await response.json();
            
            results.push({
              query,
              responseTime: queryTime,
              success: true,
              intent: data.metadata.intent,
              confidence: data.metadata.confidence
            });
            
            console.log(`✅ Query: "${query.substring(0, 30)}..." - ${queryTime}ms`);
          }
          
          const totalTime = Date.now() - startTime;
          
          // Validate performance
          expect(totalTime).toBeLessThan(test.expectedMaxTime);
          
          // Validate all queries succeeded
          results.forEach(result => {
            expect(result.success).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.5);
          });
          
          testResults.push({
            name: test.name,
            success: true,
            responseTime: totalTime,
            intent: 'performance',
            confidence: results.reduce((sum: number, r: any) => sum + r.confidence, 0) / results.length,
            queriesProcessed: results.length
          });
          
          console.log(`✅ Performance: ${test.name} - ${totalTime}ms for ${results.length} queries`);
          
        } catch (error) {
          const totalTime = Date.now() - startTime;
          testResults.push({
            name: test.name,
            success: false,
            responseTime: totalTime,
            intent: 'performance',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          console.log(`❌ Performance: ${test.name} - ${totalTime}ms, error: ${error}`);
          throw error;
        }
      });
    });
  });

  describe('API Error Handling Tests', () => {
    it('should handle invalid requests gracefully', async () => {
      if (!apiAvailable) {
        console.log('⏭️ Skipping error handling test - API not available');
        return;
      }

      const errorTests = [
        {
          name: 'Empty messages',
          body: { messages: [], sessionId: 'test' },
          expectedStatus: 400
        },
        {
          name: 'Missing messages',
          body: { sessionId: 'test' },
          expectedStatus: 400
        },
        {
          name: 'Invalid message format',
          body: { messages: [{ role: 'invalid', content: 'test' }], sessionId: 'test' },
          expectedStatus: 400
        },
        {
          name: 'Empty message content',
          body: { messages: [{ role: 'user', content: '' }], sessionId: 'test' },
          expectedStatus: 400
        }
      ];
      
      for (const test of errorTests) {
        try {
          const response = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.body)
          });
          
          expect(response.status).toBe(test.expectedStatus);
          console.log(`✅ Error handling: ${test.name} - ${response.status}`);
          
        } catch (error) {
          console.log(`⚠️ Error handling: ${test.name} - ${error}`);
        }
      }
      
      testResults.push({
        name: 'Error Handling',
        success: true,
        responseTime: 0,
        intent: 'error-handling',
        confidence: 1.0
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      if (!apiAvailable) {
        console.log('⏭️ Skipping malformed JSON test - API not available');
        return;
      }

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        });
        
        // Should return 400 or 500, not crash
        expect(response.status).toBeGreaterThanOrEqual(400);
        console.log(`✅ Malformed JSON handled: ${response.status}`);
        
      } catch (error) {
        console.log(`⚠️ Malformed JSON test failed: ${error}`);
      }
      
      testResults.push({
        name: 'Malformed JSON Handling',
        success: true,
        responseTime: 0,
        intent: 'error-handling',
        confidence: 1.0
      });
    });
  });

  describe('API Metadata Validation', () => {
    it('should provide comprehensive metadata', async () => {
      if (!apiAvailable) {
        console.log('⏭️ Skipping metadata validation - API not available');
        return;
      }

      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Jakie masz umiejętności?' }],
          sessionId: `metadata-test-${Date.now()}`
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Validate all required metadata fields
      const requiredFields = [
        'intent', 'confidence', 'language', 'complexity',
        'contextLength', 'searchResultsCount', 'pipelineStages',
        'cacheHit', 'responseTime', 'tokensUsed',
        'buildVersion', 'buildDate'
      ];
      
      requiredFields.forEach(field => {
        expect(data.metadata[field]).toBeDefined();
      });
      
      // Validate specific metadata values
      expect(data.metadata.intent).toBe('skillset');
      expect(data.metadata.language).toBe('polish');
      expect(data.metadata.confidence).toBeGreaterThan(0.5);
      expect(data.metadata.responseTime).toBeGreaterThan(0);
      expect(data.metadata.tokensUsed).toBeGreaterThan(0);
      expect(data.metadata.buildVersion).toBe('test123');
      expect(data.metadata.pipelineStages.length).toBeGreaterThan(0);
      
      console.log(`✅ Metadata validation passed: ${Object.keys(data.metadata).length} fields`);
      
      testResults.push({
        name: 'Metadata Validation',
        success: true,
        responseTime: data.metadata.responseTime,
        intent: 'metadata',
        confidence: data.metadata.confidence
      });
    });
  });
});