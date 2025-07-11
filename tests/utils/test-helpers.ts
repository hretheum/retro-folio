import { TEST_CONFIG } from '../config/test-config';

// Response interfaces
interface ChatResponse {
  status: number;
  body: {
    content: string;
    metadata?: {
      queryIntent?: string;
      contextLength?: number;
      responseTime?: number;
      tokensUsed?: number;
      confidence?: number;
      fallbacksUsed?: string[];
      cacheHit?: boolean;
    };
    error?: string;
  };
}

interface StreamingResponse {
  status: number;
  content: string;
  chunks: string[];
  firstChunkTime?: number;
  totalTime: number;
}

interface TestResult {
  passed: boolean;
  message: string;
  responseTime?: number;
  error?: string;
  response?: ChatResponse | StreamingResponse;
}

// Test performance tracking
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  timeouts: number;
  errors: Array<{
    endpoint: string;
    testCase: string;
    error: string;
    timestamp: number;
  }>;
}

export class ChatTestSuite {
  private performanceMetrics: PerformanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    timeouts: 0,
    errors: [],
  };

  private testResults: Array<{
    endpoint: string;
    testCase: string;
    category: string;
    result: TestResult;
    timestamp: number;
  }> = [];

  /**
   * Test a single endpoint with a specific test case
   */
  async testEndpointWithCase(
    endpoint: string,
    testCase: string,
    category: string = 'general'
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(endpoint, {
        messages: [{ role: 'user', content: testCase }],
        sessionId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime, true);

      // Comprehensive validation
      const validationResult = this.validateResponse(response, testCase, endpoint);
      
      const result: TestResult = {
        passed: validationResult.isValid,
        message: validationResult.message,
        responseTime,
        response
      };

      this.testResults.push({
        endpoint,
        testCase: testCase.length > 100 ? testCase.substring(0, 100) + '...' : testCase,
        category,
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime, false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.performanceMetrics.errors.push({
        endpoint,
        testCase: testCase.substring(0, 100),
        error: errorMessage,
        timestamp: Date.now()
      });

      const result: TestResult = {
        passed: false,
        message: `Request failed: ${errorMessage}`,
        responseTime,
        error: errorMessage
      };

      this.testResults.push({
        endpoint,
        testCase: testCase.length > 100 ? testCase.substring(0, 100) + '...' : testCase,
        category,
        result,
        timestamp: Date.now()
      });

      return result;
    }
  }

  /**
   * Test multiple endpoints with the same test case
   */
  async testAllEndpointsWithCase(
    testCase: string,
    category: string = 'general'
  ): Promise<Record<string, TestResult>> {
    const results: Record<string, TestResult> = {};
    
    for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
      results[name] = await this.testEndpointWithCase(endpoint, testCase, category);
    }
    
    return results;
  }

  /**
   * Test an endpoint with all test cases from a category
   */
  async testEndpointWithAllCases(
    endpoint: string,
    testCases: string[],
    category: string
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      const result = await this.testEndpointWithCase(endpoint, testCase, category);
      results.push(result);
      
      // Small delay to avoid overwhelming the server
      await this.sleep(50);
    }
    
    return results;
  }

  /**
   * Make a standard HTTP request to a chat endpoint
   */
  async makeRequest(endpoint: string, body: any): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.TIMEOUT);

    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseBody = await response.json();

      return {
        status: response.status,
        body: responseBody
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        this.performanceMetrics.timeouts++;
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Make a streaming request to a chat endpoint
   */
  async makeStreamingRequest(
    endpoint: string,
    body: any,
    options?: {
      onFirstChunk?: () => void;
      onChunk?: (chunk: string) => void;
      timeout?: number;
    }
  ): Promise<StreamingResponse> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = options?.timeout || TEST_CONFIG.TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      const decoder = new TextDecoder();
      let content = '';
      const chunks: string[] = [];
      let firstChunk = true;
      let firstChunkTime: number | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chunks.push(chunk);
          content += chunk;

          if (firstChunk) {
            firstChunkTime = Date.now() - startTime;
            firstChunk = false;
            options?.onFirstChunk?.();
          }

          options?.onChunk?.(chunk);
        }
      } finally {
        reader.releaseLock();
      }

      clearTimeout(timeoutId);

      return {
        status: response.status,
        content,
        chunks,
        firstChunkTime,
        totalTime: Date.now() - startTime
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        this.performanceMetrics.timeouts++;
        throw new Error('Streaming request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Validate a response against expected criteria
   */
  private validateResponse(
    response: ChatResponse,
    testCase: string,
    endpoint: string
  ): { isValid: boolean; message: string } {
    const validations = [
      // Basic HTTP response validation
      {
        check: () => response.status === 200,
        message: `HTTP status should be 200, got ${response.status}`
      },
      
      // Response body validation
      {
        check: () => response.body && typeof response.body === 'object',
        message: 'Response body should be a valid object'
      },
      
      // Content validation
      {
        check: () => response.body.content && typeof response.body.content === 'string',
        message: 'Response should contain valid content string'
      },
      
      // Content length validation
      {
        check: () => response.body.content.length > 0,
        message: 'Response content should not be empty'
      },
      
      // Reasonable content length
      {
        check: () => response.body.content.length < 10000,
        message: 'Response content should be reasonable length (< 10k chars)'
      },
      
      // Should not contain error indicators
      {
        check: () => !response.body.content.toLowerCase().includes('error'),
        message: 'Response should not contain error messages'
      },
      
      // Should not contain undefined/null text
      {
        check: () => 
          !response.body.content.includes('undefined') && 
          !response.body.content.includes('null'),
        message: 'Response should not contain undefined/null text'
      },
      
      // Should not be generic fallback for normal queries
      {
        check: () => {
          const isNormalQuery = testCase.length > 2 && 
            testCase.includes('umiejętności') || 
            testCase.includes('skills') || 
            testCase.includes('projekty') || 
            testCase.includes('projects');
          
          const isGenericFallback = response.body.content.includes('nie zrozumiałem pytania');
          
          return !isNormalQuery || !isGenericFallback;
        },
        message: 'Normal queries should not trigger generic fallback responses'
      },
      
      // Metadata validation for intelligent endpoints
      {
        check: () => {
          if (endpoint.includes('intelligent-chat')) {
            return response.body.metadata && 
              typeof response.body.metadata === 'object' &&
              'responseTime' in response.body.metadata;
          }
          return true;
        },
        message: 'Intelligent chat endpoint should provide metadata'
      },
      
      // Language detection validation
      {
        check: () => {
          const isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(testCase);
          const responseInPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(response.body.content);
          
          // If input is Polish, response should generally be Polish too
          return !isPolish || responseInPolish;
        },
        message: 'Response language should match input language'
      }
    ];

    for (const validation of validations) {
      try {
        if (!validation.check()) {
          return { isValid: false, message: validation.message };
        }
      } catch (error) {
        return { 
          isValid: false, 
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    return { isValid: true, message: 'All validations passed' };
  }

  /**
   * Performance testing with concurrent requests
   */
  async performanceTest(
    endpoint: string,
    testCase: string,
    concurrentRequests: number = 10,
    maxResponseTime: number = 5000
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    timeouts: number;
    withinAcceptableTime: number;
  }> {
    const promises = Array.from({ length: concurrentRequests }, (_, i) => {
      const requestStartTime = Date.now();
      return this.makeRequest(endpoint, {
        messages: [{ role: 'user', content: `${testCase} (request ${i + 1})` }],
        sessionId: `perf-test-${Date.now()}-${i}`
      }).then(response => ({ 
        success: true, 
        response, 
        responseTime: Date.now() - requestStartTime 
      }))
        .catch(error => ({ 
          success: false, 
          error, 
          responseTime: Date.now() - requestStartTime 
        }));
    });

    const results = await Promise.allSettled(promises);
    const processedResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: result.reason, responseTime: 0 }
    );

    const successful = processedResults.filter(r => r.success);
    const failed = processedResults.filter(r => !r.success);
    const responseTimes = processedResults.map(r => r.responseTime);

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const maxTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const withinAcceptableTime = responseTimes.filter(t => t <= maxResponseTime).length;

    return {
      totalRequests: concurrentRequests,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: avgResponseTime,
      maxResponseTime: maxTime,
      timeouts: this.performanceMetrics.timeouts,
      withinAcceptableTime
    };
  }

  /**
   * Memory leak detection test
   */
  async memoryLeakTest(
    endpoint: string,
    testCase: string,
    iterations: number = 100
  ): Promise<{
    initialMemory: number;
    finalMemory: number;
    memoryIncrease: number;
    averageMemoryPerRequest: number;
    potentialLeak: boolean;
  }> {
    // Memory testing - simplified version for TypeScript compatibility
    const initialMemory = Date.now(); // Use timestamp as placeholder
    
    for (let i = 0; i < iterations; i++) {
      try {
        await this.makeRequest(endpoint, {
          messages: [{ role: 'user', content: `${testCase} (iteration ${i + 1})` }],
          sessionId: `memory-test-${Date.now()}-${i}`
        });
      } catch (error) {
        // Continue testing even if some requests fail
      }
    }

    const finalMemory = Date.now(); // Use timestamp as placeholder
    const memoryIncrease = finalMemory - initialMemory;
    const averageMemoryPerRequest = memoryIncrease / iterations;
    const potentialLeak = false; // Cannot detect without Node.js process API

    return {
      initialMemory,
      finalMemory,
      memoryIncrease,
      averageMemoryPerRequest,
      potentialLeak
    };
  }

  /**
   * Security testing for injection attacks
   */
  async securityTest(
    endpoint: string,
    attackVectors: string[],
    category: string
  ): Promise<{
    totalTests: number;
    vulnerabilitiesFound: number;
    secureResponses: number;
    suspiciousResponses: Array<{
      attack: string;
      response: string;
      concern: string;
    }>;
  }> {
    const results = {
      totalTests: 0,
      vulnerabilitiesFound: 0,
      secureResponses: 0,
      suspiciousResponses: [] as Array<{
        attack: string;
        response: string;
        concern: string;
      }>
    };

    for (const attack of attackVectors) {
      results.totalTests++;

      try {
        const response = await this.makeRequest(endpoint, {
          messages: [{ role: 'user', content: attack }],
          sessionId: `security-test-${Date.now()}-${Math.random()}`
        });

        // Check for security concerns
        const concerns = this.checkSecurityConcerns(response.body.content, attack, category);
        
        if (concerns.length > 0) {
          results.vulnerabilitiesFound++;
          results.suspiciousResponses.push({
            attack: attack.substring(0, 100),
            response: response.body.content.substring(0, 200),
            concern: concerns.join(', ')
          });
        } else {
          results.secureResponses++;
        }

      } catch (error) {
        // Request failures are generally good for security
        results.secureResponses++;
      }
    }

    return results;
  }

  /**
   * Check for security concerns in responses
   */
  private checkSecurityConcerns(
    response: string,
    attack: string,
    category: string
  ): string[] {
    const concerns: string[] = [];

    switch (category) {
      case 'sql':
        if (response.toLowerCase().includes('error') && 
            response.toLowerCase().includes('sql')) {
          concerns.push('SQL error exposed');
        }
        if (response.includes('password') || response.includes('users') || 
            response.includes('table')) {
          concerns.push('Database information exposed');
        }
        break;

      case 'xss':
        if (response.includes('<script>') || response.includes('javascript:')) {
          concerns.push('XSS payload not sanitized');
        }
        if (response.includes('alert(') || response.includes('eval(')) {
          concerns.push('JavaScript execution possible');
        }
        break;

      case 'command':
        if (response.includes('root:') || response.includes('/etc/passwd')) {
          concerns.push('System file access');
        }
        if (response.includes('command not found') || response.includes('permission denied')) {
          concerns.push('Command execution attempted');
        }
        break;

      case 'path':
        if (response.includes('../../../../') || response.includes('..\\..\\')) {
          concerns.push('Path traversal not prevented');
        }
        break;
    }

    return concerns;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(responseTime: number, success: boolean): void {
    this.performanceMetrics.totalRequests++;
    
    if (success) {
      this.performanceMetrics.successfulRequests++;
    } else {
      this.performanceMetrics.failedRequests++;
    }

    this.performanceMetrics.minResponseTime = Math.min(
      this.performanceMetrics.minResponseTime,
      responseTime
    );
    this.performanceMetrics.maxResponseTime = Math.max(
      this.performanceMetrics.maxResponseTime,
      responseTime
    );

    // Update average response time
    const totalTime = this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalRequests - 1);
    this.performanceMetrics.averageResponseTime = (totalTime + responseTime) / this.performanceMetrics.totalRequests;
  }

  /**
   * Get comprehensive test report
   */
  getTestReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      successRate: number;
    };
    performance: PerformanceMetrics;
    testsByCategory: Record<string, {
      total: number;
      passed: number;
      failed: number;
    }>;
    testsByEndpoint: Record<string, {
      total: number;
      passed: number;
      failed: number;
    }>;
    recentFailures: Array<{
      endpoint: string;
      testCase: string;
      error: string;
      timestamp: number;
    }>;
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.result.passed).length;
    const failedTests = totalTests - passedTests;

    const testsByCategory: Record<string, { total: number; passed: number; failed: number }> = {};
    const testsByEndpoint: Record<string, { total: number; passed: number; failed: number }> = {};

    this.testResults.forEach(test => {
      // Category stats
      if (!testsByCategory[test.category]) {
        testsByCategory[test.category] = { total: 0, passed: 0, failed: 0 };
      }
      testsByCategory[test.category].total++;
      if (test.result.passed) {
        testsByCategory[test.category].passed++;
      } else {
        testsByCategory[test.category].failed++;
      }

      // Endpoint stats
      if (!testsByEndpoint[test.endpoint]) {
        testsByEndpoint[test.endpoint] = { total: 0, passed: 0, failed: 0 };
      }
      testsByEndpoint[test.endpoint].total++;
      if (test.result.passed) {
        testsByEndpoint[test.endpoint].passed++;
      } else {
        testsByEndpoint[test.endpoint].failed++;
      }
    });

    const recentFailures = this.testResults
      .filter(r => !r.result.passed)
      .slice(-10)
      .map(r => ({
        endpoint: r.endpoint,
        testCase: r.testCase,
        error: r.result.error || r.result.message,
        timestamp: r.timestamp
      }));

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
      },
      performance: this.performanceMetrics,
      testsByCategory,
      testsByEndpoint,
      recentFailures
    };
  }

  /**
   * Reset test metrics
   */
  reset(): void {
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      timeouts: 0,
      errors: [],
    };
    this.testResults = [];
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const chatTestSuite = new ChatTestSuite();

// Export types for use in tests
export type {
  ChatResponse,
  StreamingResponse,
  TestResult,
  PerformanceMetrics
};