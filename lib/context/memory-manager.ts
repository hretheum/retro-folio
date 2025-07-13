export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: Date;
  type: 'working' | 'episodic' | 'semantic';
  metadata: {
    source: string;
    relevance: number;
    decay: number;
    tags: string[];
    sessionId?: string;
    userId?: string;
  };
}

export interface WorkingMemory extends MemoryEntry {
  type: 'working';
  contextWindow: number;
  priority: number;
  expiresAt: Date;
}

export interface EpisodicMemory extends MemoryEntry {
  type: 'episodic';
  episode: {
    startTime: Date;
    endTime?: Date;
    participants: string[];
    location?: string;
    summary: string;
  };
  emotionalContext?: {
    sentiment: number;
    emotions: string[];
    intensity: number;
  };
}

export interface SemanticMemory extends MemoryEntry {
  type: 'semantic';
  concept: {
    category: string;
    relationships: string[];
    confidence: number;
    lastAccessed: Date;
    accessCount: number;
  };
  embedding?: number[];
}

export interface MemoryQuery {
  query: string;
  type?: 'working' | 'episodic' | 'semantic' | 'all';
  limit?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  relevanceThreshold?: number;
  sessionId?: string;
  userId?: string;
}

export interface MemorySearchResult {
  memories: MemoryEntry[];
  totalFound: number;
  searchTime: number;
  relevanceScores: number[];
}

export class MemoryManager {
  private workingMemory: Map<string, WorkingMemory> = new Map();
  private episodicMemory: Map<string, EpisodicMemory> = new Map();
  private semanticMemory: Map<string, SemanticMemory> = new Map();
  
  private maxWorkingMemorySize = 50;
  private maxEpisodicMemorySize = 1000;
  private maxSemanticMemorySize = 5000;
  
  private decayRate = 0.95; // Memory decay rate per hour
  private consolidationThreshold = 0.8; // Threshold for moving to long-term memory

  constructor() {
    // Start memory maintenance tasks
    this.startMemoryMaintenance();
  }

  // Working Memory Operations
  async addToWorkingMemory(content: string, metadata: Partial<MemoryEntry['metadata']> = {}): Promise<string> {
    const id = this.generateId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes default
    
    const memory: WorkingMemory = {
      id,
      content,
      timestamp: new Date(),
      type: 'working',
      contextWindow: 10,
      priority: 1,
      expiresAt,
      metadata: {
        source: 'user_input',
        relevance: 1.0,
        decay: 1.0,
        tags: [],
        ...metadata
      }
    };

    this.workingMemory.set(id, memory);
    
    // Maintain size limit
    if (this.workingMemory.size > this.maxWorkingMemorySize) {
      this.evictOldestWorkingMemory();
    }

    return id;
  }

  async getWorkingMemory(sessionId?: string): Promise<WorkingMemory[]> {
    const memories = Array.from(this.workingMemory.values());
    
    if (sessionId) {
      return memories.filter(m => m.metadata.sessionId === sessionId);
    }
    
    return memories.sort((a, b) => b.priority - a.priority);
  }

  // Episodic Memory Operations
  async addToEpisodicMemory(
    content: string,
    episode: EpisodicMemory['episode'],
    metadata: Partial<MemoryEntry['metadata']> = {}
  ): Promise<string> {
    const id = this.generateId();
    
    const memory: EpisodicMemory = {
      id,
      content,
      timestamp: new Date(),
      type: 'episodic',
      episode,
      metadata: {
        source: 'conversation',
        relevance: 1.0,
        decay: 1.0,
        tags: [],
        ...metadata
      }
    };

    this.episodicMemory.set(id, memory);
    
    // Maintain size limit
    if (this.episodicMemory.size > this.maxEpisodicMemorySize) {
      this.evictOldestEpisodicMemory();
    }

    return id;
  }

  async getEpisodicMemory(timeRange?: { start: Date; end: Date }): Promise<EpisodicMemory[]> {
    const memories = Array.from(this.episodicMemory.values());
    
    if (timeRange) {
      return memories.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return memories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Semantic Memory Operations
  async addToSemanticMemory(
    content: string,
    concept: SemanticMemory['concept'],
    metadata: Partial<MemoryEntry['metadata']> = {},
    embedding?: number[]
  ): Promise<string> {
    const id = this.generateId();
    
    const memory: SemanticMemory = {
      id,
      content,
      timestamp: new Date(),
      type: 'semantic',
      concept,
      embedding,
      metadata: {
        source: 'knowledge_base',
        relevance: 1.0,
        decay: 1.0,
        tags: [],
        ...metadata
      }
    };

    this.semanticMemory.set(id, memory);
    
    // Maintain size limit
    if (this.semanticMemory.size > this.maxSemanticMemorySize) {
      this.evictLeastAccessedSemanticMemory();
    }

    return id;
  }

  async getSemanticMemory(category?: string): Promise<SemanticMemory[]> {
    const memories = Array.from(this.semanticMemory.values());
    
    if (category) {
      return memories.filter(m => m.concept.category === category);
    }
    
    return memories.sort((a, b) => b.concept.confidence - a.concept.confidence);
  }

  // Universal Search
  async searchMemory(query: MemoryQuery): Promise<MemorySearchResult> {
    const startTime = Date.now();
    const results: MemoryEntry[] = [];
    const relevanceScores: number[] = [];

    // Search in working memory
    if (!query.type || query.type === 'working' || query.type === 'all') {
      const workingResults = await this.searchWorkingMemory(query);
      results.push(...workingResults.memories);
      relevanceScores.push(...workingResults.relevanceScores);
    }

    // Search in episodic memory
    if (!query.type || query.type === 'episodic' || query.type === 'all') {
      const episodicResults = await this.searchEpisodicMemory(query);
      results.push(...episodicResults.memories);
      relevanceScores.push(...episodicResults.relevanceScores);
    }

    // Search in semantic memory
    if (!query.type || query.type === 'semantic' || query.type === 'all') {
      const semanticResults = await this.searchSemanticMemory(query);
      results.push(...semanticResults.memories);
      relevanceScores.push(...semanticResults.relevanceScores);
    }

    // Sort by relevance and apply limit
    const sortedResults = results
      .map((memory, index) => ({ memory, relevance: relevanceScores[index] }))
      .sort((a, b) => b.relevance - a.relevance);

    if (query.relevanceThreshold) {
      const filtered = sortedResults.filter(r => r.relevance >= query.relevanceThreshold!);
      results.length = 0;
      relevanceScores.length = 0;
      filtered.forEach(r => {
        results.push(r.memory);
        relevanceScores.push(r.relevance);
      });
    }

    if (query.limit) {
      results.splice(query.limit);
      relevanceScores.splice(query.limit);
    }

    return {
      memories: results,
      totalFound: results.length,
      searchTime: Date.now() - startTime,
      relevanceScores
    };
  }

  // Memory Consolidation
  async consolidateMemory(): Promise<void> {
    // Move high-relevance working memory to episodic memory
    const workingMemories = Array.from(this.workingMemory.values());
    
    for (const memory of workingMemories) {
      if (memory.metadata.relevance >= this.consolidationThreshold) {
        await this.addToEpisodicMemory(
          memory.content,
          {
            startTime: memory.timestamp,
            endTime: new Date(),
            participants: [memory.metadata.userId || 'unknown'],
            summary: memory.content.substring(0, 100)
          },
          memory.metadata
        );
        
        this.workingMemory.delete(memory.id);
      }
    }

    // Extract concepts from episodic memory for semantic memory
    const episodicMemories = Array.from(this.episodicMemory.values());
    
    for (const memory of episodicMemories) {
      if (memory.metadata.relevance >= this.consolidationThreshold) {
        const concepts = this.extractConcepts(memory.content);
        
        for (const concept of concepts) {
          await this.addToSemanticMemory(
            concept.content,
            {
              category: concept.category,
              relationships: concept.relationships,
              confidence: concept.confidence,
              lastAccessed: new Date(),
              accessCount: 1
            },
            memory.metadata
          );
        }
      }
    }
  }

  // Memory Maintenance
  private startMemoryMaintenance(): void {
    // Run memory maintenance every hour
    setInterval(() => {
      this.applyMemoryDecay();
      this.consolidateMemory();
      this.cleanupExpiredMemories();
    }, 60 * 60 * 1000); // 1 hour
  }

  private applyMemoryDecay(): void {
    const now = new Date();
    
    // Apply decay to working memory
    for (const memory of this.workingMemory.values()) {
      const hoursElapsed = (now.getTime() - memory.timestamp.getTime()) / (1000 * 60 * 60);
      memory.metadata.decay *= Math.pow(this.decayRate, hoursElapsed);
      
      if (memory.metadata.decay < 0.1) {
        this.workingMemory.delete(memory.id);
      }
    }

    // Apply decay to episodic memory
    for (const memory of this.episodicMemory.values()) {
      const hoursElapsed = (now.getTime() - memory.timestamp.getTime()) / (1000 * 60 * 60);
      memory.metadata.decay *= Math.pow(this.decayRate, hoursElapsed);
      
      if (memory.metadata.decay < 0.05) {
        this.episodicMemory.delete(memory.id);
      }
    }
  }

  private cleanupExpiredMemories(): void {
    const now = new Date();
    
    // Remove expired working memories
    for (const memory of this.workingMemory.values()) {
      if (memory.expiresAt <= now) {
        this.workingMemory.delete(memory.id);
      }
    }
  }

  private evictOldestWorkingMemory(): void {
    const oldest = Array.from(this.workingMemory.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
    
    if (oldest) {
      this.workingMemory.delete(oldest.id);
    }
  }

  private evictOldestEpisodicMemory(): void {
    const oldest = Array.from(this.episodicMemory.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
    
    if (oldest) {
      this.episodicMemory.delete(oldest.id);
    }
  }

  private evictLeastAccessedSemanticMemory(): void {
    const leastAccessed = Array.from(this.semanticMemory.values())
      .sort((a, b) => a.concept.accessCount - b.concept.accessCount)[0];
    
    if (leastAccessed) {
      this.semanticMemory.delete(leastAccessed.id);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private extractConcepts(content: string): {
    content: string;
    category: string;
    relationships: string[];
    confidence: number;
  }[] {
    // Simple concept extraction - in a real implementation, this would be more sophisticated
    const concepts: {
      content: string;
      category: string;
      relationships: string[];
      confidence: number;
    }[] = [];

    const words = content.toLowerCase().split(/\s+/);
    const techWords = ['programming', 'code', 'development', 'javascript', 'typescript', 'react'];
    const workWords = ['work', 'job', 'career', 'experience', 'project'];
    const personalWords = ['personal', 'hobby', 'interest', 'background'];

    for (const word of words) {
      if (techWords.includes(word)) {
        concepts.push({
          content: word,
          category: 'technical',
          relationships: [],
          confidence: 0.8
        });
      } else if (workWords.includes(word)) {
        concepts.push({
          content: word,
          category: 'professional',
          relationships: [],
          confidence: 0.8
        });
      } else if (personalWords.includes(word)) {
        concepts.push({
          content: word,
          category: 'personal',
          relationships: [],
          confidence: 0.7
        });
      }
    }

    return concepts;
  }

  private async searchWorkingMemory(query: MemoryQuery): Promise<{
    memories: WorkingMemory[];
    relevanceScores: number[];
  }> {
    const memories = Array.from(this.workingMemory.values());
    const results: { memory: WorkingMemory; relevance: number }[] = [];

    for (const memory of memories) {
      const relevance = this.calculateRelevance(query.query, memory.content);
      if (relevance > 0.1) {
        results.push({ memory, relevance });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      memories: results.map(r => r.memory),
      relevanceScores: results.map(r => r.relevance)
    };
  }

  private async searchEpisodicMemory(query: MemoryQuery): Promise<{
    memories: EpisodicMemory[];
    relevanceScores: number[];
  }> {
    const memories = Array.from(this.episodicMemory.values());
    const results: { memory: EpisodicMemory; relevance: number }[] = [];

    for (const memory of memories) {
      const relevance = this.calculateRelevance(query.query, memory.content);
      if (relevance > 0.1) {
        results.push({ memory, relevance });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      memories: results.map(r => r.memory),
      relevanceScores: results.map(r => r.relevance)
    };
  }

  private async searchSemanticMemory(query: MemoryQuery): Promise<{
    memories: SemanticMemory[];
    relevanceScores: number[];
  }> {
    const memories = Array.from(this.semanticMemory.values());
    const results: { memory: SemanticMemory; relevance: number }[] = [];

    for (const memory of memories) {
      const relevance = this.calculateRelevance(query.query, memory.content);
      if (relevance > 0.1) {
        results.push({ memory, relevance });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      memories: results.map(r => r.memory),
      relevanceScores: results.map(r => r.relevance)
    };
  }

  private calculateRelevance(query: string, content: string): number {
    // Simple relevance calculation - in a real implementation, this would use embeddings
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const queryWord of queryWords) {
      if (contentWords.includes(queryWord)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  // Statistics and Monitoring
  getMemoryStats(): {
    working: { count: number; maxSize: number };
    episodic: { count: number; maxSize: number };
    semantic: { count: number; maxSize: number };
    totalMemories: number;
  } {
    return {
      working: {
        count: this.workingMemory.size,
        maxSize: this.maxWorkingMemorySize
      },
      episodic: {
        count: this.episodicMemory.size,
        maxSize: this.maxEpisodicMemorySize
      },
      semantic: {
        count: this.semanticMemory.size,
        maxSize: this.maxSemanticMemorySize
      },
      totalMemories: this.workingMemory.size + this.episodicMemory.size + this.semanticMemory.size
    };
  }
}