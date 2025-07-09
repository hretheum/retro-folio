// Unit tests for dynamic context sizing - isolated from external dependencies

type QueryIntentType = 'SYNTHESIS' | 'EXPLORATION' | 'COMPARISON' | 'FACTUAL' | 'CASUAL';

interface ContextSizeConfig {
  maxTokens: number;
  chunkCount: number;
  diversityBoost: boolean;
  queryExpansion: boolean;
  topKMultiplier: number;
}

// Copy of functions for isolated testing
function analyzeQueryIntent(userQuery: string): QueryIntentType {
  const query = userQuery.toLowerCase();
  
  const polishPatterns = {
    synthesis: /co potrafisz|jakie są.*umiejętności|analiz|syntez|umiejętności|kompetencj|przegląd|podsumuj|oceń|jak wyglądają|przedstaw|scharakteryzuj/,
    exploration: /opowiedz|więcej|szczegół|jak.*proces|dlaczego|historia|metodologia|rozwin|wyjaśnij|opisz|co się działo|jak to|w jaki sposób/,
    comparison: /porównaj|versus|vs|różnic|lepsze|gorsze|wybór|alternatyw|zestawiaj|różnią się|podobne|inne/,
    factual: /ile(?!\s+razy)|kiedy|gdzie|kto|która|które|jakie(?!\s+są)|jaki(?!\s+sposób)|data|rok|liczba|wiek|czas|długo|dużo|mało|konkretnie|dokładnie|precyzyjnie|faktycznie/
  };
  
  const englishPatterns = {
    synthesis: /what.*(can|are|do)|competenc|skill|capabilit|overview|summariz|review|present|characterize|analyz|assess|evaluat/,
    exploration: /tell.*more|detail|how.*(process|work)|why|history|methodology|explain|describe|expand|elaborate|what.*happen/,
    comparison: /versus|vs|differ|better|worse|choice|alternative|compare|contrast|similar|different|between/,
    factual: /how\s+(much|many|long|old)|when|where|who|what(?!\s+are)|which|date|year|number|age|time|specific|exact|precise|fact/
  };
  
  if (polishPatterns.factual.test(query) || englishPatterns.factual.test(query)) {
    return 'FACTUAL';
  }
  
  if (polishPatterns.synthesis.test(query) || englishPatterns.synthesis.test(query)) {
    return 'SYNTHESIS';
  }
  
  if (polishPatterns.exploration.test(query) || englishPatterns.exploration.test(query)) {
    return 'EXPLORATION';
  }
  
  if (polishPatterns.comparison.test(query) || englishPatterns.comparison.test(query)) {
    return 'COMPARISON';
  }
  
  return 'CASUAL';
}

function calculateQueryComplexity(query: string, queryLength: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  const complexityIndicators = {
    multipleQuestions: (query.match(/\?/g) || []).length > 1,
    conjunctions: /\b(and|or|but|oraz|ale|czy|lub|i )\b/gi.test(query),
    specificTerms: /\b(specific|dokładnie|konkretnie|precyzyjnie|exactly|detailed|szczegółowo)\b/gi.test(query),
    comparisonWords: /\b(versus|vs|compared|różnice|podobieństwa|lepsze|gorsze)\b/gi.test(query),
    longQuery: queryLength > 100,
    multipleTopics: query.split(/\b(projekt|project|team|zespół|design|experience|doświadczenie)\b/gi).length > 3
  };
  
  const complexityScore = Object.values(complexityIndicators).filter(Boolean).length;
  
  if (complexityScore >= 3) return 'HIGH';
  if (complexityScore >= 1) return 'MEDIUM';
  return 'LOW';
}

function getOptimalContextSize(userQuery: string, queryLength: number = 0): ContextSizeConfig {
  const queryIntent = analyzeQueryIntent(userQuery);
  const effectiveQueryLength = queryLength || userQuery.length;
  
  const baseConfigs: Record<QueryIntentType, ContextSizeConfig> = {
    FACTUAL: {
      maxTokens: 600,
      chunkCount: 3,
      diversityBoost: false,
      queryExpansion: false,
      topKMultiplier: 1.0
    },
    CASUAL: {
      maxTokens: 400,
      chunkCount: 2,
      diversityBoost: false,
      queryExpansion: false,
      topKMultiplier: 0.8
    },
    EXPLORATION: {
      maxTokens: 1200,
      chunkCount: 6,
      diversityBoost: true,
      queryExpansion: true,
      topKMultiplier: 1.5
    },
    COMPARISON: {
      maxTokens: 1800,
      chunkCount: 8,
      diversityBoost: true,
      queryExpansion: true,
      topKMultiplier: 2.0
    },
    SYNTHESIS: {
      maxTokens: 2000,
      chunkCount: 10,
      diversityBoost: true,
      queryExpansion: true,
      topKMultiplier: 2.5
    }
  };
  
  let config = { ...baseConfigs[queryIntent] };
  
  const queryComplexity = calculateQueryComplexity(userQuery, effectiveQueryLength);
  
  if (queryComplexity === 'HIGH') {
    config.maxTokens = Math.floor(config.maxTokens * 1.5);
    config.chunkCount = Math.floor(config.chunkCount * 1.3);
    config.topKMultiplier *= 1.2;
  } else if (queryComplexity === 'LOW') {
    config.maxTokens = Math.floor(config.maxTokens * 0.7);
    config.chunkCount = Math.floor(config.chunkCount * 0.8);
    config.topKMultiplier *= 0.9;
  }
  
  config.maxTokens = Math.max(config.maxTokens, 300);
  config.chunkCount = Math.max(config.chunkCount, 1);
  config.topKMultiplier = Math.max(config.topKMultiplier, 0.5);
  
  return config;
}

describe('Dynamic Context Sizing Unit Tests', () => {
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
    
    it('should achieve target token ranges for different query types', () => {
      const testCases = [
        { query: 'ile lat doświadczenia masz?', minTokens: 400, maxTokens: 800 },
        { query: 'cześć', minTokens: 300, maxTokens: 500 },
        { query: 'opowiedz o VW', minTokens: 800, maxTokens: 1500 },
        { query: 'porównaj VW vs Polsat', minTokens: 1200, maxTokens: 2200 },
        { query: 'co potrafisz jako projektant?', minTokens: 1400, maxTokens: 2500 }
      ];
      
      testCases.forEach(testCase => {
        const config = getOptimalContextSize(testCase.query);
        expect(config.maxTokens).toBeGreaterThanOrEqual(testCase.minTokens);
        expect(config.maxTokens).toBeLessThanOrEqual(testCase.maxTokens);
      });
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
  
  describe('Configuration Consistency', () => {
    it('should provide consistent context sizes for similar intents', () => {
      const synthesisQueries = [
        'co potrafisz jako projektant?',
        'jakie są twoje umiejętności?',
        'przedstaw swoje kompetencje'
      ];
      
      const configs = synthesisQueries.map(q => getOptimalContextSize(q));
      
      // All should have similar token counts (within 500 tokens of each other)
      const tokenCounts = configs.map(c => c.maxTokens);
      const maxDiff = Math.max(...tokenCounts) - Math.min(...tokenCounts);
      expect(maxDiff).toBeLessThan(500);
      
      // All should have diversity boost enabled
      configs.forEach(config => {
        expect(config.diversityBoost).toBe(true);
        expect(config.queryExpansion).toBe(true);
      });
    });
  });
});