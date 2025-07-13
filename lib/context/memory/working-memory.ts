import { QueryIntent } from '../../chat-intelligence';
import { ContextualChatRequest, ContextualChatResponse } from '../context-integration';

// Define missing types locally
interface ConversationContext {
  query: string;
  conversationHistory?: string[];
  metadata?: Record<string, any>;
  sessionId?: string;
  userId?: string;
}

type IntentType = QueryIntent;
type ContextualResponse = ContextualChatResponse;

export interface WorkingMemoryEntry {
  id: string;
  timestamp: number;
  context: ConversationContext;
  intent: IntentType;
  response?: ContextualResponse;
  relevanceScore: number;
  expiresAt: number;
}

export interface WorkingMemoryStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  memoryUsage: number;
  averageRelevance: number;
}

export class WorkingMemory {
  private entries: Map<string, WorkingMemoryEntry> = new Map();
  private maxEntries: number = 100;
  private defaultTTL: number = 300000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxEntries: number = 100, defaultTTL: number = 300000) {
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Store context in working memory
   */
  store(context: ConversationContext, intent: IntentType, response?: ContextualResponse): string {
    const id = this.generateId();
    const now = Date.now();
    
    const entry: WorkingMemoryEntry = {
      id,
      timestamp: now,
      context,
      intent,
      response,
      relevanceScore: this.calculateRelevanceScore(context, intent),
      expiresAt: now + this.defaultTTL
    };

    // Remove oldest entries if at capacity
    if (this.entries.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.entries.set(id, entry);
    return id;
  }

  /**
   * Retrieve context from working memory
   */
  retrieve(id: string): WorkingMemoryEntry | null {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(id);
      return null;
    }

    return entry;
  }

  /**
   * Search working memory by intent or context similarity
   */
  search(query: {
    intent?: IntentType;
    contextSimilarity?: string;
    minRelevance?: number;
    limit?: number;
  }): WorkingMemoryEntry[] {
    const results: WorkingMemoryEntry[] = [];
    const now = Date.now();
    
    for (const entry of this.entries.values()) {
      // Skip expired entries
      if (now > entry.expiresAt) {
        continue;
      }

      // Filter by intent
      if (query.intent && entry.intent !== query.intent) {
        continue;
      }

      // Filter by minimum relevance
      if (query.minRelevance && entry.relevanceScore < query.minRelevance) {
        continue;
      }

      // Filter by context similarity (simple keyword matching)
      if (query.contextSimilarity) {
        const similarity = this.calculateContextSimilarity(
          entry.context,
          query.contextSimilarity
        );
        if (similarity < 0.3) {
          continue;
        }
      }

      results.push(entry);
    }

    // Sort by relevance score (descending) and timestamp (newest first)
    results.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.timestamp - a.timestamp;
    });

    return query.limit ? results.slice(0, query.limit) : results;
  }

  /**
   * Update entry relevance score
   */
  updateRelevance(id: string, score: number): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    entry.relevanceScore = Math.max(0, Math.min(1, score));
    return true;
  }

  /**
   * Extend entry TTL
   */
  extendTTL(id: string, additionalTime: number): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    entry.expiresAt += additionalTime;
    return true;
  }

  /**
   * Get working memory statistics
   */
  getStats(): WorkingMemoryStats {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;
    let totalRelevance = 0;

    for (const entry of this.entries.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        activeEntries++;
        totalRelevance += entry.relevanceScore;
      }
    }

    return {
      totalEntries: this.entries.size,
      activeEntries,
      expiredEntries,
      memoryUsage: this.calculateMemoryUsage(),
      averageRelevance: activeEntries > 0 ? totalRelevance / activeEntries : 0
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, entry] of this.entries) {
      if (now > entry.expiresAt) {
        expiredIds.push(id);
      }
    }

    expiredIds.forEach(id => this.entries.delete(id));
  }

  /**
   * Evict oldest entries when at capacity
   */
  private evictOldest(): void {
    const entries = Array.from(this.entries.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.entries.delete(entries[i][0]);
    }
  }

  /**
   * Generate unique ID for entry
   */
  private generateId(): string {
    return `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate relevance score based on context and intent
   */
  private calculateRelevanceScore(context: ConversationContext, intent: IntentType): number {
    let score = 0.5; // Base score

    // Intent-based scoring
    if (intent === 'FACTUAL' || intent === 'COMPARISON') {
      score += 0.2; // Higher relevance for factual queries
    }

    // Context quality scoring
    if (context.query && context.query.length > 10) {
      score += 0.1; // Longer queries tend to be more specific
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      score += 0.1; // Context with history is more valuable
    }

    if (context.metadata && Object.keys(context.metadata).length > 0) {
      score += 0.1; // Rich metadata increases relevance
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate context similarity (simple implementation)
   */
  private calculateContextSimilarity(context: ConversationContext, query: string): number {
    const contextText = [
      context.query || '',
      context.conversationHistory?.join(' ') || '',
      JSON.stringify(context.metadata || {})
    ].join(' ').toLowerCase();

    const queryWords = query.toLowerCase().split(/\s+/);
    const matchedWords = queryWords.filter(word => 
      contextText.includes(word) && word.length > 2
    );

    return queryWords.length > 0 ? matchedWords.length / queryWords.length : 0;
  }

  /**
   * Calculate approximate memory usage
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.entries.values()) {
      // Rough estimation of entry size
      totalSize += JSON.stringify(entry).length * 2; // UTF-16 encoding
    }
    
    return totalSize;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}