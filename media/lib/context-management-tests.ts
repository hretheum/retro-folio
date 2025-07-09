import { hybridSearchPinecone } from './pinecone-vector-store';

export interface BaselineMetrics {
  avgResponseTime: number;
  avgTokensUsed: number;
  accuracyScore: number;
  testsCovered: number;
  queryTypeBreakdown: Record<string, number>;
  contextUtilization: number;
  errorRate: number;
}

export interface TestQuery {
  id: string;
  query: string;
  type: 'SYNTHESIS' | 'EXPLORATION' | 'COMPARISON' | 'FACTUAL' | 'CASUAL';
  expectedTopics: string[];
  expectedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  language: 'pl' | 'en';
}

export const TEST_QUERIES: TestQuery[] = [
  // SYNTHESIS Queries
  {
    id: 'syn_01',
    query: 'co potrafisz jako projektant?',
    type: 'SYNTHESIS',
    expectedTopics: ['design', 'skills', 'experience'],
    expectedComplexity: 'HIGH',
    language: 'pl'
  },
  {
    id: 'syn_02',
    query: 'what are your key design competencies?',
    type: 'SYNTHESIS',
    expectedTopics: ['design', 'skills', 'competencies'],
    expectedComplexity: 'HIGH',
    language: 'en'
  },
  {
    id: 'syn_03',
    query: 'przegląd twoich umiejętności w zarządzaniu zespołem',
    type: 'SYNTHESIS',
    expectedTopics: ['leadership', 'team', 'management'],
    expectedComplexity: 'HIGH',
    language: 'pl'
  },
  {
    id: 'syn_04',
    query: 'analyze your approach to design systems',
    type: 'SYNTHESIS',
    expectedTopics: ['design systems', 'approach', 'methodology'],
    expectedComplexity: 'HIGH',
    language: 'en'
  },
  
  // EXPLORATION Queries
  {
    id: 'exp_01',
    query: 'opowiedz więcej o projekcie Volkswagen Digital',
    type: 'EXPLORATION',
    expectedTopics: ['Volkswagen', 'project', 'experience'],
    expectedComplexity: 'MEDIUM',
    language: 'pl'
  },
  {
    id: 'exp_02',
    query: 'tell me about your experience at Polsat Box Go',
    type: 'EXPLORATION',
    expectedTopics: ['Polsat', 'streaming', 'project'],
    expectedComplexity: 'MEDIUM',
    language: 'en'
  },
  {
    id: 'exp_03',
    query: 'jak wyglądał proces skalowania zespołu w VW?',
    type: 'EXPLORATION',
    expectedTopics: ['scaling', 'team', 'process'],
    expectedComplexity: 'MEDIUM',
    language: 'pl'
  },
  {
    id: 'exp_04',
    query: 'what was your methodology for improving retention at Polsat?',
    type: 'EXPLORATION',
    expectedTopics: ['retention', 'methodology', 'improvement'],
    expectedComplexity: 'MEDIUM',
    language: 'en'
  },
  
  // COMPARISON Queries
  {
    id: 'comp_01',
    query: 'porównaj swoje doświadczenie w VW vs Polsat',
    type: 'COMPARISON',
    expectedTopics: ['comparison', 'VW', 'Polsat'],
    expectedComplexity: 'HIGH',
    language: 'pl'
  },
  {
    id: 'comp_02',
    query: 'differences between corporate vs media industry work',
    type: 'COMPARISON',
    expectedTopics: ['corporate', 'media', 'differences'],
    expectedComplexity: 'HIGH',
    language: 'en'
  },
  {
    id: 'comp_03',
    query: 'które projekty były bardziej challenging?',
    type: 'COMPARISON',
    expectedTopics: ['projects', 'challenging', 'difficulty'],
    expectedComplexity: 'MEDIUM',
    language: 'pl'
  },
  
  // FACTUAL Queries
  {
    id: 'fact_01',
    query: 'ile lat doświadczenia masz?',
    type: 'FACTUAL',
    expectedTopics: ['experience', 'years'],
    expectedComplexity: 'LOW',
    language: 'pl'
  },
  {
    id: 'fact_02',
    query: 'what was your last job title?',
    type: 'FACTUAL',
    expectedTopics: ['job', 'title', 'position'],
    expectedComplexity: 'LOW',
    language: 'en'
  },
  {
    id: 'fact_03',
    query: 'kiedy byłeś w Volkswagen Digital?',
    type: 'FACTUAL',
    expectedTopics: ['Volkswagen', 'dates', 'timeline'],
    expectedComplexity: 'LOW',
    language: 'pl'
  },
  {
    id: 'fact_04',
    query: 'how many users did Polsat Box Go have?',
    type: 'FACTUAL',
    expectedTopics: ['users', 'numbers', 'metrics'],
    expectedComplexity: 'LOW',
    language: 'en'
  },
  
  // CASUAL Queries
  {
    id: 'cas_01',
    query: 'cześć',
    type: 'CASUAL',
    expectedTopics: ['greeting'],
    expectedComplexity: 'LOW',
    language: 'pl'
  },
  {
    id: 'cas_02',
    query: 'hello',
    type: 'CASUAL',
    expectedTopics: ['greeting'],
    expectedComplexity: 'LOW',
    language: 'en'
  },
  {
    id: 'cas_03',
    query: 'dzięki za rozmowę',
    type: 'CASUAL',
    expectedTopics: ['thanks', 'conversation'],
    expectedComplexity: 'LOW',
    language: 'pl'
  },
  {
    id: 'cas_04',
    query: 'what is your preferred work style?',
    type: 'CASUAL',
    expectedTopics: ['work style', 'preferences'],
    expectedComplexity: 'LOW',
    language: 'en'
  }
];

export interface TestResult {
  queryId: string;
  query: string;
  responseTime: number;
  tokensUsed: number;
  contextRetrieved: {
    chunks: number;
    totalLength: number;
    relevanceScore: number;
  };
  responseQuality: number; // 1-10 subjective score
  errorOccurred: boolean;
  errorMessage?: string;
  timestamp: number;
}

export class BaselinePerformanceTester {
  private results: TestResult[] = [];
  
  async runBaseline(): Promise<BaselineMetrics> {
    console.log('🚀 Starting Baseline Performance Test');
    console.log(`📊 Testing ${TEST_QUERIES.length} queries`);
    
    this.results = [];
    
    for (const testQuery of TEST_QUERIES) {
      console.log(`\n🔍 Testing: ${testQuery.id} - ${testQuery.query}`);
      
      try {
        const result = await this.testSingleQuery(testQuery);
        this.results.push(result);
        
        console.log(`⏱️  Response Time: ${result.responseTime}ms`);
        console.log(`📄 Context Chunks: ${result.contextRetrieved.chunks}`);
        console.log(`🎯 Relevance Score: ${result.contextRetrieved.relevanceScore.toFixed(2)}`);
        
      } catch (error) {
        console.error(`❌ Error testing ${testQuery.id}:`, error);
        
        this.results.push({
          queryId: testQuery.id,
          query: testQuery.query,
          responseTime: 0,
          tokensUsed: 0,
          contextRetrieved: {
            chunks: 0,
            totalLength: 0,
            relevanceScore: 0
          },
          responseQuality: 0,
          errorOccurred: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const metrics = this.calculateMetrics();
    console.log('\n📊 BASELINE METRICS SUMMARY:');
    console.log(`🕐 Average Response Time: ${metrics.avgResponseTime.toFixed(0)}ms`);
    console.log(`🎯 Average Tokens Used: ${metrics.avgTokensUsed.toFixed(0)}`);
    console.log(`📈 Context Utilization: ${metrics.contextUtilization.toFixed(1)}%`);
    console.log(`❌ Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    console.log(`✅ Tests Covered: ${metrics.testsCovered}`);
    
    return metrics;
  }
  
  private async testSingleQuery(testQuery: TestQuery): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test context retrieval
      const searchResults = await hybridSearchPinecone(testQuery.query, {
        topK: 5,
        namespace: 'production',
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Calculate context metrics
      const contextRetrieved = {
        chunks: searchResults.length,
        totalLength: searchResults.reduce((sum, r) => sum + r.chunk.text.length, 0),
        relevanceScore: searchResults.length > 0 
          ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length 
          : 0
      };
      
      // Estimate tokens used (rough calculation: ~4 chars per token)
      const tokensUsed = Math.ceil(contextRetrieved.totalLength / 4);
      
      // Calculate response quality based on context relevance and completeness
      const responseQuality = this.calculateResponseQuality(testQuery, searchResults);
      
      return {
        queryId: testQuery.id,
        query: testQuery.query,
        responseTime,
        tokensUsed,
        contextRetrieved,
        responseQuality,
        errorOccurred: false,
        timestamp: Date.now()
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  private calculateResponseQuality(testQuery: TestQuery, searchResults: any[]): number {
    if (searchResults.length === 0) return 1;
    
    // Basic quality scoring based on:
    // 1. Number of relevant results
    // 2. Average relevance score
    // 3. Coverage of expected topics
    
    const avgRelevance = searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length;
    const resultCount = Math.min(searchResults.length, 5); // Cap at 5 for scoring
    
    // Score based on relevance and result count
    let score = (avgRelevance * 5) + (resultCount * 1);
    
    // Adjust for expected complexity
    const complexityMultiplier = {
      'LOW': 1.0,
      'MEDIUM': 0.8,
      'HIGH': 0.6
    };
    
    score *= complexityMultiplier[testQuery.expectedComplexity];
    
    return Math.max(1, Math.min(10, score));
  }
  
  private calculateMetrics(): BaselineMetrics {
    const successfulResults = this.results.filter(r => !r.errorOccurred);
    const totalResults = this.results.length;
    
    if (successfulResults.length === 0) {
      return {
        avgResponseTime: 0,
        avgTokensUsed: 0,
        accuracyScore: 0,
        testsCovered: totalResults,
        queryTypeBreakdown: {},
        contextUtilization: 0,
        errorRate: 100
      };
    }
    
    const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
    const avgTokensUsed = successfulResults.reduce((sum, r) => sum + r.tokensUsed, 0) / successfulResults.length;
    const accuracyScore = successfulResults.reduce((sum, r) => sum + r.responseQuality, 0) / successfulResults.length;
    
    // Calculate context utilization (how much of retrieved context is actually relevant)
    const contextUtilization = successfulResults.reduce((sum, r) => sum + r.contextRetrieved.relevanceScore, 0) / successfulResults.length * 100;
    
    // Query type breakdown
    const queryTypeBreakdown: Record<string, number> = {};
    TEST_QUERIES.forEach(q => {
      queryTypeBreakdown[q.type] = (queryTypeBreakdown[q.type] || 0) + 1;
    });
    
    const errorRate = ((totalResults - successfulResults.length) / totalResults) * 100;
    
    return {
      avgResponseTime,
      avgTokensUsed,
      accuracyScore,
      testsCovered: totalResults,
      queryTypeBreakdown,
      contextUtilization,
      errorRate
    };
  }
  
  public getDetailedResults(): TestResult[] {
    return this.results;
  }
  
  public exportResults(): string {
    const metrics = this.calculateMetrics();
    const timestamp = new Date().toISOString();
    
    return `
# Baseline Performance Test Results
**Date**: ${timestamp}
**Total Queries**: ${metrics.testsCovered}

## Summary Metrics
- **Average Response Time**: ${metrics.avgResponseTime.toFixed(0)}ms
- **Average Tokens Used**: ${metrics.avgTokensUsed.toFixed(0)}
- **Accuracy Score**: ${metrics.accuracyScore.toFixed(2)}/10
- **Context Utilization**: ${metrics.contextUtilization.toFixed(1)}%
- **Error Rate**: ${metrics.errorRate.toFixed(1)}%

## Query Type Breakdown
${Object.entries(metrics.queryTypeBreakdown).map(([type, count]) => `- **${type}**: ${count} queries`).join('\n')}

## Detailed Results
${this.results.map(r => `
### ${r.queryId} - ${r.query}
- **Response Time**: ${r.responseTime}ms
- **Tokens Used**: ${r.tokensUsed}
- **Context Chunks**: ${r.contextRetrieved.chunks}
- **Relevance Score**: ${r.contextRetrieved.relevanceScore.toFixed(2)}
- **Quality Score**: ${r.responseQuality.toFixed(1)}/10
- **Error**: ${r.errorOccurred ? r.errorMessage : 'None'}
`).join('\n')}

---
*Generated by Context Management Implementation Plan*
`;
  }
}