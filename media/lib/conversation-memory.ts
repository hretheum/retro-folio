import { extractTopics } from './chat-intelligence';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  topics: string[];
  metadata?: {
    queryIntent?: string;
    contextLength?: number;
    responseTime?: number;
  };
}

export interface ConversationSession {
  sessionId: string;
  messages: ConversationMessage[];
  lastActive: number;
  totalMessages: number;
  dominantTopics: string[];
}

export class ConversationMemory {
  private conversations = new Map<string, ConversationSession>();
  private maxMessages = 20; // Keep last 20 messages per session
  private sessionTTL = 3600000; // 1 hour in milliseconds
  
  constructor(options?: {
    maxMessages?: number;
    sessionTTL?: number;
  }) {
    if (options?.maxMessages) this.maxMessages = options.maxMessages;
    if (options?.sessionTTL) this.sessionTTL = options.sessionTTL;
    
    // Clean up expired sessions every 10 minutes
    setInterval(() => this.cleanupExpiredSessions(), 10 * 60 * 1000);
  }
  
  addMessage(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
  }): void {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        sessionId,
        messages: [],
        lastActive: Date.now(),
        totalMessages: 0,
        dominantTopics: []
      });
    }
    
    const session = this.conversations.get(sessionId)!;
    const topics = extractTopics(message.content);
    
    const conversationMessage: ConversationMessage = {
      role: message.role,
      content: message.content,
      timestamp: Date.now(),
      topics,
      metadata: message.metadata
    };
    
    session.messages.push(conversationMessage);
    session.lastActive = Date.now();
    session.totalMessages++;
    
    // Update dominant topics
    this.updateDominantTopics(session);
    
    // Trim messages if too many
    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }
  }
  
  getRelevantHistory(sessionId: string, currentQuery: string, options?: {
    maxMessages?: number;
    relevanceThreshold?: number;
  }): ConversationMessage[] {
    const session = this.conversations.get(sessionId);
    if (!session) return [];
    
    const { maxMessages = 5, relevanceThreshold = 0.3 } = options || {};
    const currentTopics = extractTopics(currentQuery);
    
    // Get messages with topic overlap or recent messages
    const relevantMessages = session.messages.filter((msg, index) => {
      // Always include the last few messages for context
      if (index >= session.messages.length - 3) {
        return true;
      }
      
      // Include messages with topic overlap
      const topicOverlap = msg.topics.filter(topic => 
        currentTopics.includes(topic)
      ).length;
      
      const relevanceScore = topicOverlap / Math.max(msg.topics.length, currentTopics.length, 1);
      return relevanceScore >= relevanceThreshold;
    });
    
    // Return most recent relevant messages
    return relevantMessages.slice(-maxMessages);
  }
  
  getSessionSummary(sessionId: string): {
    messageCount: number;
    dominantTopics: string[];
    sessionDuration: number;
    lastActive: Date;
  } | null {
    const session = this.conversations.get(sessionId);
    if (!session) return null;
    
    const sessionDuration = session.messages.length > 0 
      ? session.lastActive - session.messages[0].timestamp
      : 0;
    
    return {
      messageCount: session.totalMessages,
      dominantTopics: session.dominantTopics,
      sessionDuration,
      lastActive: new Date(session.lastActive)
    };
  }
  
  getConversationalContext(sessionId: string, currentQuery: string): string {
    const relevantHistory = this.getRelevantHistory(sessionId, currentQuery);
    
    if (relevantHistory.length === 0) {
      return '';
    }
    
    let context = '\n### CONVERSATION HISTORY\n';
    
    relevantHistory.forEach(msg => {
      const timeAgo = this.getTimeAgo(msg.timestamp);
      context += `- ${msg.role.toUpperCase()} (${timeAgo}): ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}\n`;
    });
    
    return context;
  }
  
  private updateDominantTopics(session: ConversationSession): void {
    const topicCounts = new Map<string, number>();
    
    // Count topic frequency across all messages
    session.messages.forEach(msg => {
      msg.topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });
    
    // Get top 5 most frequent topics
    session.dominantTopics = Array.from(topicCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }
  
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    this.conversations.forEach((session, sessionId) => {
      if (now - session.lastActive > this.sessionTTL) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      this.conversations.delete(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`[CONVERSATION-MEMORY] Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
  
  private getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  // Analytics methods
  getPerformanceMetrics(): {
    totalSessions: number;
    activeSessions: number;
    averageMessagesPerSession: number;
    mostCommonTopics: string[];
  } {
    const now = Date.now();
    const activeSessions = Array.from(this.conversations.values())
      .filter(session => now - session.lastActive < this.sessionTTL);
    
    const totalMessages = Array.from(this.conversations.values())
      .reduce((sum, session) => sum + session.totalMessages, 0);
    
    const allTopics = new Map<string, number>();
    this.conversations.forEach(session => {
      session.dominantTopics.forEach(topic => {
        allTopics.set(topic, (allTopics.get(topic) || 0) + 1);
      });
    });
    
    const mostCommonTopics = Array.from(allTopics.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);
    
    return {
      totalSessions: this.conversations.size,
      activeSessions: activeSessions.length,
      averageMessagesPerSession: this.conversations.size > 0 
        ? totalMessages / this.conversations.size 
        : 0,
      mostCommonTopics
    };
  }
  
  // Clear session data
  clearSession(sessionId: string): boolean {
    return this.conversations.delete(sessionId);
  }
  
  // Get all active sessions (for admin/debugging)
  getActiveSessions(): ConversationSession[] {
    const now = Date.now();
    return Array.from(this.conversations.values())
      .filter(session => now - session.lastActive < this.sessionTTL)
      .sort((a, b) => b.lastActive - a.lastActive);
  }
}

// Global instance
export const conversationMemory = new ConversationMemory({
  maxMessages: parseInt(process.env.CONVERSATION_MEMORY_MAX_MESSAGES || '20'),
  sessionTTL: parseInt(process.env.CONVERSATION_MEMORY_TTL || '3600000')
});

// Helper function for getting conversation context in API endpoints
export function getConversationContext(sessionId: string, currentQuery: string): {
  relevantHistory: ConversationMessage[];
  contextText: string;
  sessionSummary: any;
} {
  const relevantHistory = conversationMemory.getRelevantHistory(sessionId, currentQuery);
  const contextText = conversationMemory.getConversationalContext(sessionId, currentQuery);
  const sessionSummary = conversationMemory.getSessionSummary(sessionId);
  
  return {
    relevantHistory,
    contextText,
    sessionSummary
  };
}