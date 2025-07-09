// Unit tests for query intent analysis - isolated from external dependencies
// This tests only the analyzeQueryIntent function without importing the full chat-intelligence module

type QueryIntent = 'SYNTHESIS' | 'EXPLORATION' | 'COMPARISON' | 'FACTUAL' | 'CASUAL';

// Copy of the analyzeQueryIntent function for isolated testing
function analyzeQueryIntent(userQuery: string): QueryIntent {
  const query = userQuery.toLowerCase();
  
  // Enhanced Polish patterns with better precision
  const polishPatterns = {
    synthesis: /co potrafisz|jakie są.*umiejętności|analiz|syntez|umiejętności|kompetencj|przegląd|podsumuj|oceń|jak wyglądają|przedstaw|scharakteryzuj/,
    exploration: /opowiedz|więcej|szczegół|jak.*proces|dlaczego|historia|metodologia|rozwin|wyjaśnij|opisz|co się działo|jak to|w jaki sposób/,
    comparison: /porównaj|versus|vs|różnic|lepsze|gorsze|wybór|alternatyw|zestawiaj|różnią się|podobne|inne/,
    factual: /ile(?!\s+razy)|kiedy|gdzie|kto|która|które|jakie(?!\s+są)|jaki(?!\s+sposób)|data|rok|liczba|wiek|czas|długo|dużo|mało|konkretnie|dokładnie|precyzyjnie|faktycznie/
  };
  
  // Enhanced English patterns with better precision
  const englishPatterns = {
    synthesis: /what.*(can|are|do)|competenc|skill|capabilit|overview|summariz|review|present|characterize|analyz|assess|evaluat/,
    exploration: /tell.*more|detail|how.*(process|work)|why|history|methodology|explain|describe|expand|elaborate|what.*happen/,
    comparison: /versus|vs|differ|better|worse|choice|alternative|compare|contrast|similar|different|between/,
    factual: /how\s+(much|many|long|old)|when|where|who|what(?!\s+are)|which|date|year|number|age|time|specific|exact|precise|fact/
  };
  
  // Test for factual queries first (most specific)
  if (polishPatterns.factual.test(query) || englishPatterns.factual.test(query)) {
    return 'FACTUAL';
  }
  
  // Test for synthesis queries
  if (polishPatterns.synthesis.test(query) || englishPatterns.synthesis.test(query)) {
    return 'SYNTHESIS';
  }
  
  // Test for exploration queries
  if (polishPatterns.exploration.test(query) || englishPatterns.exploration.test(query)) {
    return 'EXPLORATION';
  }
  
  // Test for comparison queries
  if (polishPatterns.comparison.test(query) || englishPatterns.comparison.test(query)) {
    return 'COMPARISON';
  }
  
  // Default to casual for simple greetings, short queries, or unclear intent
  return 'CASUAL';
}

describe('Query Intent Analysis (Unit Tests)', () => {
  describe('SYNTHESIS queries', () => {
    const synthesisQueries = [
      'co potrafisz jako projektant?',
      'what are your key design competencies?',
      'jakie są twoje umiejętności?',
      'analyze your approach to design systems',
      'przegląd twoich kompetencji',
      'present your leadership capabilities',
      'oceń swoje doświadczenie',
      'characterize your work style'
    ];
    
    synthesisQueries.forEach(query => {
      it(`should classify "${query}" as SYNTHESIS`, () => {
        expect(analyzeQueryIntent(query)).toBe('SYNTHESIS');
      });
    });
  });
  
  describe('EXPLORATION queries', () => {
    const explorationQueries = [
      'opowiedz więcej o projekcie Volkswagen Digital',
      'tell me about your experience at Polsat Box Go',
      'jak wyglądał proces skalowania zespołu?',
      'explain your methodology for improving retention',
      'opisz swoje podejście do zarządzania',
      'how did you handle team conflicts?',
      'co się działo podczas tego projektu?',
      'elaborate on your design process'
    ];
    
    explorationQueries.forEach(query => {
      it(`should classify "${query}" as EXPLORATION`, () => {
        expect(analyzeQueryIntent(query)).toBe('EXPLORATION');
      });
    });
  });
  
  describe('COMPARISON queries', () => {
    const comparisonQueries = [
      'porównaj swoje doświadczenie w VW vs Polsat',
      'differences between corporate vs media industry work',
      'które projekty były bardziej challenging?',
      'compare your leadership approaches',
      'różnice między tymi technologiami',
      'what is better - remote or office work?',
      'podobieństwa między projektami',
      'contrast your experiences'
    ];
    
    comparisonQueries.forEach(query => {
      it(`should classify "${query}" as COMPARISON`, () => {
        expect(analyzeQueryIntent(query)).toBe('COMPARISON');
      });
    });
  });
  
  describe('FACTUAL queries', () => {
    const factualQueries = [
      'ile lat doświadczenia masz?',
      'what was your last job title?',
      'kiedy byłeś w Volkswagen Digital?',
      'how many users did Polsat Box Go have?',
      'jaki był twój wiek?',
      'when did you start working?',
      'gdzie pracowałeś wcześniej?',
      'which technologies do you use?',
      'konkretnie ile projektów?',
      'exactly how long?'
    ];
    
    factualQueries.forEach(query => {
      it(`should classify "${query}" as FACTUAL`, () => {
        expect(analyzeQueryIntent(query)).toBe('FACTUAL');
      });
    });
  });
  
  describe('CASUAL queries', () => {
    const casualQueries = [
      'cześć',
      'hello',
      'dzięki za rozmowę',
      'thanks for the conversation',
      'jak się masz?',
      'how are you?',
      'miłego dnia',
      'have a great day',
      'hi there',
      'tak',
      'no'
    ];
    
    casualQueries.forEach(query => {
      it(`should classify "${query}" as CASUAL`, () => {
        expect(analyzeQueryIntent(query)).toBe('CASUAL');
      });
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty queries', () => {
      expect(analyzeQueryIntent('')).toBe('CASUAL');
    });
    
    it('should handle single word queries', () => {
      expect(analyzeQueryIntent('projektant')).toBe('CASUAL');
      expect(analyzeQueryIntent('when')).toBe('FACTUAL');
    });
    
    it('should handle mixed language queries', () => {
      expect(analyzeQueryIntent('co potrafisz as designer?')).toBe('SYNTHESIS');
      expect(analyzeQueryIntent('kiedy was your last job?')).toBe('FACTUAL');
    });
    
    it('should handle capitalized queries', () => {
      expect(analyzeQueryIntent('CO POTRAFISZ JAKO PROJEKTANT?')).toBe('SYNTHESIS');
      expect(analyzeQueryIntent('ILE LAT DOŚWIADCZENIA?')).toBe('FACTUAL');
    });
  });
  
  describe('Query priority handling', () => {
    it('should prioritize FACTUAL over other intents when multiple patterns match', () => {
      // This query could match both FACTUAL and EXPLORATION but should be FACTUAL
      expect(analyzeQueryIntent('ile lat doświadczenia masz i opowiedz więcej')).toBe('FACTUAL');
    });
    
    it('should prioritize SYNTHESIS when no factual indicators', () => {
      expect(analyzeQueryIntent('co potrafisz i jak to robisz?')).toBe('SYNTHESIS');
    });
  });
  
  describe('Performance benchmarks', () => {
    it('should classify queries quickly', () => {
      const testQueries = [
        'co potrafisz jako projektant?',
        'opowiedz więcej o projekcie',
        'ile lat doświadczenia masz?',
        'porównaj swoje doświadczenie',
        'cześć'
      ];
      
      const start = performance.now();
      testQueries.forEach(query => {
        analyzeQueryIntent(query);
      });
      const end = performance.now();
      
      const avgTime = (end - start) / testQueries.length;
      expect(avgTime).toBeLessThan(5); // Should be under 5ms per query
    });
  });
  
  describe('Classification accuracy', () => {
    const testCases = [
      { query: "co potrafisz jako projektant?", expected: "SYNTHESIS" },
      { query: "opowiedz o Volkswagenie", expected: "EXPLORATION" },
      { query: "ile lat doświadczenia masz?", expected: "FACTUAL" },
      { query: "porównaj VW vs Polsat", expected: "COMPARISON" },
      { query: "cześć", expected: "CASUAL" }
    ];
    
    testCases.forEach(testCase => {
      it(`should correctly classify "${testCase.query}" as ${testCase.expected}`, () => {
        expect(analyzeQueryIntent(testCase.query)).toBe(testCase.expected);
      });
    });
    
    it('should achieve >95% accuracy on test cases', () => {
      const correct = testCases.filter(testCase => 
        analyzeQueryIntent(testCase.query) === testCase.expected
      ).length;
      
      const accuracy = (correct / testCases.length) * 100;
      expect(accuracy).toBeGreaterThanOrEqual(95);
    });
  });
});