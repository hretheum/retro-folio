import { HierarchicalClassifier } from '../../lib/intent/hierarchical/hierarchical-classifier';
import { IntentHierarchyManager, INTENT_HIERARCHY } from '../../lib/intent/hierarchical/intent-hierarchy';

describe('Phase 2 - Hierarchical Classification', () => {
  let hierarchyManager: IntentHierarchyManager;
  let classifier: HierarchicalClassifier;

  beforeEach(() => {
    hierarchyManager = new IntentHierarchyManager();
    classifier = new HierarchicalClassifier(hierarchyManager);
  });

  describe('Intent Hierarchy Structure', () => {
    test('should have proper hierarchy levels', () => {
      const level1Intents = INTENT_HIERARCHY.filter(intent => intent.level === 1);
      const level2Intents = INTENT_HIERARCHY.filter(intent => intent.level === 2);
      const level3Intents = INTENT_HIERARCHY.filter(intent => intent.level === 3);

      expect(level1Intents.length).toBeGreaterThanOrEqual(4);
      expect(level2Intents.length).toBeGreaterThanOrEqual(8);
      expect(level3Intents.length).toBeGreaterThanOrEqual(12);
    });

    test('should have valid parent-child relationships', () => {
      const level2Intents = INTENT_HIERARCHY.filter(intent => intent.level === 2);
      
      level2Intents.forEach(intent => {
        expect(intent.parent).toBeDefined();
        const parent = hierarchyManager.getIntentById(intent.parent!);
        expect(parent).toBeDefined();
        expect(parent!.level).toBe(1);
      });
    });

    test('should have proper confidence thresholds', () => {
      INTENT_HIERARCHY.forEach(intent => {
        expect(intent.confidence_threshold).toBeGreaterThan(0);
        expect(intent.confidence_threshold).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Hierarchical Classifier', () => {
    test('should classify professional queries correctly', async () => {
      const query = 'jakie masz doświadczenie zawodowe?';
      const result = await classifier.classifyIntent(query);

      expect(result.level1.intent.id).toBe('professional');
      expect(result.level1.confidence).toBeGreaterThan(0.7);
      expect(result.overallConfidence).toBeGreaterThan(0.6);
    });

    test('should classify technical queries correctly', async () => {
      const query = 'jakie znasz języki programowania?';
      const result = await classifier.classifyIntent(query);

      expect(result.level1.intent.id).toBe('technical');
      expect(result.level2?.intent.id).toBe('programming');
      expect(result.overallConfidence).toBeGreaterThan(0.6);
    });

    test('should handle multi-level classification', async () => {
      const query = 'opowiedz o swoich projektach';
      const result = await classifier.classifyIntent(query);

      expect(result.level1).toBeDefined();
      expect(result.level2).toBeDefined();
      expect(result.path.length).toBeGreaterThanOrEqual(2);
    });

    test('should provide alternative intents', async () => {
      const query = 'co potrafisz robić?';
      const result = await classifier.classifyIntent(query);

      expect(result.alternativeIntents.length).toBeGreaterThan(0);
      expect(result.alternativeIntents[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('Classification Performance', () => {
    test('should classify queries within time limits', async () => {
      const query = 'jakie masz umiejętności?';
      const startTime = Date.now();
      
      await classifier.classifyIntent(query);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds
    });

    test('should handle batch classification efficiently', async () => {
      const queries = [
        'jakie masz doświadczenie?',
        'co potrafisz programować?',
        'opowiedz o sobie',
        'chcę z tobą współpracować'
      ];

      const startTime = Date.now();
      const results = await classifier.batchClassify(queries);
      const endTime = Date.now();

      expect(results.length).toBe(queries.length);
      expect(endTime - startTime).toBeLessThan(5000); // < 5 seconds for batch
    });
  });

  describe('Error Handling', () => {
    test('should handle empty queries gracefully', async () => {
      const result = await classifier.classifyIntent('');
      
      expect(result.level1.confidence).toBeLessThan(0.5);
      expect(result.overallConfidence).toBeLessThan(0.5);
    });

    test('should handle very long queries', async () => {
      const longQuery = 'bardzo długie zapytanie '.repeat(100);
      const result = await classifier.classifyIntent(longQuery);

      expect(result).toBeDefined();
      expect(result.level1).toBeDefined();
    });

    test('should handle non-Polish queries', async () => {
      const englishQuery = 'what are your skills?';
      const result = await classifier.classifyIntent(englishQuery);

      expect(result).toBeDefined();
      expect(result.level1).toBeDefined();
    });
  });

  describe('Confidence Scoring', () => {
    test('should provide realistic confidence scores', async () => {
      const query = 'jakie masz doświadczenie zawodowe?';
      const result = await classifier.classifyIntent(query);

      expect(result.level1.confidence).toBeGreaterThan(0.5);
      expect(result.level1.confidence).toBeLessThanOrEqual(1.0);
      expect(result.overallConfidence).toBeGreaterThan(0.4);
      expect(result.overallConfidence).toBeLessThanOrEqual(1.0);
    });

    test('should handle low confidence scenarios', async () => {
      const ambiguousQuery = 'hmm...';
      const result = await classifier.classifyIntent(ambiguousQuery);

      expect(result.level1.confidence).toBeLessThan(0.7);
      expect(result.alternativeIntents.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Intent Hierarchy', () => {
    test('should respect hierarchy constraints', async () => {
      const query = 'jakie masz certyfikaty?';
      const result = await classifier.classifyIntent(query);

      if (result.level2) {
        const parent = hierarchyManager.getParentOf(result.level2.intent.id);
        expect(parent?.id).toBe(result.level1.intent.id);
      }
    });

    test('should provide complete classification path', async () => {
      const query = 'opowiedz o swoich obecnych projektach';
      const result = await classifier.classifyIntent(query);

      expect(result.path.length).toBeGreaterThanOrEqual(1);
      expect(result.path[0]).toBe(result.level1.intent.id);
      
      if (result.level2) {
        expect(result.path[1]).toBe(result.level2.intent.id);
      }
    });
  });

  describe('Validation and Consistency', () => {
    test('should validate classifier state', async () => {
      const validation = await classifier.validateClassifier();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should provide classification statistics', () => {
      const stats = classifier.getClassificationStats();
      
      expect(stats.totalIntents).toBeGreaterThan(0);
      expect(stats.level1Intents).toBeGreaterThan(0);
      expect(stats.level2Intents).toBeGreaterThan(0);
      expect(stats.averageConfidenceThreshold).toBeGreaterThan(0);
    });
  });
});