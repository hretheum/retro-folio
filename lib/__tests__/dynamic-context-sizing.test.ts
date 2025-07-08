import { getOptimalContextSize, analyzeQueryIntent, ContextSizeConfig } from '../chat-intelligence';

describe('Dynamic Context Sizing Integration Tests', () => {
  describe('Context Size by Query Intent', () => {
    it('should configure small context for FACTUAL queries', () => {
      const query = 'ile lat doświadczenia masz?';
      const config = getOptimalContextSize(query);
      
      expect(config.maxTokens).toBeGreaterThanOrEqual(400);
      expect(config.maxTokens).toBeLessThanOrEqual(800);
      expect(config.chunkCount).toBeGreaterThanOrEqual(2);
      expect(config.chunkCount).toBeLessThanOrEqual(4);
      expect(config.diversityBoost).toBe(false);
      expect(config.queryExpansion).toBe(false);
    });
    
    it('should configure minimal context for CASUAL queries', () => {
      const query = 'cześć';
      const config = getOptimalContextSize(query);
      
      expect(config.maxTokens).toBeGreaterThanOrEqual(300);
      expect(config.maxTokens).toBeLessThanOrEqual(500);
      expect(config.chunkCount).toBeGreaterThanOrEqual(1);
      expect(config.chunkCount).toBeLessThanOrEqual(3);
      expect(config.diversityBoost).toBe(false);
    });
    
    it('should configure medium context for EXPLORATION queries', () => {
      const query = 'opowiedz więcej o projekcie Volkswagen Digital';
      const config = getOptimalContextSize(query);
      
      expect(config.maxTokens).toBeGreaterThanOrEqual(800);
      expect(config.maxTokens).toBeLessThanOrEqual(1500);
      expect(config.chunkCount).toBeGreaterThanOrEqual(4);
      expect(config.chunkCount).toBeLessThanOrEqual(8);
      expect(config.diversityBoost).toBe(true);
      expect(config.queryExpansion).toBe(true);
    });
    
    it('should configure large context for COMPARISON queries', () => {
      const query = 'porównaj swoje doświadczenie w VW vs Polsat';
      const config = getOptimalContextSize(query);
      
      expect(config.maxTokens).toBeGreaterThanOrEqual(1200);
      expect(config.maxTokens).toBeLessThanOrEqual(2200);
      expect(config.chunkCount).toBeGreaterThanOrEqual(6);
      expect(config.chunkCount).toBeLessThanOrEqual(10);
      expect(config.diversityBoost).toBe(true);
      expect(config.queryExpansion).toBe(true);
    });
    
    it('should configure maximum context for SYNTHESIS queries', () => {
      const query = 'co potrafisz jako projektant?';
      const config = getOptimalContextSize(query);
      
      expect(config.maxTokens).toBeGreaterThanOrEqual(1400);
      expect(config.maxTokens).toBeLessThanOrEqual(2500);
      expect(config.chunkCount).toBeGreaterThanOrEqual(7);
      expect(config.chunkCount).toBeLessThanOrEqual(12);
      expect(config.diversityBoost).toBe(true);
      expect(config.queryExpansion).toBe(true);
    });
  });
  
  describe('Query Complexity Adaptation', () => {
    it('should increase context for high complexity queries', () => {
      const simpleQuery = 'kiedy?';
      const complexQuery = 'kiedy byłeś w Volkswagen Digital i jak wyglądał proces skalowania zespołu oraz jakie były największe wyzwania?';
      
      const simpleConfig = getOptimalContextSize(simpleQuery);
      const complexConfig = getOptimalContextSize(complexQuery);
      
      expect(complexConfig.maxTokens).toBeGreaterThan(simpleConfig.maxTokens);
      expect(complexConfig.chunkCount).toBeGreaterThanOrEqual(simpleConfig.chunkCount);
      expect(complexConfig.topKMultiplier).toBeGreaterThan(simpleConfig.topKMultiplier);
    });
    
    it('should reduce context for simple queries', () => {
      const baseQuery = 'co potrafisz?';
      const simpleQuery = 'tak';
      
      const baseConfig = getOptimalContextSize(baseQuery);
      const simpleConfig = getOptimalContextSize(simpleQuery);
      
      expect(simpleConfig.maxTokens).toBeLessThanOrEqual(baseConfig.maxTokens);
      expect(simpleConfig.chunkCount).toBeLessThanOrEqual(baseConfig.chunkCount);
    });
    
    it('should maintain minimums even for very simple queries', () => {
      const query = '';
      const config = getOptimalContextSize(query);
      
      expect(config.maxTokens).toBeGreaterThanOrEqual(300);
      expect(config.chunkCount).toBeGreaterThanOrEqual(1);
      expect(config.topKMultiplier).toBeGreaterThanOrEqual(0.5);
    });
  });
  
  describe('Real-world Query Scenarios', () => {
    const testScenarios = [
      {
        description: 'Job interview synthesis question',
        query: 'co potrafisz jako projektant i jakie są twoje główne kompetencje?',
        expectedIntent: 'SYNTHESIS',
        expectedMinTokens: 1500,
        expectedMaxTokens: 2500
      },
      {
        description: 'Specific factual question',
        query: 'ile lat doświadczenia masz w design systemach?',
        expectedIntent: 'FACTUAL',
        expectedMinTokens: 400,
        expectedMaxTokens: 800
      },
      {
        description: 'Project exploration request',
        query: 'opowiedz mi więcej o tym jak skalowałeś zespół w Volkswagen Digital',
        expectedIntent: 'EXPLORATION',
        expectedMinTokens: 800,
        expectedMaxTokens: 1500
      },
      {
        description: 'Company comparison',
        query: 'jakie są różnice między pracą w VW a Polsat pod względem metodologii?',
        expectedIntent: 'COMPARISON',
        expectedMinTokens: 1200,
        expectedMaxTokens: 2200
      },
      {
        description: 'Casual greeting',
        query: 'cześć, jak się masz?',
        expectedIntent: 'CASUAL',
        expectedMinTokens: 300,
        expectedMaxTokens: 500
      }
    ];
    
    testScenarios.forEach(scenario => {
      it(`should handle ${scenario.description}`, () => {
        const intent = analyzeQueryIntent(scenario.query);
        const config = getOptimalContextSize(scenario.query);
        
        expect(intent).toBe(scenario.expectedIntent);
        expect(config.maxTokens).toBeGreaterThanOrEqual(scenario.expectedMinTokens);
        expect(config.maxTokens).toBeLessThanOrEqual(scenario.expectedMaxTokens);
      });
    });
  });
  
  describe('Configuration Consistency', () => {
    it('should have consistent configurations across similar queries', () => {
      const queries = [
        'co potrafisz jako projektant?',
        'jakie są twoje umiejętności?',
        'przedstaw swoje kompetencje'
      ];
      
      const configs = queries.map(q => getOptimalContextSize(q));
      
      // All should be SYNTHESIS with similar configurations
      configs.forEach(config => {
        expect(config.maxTokens).toBeGreaterThan(1000);
        expect(config.diversityBoost).toBe(true);
        expect(config.queryExpansion).toBe(true);
      });
      
      // Token counts should be within reasonable range of each other
      const tokenCounts = configs.map(c => c.maxTokens);
      const maxDifference = Math.max(...tokenCounts) - Math.min(...tokenCounts);
      expect(maxDifference).toBeLessThan(1000); // Should not vary too much
    });
  });
  
  describe('Token Reduction Validation', () => {
    it('should demonstrate token reduction for simple vs complex queries', () => {
      const simpleQueries = [
        'tak',
        'cześć',
        'kiedy?',
        'gdzie?'
      ];
      
      const complexQueries = [
        'co potrafisz jako projektant i jakie są twoje największe osiągnięcia?',
        'porównaj swoje doświadczenie w różnych firmach i oceń co było najważniejsze',
        'opowiedz szczegółowo o procesie skalowania zespołu w Volkswagen Digital'
      ];
      
      const simpleAvgTokens = simpleQueries
        .map(q => getOptimalContextSize(q).maxTokens)
        .reduce((a, b) => a + b, 0) / simpleQueries.length;
        
      const complexAvgTokens = complexQueries
        .map(q => getOptimalContextSize(q).maxTokens)
        .reduce((a, b) => a + b, 0) / complexQueries.length;
      
      // Simple queries should use significantly fewer tokens
      const reductionRate = (complexAvgTokens - simpleAvgTokens) / complexAvgTokens;
      expect(reductionRate).toBeGreaterThan(0.3); // At least 30% reduction
    });
  });
  
  describe('Performance Validation', () => {
    it('should process context sizing quickly', () => {
      const testQueries = [
        'co potrafisz?',
        'opowiedz o swoim doświadczeniu',
        'ile lat pracujesz?',
        'porównaj VW vs Polsat',
        'cześć'
      ];
      
      const start = performance.now();
      testQueries.forEach(query => {
        getOptimalContextSize(query);
      });
      const end = performance.now();
      
      const avgTime = (end - start) / testQueries.length;
      expect(avgTime).toBeLessThan(10); // Should be under 10ms per query
    });
  });
});