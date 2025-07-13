import { QueryIntent } from '../../chat-intelligence';
import { ContextualChatResponse } from '../context-integration';

// Define local types
interface ConversationContext {
  query: string;
  conversationHistory?: string[];
  metadata?: Record<string, any>;
  sessionId?: string;
  userId?: string;
}

export interface EpisodicMemoryEntry {
  id: string;
  episodeId: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  context: ConversationContext;
  intent: QueryIntent;
  response: ContextualChatResponse;
  emotions?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: string[];
  };
  outcomes?: {
    satisfied: boolean;
    helpfulness: number;
    clarity: number;
  };
  relatedEpisodes: string[];
  importance: number;
  consolidationLevel: 'new' | 'consolidated' | 'archived';
}

export interface EpisodicMemoryStats {
  totalEpisodes: number;
  activeEpisodes: number;
  consolidatedEpisodes: number;
  archivedEpisodes: number;
  averageImportance: number;
  memorySpan: number; // in days
  topSessions: Array<{ sessionId: string; episodeCount: number }>;
}

export interface EpisodeQuery {
  sessionId?: string;
  userId?: string;
  intent?: QueryIntent;
  timeRange?: {
    start: Date;
    end: Date;
  };
  minImportance?: number;
  consolidationLevel?: 'new' | 'consolidated' | 'archived';
  limit?: number;
  includeRelated?: boolean;
}

export class EpisodicMemory {
  private episodes: Map<string, EpisodicMemoryEntry> = new Map();
  private sessionIndex: Map<string, Set<string>> = new Map();
  private userIndex: Map<string, Set<string>> = new Map();
  private intentIndex: Map<QueryIntent, Set<string>> = new Map();
  private maxEpisodes: number = 1000;
  private consolidationThreshold: number = 24 * 60 * 60 * 1000; // 24 hours
  private archiveThreshold: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(maxEpisodes: number = 1000) {
    this.maxEpisodes = maxEpisodes;
    
    // Initialize intent index
    const intents: QueryIntent[] = ['SYNTHESIS', 'EXPLORATION', 'COMPARISON', 'FACTUAL', 'CASUAL'];
    intents.forEach(intent => {
      this.intentIndex.set(intent, new Set());
    });
  }

  /**
   * Store a new episodic memory
   */
  storeEpisode(
    context: ConversationContext,
    intent: QueryIntent,
    response: ContextualChatResponse,
    emotions?: EpisodicMemoryEntry['emotions'],
    outcomes?: EpisodicMemoryEntry['outcomes']
  ): string {
    const episodeId = this.generateEpisodeId();
    const now = Date.now();
    
    const episode: EpisodicMemoryEntry = {
      id: episodeId,
      episodeId,
      timestamp: now,
      sessionId: context.sessionId || 'unknown',
      userId: context.userId,
      context,
      intent,
      response,
      emotions,
      outcomes,
      relatedEpisodes: [],
      importance: this.calculateImportance(context, intent, response, emotions, outcomes),
      consolidationLevel: 'new'
    };

    // Check capacity and evict if necessary
    if (this.episodes.size >= this.maxEpisodes) {
      this.evictOldestEpisodes();
    }

    // Store episode
    this.episodes.set(episodeId, episode);
    
    // Update indices
    this.updateIndices(episode);
    
    // Find and link related episodes
    this.linkRelatedEpisodes(episode);

    return episodeId;
  }

  /**
   * Retrieve specific episode
   */
  getEpisode(episodeId: string): EpisodicMemoryEntry | null {
    return this.episodes.get(episodeId) || null;
  }

  /**
   * Search episodes by various criteria
   */
  searchEpisodes(query: EpisodeQuery): EpisodicMemoryEntry[] {
    let candidateIds: Set<string> = new Set();
    let isFirstFilter = true;

    // Filter by session
    if (query.sessionId) {
      const sessionEpisodes = this.sessionIndex.get(query.sessionId) || new Set();
      if (isFirstFilter) {
        candidateIds = new Set(sessionEpisodes);
        isFirstFilter = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => sessionEpisodes.has(id)));
      }
    }

    // Filter by user
    if (query.userId) {
      const userEpisodes = this.userIndex.get(query.userId) || new Set();
      if (isFirstFilter) {
        candidateIds = new Set(userEpisodes);
        isFirstFilter = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => userEpisodes.has(id)));
      }
    }

    // Filter by intent
    if (query.intent) {
      const intentEpisodes = this.intentIndex.get(query.intent) || new Set();
      if (isFirstFilter) {
        candidateIds = new Set(intentEpisodes);
        isFirstFilter = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => intentEpisodes.has(id)));
      }
    }

    // If no filters applied, use all episodes
    if (isFirstFilter) {
      candidateIds = new Set(this.episodes.keys());
    }

    // Convert to episodes and apply remaining filters
    const episodes = Array.from(candidateIds)
      .map(id => this.episodes.get(id))
      .filter((episode): episode is EpisodicMemoryEntry => episode !== undefined);

    let filteredEpisodes = episodes.filter(episode => {
      // Time range filter
      if (query.timeRange) {
        const episodeDate = new Date(episode.timestamp);
        if (episodeDate < query.timeRange.start || episodeDate > query.timeRange.end) {
          return false;
        }
      }

      // Importance filter
      if (query.minImportance && episode.importance < query.minImportance) {
        return false;
      }

      // Consolidation level filter
      if (query.consolidationLevel && episode.consolidationLevel !== query.consolidationLevel) {
        return false;
      }

      return true;
    });

    // Sort by importance (descending) and recency (newest first)
    filteredEpisodes.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return b.timestamp - a.timestamp;
    });

    // Include related episodes if requested
    if (query.includeRelated) {
      const relatedEpisodes = new Set<EpisodicMemoryEntry>();
      filteredEpisodes.forEach(episode => {
        episode.relatedEpisodes.forEach(relatedId => {
          const related = this.episodes.get(relatedId);
          if (related) {
            relatedEpisodes.add(related);
          }
        });
      });
      
      // Merge and deduplicate
      const allEpisodes = [...filteredEpisodes, ...relatedEpisodes];
      const uniqueEpisodes = Array.from(new Map(allEpisodes.map(e => [e.id, e])).values());
      filteredEpisodes = uniqueEpisodes.sort((a, b) => b.importance - a.importance);
    }

    // Apply limit
    if (query.limit) {
      filteredEpisodes = filteredEpisodes.slice(0, query.limit);
    }

    return filteredEpisodes;
  }

  /**
   * Get episodes for a specific session
   */
  getSessionEpisodes(sessionId: string, limit?: number): EpisodicMemoryEntry[] {
    return this.searchEpisodes({
      sessionId,
      limit
    });
  }

  /**
   * Get recent episodes across all sessions
   */
  getRecentEpisodes(limit: number = 10): EpisodicMemoryEntry[] {
    const allEpisodes = Array.from(this.episodes.values());
    return allEpisodes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Consolidate episodes (move from 'new' to 'consolidated')
   */
  consolidateEpisodes(): number {
    const now = Date.now();
    let consolidatedCount = 0;

    for (const episode of this.episodes.values()) {
      if (episode.consolidationLevel === 'new' && 
          (now - episode.timestamp) > this.consolidationThreshold) {
        episode.consolidationLevel = 'consolidated';
        consolidatedCount++;
      }
    }

    return consolidatedCount;
  }

  /**
   * Archive old episodes
   */
  archiveEpisodes(): number {
    const now = Date.now();
    let archivedCount = 0;

    for (const episode of this.episodes.values()) {
      if (episode.consolidationLevel === 'consolidated' && 
          (now - episode.timestamp) > this.archiveThreshold) {
        episode.consolidationLevel = 'archived';
        archivedCount++;
      }
    }

    return archivedCount;
  }

  /**
   * Update episode importance based on new interactions
   */
  updateImportance(episodeId: string, delta: number): boolean {
    const episode = this.episodes.get(episodeId);
    if (!episode) {
      return false;
    }

    episode.importance = Math.max(0, Math.min(1, episode.importance + delta));
    return true;
  }

  /**
   * Get memory statistics
   */
  getStats(): EpisodicMemoryStats {
    const episodes = Array.from(this.episodes.values());
    const now = Date.now();
    
    let totalImportance = 0;
    let newCount = 0;
    let consolidatedCount = 0;
    let archivedCount = 0;
    let oldestTimestamp = now;

    episodes.forEach(episode => {
      totalImportance += episode.importance;
      
      switch (episode.consolidationLevel) {
        case 'new':
          newCount++;
          break;
        case 'consolidated':
          consolidatedCount++;
          break;
        case 'archived':
          archivedCount++;
          break;
      }
      
      if (episode.timestamp < oldestTimestamp) {
        oldestTimestamp = episode.timestamp;
      }
    });

    // Calculate session statistics
    const sessionCounts = new Map<string, number>();
    episodes.forEach(episode => {
      const count = sessionCounts.get(episode.sessionId) || 0;
      sessionCounts.set(episode.sessionId, count + 1);
    });

    const topSessions = Array.from(sessionCounts.entries())
      .map(([sessionId, episodeCount]) => ({ sessionId, episodeCount }))
      .sort((a, b) => b.episodeCount - a.episodeCount)
      .slice(0, 10);

    return {
      totalEpisodes: episodes.length,
      activeEpisodes: newCount + consolidatedCount,
      consolidatedEpisodes: consolidatedCount,
      archivedEpisodes: archivedCount,
      averageImportance: episodes.length > 0 ? totalImportance / episodes.length : 0,
      memorySpan: episodes.length > 0 ? (now - oldestTimestamp) / (24 * 60 * 60 * 1000) : 0,
      topSessions
    };
  }

  /**
   * Clear all episodes
   */
  clear(): void {
    this.episodes.clear();
    this.sessionIndex.clear();
    this.userIndex.clear();
    this.intentIndex.forEach(set => set.clear());
  }

  /**
   * Private helper methods
   */
  private generateEpisodeId(): string {
    return `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateIndices(episode: EpisodicMemoryEntry): void {
    // Update session index
    if (!this.sessionIndex.has(episode.sessionId)) {
      this.sessionIndex.set(episode.sessionId, new Set());
    }
    this.sessionIndex.get(episode.sessionId)!.add(episode.id);

    // Update user index
    if (episode.userId) {
      if (!this.userIndex.has(episode.userId)) {
        this.userIndex.set(episode.userId, new Set());
      }
      this.userIndex.get(episode.userId)!.add(episode.id);
    }

    // Update intent index
    this.intentIndex.get(episode.intent)?.add(episode.id);
  }

  private linkRelatedEpisodes(newEpisode: EpisodicMemoryEntry): void {
    // Find episodes from the same session
    const sessionEpisodes = this.searchEpisodes({
      sessionId: newEpisode.sessionId,
      limit: 5
    });

    sessionEpisodes.forEach(episode => {
      if (episode.id !== newEpisode.id) {
        // Calculate similarity based on context and intent
        const similarity = this.calculateEpisodeSimilarity(newEpisode, episode);
        
        if (similarity > 0.3) {
          newEpisode.relatedEpisodes.push(episode.id);
          episode.relatedEpisodes.push(newEpisode.id);
        }
      }
    });
  }

  private calculateEpisodeSimilarity(episode1: EpisodicMemoryEntry, episode2: EpisodicMemoryEntry): number {
    let similarity = 0;

    // Intent similarity
    if (episode1.intent === episode2.intent) {
      similarity += 0.3;
    }

    // Context similarity (simple keyword matching)
    const context1 = episode1.context.query.toLowerCase();
    const context2 = episode2.context.query.toLowerCase();
    
    const words1 = context1.split(/\s+/);
    const words2 = context2.split(/\s+/);
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 2
    );
    
    if (words1.length > 0 && words2.length > 0) {
      similarity += (commonWords.length / Math.max(words1.length, words2.length)) * 0.4;
    }

    // Time proximity (episodes close in time are more related)
    const timeDiff = Math.abs(episode1.timestamp - episode2.timestamp);
    const maxTimeDiff = 60 * 60 * 1000; // 1 hour
    
    if (timeDiff < maxTimeDiff) {
      similarity += (1 - (timeDiff / maxTimeDiff)) * 0.3;
    }

    return Math.min(1, similarity);
  }

  private calculateImportance(
    context: ConversationContext,
    intent: QueryIntent,
    response: ContextualChatResponse,
    emotions?: EpisodicMemoryEntry['emotions'],
    outcomes?: EpisodicMemoryEntry['outcomes']
  ): number {
    let importance = 0.5; // Base importance

    // Intent-based importance
    switch (intent) {
      case 'SYNTHESIS':
        importance += 0.2;
        break;
      case 'EXPLORATION':
        importance += 0.15;
        break;
      case 'COMPARISON':
        importance += 0.1;
        break;
      case 'FACTUAL':
        importance += 0.05;
        break;
      case 'CASUAL':
        importance += 0.0;
        break;
    }

    // Context quality
    if (context.query.length > 20) {
      importance += 0.1;
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      importance += 0.1;
    }

    // Emotional significance
    if (emotions) {
      if (emotions.sentiment !== 'neutral') {
        importance += 0.1;
      }
      if (emotions.confidence > 0.8) {
        importance += 0.05;
      }
    }

    // Outcome quality
    if (outcomes) {
      if (outcomes.satisfied) {
        importance += 0.1;
      }
      importance += (outcomes.helpfulness * 0.1);
      importance += (outcomes.clarity * 0.05);
    }

    return Math.max(0, Math.min(1, importance));
  }

  private evictOldestEpisodes(): void {
    const episodes = Array.from(this.episodes.values());
    
    // Sort by importance (ascending) and age (oldest first)
    episodes.sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance;
      }
      return a.timestamp - b.timestamp;
    });

    // Remove oldest 10% of episodes
    const toRemove = Math.max(1, Math.floor(episodes.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      const episode = episodes[i];
      this.episodes.delete(episode.id);
      
      // Clean up indices
      this.sessionIndex.get(episode.sessionId)?.delete(episode.id);
      if (episode.userId) {
        this.userIndex.get(episode.userId)?.delete(episode.id);
      }
      this.intentIndex.get(episode.intent)?.delete(episode.id);
    }
  }
}