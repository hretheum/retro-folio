import { HierarchicalClassifier } from '../../lib/intent/hierarchical/hierarchical-classifier';
import { CombinedClassifier } from '../../lib/intent/hierarchical/combined-classifier';
import { INTENT_HIERARCHY } from '../../lib/intent/hierarchical/intent-hierarchy';

describe('Phase 2 - Hierarchical Intent Classification', () => {
  let hierarchicalClassifier: HierarchicalClassifier;
  let combinedClassifier: CombinedClassifier;

  beforeEach(() => {
    hierarchicalClassifier = new HierarchicalClassifier();
    combinedClassifier = new CombinedClassifier();
  });

  describe('Intent Hierarchy Structure', () => {
    it('should have correct L1 domain structure', () => {
      const l1Domains = Object.keys(INTENT_HIERARCHY);
      expect(l1Domains).toHaveLength(4);
      expect(l1Domains).toContain('professional');
      expect(l1Domains).toContain('technical');
      expect(l1Domains).toContain('personal');
      expect(l1Domains).toContain('collaboration');
    });

    it('should have correct L2 categories', () => {
      let totalL2 = 0;
      for (const categories of Object.values(INTENT_HIERARCHY)) {
        totalL2 += Object.keys(categories).length;
      }
      expect(totalL2).toBeGreaterThanOrEqual(10);
    });

    it('should have correct L3 intents', () => {
      let totalL3 = 0;
      for (const categories of Object.values(INTENT_HIERARCHY)) {
        for (const intents of Object.values(categories)) {
          totalL3 += intents.length;
        }
      }
      expect(totalL3).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Hierarchical Classifier', () => {
    it('should classify professional queries correctly', () => {
      const testCases = [
        'Tell me about your projects',
        'What is your work experience?',
        'Show me your portfolio',
        'What companies have you worked for?'
      ];

      testCases.forEach(testCase => {
        const result = hierarchicalClassifier.classify(testCase);
        expect(result.l1_domain).toBe('professional');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify technical queries correctly', () => {
      const testCases = [
        'How do I use React hooks?',
        'What is TypeScript?',
        'Explain JavaScript closures',
        'Help me with CSS flexbox'
      ];

      testCases.forEach(testCase => {
        const result = hierarchicalClassifier.classify(testCase);
        expect(result.l1_domain).toBe('technical');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify personal queries correctly', () => {
      const testCases = [
        'What are your hobbies?',
        'Tell me about yourself',
        'What do you like to do?',
        'Where are you from?'
      ];

      testCases.forEach(testCase => {
        const result = hierarchicalClassifier.classify(testCase);
        expect(result.l1_domain).toBe('personal');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify collaboration queries correctly', () => {
      const testCases = [
        'Can you help me with my code?',
        'Let\'s work together',
        'I need assistance',
        'Can you review my project?'
      ];

      testCases.forEach(testCase => {
        const result = hierarchicalClassifier.classify(testCase);
        expect(result.l1_domain).toBe('collaboration');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        '',
        '   ',
        '🚀🎯💻',
        'asdfghjkl',
        'What???',
        'Hello world'
      ];

      edgeCases.forEach(testCase => {
        const result = hierarchicalClassifier.classify(testCase);
        expect(result).toHaveProperty('l1_domain');
        expect(result).toHaveProperty('confidence');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Combined Classifier Integration', () => {
    it('should maintain backward compatibility', () => {
      const testCase = 'Tell me about your projects';
      const result = combinedClassifier.classifyIntent(testCase);
      
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should provide hierarchical information', () => {
      const testCase = 'How do I use React hooks?';
      const result = combinedClassifier.classifyIntent(testCase);
      
      expect(result).toHaveProperty('hierarchical');
      expect(result.hierarchical).toHaveProperty('l1_domain');
      expect(result.hierarchical).toHaveProperty('l2_category');
      expect(result.hierarchical).toHaveProperty('l3_intent');
    });

    it('should handle multiple languages', () => {
      const testCases = [
        'Jakie masz umiejętności?',
        'What are your skills?',
        'Quelles sont vos compétences?',
        'Cuáles son tus habilidades?'
      ];

      testCases.forEach(testCase => {
        const result = combinedClassifier.classifyIntent(testCase);
        expect(result.intent).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should classify intents within acceptable time limits', () => {
      const testCase = 'Tell me about your projects';
      const startTime = Date.now();
      
      hierarchicalClassifier.classify(testCase);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be under 100ms
    });

    it('should handle batch classification efficiently', () => {
      const testCases = Array(100).fill('Tell me about your projects');
      const startTime = Date.now();
      
      testCases.forEach(testCase => {
        hierarchicalClassifier.classify(testCase);
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should be under 5 seconds for 100 classifications
    });
  });

  describe('Accuracy Tests', () => {
    it('should achieve target accuracy on test dataset', () => {
      const testDataset = [
        { input: 'Tell me about your projects', expected: 'professional' },
        { input: 'What is your work experience?', expected: 'professional' },
        { input: 'How do I use React hooks?', expected: 'technical' },
        { input: 'What is TypeScript?', expected: 'technical' },
        { input: 'What are your hobbies?', expected: 'personal' },
        { input: 'Tell me about yourself', expected: 'personal' },
        { input: 'Can you help me with my code?', expected: 'collaboration' },
        { input: 'Let\'s work together', expected: 'collaboration' }
      ];

      let correct = 0;
      
      testDataset.forEach(({ input, expected }) => {
        const result = hierarchicalClassifier.classify(input);
        if (result.l1_domain === expected) {
          correct++;
        }
      });

      const accuracy = correct / testDataset.length;
      expect(accuracy).toBeGreaterThan(0.8); // Target: 80%+ accuracy
    });
  });
});