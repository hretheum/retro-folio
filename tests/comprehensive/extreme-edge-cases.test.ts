// Jest globals are configured in jest.config.js
import { 
  TEST_CONFIG, 
  EXTREME_LANGUAGE_CASES, 
  EXTREME_TECHNICAL_CASES, 
  EXTREME_CONTEXT_CASES, 
  EXTREME_CHAOS_CASES,
  SECURITY_PARAMS,
  PERFORMANCE_PARAMS,
  LANGUAGE_PARAMS
} from '../config/test-config';
import { chatTestSuite } from '../utils/test-helpers';

describe('🔥 EXTREME EDGE CASES - Comprehensive Chat Endpoint Testing', () => {
  
  beforeAll(async () => {
    console.log('🚀 Starting comprehensive edge case testing...');
    console.log(`📡 Testing against: ${TEST_CONFIG.API_BASE_URL}`);
    console.log(`🎯 Endpoints: ${Object.keys(TEST_CONFIG.ENDPOINTS).join(', ')}`);
    chatTestSuite.reset();
  });

  afterAll(async () => {
    const report = chatTestSuite.getTestReport();
    console.log('\n📊 COMPREHENSIVE TEST REPORT:');
    console.log('='.repeat(50));
    console.log(`✅ Total Tests: ${report.summary.totalTests}`);
    console.log(`🎯 Passed: ${report.summary.passedTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(2)}%`);
    console.log(`⏱️  Average Response Time: ${report.performance.averageResponseTime.toFixed(2)}ms`);
    console.log(`🔥 Max Response Time: ${report.performance.maxResponseTime}ms`);
    console.log(`⏳ Timeouts: ${report.performance.timeouts}`);
    console.log('='.repeat(50));
    
    if (report.recentFailures.length > 0) {
      console.log('\n🚨 Recent Failures:');
      report.recentFailures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.endpoint}: ${failure.testCase} - ${failure.error}`);
      });
    }
  });

  describe('📡 All Endpoints Basic Functionality', () => {
    test('🏥 Health Check - All endpoints should be responsive', async () => {
      const healthCheck = await chatTestSuite.testAllEndpointsWithCase(
        'jakie masz umiejętności',
        'health-check'
      );

      for (const [endpoint, result] of Object.entries(healthCheck)) {
        expect(result.passed).toBe(true);
        expect(result.responseTime).toBeLessThan(PERFORMANCE_PARAMS.TIMEOUT_LONG);
        
        if (!result.passed) {
          console.error(`❌ Health check failed for ${endpoint}: ${result.message}`);
        }
      }
    }, 60000); // 1 minute timeout for health check

    test('🌐 Basic Language Detection', async () => {
      const polishQuery = 'Jakie masz umiejętności?';
      const englishQuery = 'What skills do you have?';

      const polishResults = await chatTestSuite.testAllEndpointsWithCase(
        polishQuery,
        'language-detection'
      );

      const englishResults = await chatTestSuite.testAllEndpointsWithCase(
        englishQuery,
        'language-detection'
      );

      // Polish queries should get Polish responses
      for (const [endpoint, result] of Object.entries(polishResults)) {
        expect(result.passed).toBe(true);
        if (result.response && 'body' in result.response) {
          expect(result.response.body.content).toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
        }
      }

      // English queries should get English responses
      for (const [endpoint, result] of Object.entries(englishResults)) {
        expect(result.passed).toBe(true);
        if (result.response && 'body' in result.response) {
          expect(result.response.body.content).toMatch(/\b(skills|projects|experience)\b/i);
        }
      }
    }, 120000); // 2 minutes for language detection
  });

  describe('🎭 Extreme Language Cases', () => {
    // Test each endpoint with all extreme language cases
    Object.entries(TEST_CONFIG.ENDPOINTS).forEach(([endpointName, endpointPath]) => {
      test(`${endpointName} - All extreme language cases`, async () => {
        const results = await chatTestSuite.testEndpointWithAllCases(
          endpointPath,
          EXTREME_LANGUAGE_CASES,
          'extreme-language'
        );

        // At least 80% should pass for language edge cases
        const passRate = results.filter(r => r.passed).length / results.length;
        expect(passRate).toBeGreaterThan(0.8);

        // No response should be completely empty
        results.forEach(result => {
          if (result.response && 'body' in result.response) {
            expect(result.response.body.content.length).toBeGreaterThan(0);
          }
        });

        // Log failures for debugging
        const failures = results.filter(r => !r.passed);
        if (failures.length > 0) {
          console.log(`⚠️  ${endpointName} language failures: ${failures.length}/${results.length}`);
        }
      }, 180000); // 3 minutes per endpoint
    });
  });

  describe('🤖 Extreme Technical Cases', () => {
    Object.entries(TEST_CONFIG.ENDPOINTS).forEach(([endpointName, endpointPath]) => {
      test(`${endpointName} - All extreme technical cases`, async () => {
        const results = await chatTestSuite.testEndpointWithAllCases(
          endpointPath,
          EXTREME_TECHNICAL_CASES,
          'extreme-technical'
        );

        // At least 70% should pass for technical edge cases (more lenient)
        const passRate = results.filter(r => r.passed).length / results.length;
        expect(passRate).toBeGreaterThan(0.7);

        // No response should contain "ERROR" or crash indicators
        results.forEach(result => {
          if (result.response && 'body' in result.response) {
            expect(result.response.body.content).not.toContain('ERROR');
            expect(result.response.body.content).not.toContain('undefined');
            expect(result.response.body.content).not.toContain('null');
          }
        });

        // Very long queries should be handled gracefully
        const longQueryResults = results.filter((_, index) => 
          EXTREME_TECHNICAL_CASES[index].length > 1000
        );
        longQueryResults.forEach(result => {
          expect(result.passed).toBe(true);
          expect(result.responseTime).toBeLessThan(PERFORMANCE_PARAMS.TIMEOUT_LONG);
        });
      }, 300000); // 5 minutes per endpoint
    });
  });

  describe('🎪 Extreme Context Cases', () => {
    Object.entries(TEST_CONFIG.ENDPOINTS).forEach(([endpointName, endpointPath]) => {
      test(`${endpointName} - All extreme context cases`, async () => {
        const results = await chatTestSuite.testEndpointWithAllCases(
          endpointPath,
          EXTREME_CONTEXT_CASES,
          'extreme-context'
        );

        // At least 60% should pass for context edge cases
        const passRate = results.filter(r => r.passed).length / results.length;
        expect(passRate).toBeGreaterThan(0.6);

        // Responses should be contextually appropriate
        results.forEach(result => {
          if (result.response && 'body' in result.response) {
            // Should not be hostile or inappropriate
            expect(result.response.body.content).not.toMatch(/fuck|shit|damn/i);
            
            // Should handle philosophical questions gracefully
            if (result.response.body.content.includes('meaning of life')) {
              expect(result.response.body.content.length).toBeGreaterThan(50);
            }
          }
        });
      }, 240000); // 4 minutes per endpoint
    });
  });

  describe('🌪️ Extreme Chaos Cases', () => {
    Object.entries(TEST_CONFIG.ENDPOINTS).forEach(([endpointName, endpointPath]) => {
      test(`${endpointName} - All extreme chaos cases`, async () => {
        const results = await chatTestSuite.testEndpointWithAllCases(
          endpointPath,
          EXTREME_CHAOS_CASES,
          'extreme-chaos'
        );

        // At least 50% should pass for chaos cases (most lenient)
        const passRate = results.filter(r => r.passed).length / results.length;
        expect(passRate).toBeGreaterThan(0.5);

        // Should handle gibberish gracefully
        results.forEach(result => {
          if (result.response && 'body' in result.response) {
            // Should not echo back nonsense
            expect(result.response.body.content).not.toContain('asdfghjkl');
            expect(result.response.body.content).not.toContain('fjdklsajf');
            
            // Should provide some meaningful response
            expect(result.response.body.content.length).toBeGreaterThan(20);
          }
        });

        // Spam/repetition should be handled
        const spamResults = results.filter((_, index) => 
          EXTREME_CHAOS_CASES[index].includes('jakie jakie jakie')
        );
        spamResults.forEach(result => {
          expect(result.passed).toBe(true);
        });
      }, 180000); // 3 minutes per endpoint
    });
  });

  describe('🔐 Security Testing', () => {
    test('💉 SQL Injection Resistance', async () => {
      for (const [endpointName, endpointPath] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
        const securityResults = await chatTestSuite.securityTest(
          endpointPath,
          SECURITY_PARAMS.SQL_INJECTIONS,
          'sql'
        );

        expect(securityResults.vulnerabilitiesFound).toBe(0);
        expect(securityResults.secureResponses).toBeGreaterThan(0);

        if (securityResults.vulnerabilitiesFound > 0) {
          console.error(`🚨 SQL injection vulnerabilities found in ${endpointName}:`);
          securityResults.suspiciousResponses.forEach(response => {
            console.error(`  - ${response.concern}: ${response.attack}`);
          });
        }
      }
    }, 120000);

    test('🔗 XSS Attack Resistance', async () => {
      for (const [endpointName, endpointPath] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
        const securityResults = await chatTestSuite.securityTest(
          endpointPath,
          SECURITY_PARAMS.XSS_ATTACKS,
          'xss'
        );

        expect(securityResults.vulnerabilitiesFound).toBe(0);
        
        if (securityResults.vulnerabilitiesFound > 0) {
          console.error(`🚨 XSS vulnerabilities found in ${endpointName}:`);
          securityResults.suspiciousResponses.forEach(response => {
            console.error(`  - ${response.concern}: ${response.attack}`);
          });
        }
      }
    }, 120000);

    test('🖥️ Command Injection Resistance', async () => {
      for (const [endpointName, endpointPath] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
        const securityResults = await chatTestSuite.securityTest(
          endpointPath,
          SECURITY_PARAMS.COMMAND_INJECTIONS,
          'command'
        );

        expect(securityResults.vulnerabilitiesFound).toBe(0);
        
        if (securityResults.vulnerabilitiesFound > 0) {
          console.error(`🚨 Command injection vulnerabilities found in ${endpointName}:`);
          securityResults.suspiciousResponses.forEach(response => {
            console.error(`  - ${response.concern}: ${response.attack}`);
          });
        }
      }
    }, 120000);
  });

  describe('⚡ Performance Testing', () => {
    test('🏋️ Load Testing - Concurrent Users', async () => {
      const testQuery = 'jakie masz umiejętności';
      
      for (const [endpointName, endpointPath] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
        const performanceResults = await chatTestSuite.performanceTest(
          endpointPath,
          testQuery,
          PERFORMANCE_PARAMS.MEDIUM_LOAD, // 50 concurrent requests
          PERFORMANCE_PARAMS.ACCEPTABLE_RESPONSE_TIME
        );

        // At least 90% should succeed
        const successRate = performanceResults.successfulRequests / performanceResults.totalRequests;
        expect(successRate).toBeGreaterThan(0.9);

        // Average response time should be reasonable
        expect(performanceResults.averageResponseTime).toBeLessThan(
          PERFORMANCE_PARAMS.ACCEPTABLE_RESPONSE_TIME
        );

        // At least 80% should be within acceptable time
        const timePerformance = performanceResults.withinAcceptableTime / performanceResults.totalRequests;
        expect(timePerformance).toBeGreaterThan(0.8);

        console.log(`📊 ${endpointName} performance: ${successRate.toFixed(2)} success rate, ${performanceResults.averageResponseTime.toFixed(2)}ms avg`);
      }
    }, 300000); // 5 minutes for load testing

    test('🔥 Stress Testing - High Load', async () => {
      const testQuery = 'opowiedz o swoich projektach';
      
      // Test only the most robust endpoints under high load
      const robustEndpoints = {
        'INTELLIGENT_CHAT': TEST_CONFIG.ENDPOINTS.INTELLIGENT_CHAT,
        'CHAT': TEST_CONFIG.ENDPOINTS.CHAT
      };

      for (const [endpointName, endpointPath] of Object.entries(robustEndpoints)) {
        const stressResults = await chatTestSuite.performanceTest(
          endpointPath,
          testQuery,
          PERFORMANCE_PARAMS.HEAVY_LOAD, // 100 concurrent requests
          PERFORMANCE_PARAMS.ACCEPTABLE_RESPONSE_TIME * 2 // Allow 2x time under stress
        );

        // At least 80% should succeed under stress
        const successRate = stressResults.successfulRequests / stressResults.totalRequests;
        expect(successRate).toBeGreaterThan(0.8);

        // Should not have excessive failures
        expect(stressResults.failedRequests).toBeLessThan(
          stressResults.totalRequests * 0.2
        );

        console.log(`🔥 ${endpointName} stress test: ${successRate.toFixed(2)} success rate under ${PERFORMANCE_PARAMS.HEAVY_LOAD} concurrent requests`);
      }
    }, 600000); // 10 minutes for stress testing
  });

  describe('🌍 Multi-Language Support', () => {
    test('🗣️ Language Detection and Response', async () => {
      for (const languageTest of LANGUAGE_PARAMS.LANGUAGE_DETECTION_TESTS) {
        const results = await chatTestSuite.testAllEndpointsWithCase(
          languageTest.query,
          'language-detection'
        );

        for (const [endpointName, result] of Object.entries(results)) {
          expect(result.passed).toBe(true);
          
          if (result.response && 'body' in result.response) {
            if (languageTest.expectPolish) {
              // Should respond in Polish
              expect(result.response.body.content).toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
            } else if (languageTest.expectEnglish) {
              // Should respond in English
              expect(result.response.body.content).toMatch(/\b(skills|projects|experience)\b/i);
            }
            // For other languages, just expect a reasonable response
            expect(result.response.body.content.length).toBeGreaterThan(50);
          }
        }
      }
    }, 180000);
  });

  describe('🧠 RAG Pipeline Specific Tests', () => {
    const intelligentEndpoints = {
      'INTELLIGENT_CHAT': TEST_CONFIG.ENDPOINTS.INTELLIGENT_CHAT,
      'CHAT': TEST_CONFIG.ENDPOINTS.CHAT
    };

    test('🔍 Context Retrieval Validation', async () => {
      const contextQueries = [
        'jakie masz umiejętności w designie',
        'opowiedz o projektach z Volkswagen',
        'jakie technologie znasz',
        'czego potrafisz nauczyć'
      ];

      for (const query of contextQueries) {
        for (const [endpointName, endpointPath] of Object.entries(intelligentEndpoints)) {
          const result = await chatTestSuite.testEndpointWithCase(
            endpointPath,
            query,
            'rag-validation'
          );

          expect(result.passed).toBe(true);

          if (result.response && 'body' in result.response) {
            // Should provide detailed, contextual responses
            expect(result.response.body.content.length).toBeGreaterThan(200);
            
            // Should not be generic fallback
            expect(result.response.body.content).not.toContain('nie zrozumiałem pytania');
            
            // Should contain relevant information
            if (query.includes('design')) {
              expect(result.response.body.content).toMatch(/design|UX|UI|projekt/i);
            }
            if (query.includes('Volkswagen')) {
              expect(result.response.body.content).toMatch(/Volkswagen|VW/i);
            }
          }
        }
      }
    }, 240000);

    test('📊 Metadata Validation', async () => {
      const testQuery = 'jakie masz umiejętności';
      
      for (const [endpointName, endpointPath] of Object.entries(intelligentEndpoints)) {
        const result = await chatTestSuite.testEndpointWithCase(
          endpointPath,
          testQuery,
          'metadata-validation'
        );

        expect(result.passed).toBe(true);

        if (result.response && 'body' in result.response && result.response.body.metadata) {
          const metadata = result.response.body.metadata;
          
          // Should have performance metrics
          expect(metadata.responseTime).toBeDefined();
          expect(metadata.responseTime).toBeGreaterThan(0);
          
          // Should have context information
          expect(metadata.contextLength).toBeDefined();
          expect(metadata.contextLength).toBeGreaterThanOrEqual(0);
          
          // Should have confidence score
          if (metadata.confidence) {
            expect(metadata.confidence).toBeGreaterThanOrEqual(0);
            expect(metadata.confidence).toBeLessThanOrEqual(1);
          }
        }
      }
    }, 120000);
  });

  describe('🎯 Edge Case Recovery', () => {
    test('🔄 Graceful Degradation', async () => {
      // Test scenarios that should trigger fallbacks
      const fallbackScenarios = [
        '', // Empty query
        'x', // Single character
        'null', // Null string
        'undefined', // Undefined string
        '404', // HTTP error code
        'error', // Error keyword
      ];

      for (const scenario of fallbackScenarios) {
        const results = await chatTestSuite.testAllEndpointsWithCase(
          scenario,
          'graceful-degradation'
        );

        for (const [endpointName, result] of Object.entries(results)) {
          // Should not crash
          expect(result.passed).toBe(true);
          
          if (result.response && 'body' in result.response) {
            // Should provide some response
            expect(result.response.body.content.length).toBeGreaterThan(0);
            
            // Should not expose errors
            expect(result.response.body.content).not.toMatch(/stack trace|error 500|internal server error/i);
          }
        }
      }
    }, 120000);
  });

  describe('🎪 Streaming vs Non-Streaming Comparison', () => {
    test('🌊 Streaming Integrity', async () => {
      const testQuery = 'opowiedz o swoich najważniejszych projektach';
      
      // Test streaming endpoint
      const streamingResult = await chatTestSuite.makeStreamingRequest(
        TEST_CONFIG.ENDPOINTS.CHAT_STREAMING,
        {
          messages: [{ role: 'user', content: testQuery }],
          sessionId: `streaming-test-${Date.now()}`
        }
      );

      // Test non-streaming endpoint
      const nonStreamingResult = await chatTestSuite.makeRequest(
        TEST_CONFIG.ENDPOINTS.CHAT_LLM,
        {
          messages: [{ role: 'user', content: testQuery }],
          sessionId: `non-streaming-test-${Date.now()}`
        }
      );

      // Both should succeed
      expect(streamingResult.status).toBe(200);
      expect(nonStreamingResult.status).toBe(200);

      // Both should have meaningful content
      expect(streamingResult.content.length).toBeGreaterThan(100);
      expect(nonStreamingResult.body.content.length).toBeGreaterThan(100);

      // Streaming should have first chunk time
      expect(streamingResult.firstChunkTime).toBeDefined();
      expect(streamingResult.firstChunkTime!).toBeGreaterThan(0);
      expect(streamingResult.firstChunkTime!).toBeLessThan(5000); // First chunk within 5 seconds

      // Both should avoid fallback responses
      expect(streamingResult.content).not.toContain('nie zrozumiałem pytania');
      expect(nonStreamingResult.body.content).not.toContain('nie zrozumiałem pytania');
    }, 120000);
  });
});

// Additional test suites for specific scenarios
describe('🚀 Extreme Load Edge Cases', () => {
  test('💥 Maximum Concurrent Load', async () => {
    const testQuery = 'test maximum load';
    
    // Test extreme concurrent load on the most robust endpoint
    const extremeLoadResults = await chatTestSuite.performanceTest(
      TEST_CONFIG.ENDPOINTS.INTELLIGENT_CHAT,
      testQuery,
      PERFORMANCE_PARAMS.EXTREME_LOAD, // 200 concurrent requests
      PERFORMANCE_PARAMS.TIMEOUT_LONG
    );

    // Should handle at least 70% successfully under extreme load
    const successRate = extremeLoadResults.successfulRequests / extremeLoadResults.totalRequests;
    expect(successRate).toBeGreaterThan(0.7);

    // Should not have excessive timeouts
    expect(extremeLoadResults.timeouts).toBeLessThan(
      extremeLoadResults.totalRequests * 0.1
    );

    console.log(`💥 Extreme load test: ${successRate.toFixed(2)} success rate with ${PERFORMANCE_PARAMS.EXTREME_LOAD} concurrent requests`);
  }, 900000); // 15 minutes for extreme load testing
});

describe('🔬 Memory and Resource Testing', () => {
  test('🧠 Memory Leak Detection', async () => {
    const testQuery = 'memory leak test query';
    
    for (const [endpointName, endpointPath] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
      const memoryResults = await chatTestSuite.memoryLeakTest(
        endpointPath,
        testQuery,
        100 // 100 iterations
      );

      // Should not indicate potential memory leak
      expect(memoryResults.potentialLeak).toBe(false);

      console.log(`🧠 ${endpointName} memory test: ${memoryResults.memoryIncrease} bytes increase over 100 requests`);
    }
  }, 600000); // 10 minutes for memory testing
});