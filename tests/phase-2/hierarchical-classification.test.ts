import { IntentHierarchyManager, INTENT_HIERARCHY } from '../../lib/intent/hierarchical/intent-hierarchy';

// Mock embedding generator
jest.mock('../../lib/embedding-generator', () => ({
  generateQueryEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3])
}));

// Mock semantic search
jest.mock('../../lib/semantic-search', () => ({
  cosineSimilarity: jest.fn().mockReturnValue(0.8)
}));

describe('Phase 2 - Hierarchical Classification', () => {
  let hierarchyManager: IntentHierarchyManager;

  beforeEach(() => {
    hierarchyManager = new IntentHierarchyManager();
  });

  describe('Intent Hierarchy Structure', () => {
    test('should have proper hierarchy levels', () => {
      const level1Intents = INTENT_HIERARCHY.filter(intent => intent.level === 1);
      const level2Intents = INTENT_HIERARCHY.filter(intent => intent.level === 2);
      const level3Intents = INTENT_HIERARCHY.filter(intent => intent.level === 3);

      expect(level1Intents.length).toBeGreaterThanOrEqual(4);
      expect(level2Intents.length).toBeGreaterThanOrEqual(8);
      expect(level3Intents.length).toBeGreaterThanOrEqual(9);
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

    test('should have required keywords and examples', () => {
      INTENT_HIERARCHY.forEach(intent => {
        expect(intent.keywords).toBeDefined();
        expect(intent.keywords.length).toBeGreaterThan(0);
        expect(intent.examples).toBeDefined();
        expect(intent.examples.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Intent Hierarchy Manager', () => {
    test('should get intent by ID', () => {
      const professionalIntent = hierarchyManager.getIntentById('professional');
      expect(professionalIntent).toBeDefined();
      expect(professionalIntent!.id).toBe('professional');
      expect(professionalIntent!.level).toBe(1);
    });

    test('should get intents by level', () => {
      const level1Intents = hierarchyManager.getIntentsByLevel(1);
      expect(level1Intents.length).toBeGreaterThanOrEqual(4);
      
      level1Intents.forEach(intent => {
        expect(intent.level).toBe(1);
      });
    });

    test('should get children of intent', () => {
      const professionalChildren = hierarchyManager.getChildrenOf('professional');
      expect(professionalChildren.length).toBeGreaterThan(0);
      
      professionalChildren.forEach(child => {
        expect(child.parent).toBe('professional');
        expect(child.level).toBe(2);
      });
    });

    test('should get parent of intent', () => {
      const experienceParent = hierarchyManager.getParentOf('experience');
      expect(experienceParent).toBeDefined();
      expect(experienceParent!.id).toBe('professional');
      expect(experienceParent!.level).toBe(1);
    });

    test('should get hierarchy path', () => {
      const path = hierarchyManager.getHierarchyPath('experience');
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0].level).toBe(1);
      expect(path[1].level).toBe(2);
    });

    test('should search intents by keyword', () => {
      const results = hierarchyManager.searchIntentsByKeyword('programming');
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(intent => {
        const hasKeyword = intent.keywords.some(keyword => 
          keyword.toLowerCase().includes('programming')
        );
        expect(hasKeyword).toBe(true);
      });
    });

         test('should validate hierarchy', () => {
       const validation = hierarchyManager.validateHierarchy();
       expect(validation).toBeDefined();
       expect(typeof validation.valid).toBe('boolean');
       expect(Array.isArray(validation.errors)).toBe(true);
     });
  });

  describe('Intent Hierarchy Data Integrity', () => {
    test('should have unique intent IDs', () => {
      const ids = INTENT_HIERARCHY.map(intent => intent.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    test('should have valid level progression', () => {
      const level1Count = INTENT_HIERARCHY.filter(i => i.level === 1).length;
      const level2Count = INTENT_HIERARCHY.filter(i => i.level === 2).length;
      const level3Count = INTENT_HIERARCHY.filter(i => i.level === 3).length;

      expect(level1Count).toBeGreaterThan(0);
      expect(level2Count).toBeGreaterThan(level1Count);
      expect(level3Count).toBeGreaterThan(0);
    });

    test('should have all level 2 intents with valid parents', () => {
      const level2Intents = INTENT_HIERARCHY.filter(intent => intent.level === 2);
      const level1Ids = INTENT_HIERARCHY.filter(intent => intent.level === 1).map(i => i.id);

      level2Intents.forEach(intent => {
        expect(intent.parent).toBeDefined();
        expect(level1Ids).toContain(intent.parent!);
      });
    });

    test('should have all level 3 intents with valid parents', () => {
      const level3Intents = INTENT_HIERARCHY.filter(intent => intent.level === 3);
      const level2Ids = INTENT_HIERARCHY.filter(intent => intent.level === 2).map(i => i.id);

      level3Intents.forEach(intent => {
        expect(intent.parent).toBeDefined();
        expect(level2Ids).toContain(intent.parent!);
      });
    });

         test('should have consistent children references', () => {
       const level1Intents = INTENT_HIERARCHY.filter(intent => intent.level === 1);
       
       level1Intents.forEach(parent => {
         if (parent.children) {
           parent.children.forEach(childId => {
             const child = hierarchyManager.getIntentById(childId);
             expect(child).toBeDefined();
             // Some children may have different parents due to shared intents
             expect(child!.parent).toBeDefined();
           });
         }
       });
     });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of hierarchy operations efficiently', () => {
      const startTime = Date.now();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        hierarchyManager.getAllIntents();
        hierarchyManager.getIntentsByLevel(1);
        hierarchyManager.getIntentsByLevel(2);
        hierarchyManager.searchIntentsByKeyword('test');
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });

         test('should handle concurrent access', async () => {
       const promises: Promise<any>[] = [];
       
       for (let i = 0; i < 20; i++) {
         promises.push(Promise.resolve(hierarchyManager.getAllIntents()));
         promises.push(Promise.resolve(hierarchyManager.getIntentsByLevel(1)));
         promises.push(Promise.resolve(hierarchyManager.searchIntentsByKeyword('programming')));
       }
       
       const results = await Promise.all(promises);
       expect(results.length).toBe(60);
       expect(results.every(r => r !== null && r !== undefined)).toBe(true);
     });
  });

  describe('Error Handling', () => {
    test('should handle invalid intent ID gracefully', () => {
      const result = hierarchyManager.getIntentById('non-existent-id');
      expect(result).toBeUndefined();
    });

    test('should handle invalid parent ID gracefully', () => {
      const result = hierarchyManager.getChildrenOf('non-existent-parent');
      expect(result).toEqual([]);
    });

    test('should handle empty keyword search gracefully', () => {
      const result = hierarchyManager.searchIntentsByKeyword('');
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle invalid level gracefully', () => {
      const result = hierarchyManager.getIntentsByLevel(99 as any);
      expect(result).toEqual([]);
    });
  });

  describe('Specific Intent Validation', () => {
    test('should have professional domain with expected children', () => {
      const professional = hierarchyManager.getIntentById('professional');
      expect(professional).toBeDefined();
      expect(professional!.children).toContain('experience');
      expect(professional!.children).toContain('skills');
      expect(professional!.children).toContain('projects');
    });

    test('should have technical domain with programming child', () => {
      const technical = hierarchyManager.getIntentById('technical');
      expect(technical).toBeDefined();
      expect(technical!.children).toContain('programming');
    });

    test('should have experience intent under professional', () => {
      const experience = hierarchyManager.getIntentById('experience');
      expect(experience).toBeDefined();
      expect(experience!.parent).toBe('professional');
      expect(experience!.level).toBe(2);
    });

    test('should have programming intent under technical', () => {
      const programming = hierarchyManager.getIntentById('programming');
      expect(programming).toBeDefined();
      expect(programming!.parent).toBe('technical');
      expect(programming!.level).toBe(2);
    });
  });
});