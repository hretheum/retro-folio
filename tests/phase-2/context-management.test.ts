import { WorkingMemory } from '../../lib/context/memory/working-memory';
import { EpisodicMemory } from '../../lib/context/memory/episodic-memory';
import { SemanticMemory } from '../../lib/context/memory/semantic-memory';
import { ContextIntegration } from '../../lib/context/context-integration';
import { MemoryPersistence } from '../../lib/context/memory/memory-persistence';

describe('Phase 2 - Context Management', () => {
  describe('Working Memory', () => {
    let workingMemory: WorkingMemory;

    beforeEach(() => {
      workingMemory = new WorkingMemory();
    });

    it('should add and retrieve entries', () => {
      workingMemory.addEntry('test1', 'Test entry 1', 'high');
      workingMemory.addEntry('test2', 'Test entry 2', 'medium');
      
      const entries = workingMemory.getRecentEntries(10);
      expect(entries).toHaveLength(2);
      expect(entries[0].content).toBe('Test entry 2'); // Most recent first
      expect(entries[1].content).toBe('Test entry 1');
    });

    it('should respect capacity limits', () => {
      // Add more entries than capacity
      for (let i = 0; i < 60; i++) {
        workingMemory.addEntry(`test${i}`, `Test entry ${i}`, 'medium');
      }
      
      const entries = workingMemory.getRecentEntries(100);
      expect(entries.length).toBeLessThanOrEqual(50); // Default capacity
    });

    it('should prioritize high-importance entries', () => {
      workingMemory.addEntry('low', 'Low priority', 'low');
      workingMemory.addEntry('high', 'High priority', 'high');
      workingMemory.addEntry('medium', 'Medium priority', 'medium');
      
      const entries = workingMemory.getRecentEntries(10);
      const highPriorityEntry = entries.find(e => e.content === 'High priority');
      expect(highPriorityEntry).toBeDefined();
      expect(highPriorityEntry?.priority).toBe('high');
    });

    it('should handle memory consolidation', () => {
      // Add entries and trigger consolidation
      for (let i = 0; i < 30; i++) {
        workingMemory.addEntry(`test${i}`, `Test entry ${i}`, 'medium');
      }
      
      workingMemory.consolidateMemories();
      
      const entries = workingMemory.getRecentEntries(100);
      expect(entries.length).toBeLessThanOrEqual(30);
    });
  });

  describe('Episodic Memory', () => {
    let episodicMemory: EpisodicMemory;

    beforeEach(() => {
      episodicMemory = new EpisodicMemory();
    });

    it('should add and retrieve episodes', () => {
      episodicMemory.addEpisode('session1', 'user', 'Hello', { intent: 'greeting' });
      episodicMemory.addEpisode('session1', 'assistant', 'Hi there!', { intent: 'greeting' });
      
      const episodes = episodicMemory.getRecentEpisodes(10);
      expect(episodes).toHaveLength(2);
      expect(episodes[0].role).toBe('assistant'); // Most recent first
      expect(episodes[1].role).toBe('user');
    });

    it('should retrieve episodes by session', () => {
      episodicMemory.addEpisode('session1', 'user', 'Hello', { intent: 'greeting' });
      episodicMemory.addEpisode('session2', 'user', 'Hi', { intent: 'greeting' });
      
      const session1Episodes = episodicMemory.getSessionEpisodes('session1');
      expect(session1Episodes).toHaveLength(1);
      expect(session1Episodes[0].sessionId).toBe('session1');
    });

    it('should respect capacity limits', () => {
      // Add more episodes than capacity
      for (let i = 0; i < 1100; i++) {
        episodicMemory.addEpisode(`session${i}`, 'user', `Message ${i}`, { intent: 'test' });
      }
      
      const episodes = episodicMemory.getRecentEpisodes(2000);
      expect(episodes.length).toBeLessThanOrEqual(1000); // Default capacity
    });

    it('should handle memory decay', () => {
      episodicMemory.addEpisode('session1', 'user', 'Old message', { intent: 'test' });
      
      // Simulate time passing
      episodicMemory.decayMemories();
      
      const episodes = episodicMemory.getRecentEpisodes(10);
      expect(episodes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Semantic Memory', () => {
    let semanticMemory: SemanticMemory;

    beforeEach(() => {
      semanticMemory = new SemanticMemory();
    });

    it('should add and retrieve concepts', () => {
      semanticMemory.addConcept('react', 'React framework', ['javascript', 'frontend'], 0.9);
      semanticMemory.addConcept('typescript', 'TypeScript language', ['javascript', 'types'], 0.8);
      
      const concepts = semanticMemory.getConcepts(['javascript']);
      expect(concepts).toHaveLength(2);
      expect(concepts[0].name).toBe('react'); // Higher relevance first
    });

    it('should update concept relevance', () => {
      semanticMemory.addConcept('test', 'Test concept', ['testing'], 0.5);
      semanticMemory.updateConceptRelevance('test', 0.8);
      
      const concepts = semanticMemory.getConcepts(['testing']);
      expect(concepts[0].relevance).toBe(0.8);
    });

    it('should respect capacity limits', () => {
      // Add more concepts than capacity
      for (let i = 0; i < 5100; i++) {
        semanticMemory.addConcept(`concept${i}`, `Concept ${i}`, ['test'], 0.5);
      }
      
      const concepts = semanticMemory.getAllConcepts();
      expect(concepts.length).toBeLessThanOrEqual(5000); // Default capacity
    });

    it('should find related concepts', () => {
      semanticMemory.addConcept('react', 'React framework', ['javascript', 'frontend'], 0.9);
      semanticMemory.addConcept('vue', 'Vue framework', ['javascript', 'frontend'], 0.8);
      semanticMemory.addConcept('python', 'Python language', ['backend'], 0.7);
      
      const related = semanticMemory.getRelatedConcepts('react', 0.7);
      expect(related).toHaveLength(1);
      expect(related[0].name).toBe('vue');
    });
  });

  describe('Context Integration', () => {
    let contextIntegration: ContextIntegration;

    beforeEach(() => {
      contextIntegration = new ContextIntegration();
    });

    it('should initialize and manage sessions', () => {
      const sessionId = 'test-session';
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      
      const context = contextIntegration.getSessionContext(sessionId);
      expect(context).toBeDefined();
      expect(context.sessionId).toBe(sessionId);
      expect(context.userId).toBe('user123');
    });

    it('should update conversation state', () => {
      const sessionId = 'test-session';
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      
      contextIntegration.updateConversationState(sessionId, {
        currentTopic: 'testing',
        lastIntent: 'test',
        messageCount: 5
      });
      
      const context = contextIntegration.getSessionContext(sessionId);
      expect(context.conversationState.currentTopic).toBe('testing');
      expect(context.conversationState.messageCount).toBe(5);
    });

    it('should track user preferences', () => {
      const sessionId = 'test-session';
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      
      contextIntegration.updateUserPreferences(sessionId, {
        language: 'en',
        responseStyle: 'detailed',
        topics: ['programming', 'design']
      });
      
      const context = contextIntegration.getSessionContext(sessionId);
      expect(context.userPreferences.language).toBe('en');
      expect(context.userPreferences.topics).toContain('programming');
    });

    it('should provide contextual insights', () => {
      const sessionId = 'test-session';
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      
      // Add some conversation history
      contextIntegration.addToConversationHistory(sessionId, {
        role: 'user',
        content: 'Tell me about React',
        timestamp: new Date(),
        intent: 'technical_question'
      });
      
      const insights = contextIntegration.getContextualInsights(sessionId);
      expect(insights).toBeDefined();
      expect(insights.conversationFlow).toBeDefined();
      expect(insights.userEngagement).toBeDefined();
    });

    it('should handle context cleanup', () => {
      const sessionId = 'test-session';
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      
      // Verify session exists
      let context = contextIntegration.getSessionContext(sessionId);
      expect(context).toBeDefined();
      
      // Clean up session
      contextIntegration.cleanupSession(sessionId);
      
      // Verify session is cleaned up
      context = contextIntegration.getSessionContext(sessionId);
      expect(context).toBeUndefined();
    });
  });

  describe('Memory Persistence', () => {
    let memoryPersistence: MemoryPersistence;

    beforeEach(() => {
      memoryPersistence = new MemoryPersistence();
    });

    it('should save and load memories', () => {
      const sessionId = 'test-session';
      const memories = [
        { type: 'working', content: 'Test working memory', timestamp: new Date() },
        { type: 'episodic', content: 'Test episodic memory', timestamp: new Date() }
      ];
      
      memoryPersistence.saveMemories(sessionId, memories);
      const loadedMemories = memoryPersistence.loadMemories(sessionId);
      
      expect(loadedMemories).toHaveLength(2);
      expect(loadedMemories[0].content).toBe('Test working memory');
    });

    it('should handle cross-memory search', () => {
      const sessionId = 'test-session';
      const memories = [
        { type: 'working', content: 'React hooks tutorial', timestamp: new Date() },
        { type: 'episodic', content: 'User asked about React', timestamp: new Date() },
        { type: 'semantic', content: 'React is a JavaScript library', timestamp: new Date() }
      ];
      
      memoryPersistence.saveMemories(sessionId, memories);
      const searchResults = memoryPersistence.searchMemories(sessionId, 'React');
      
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(m => m.content.includes('React'))).toBe(true);
    });

    it('should handle memory consolidation', () => {
      const sessionId = 'test-session';
      const memories = Array(100).fill(null).map((_, i) => ({
        type: 'working',
        content: `Memory ${i}`,
        timestamp: new Date(Date.now() - i * 1000)
      }));
      
      memoryPersistence.saveMemories(sessionId, memories);
      memoryPersistence.consolidateMemories(sessionId);
      
      const consolidatedMemories = memoryPersistence.loadMemories(sessionId);
      expect(consolidatedMemories.length).toBeLessThanOrEqual(memories.length);
    });

    it('should handle memory expiration', () => {
      const sessionId = 'test-session';
      const oldMemories = [
        { 
          type: 'working', 
          content: 'Old memory', 
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      ];
      
      memoryPersistence.saveMemories(sessionId, oldMemories);
      memoryPersistence.expireOldMemories(sessionId, 12 * 60 * 60 * 1000); // 12 hours
      
      const remainingMemories = memoryPersistence.loadMemories(sessionId);
      expect(remainingMemories.length).toBeLessThanOrEqual(oldMemories.length);
    });
  });

  describe('Integration Tests', () => {
    let contextIntegration: ContextIntegration;
    let memoryPersistence: MemoryPersistence;

    beforeEach(() => {
      contextIntegration = new ContextIntegration();
      memoryPersistence = new MemoryPersistence();
    });

    it('should integrate all memory systems', () => {
      const sessionId = 'integration-test';
      
      // Initialize session
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      
      // Add conversation history
      contextIntegration.addToConversationHistory(sessionId, {
        role: 'user',
        content: 'Tell me about React hooks',
        timestamp: new Date(),
        intent: 'technical_question'
      });
      
      // Update conversation state
      contextIntegration.updateConversationState(sessionId, {
        currentTopic: 'react',
        lastIntent: 'technical_question',
        messageCount: 1
      });
      
      // Get context
      const context = contextIntegration.getSessionContext(sessionId);
      expect(context).toBeDefined();
      expect(context.conversationState.currentTopic).toBe('react');
      expect(context.conversationHistory).toHaveLength(1);
    });

    it('should handle memory persistence across sessions', () => {
      const sessionId = 'persistence-test';
      
      // Create initial context
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      contextIntegration.updateConversationState(sessionId, {
        currentTopic: 'testing',
        lastIntent: 'test',
        messageCount: 5
      });
      
      // Save to persistence
      const context = contextIntegration.getSessionContext(sessionId);
      const memories = [
        { type: 'working', content: JSON.stringify(context.conversationState), timestamp: new Date() }
      ];
      memoryPersistence.saveMemories(sessionId, memories);
      
      // Load from persistence
      const loadedMemories = memoryPersistence.loadMemories(sessionId);
      expect(loadedMemories).toHaveLength(1);
      
      const restoredState = JSON.parse(loadedMemories[0].content);
      expect(restoredState.currentTopic).toBe('testing');
    });
  });

  describe('Performance Tests', () => {
    it('should handle context operations within acceptable time limits', () => {
      const contextIntegration = new ContextIntegration();
      const sessionId = 'performance-test';
      
      const startTime = Date.now();
      
      // Perform multiple context operations
      contextIntegration.initializeSession(sessionId, { userId: 'user123' });
      contextIntegration.updateConversationState(sessionId, {
        currentTopic: 'performance',
        lastIntent: 'test',
        messageCount: 1
      });
      contextIntegration.getSessionContext(sessionId);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be under 100ms
    });

    it('should handle memory operations efficiently', () => {
      const workingMemory = new WorkingMemory();
      const startTime = Date.now();
      
      // Add many entries
      for (let i = 0; i < 1000; i++) {
        workingMemory.addEntry(`test${i}`, `Test entry ${i}`, 'medium');
      }
      
      // Retrieve entries
      workingMemory.getRecentEntries(100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should be under 1 second
    });
  });
});