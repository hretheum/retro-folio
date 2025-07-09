import { analyzeQueryIntent, QueryIntent } from '../chat-intelligence';

describe('Query Intent Analysis', () => {
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