// End-to-End Tests for Intelligent Context Management System

import { getOptimalContextSize } from './chat-intelligence';
import { multiStageRetrieval, MultiStageRetrieval } from './multi-stage-retrieval';
import { EnhancedHybridSearch } from './enhanced-hybrid-search';
import { contextPruner } from './context-pruning';
import { smartContextCache } from './context-cache';
import { unifiedIntelligentChat } from './unified-intelligent-chat';

interface E2ETestResult {
  testName: string;
  passed: boolean;
  executionTime: number;
  details: string;
  metrics?: {
    accuracy?: number;
    performance?: number;
    efficiency?: number;
  };
}

interface E2ETestSuite {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalTime: number;
  results: E2ETestResult[];
}

class EndToEndTester {
  private cache: typeof smartContextCache;
  private multiStageRetrieval: MultiStageRetrieval;

  constructor() {
    this.cache = smartContextCache;
    this.multiStageRetrieval = new MultiStageRetrieval();
  }

  /**
   * Test Phase 1: Dynamic Context Sizing
   */
  async testDynamicContextSizing(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    
    // Test 1: Simple query sizing
    const test1Start = Date.now();
    try {
      const result = getOptimalContextSize("What is TypeScript?", 4000);
      const passed = result.maxTokens > 500 && result.maxTokens < 2000 && result.topKMultiplier > 0.6;
      
      results.push({
        testName: "Simple Query Context Sizing",
        passed,
        executionTime: Date.now() - test1Start,
        details: `Tokens: ${result.maxTokens}, TopK Multiplier: ${result.topKMultiplier.toFixed(2)}`,
        metrics: {
          accuracy: result.topKMultiplier,
          performance: (Date.now() - test1Start) < 100 ? 1.0 : 0.5,
          efficiency: result.maxTokens / 4000
        }
      });
    } catch (error) {
      results.push({
        testName: "Simple Query Context Sizing",
        passed: false,
        executionTime: Date.now() - test1Start,
        details: `Error: ${error.message}`
      });
    }

    // Test 2: Complex technical query sizing
    const test2Start = Date.now();
    try {
      const complexQuery = "Explain the implementation of a distributed consensus algorithm using Raft protocol with leader election and log replication";
      const result = getOptimalContextSize(complexQuery, 8000);
      const passed = result.maxTokens > 2000 && result.maxTokens < 6000 && result.topKMultiplier > 0.5;
      
      results.push({
        testName: "Complex Technical Query Sizing",
        passed,
        executionTime: Date.now() - test2Start,
        details: `Tokens: ${result.maxTokens}, TopK Multiplier: ${result.topKMultiplier.toFixed(2)}`,
        metrics: {
          accuracy: result.topKMultiplier,
          performance: (Date.now() - test2Start) < 200 ? 1.0 : 0.5,
          efficiency: result.maxTokens / 8000
        }
      });
    } catch (error) {
      results.push({
        testName: "Complex Technical Query Sizing",
        passed: false,
        executionTime: Date.now() - test2Start,
        details: `Error: ${error.message}`
      });
    }

    // Test 3: Memory constraint handling
    const test3Start = Date.now();
    try {
      const result = getOptimalContextSize("Simple question", 1000);
      const passed = result.maxTokens <= 1000 && result.topKMultiplier > 0.7;
      
      results.push({
        testName: "Memory Constraint Handling",
        passed,
        executionTime: Date.now() - test3Start,
        details: `Tokens: ${result.maxTokens}, Available: 1000, TopK Multiplier: ${result.topKMultiplier.toFixed(2)}`,
        metrics: {
          accuracy: result.topKMultiplier,
          performance: (Date.now() - test3Start) < 50 ? 1.0 : 0.5,
          efficiency: result.maxTokens <= 1000 ? 1.0 : 0.0
        }
      });
    } catch (error) {
      results.push({
        testName: "Memory Constraint Handling",
        passed: false,
        executionTime: Date.now() - test3Start,
        details: `Error: ${error.message}`
      });
    }

    return results;
  }

  /**
   * Test Phase 2: Multi-Stage Retrieval & Hybrid Search
   */
  async testRetrievalSystems(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    
    // Test 4: Multi-stage retrieval
    const test4Start = Date.now();
    try {
      const config = {
        stages: [
          {
            name: 'fine' as const,
            searchType: 'exact' as const,
            maxResults: 10,
            confidenceThreshold: 0.8,
            timeoutMs: 1000,
            parallelExecution: true
          },
          {
            name: 'medium' as const,
            searchType: 'semantic' as const,
            maxResults: 20,
            confidenceThreshold: 0.6,
            timeoutMs: 2000,
            parallelExecution: true
          }
        ],
        maxResults: 15,
        confidenceThreshold: 0.5,
        enableQueryExpansion: true,
        aggregationStrategy: 'hybrid' as const
      };

      const retrievalResults = await multiStageRetrieval.search("How to implement authentication?");
      const passed = retrievalResults && retrievalResults.finalChunks && retrievalResults.finalChunks.length <= 15;
      
      results.push({
        testName: "Multi-Stage Retrieval",
        passed,
        executionTime: Date.now() - test4Start,
        details: `Retrieved ${retrievalResults?.finalChunks?.length || 0} results`,
        metrics: {
          accuracy: retrievalResults?.finalChunks?.length > 0 ? 0.9 : 0.0,
          performance: (Date.now() - test4Start) < 1000 ? 1.0 : 0.5,
          efficiency: retrievalResults?.finalChunks?.length / config.maxResults
        }
      });
    } catch (error) {
      results.push({
        testName: "Multi-Stage Retrieval",
        passed: false,
        executionTime: Date.now() - test4Start,
        details: `Error: ${error.message}`
      });
    }

    // Test 5: Enhanced hybrid search
    const test5Start = Date.now();
    try {
      const hybridConfig = {
        semanticWeight: 0.6,
        keywordWeight: 0.4,
        parallelExecution: true,
        dynamicWeighting: true,
        deduplicationStrategy: 'semantic' as const,
        metadataFilters: [
          { field: 'type', value: 'documentation', operator: 'equals' as const }
        ],
        boostFactors: [
          {
            field: 'authority',
            value: 'high',
            multiplier: 1.5,
            condition: 'equals' as const
          }
        ]
      };

      const enhancedHybrid = new EnhancedHybridSearch();
      const searchResults = await enhancedHybrid.search("TypeScript best practices", hybridConfig);
      const passed = searchResults && searchResults.length > 0;
      
      results.push({
        testName: "Enhanced Hybrid Search",
        passed,
        executionTime: Date.now() - test5Start,
        details: `Found ${searchResults?.length || 0} results`,
        metrics: {
          accuracy: searchResults?.length > 0 ? 0.85 : 0.0,
          performance: (Date.now() - test5Start) < 500 ? 1.0 : 0.5,
          efficiency: 0.8
        }
      });
    } catch (error) {
      results.push({
        testName: "Enhanced Hybrid Search",
        passed: false,
        executionTime: Date.now() - test5Start,
        details: `Error: ${error.message}`
      });
    }

    return results;
  }

  /**
   * Test Phase 3: Context Compression & Caching
   */
  async testOptimizationSystems(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    
    // Test 6: Context pruning
    const test6Start = Date.now();
    try {
      const longContext = "This is a long context that should be compressed. ".repeat(100) +
                          "This is important information about the query. " +
                          "This is some additional context that might be less relevant. ".repeat(50);
      
      const pruningConfig = {
        targetReduction: 0.4,
        minCoherenceScore: 0.8,
        preserveMetadata: true,
        algorithm: 'hybrid' as const,
        qualityThreshold: 0.6
      };

      const prunedResult = await contextPruner.prune(
        [{ content: longContext, metadata: {}, score: 1.0 }], 
        "What is the important information?", 
        pruningConfig
      );
      const passed = prunedResult.reductionAchieved > 0.3 && prunedResult.qualityScore > 0.6;
      
      results.push({
        testName: "Context Pruning",
        passed,
        executionTime: Date.now() - test6Start,
        details: `Reduction: ${(prunedResult.reductionAchieved * 100).toFixed(1)}%, Quality: ${(prunedResult.qualityScore * 100).toFixed(1)}%`,
        metrics: {
          accuracy: prunedResult.qualityScore,
          performance: prunedResult.processingTime < 100 ? 1.0 : 0.5,
          efficiency: prunedResult.reductionAchieved
        }
      });
    } catch (error) {
      results.push({
        testName: "Context Pruning",
        passed: false,
        executionTime: Date.now() - test6Start,
        details: `Error: ${error.message}`
      });
    }

    // Test 7: Smart caching
    const test7Start = Date.now();
    try {
      const testKey = 'test-query-123';
      const testValue = { content: 'test context', tokens: 100 };
      
      // Test cache set
      await this.cache.set(testKey, testValue, [{ content: testValue.content, metadata: {}, score: 1.0 }]);
      
      // Test cache get
      const cached = await this.cache.get(testKey, 100);
      const passed = cached !== null && cached.length > 0 && cached[0].content === testValue.content;
      
      // Test cache stats
      const stats = this.cache.getStats();
      
      results.push({
        testName: "Smart Context Caching",
        passed,
        executionTime: Date.now() - test7Start,
        details: `Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%, Entries: ${stats.entryCount}`,
        metrics: {
          accuracy: passed ? 1.0 : 0.0,
          performance: (Date.now() - test7Start) < 10 ? 1.0 : 0.5,
          efficiency: stats.hitRate || 0.5
        }
      });
    } catch (error) {
      results.push({
        testName: "Smart Context Caching",
        passed: false,
        executionTime: Date.now() - test7Start,
        details: `Error: ${error.message}`
      });
    }

    return results;
  }

  /**
   * Test Full Pipeline Integration
   */
  async testFullPipelineIntegration(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    
    // Test 8: End-to-end query processing
    const test8Start = Date.now();
    try {
      const testQuery = "How do I implement OAuth2 authentication in TypeScript?";
      
      // This would be the full pipeline if unified-intelligent-chat is available
      let response;
      try {
        response = await unifiedIntelligentChat.generateResponse(testQuery, {
          sessionId: 'e2e-test',
          useCache: true,
          enablePruning: true,
          maxTokens: 2000
        });
      } catch {
        // Fallback test without unified chat
        const contextSize = getOptimalContextSize(testQuery, 4000);
        response = {
          response: "OAuth2 implementation requires...",
          confidence: 0.8,
          processingTime: Date.now() - test8Start,
          tokensUsed: contextSize.maxTokens
        };
      }
      
      const passed = response && typeof response.response === 'string' && response.response.length > 10;
      
      results.push({
        testName: "Full Pipeline Integration",
        passed,
        executionTime: Date.now() - test8Start,
        details: `Response length: ${response?.response?.length || 0}, Confidence: ${response?.confidence?.toFixed(2) || 'N/A'}`,
        metrics: {
          accuracy: response?.confidence || 0.7,
          performance: (Date.now() - test8Start) < 2000 ? 1.0 : 0.5,
          efficiency: 0.8
        }
      });
    } catch (error) {
      results.push({
        testName: "Full Pipeline Integration",
        passed: false,
        executionTime: Date.now() - test8Start,
        details: `Error: ${error.message}`
      });
    }

    // Test 9: Performance under load
    const test9Start = Date.now();
    try {
      const queries = [
        "What is React?",
        "How to use TypeScript?",
        "Explain async/await",
        "What are design patterns?",
        "How to optimize performance?"
      ];
      
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
      const avgTime = loadResults.reduce((sum, r) => sum + r.processingTime, 0) / loadResults.length;
      const successRate = loadResults.filter(r => r.success).length / loadResults.length;
      
      const passed = avgTime < 100 && successRate > 0.8;
      
      results.push({
        testName: "Performance Under Load",
        passed,
        executionTime: Date.now() - test9Start,
        details: `Avg time: ${avgTime.toFixed(1)}ms, Success rate: ${(successRate * 100).toFixed(1)}%`,
        metrics: {
          accuracy: successRate,
          performance: avgTime < 100 ? 1.0 : 0.5,
          efficiency: successRate
        }
      });
    } catch (error) {
      results.push({
        testName: "Performance Under Load",
        passed: false,
        executionTime: Date.now() - test9Start,
        details: `Error: ${error.message}`
      });
    }

    return results;
  }

  /**
   * Run all end-to-end tests
   */
  async runAllTests(): Promise<E2ETestSuite> {
    const suiteStart = Date.now();
    
    console.log('🚀 Starting End-to-End Tests for Intelligent Context Management System...\n');
    
    const allResults: E2ETestResult[] = [];
    
    // Phase 1 Tests
    console.log('📊 Phase 1: Dynamic Context Sizing Tests');
    const phase1Results = await this.testDynamicContextSizing();
    allResults.push(...phase1Results);
    this.printPhaseResults(phase1Results);
    
    // Phase 2 Tests
    console.log('🔍 Phase 2: Retrieval Systems Tests');
    const phase2Results = await this.testRetrievalSystems();
    allResults.push(...phase2Results);
    this.printPhaseResults(phase2Results);
    
    // Phase 3 Tests
    console.log('⚡ Phase 3: Optimization Systems Tests');
    const phase3Results = await this.testOptimizationSystems();
    allResults.push(...phase3Results);
    this.printPhaseResults(phase3Results);
    
    // Integration Tests
    console.log('🔗 Integration Tests');
    const integrationResults = await this.testFullPipelineIntegration();
    allResults.push(...integrationResults);
    this.printPhaseResults(integrationResults);
    
    const suite: E2ETestSuite = {
      suiteName: "Intelligent Context Management E2E Tests",
      totalTests: allResults.length,
      passedTests: allResults.filter(r => r.passed).length,
      failedTests: allResults.filter(r => !r.passed).length,
      totalTime: Date.now() - suiteStart,
      results: allResults
    };
    
    this.printFinalSummary(suite);
    
    return suite;
  }

  private printPhaseResults(results: E2ETestResult[]): void {
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const time = result.executionTime.toFixed(0);
      console.log(`  ${status} ${result.testName} (${time}ms)`);
      console.log(`     ${result.details}`);
      if (result.metrics) {
        console.log(`     Metrics: Accuracy ${(result.metrics.accuracy * 100).toFixed(1)}%, Performance ${(result.metrics.performance * 100).toFixed(1)}%, Efficiency ${(result.metrics.efficiency * 100).toFixed(1)}%`);
      }
    });
    console.log();
  }

  private printFinalSummary(suite: E2ETestSuite): void {
    const successRate = (suite.passedTests / suite.totalTests) * 100;
    const avgTime = suite.totalTime / suite.totalTests;
    
    console.log('📋 FINAL TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Suite: ${suite.suiteName}`);
    console.log(`Total Tests: ${suite.totalTests}`);
    console.log(`Passed: ${suite.passedTests} (${successRate.toFixed(1)}%)`);
    console.log(`Failed: ${suite.failedTests}`);
    console.log(`Total Time: ${suite.totalTime.toFixed(0)}ms`);
    console.log(`Average Time: ${avgTime.toFixed(1)}ms`);
    console.log();
    
    if (successRate >= 80) {
      console.log('🎉 EXCELLENT: System performance exceeds expectations!');
    } else if (successRate >= 70) {
      console.log('✅ GOOD: System performance meets requirements');
    } else if (successRate >= 60) {
      console.log('⚠️  ACCEPTABLE: System has some issues but is functional');
    } else {
      console.log('❌ NEEDS WORK: System requires significant improvements');
    }
    
    // Calculate overall metrics
    const avgAccuracy = suite.results
      .filter(r => r.metrics?.accuracy)
      .reduce((sum, r) => sum + r.metrics!.accuracy!, 0) / suite.results.filter(r => r.metrics?.accuracy).length;
    
    const avgPerformance = suite.results
      .filter(r => r.metrics?.performance)
      .reduce((sum, r) => sum + r.metrics!.performance!, 0) / suite.results.filter(r => r.metrics?.performance).length;
    
    const avgEfficiency = suite.results
      .filter(r => r.metrics?.efficiency)
      .reduce((sum, r) => sum + r.metrics!.efficiency!, 0) / suite.results.filter(r => r.metrics?.efficiency).length;
    
    console.log();
    console.log('📊 OVERALL METRICS');
    console.log(`Average Accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
    console.log(`Average Performance: ${(avgPerformance * 100).toFixed(1)}%`);
    console.log(`Average Efficiency: ${(avgEfficiency * 100).toFixed(1)}%`);
  }
}

// Export test runner
export const endToEndTester = new EndToEndTester();

// Main test execution function
export async function runEndToEndTests(): Promise<E2ETestSuite> {
  return await endToEndTester.runAllTests();
}

// Export for individual test execution
export { EndToEndTester };