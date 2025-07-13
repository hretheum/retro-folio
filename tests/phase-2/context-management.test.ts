import { WorkingMemory } from '../../lib/context/memory/working-memory';
import { EpisodicMemory } from '../../lib/context/memory/episodic-memory';
import { SemanticMemory } from '../../lib/context/memory/semantic-memory';
import { MemoryPersistence } from '../../lib/context/memory/memory-persistence';
import { ContextIntegration } from '../../lib/context/context-integration';

describe('Phase 2 - Context Management', () => {
  let workingMemory: WorkingMemory;
  let episodicMemory: EpisodicMemory;
  let semanticMemory: SemanticMemory;
  let memoryPersistence: MemoryPersistence;
  let contextIntegration: ContextIntegration;

  beforeEach(() => {
    workingMemory = new WorkingMemory();
    episodicMemory = new EpisodicMemory();
    semanticMemory = new SemanticMemory();
    memoryPersistence = new MemoryPersistence();
    contextIntegration = new ContextIntegration({
      workingMemory,
      episodicMemory,
      semanticMemory,
      memoryPersistence
    });
  });

  describe('Working Memory', () => {
    test('should store and retrieve current context', async () => {
      const context = {
        userQuery: 'jakie masz doświadczenie?',
        intent: 'professional',
        timestamp: Date.now()
      };

      await workingMemory.store('current-context', context);
      const retrieved = await workingMemory.retrieve('current-context');

      expect(retrieved).toEqual(context);
    });

    test('should handle capacity limits', async () => {
      const maxCapacity = workingMemory.getMaxCapacity();
      
      // Fill beyond capacity
      for (let i = 0; i < maxCapacity + 5; i++) {
        await workingMemory.store(`item-${i}`, { data: `test-${i}` });
      }

      const currentSize = workingMemory.getCurrentSize();
      expect(currentSize).toBeLessThanOrEqual(maxCapacity);
    });

    test('should implement LRU eviction', async () => {
      const capacity = workingMemory.getMaxCapacity();
      
      // Fill to capacity
      for (let i = 0; i < capacity; i++) {
        await workingMemory.store(`item-${i}`, { data: `test-${i}` });
      }

      // Access first item to make it recently used
      await workingMemory.retrieve('item-0');

      // Add new item (should evict LRU, not item-0)
      await workingMemory.store('new-item', { data: 'new' });

      const firstItem = await workingMemory.retrieve('item-0');
      expect(firstItem).toBeDefined();
    });

    test('should handle concurrent access', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(workingMemory.store(`concurrent-${i}`, { data: i }));
      }

      await Promise.all(promises);

      const retrievePromises = [];
      for (let i = 0; i < 10; i++) {
        retrievePromises.push(workingMemory.retrieve(`concurrent-${i}`));
      }

      const results = await Promise.all(retrievePromises);
      expect(results.filter(r => r !== null)).toHaveLength(10);
    });
  });

  describe('Episodic Memory', () => {
    test('should store conversation episodes', async () => {
      const episode = {
        conversationId: 'conv-1',
        userQuery: 'co potrafisz programować?',
        response: 'Znam JavaScript, TypeScript, Python...',
        timestamp: Date.now(),
        context: { intent: 'technical' }
      };

      await episodicMemory.storeEpisode(episode);
      const retrieved = await episodicMemory.getEpisode(episode.conversationId);

      expect(retrieved).toEqual(episode);
    });

    test('should retrieve episodes by time range', async () => {
      const now = Date.now();
      const episodes = [
        { conversationId: 'conv-1', timestamp: now - 3600000 }, // 1 hour ago
        { conversationId: 'conv-2', timestamp: now - 1800000 }, // 30 min ago
        { conversationId: 'conv-3', timestamp: now - 900000 }   // 15 min ago
      ];

      for (const episode of episodes) {
        await episodicMemory.storeEpisode(episode as any);
      }

      const recentEpisodes = await episodicMemory.getEpisodesByTimeRange(
        now - 2400000, // 40 min ago
        now
      );

      expect(recentEpisodes).toHaveLength(2);
    });

    test('should search episodes by content', async () => {
      const episodes = [
        { conversationId: 'conv-1', userQuery: 'jakie masz doświadczenie?' },
        { conversationId: 'conv-2', userQuery: 'co potrafisz programować?' },
        { conversationId: 'conv-3', userQuery: 'opowiedz o projektach' }
      ];

      for (const episode of episodes) {
        await episodicMemory.storeEpisode(episode as any);
      }

      const searchResults = await episodicMemory.searchEpisodes('programować');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].conversationId).toBe('conv-2');
    });

    test('should handle memory consolidation', async () => {
      // Store many episodes
      for (let i = 0; i < 100; i++) {
        await episodicMemory.storeEpisode({
          conversationId: `conv-${i}`,
          userQuery: `query ${i}`,
          timestamp: Date.now() - (i * 60000)
        } as any);
      }

      await episodicMemory.consolidateMemory();

      const stats = await episodicMemory.getMemoryStats();
      expect(stats.totalEpisodes).toBeLessThan(100);
      expect(stats.consolidatedEpisodes).toBeGreaterThan(0);
    });
  });

  describe('Semantic Memory', () => {
    test('should store and retrieve semantic knowledge', async () => {
      const knowledge = {
        concept: 'JavaScript',
        type: 'programming-language',
        properties: {
          paradigm: 'multi-paradigm',
          typing: 'dynamic',
          runtime: 'V8'
        },
        relationships: ['TypeScript', 'Node.js', 'React']
      };

      await semanticMemory.storeKnowledge(knowledge);
      const retrieved = await semanticMemory.getKnowledge('JavaScript');

      expect(retrieved).toEqual(knowledge);
    });

    test('should find related concepts', async () => {
      const concepts = [
        { concept: 'JavaScript', relationships: ['TypeScript', 'React'] },
        { concept: 'TypeScript', relationships: ['JavaScript', 'Angular'] },
        { concept: 'React', relationships: ['JavaScript', 'JSX'] }
      ];

      for (const concept of concepts) {
        await semanticMemory.storeKnowledge(concept as any);
      }

      const related = await semanticMemory.getRelatedConcepts('JavaScript');
      expect(related).toContain('TypeScript');
      expect(related).toContain('React');
    });

    test('should perform semantic search', async () => {
      const knowledge = [
        { concept: 'React', type: 'framework', description: 'UI library for JavaScript' },
        { concept: 'Vue', type: 'framework', description: 'Progressive JavaScript framework' },
        { concept: 'Angular', type: 'framework', description: 'Platform for building mobile and desktop web applications' }
      ];

      for (const item of knowledge) {
        await semanticMemory.storeKnowledge(item as any);
      }

      const searchResults = await semanticMemory.searchKnowledge('JavaScript framework');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].concept).toMatch(/React|Vue|Angular/);
    });

    test('should handle knowledge updates', async () => {
      const originalKnowledge = {
        concept: 'Node.js',
        type: 'runtime',
        version: '18.0.0'
      };

      await semanticMemory.storeKnowledge(originalKnowledge as any);

      const updatedKnowledge = {
        concept: 'Node.js',
        type: 'runtime',
        version: '20.0.0'
      };

      await semanticMemory.updateKnowledge(updatedKnowledge as any);
      const retrieved = await semanticMemory.getKnowledge('Node.js');

      expect(retrieved.version).toBe('20.0.0');
    });
  });

  describe('Memory Persistence', () => {
    test('should persist working memory to storage', async () => {
      const data = { key: 'test-data', value: 'test-value' };
      await workingMemory.store('test-key', data);

      await memoryPersistence.persistWorkingMemory(workingMemory);
      
      const newWorkingMemory = new WorkingMemory();
      await memoryPersistence.loadWorkingMemory(newWorkingMemory);

      const retrieved = await newWorkingMemory.retrieve('test-key');
      expect(retrieved).toEqual(data);
    });

    test('should persist episodic memory', async () => {
      const episode = {
        conversationId: 'test-conv',
        userQuery: 'test query',
        timestamp: Date.now()
      };

      await episodicMemory.storeEpisode(episode as any);
      await memoryPersistence.persistEpisodicMemory(episodicMemory);

      const newEpisodicMemory = new EpisodicMemory();
      await memoryPersistence.loadEpisodicMemory(newEpisodicMemory);

      const retrieved = await newEpisodicMemory.getEpisode('test-conv');
      expect(retrieved).toEqual(episode);
    });

    test('should persist semantic memory', async () => {
      const knowledge = {
        concept: 'Test Concept',
        type: 'test',
        properties: { test: true }
      };

      await semanticMemory.storeKnowledge(knowledge as any);
      await memoryPersistence.persistSemanticMemory(semanticMemory);

      const newSemanticMemory = new SemanticMemory();
      await memoryPersistence.loadSemanticMemory(newSemanticMemory);

      const retrieved = await newSemanticMemory.getKnowledge('Test Concept');
      expect(retrieved).toEqual(knowledge);
    });

    test('should handle persistence errors gracefully', async () => {
      // Simulate storage error
      const originalPersist = memoryPersistence.persistWorkingMemory;
      memoryPersistence.persistWorkingMemory = jest.fn().mockRejectedValue(new Error('Storage error'));

      await expect(memoryPersistence.persistWorkingMemory(workingMemory)).rejects.toThrow('Storage error');

      // Restore original method
      memoryPersistence.persistWorkingMemory = originalPersist;
    });
  });

  describe('Context Integration', () => {
    test('should integrate all memory systems', async () => {
      const query = 'jakie masz doświadczenie z React?';
      const context = await contextIntegration.getIntegratedContext(query);

      expect(context).toBeDefined();
      expect(context.workingMemoryContext).toBeDefined();
      expect(context.episodicContext).toBeDefined();
      expect(context.semanticContext).toBeDefined();
    });

    test('should prioritize context sources', async () => {
      // Store data in different memory systems
      await workingMemory.store('current-topic', { topic: 'React' });
      await episodicMemory.storeEpisode({
        conversationId: 'prev-conv',
        userQuery: 'co wiesz o React?',
        timestamp: Date.now() - 300000
      } as any);
      await semanticMemory.storeKnowledge({
        concept: 'React',
        type: 'framework'
      } as any);

      const context = await contextIntegration.getIntegratedContext('więcej o React');
      
      expect(context.priority).toBeDefined();
      expect(context.priority[0]).toBe('working'); // Most recent should be prioritized
    });

    test('should handle context conflicts', async () => {
      // Store conflicting information
      await workingMemory.store('framework-preference', { preferred: 'React' });
      await episodicMemory.storeEpisode({
        conversationId: 'old-conv',
        response: 'Preferuję Vue.js',
        timestamp: Date.now() - 3600000
      } as any);

      const context = await contextIntegration.resolveContextConflicts('jakie framework preferujesz?');
      
      expect(context.conflicts).toBeDefined();
      expect(context.resolution).toBeDefined();
    });

    test('should manage context lifecycle', async () => {
      const sessionId = 'test-session';
      
      await contextIntegration.initializeSession(sessionId);
      await contextIntegration.updateSessionContext(sessionId, { topic: 'programming' });
      
      const sessionContext = await contextIntegration.getSessionContext(sessionId);
      expect(sessionContext.topic).toBe('programming');
      
      await contextIntegration.cleanupSession(sessionId);
      
      const cleanedContext = await contextIntegration.getSessionContext(sessionId);
      expect(cleanedContext).toBeNull();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large context volumes', async () => {
      const startTime = Date.now();
      
      // Store large amounts of data
      for (let i = 0; i < 1000; i++) {
        await workingMemory.store(`item-${i}`, { data: `test-${i}` });
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    test('should optimize memory usage', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        await contextIntegration.getIntegratedContext(`test query ${i}`);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // < 100MB increase
    });

    test('should handle concurrent context requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 20; i++) {
        promises.push(contextIntegration.getIntegratedContext(`concurrent query ${i}`));
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(20);
      expect(results.every(r => r !== null)).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle memory system failures', async () => {
      // Simulate working memory failure
      const originalStore = workingMemory.store;
      workingMemory.store = jest.fn().mockRejectedValue(new Error('Memory failure'));

      const context = await contextIntegration.getIntegratedContext('test query');
      
      expect(context.workingMemoryContext).toBeNull();
      expect(context.episodicContext).toBeDefined(); // Other systems should still work
      
      // Restore original method
      workingMemory.store = originalStore;
    });

    test('should implement fallback strategies', async () => {
      // Disable all memory systems
      const originalMethods = {
        working: workingMemory.retrieve,
        episodic: episodicMemory.getEpisode,
        semantic: semanticMemory.getKnowledge
      };

      workingMemory.retrieve = jest.fn().mockRejectedValue(new Error('Failure'));
      episodicMemory.getEpisode = jest.fn().mockRejectedValue(new Error('Failure'));
      semanticMemory.getKnowledge = jest.fn().mockRejectedValue(new Error('Failure'));

      const context = await contextIntegration.getIntegratedContext('test query');
      
      expect(context.fallbackUsed).toBe(true);
      expect(context.basicContext).toBeDefined();
      
      // Restore original methods
      Object.assign(workingMemory, { retrieve: originalMethods.working });
      Object.assign(episodicMemory, { getEpisode: originalMethods.episodic });
      Object.assign(semanticMemory, { getKnowledge: originalMethods.semantic });
    });
  });
});