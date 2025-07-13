import { MemoryManager, MemoryEntry } from './memory-manager';
import { HierarchicalIntegration } from '../intent/hierarchical-integration';

export interface ContextualChatRequest {
  message: string;
  sessionId: string;
  userId?: string;
  metadata?: {
    timestamp: Date;
    source: string;
    context?: any;
  };
}

export interface ContextualChatResponse {
  response: string;
  intent: {
    classified: string;
    confidence: number;
    hierarchy: {
      path: string[];
      levels: any;
    };
  };
  context: {
    usedMemories: MemoryEntry[];
    memoryScore: number;
    conversationFlow: string[];
    sessionContext: any;
  };
  metadata: {
    processingTime: number;
    memoryOperations: number;
    conversationTurn: number;
  };
}

export interface ConversationSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  turnCount: number;
  context: {
    currentTopic: string;
    previousIntents: string[];
    userPreferences: Record<string, any>;
    conversationState: 'greeting' | 'inquiry' | 'deep_dive' | 'conclusion';
  };
  memories: {
    working: string[];
    episodic: string[];
    semantic: string[];
  };
}

export class ContextIntegration {
  private memoryManager: MemoryManager;
  private hierarchicalIntegration: HierarchicalIntegration;
  private sessions: Map<string, ConversationSession> = new Map();
  private conversationFlows: Map<string, string[]> = new Map();
  private combinedClassifier: any;
  private hierarchyManager: any;
  private isInitialized = false;

  constructor() {
    this.memoryManager = new MemoryManager();
    this.hierarchicalIntegration = new HierarchicalIntegration();
    this.combinedClassifier = this.hierarchicalIntegration;
    this.hierarchyManager = this.hierarchicalIntegration;
  }

  async initialize(): Promise<void> {
    await this.hierarchicalIntegration.initialize();
    console.log('Context integration initialized');
  }

  async processContextualMessage(request: ContextualChatRequest): Promise<ContextualChatResponse> {
    const startTime = Date.now();
    let memoryOperations = 0;

    try {
      // Step 1: Get or create session
      const session = await this.getOrCreateSession(request.sessionId, request.userId);
      memoryOperations++;

      // Step 2: Classify intent with context
      const classificationResult = await this.hierarchicalIntegration.classifyWithContext(
        request.message,
        request.sessionId,
        request.userId
      );
      memoryOperations++;

      // Step 3: Retrieve relevant context
      const contextMemories = await this.memoryManager.searchMemory({
        query: request.message,
        type: 'all',
        limit: 15,
        relevanceThreshold: 0.2,
        sessionId: request.sessionId,
        userId: request.userId
      });
      memoryOperations++;

      // Step 4: Update session context
      await this.updateSessionContext(session, request.message, classificationResult);
      memoryOperations++;

      // Step 5: Generate contextual response
      const response = await this.generateContextualResponse(
        request.message,
        classificationResult,
        contextMemories.memories,
        session
      );

      // Step 6: Store interaction in memory
      await this.storeInteraction(request, classificationResult, session);
      memoryOperations++;

      // Step 7: Update conversation flow
      this.updateConversationFlow(request.sessionId, classificationResult.intent);

      return {
        response,
        intent: {
          classified: classificationResult.intent,
          confidence: classificationResult.confidence,
          hierarchy: {
            path: classificationResult.hierarchical.path,
            levels: classificationResult.hierarchical.levels
          }
        },
        context: {
          usedMemories: contextMemories.memories,
          memoryScore: classificationResult.context.contextScore,
          conversationFlow: this.conversationFlows.get(request.sessionId) || [],
          sessionContext: session.context
        },
        metadata: {
          processingTime: Date.now() - startTime,
          memoryOperations,
          conversationTurn: session.turnCount
        }
      };

    } catch (error) {
      console.error('Error processing contextual message:', error);
      
      // Fallback response
      return {
        response: "I'm having trouble processing your request right now. Could you please try again?",
        intent: {
          classified: 'error',
          confidence: 0.1,
          hierarchy: {
            path: ['error'],
            levels: {}
          }
        },
        context: {
          usedMemories: [],
          memoryScore: 0,
          conversationFlow: [],
          sessionContext: {}
        },
        metadata: {
          processingTime: Date.now() - startTime,
          memoryOperations,
          conversationTurn: 0
        }
      };
    }
  }

  private async getOrCreateSession(sessionId: string, userId?: string): Promise<ConversationSession> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        userId,
        startTime: new Date(),
        lastActivity: new Date(),
        turnCount: 0,
        context: {
          currentTopic: '',
          previousIntents: [],
          userPreferences: {},
          conversationState: 'greeting'
        },
        memories: {
          working: [],
          episodic: [],
          semantic: []
        }
      };
      
      this.sessions.set(sessionId, session);
    }

    session.lastActivity = new Date();
    session.turnCount++;
    
    return session;
  }

  private async updateSessionContext(
    session: ConversationSession,
    message: string,
    classificationResult: any
  ): Promise<void> {
    // Update current topic
    if (classificationResult.confidence > 0.7) {
      session.context.currentTopic = classificationResult.intent;
    }

    // Update previous intents
    session.context.previousIntents.push(classificationResult.intent);
    if (session.context.previousIntents.length > 10) {
      session.context.previousIntents.shift();
    }

    // Update conversation state
    session.context.conversationState = this.determineConversationState(
      session.context.previousIntents,
      session.turnCount
    );

    // Extract user preferences
    await this.extractUserPreferences(message, session);
  }

  private determineConversationState(
    previousIntents: string[],
    turnCount: number
  ): 'greeting' | 'inquiry' | 'deep_dive' | 'conclusion' {
    if (turnCount <= 2) return 'greeting';
    
    const recentIntents = previousIntents.slice(-3);
    const uniqueIntents = new Set(recentIntents);
    
    if (uniqueIntents.size === 1 && recentIntents.length >= 2) {
      return 'deep_dive';
    }
    
    if (recentIntents.some(intent => 
      ['contact', 'goodbye', 'thanks'].includes(intent)
    )) {
      return 'conclusion';
    }
    
    return 'inquiry';
  }

  private async extractUserPreferences(message: string, session: ConversationSession): Promise<void> {
    const lowerMessage = message.toLowerCase();
    
    // Extract technology preferences
    const techKeywords = ['javascript', 'typescript', 'react', 'node', 'python', 'java'];
    for (const tech of techKeywords) {
      if (lowerMessage.includes(tech)) {
        session.context.userPreferences.preferredTechnologies = 
          session.context.userPreferences.preferredTechnologies || [];
        if (!session.context.userPreferences.preferredTechnologies.includes(tech)) {
          session.context.userPreferences.preferredTechnologies.push(tech);
        }
      }
    }

    // Extract communication style
    if (lowerMessage.includes('detail') || lowerMessage.includes('specific')) {
      session.context.userPreferences.communicationStyle = 'detailed';
    } else if (lowerMessage.includes('quick') || lowerMessage.includes('brief')) {
      session.context.userPreferences.communicationStyle = 'brief';
    }

    // Extract interest areas
    const interestKeywords = ['career', 'project', 'experience', 'skill', 'background'];
    for (const interest of interestKeywords) {
      if (lowerMessage.includes(interest)) {
        session.context.userPreferences.interests = 
          session.context.userPreferences.interests || [];
        if (!session.context.userPreferences.interests.includes(interest)) {
          session.context.userPreferences.interests.push(interest);
        }
      }
    }
  }

  private async generateContextualResponse(
    message: string,
    classificationResult: any,
    contextMemories: MemoryEntry[],
    session: ConversationSession
  ): Promise<string> {
    const intent = classificationResult.intent;
    const confidence = classificationResult.confidence;
    const conversationState = session.context.conversationState;
    
    // Base response templates
    const responses = {
      'current_role': [
        "I'm currently working as a Full Stack Developer, focusing on modern web technologies and AI integration.",
        "My current role involves developing scalable web applications and implementing AI-powered features.",
        "I'm currently engaged in full-stack development with a special focus on React, TypeScript, and AI technologies."
      ],
      'technical_skills': [
        "I specialize in JavaScript, TypeScript, React, Node.js, and I'm particularly interested in AI integration.",
        "My technical stack includes modern web technologies like React, TypeScript, and backend development with Node.js.",
        "I work with a variety of technologies including React, TypeScript, Node.js, and I'm exploring AI/ML integration."
      ],
      'projects': [
        "I've been working on several interesting projects, including AI-powered chat systems and modern web applications.",
        "My recent projects include building intelligent chat interfaces and developing full-stack applications.",
        "I'm currently working on projects that combine traditional web development with AI capabilities."
      ],
      'contact': [
        "You can reach me through this chat interface, or I can provide you with my contact information.",
        "I'm available for discussion right here, or I can share my contact details if you'd like to connect elsewhere.",
        "Feel free to continue our conversation here, or let me know if you'd like my contact information."
      ],
      'professional': [
        "I'm a developer with experience in full-stack development, particularly interested in AI integration and modern web technologies.",
        "My professional background includes web development, with a focus on creating intelligent, user-friendly applications.",
        "I work in software development, specializing in modern web technologies and AI-powered solutions."
      ]
    };

    // Get base response
    let baseResponse = responses[intent] || responses['professional'];
    let response = baseResponse[Math.floor(Math.random() * baseResponse.length)];

    // Contextualize based on conversation state
    if (conversationState === 'greeting' && session.turnCount <= 2) {
      response = `Hello! ${response}`;
    } else if (conversationState === 'deep_dive') {
      response = `To elaborate further, ${response.toLowerCase()}`;
    } else if (conversationState === 'conclusion') {
      response = `${response} Thank you for your interest!`;
    }

    // Add context from memories
    if (contextMemories.length > 0) {
      const relevantMemory = contextMemories.find(m => 
        m.metadata.relevance > 0.7 && m.type === 'semantic'
      );
      
      if (relevantMemory) {
        response += ` Based on our previous conversation, I should also mention that ${relevantMemory.content.substring(0, 100)}...`;
      }
    }

    // Personalize based on user preferences
    if (session.context.userPreferences.communicationStyle === 'brief') {
      response = response.split('.')[0] + '.';
    } else if (session.context.userPreferences.communicationStyle === 'detailed') {
      response += ' Would you like me to go into more detail about any specific aspect?';
    }

    return response;
  }

  private async storeInteraction(
    request: ContextualChatRequest,
    classificationResult: any,
    session: ConversationSession
  ): Promise<void> {
    // Store in working memory
    const workingMemoryId = await this.memoryManager.addToWorkingMemory(
      request.message,
      {
        source: 'user_input',
        relevance: classificationResult.confidence,
        tags: [classificationResult.intent, 'user_query'],
        sessionId: request.sessionId,
        userId: request.userId
      }
    );
    session.memories.working.push(workingMemoryId);

    // Store in episodic memory if significant
    if (classificationResult.confidence > 0.6) {
      const episodicMemoryId = await this.memoryManager.addToEpisodicMemory(
        request.message,
        {
          startTime: new Date(),
          participants: [request.userId || 'unknown'],
          summary: `User asked about ${classificationResult.intent}`,
          location: 'chat_interface'
        },
        {
          source: 'conversation',
          relevance: classificationResult.confidence,
          tags: [classificationResult.intent, 'conversation'],
          sessionId: request.sessionId,
          userId: request.userId
        }
      );
      session.memories.episodic.push(episodicMemoryId);
    }

    // Store in semantic memory for knowledge extraction
    if (classificationResult.confidence > 0.8) {
      const semanticMemoryId = await this.memoryManager.addToSemanticMemory(
        `User interest: ${classificationResult.intent}`,
        {
          category: classificationResult.hierarchical.path[0] || 'general',
          relationships: classificationResult.hierarchical.path,
          confidence: classificationResult.confidence,
          lastAccessed: new Date(),
          accessCount: 1
        },
        {
          source: 'intent_classification',
          relevance: classificationResult.confidence,
          tags: ['user_interest', classificationResult.intent],
          sessionId: request.sessionId,
          userId: request.userId
        }
      );
      session.memories.semantic.push(semanticMemoryId);
    }
  }

  private updateConversationFlow(sessionId: string, intent: string): void {
    let flow = this.conversationFlows.get(sessionId) || [];
    flow.push(intent);
    
    // Keep only last 20 intents
    if (flow.length > 20) {
      flow = flow.slice(-20);
    }
    
    this.conversationFlows.set(sessionId, flow);
  }

  // Session management methods
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async getAllSessions(): Promise<ConversationSession[]> {
    return Array.from(this.sessions.values());
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.conversationFlows.delete(sessionId);
  }

  async getSessionStats(sessionId: string): Promise<{
    session: ConversationSession | null;
    memoryStats: {
      working: number;
      episodic: number;
      semantic: number;
    };
    conversationFlow: string[];
  }> {
    const session = this.sessions.get(sessionId);
    
    return {
      session,
      memoryStats: {
        working: session?.memories.working.length || 0,
        episodic: session?.memories.episodic.length || 0,
        semantic: session?.memories.semantic.length || 0
      },
      conversationFlow: this.conversationFlows.get(sessionId) || []
    };
  }

  // Cleanup old sessions
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<number> {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > maxAge) {
        await this.clearSession(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Analytics and insights
  async getConversationInsights(): Promise<{
    totalSessions: number;
    activeSessions: number;
    averageSessionLength: number;
    topIntents: Array<{ intent: string; count: number }>;
    conversationStates: Record<string, number>;
  }> {
    const sessions = Array.from(this.sessions.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const activeSessions = sessions.filter(s => s.lastActivity > oneHourAgo);
    const averageSessionLength = sessions.reduce((sum, s) => sum + s.turnCount, 0) / sessions.length;
    
    // Count intents
    const intentCounts = new Map<string, number>();
    const stateCounts = new Map<string, number>();
    
    sessions.forEach(session => {
      session.context.previousIntents.forEach(intent => {
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      });
      
      const state = session.context.conversationState;
      stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
    });
    
    const topIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count }));

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      averageSessionLength,
      topIntents,
      conversationStates: Object.fromEntries(stateCounts)
    };
  }

  // Get system statistics
  getSystemStats(): {
    classification: any;
    memory: any;
    hierarchy: any;
    isInitialized: boolean;
  } {
    return {
      classification: this.combinedClassifier.getStats(),
      memory: this.memoryManager.getMemoryStats(),
      hierarchy: {
        totalIntents: this.hierarchyManager.getAllIntents().length,
        level1: this.hierarchyManager.getIntentsByLevel(1).length,
        level2: this.hierarchyManager.getIntentsByLevel(2).length,
        level3: this.hierarchyManager.getIntentsByLevel(3).length
      },
      isInitialized: this.isInitialized
    };
  }

  // Context management methods
  async addContextualMemory(
    content: string,
    type: 'working' | 'episodic' | 'semantic',
    metadata: any = {}
  ): Promise<string> {
    switch (type) {
      case 'working':
        return this.memoryManager.addToWorkingMemory(content, metadata);
      case 'episodic':
        return this.memoryManager.addToEpisodicMemory(content, {
          startTime: new Date(),
          participants: [metadata.userId || 'unknown'],
          summary: content.substring(0, 100)
        }, metadata);
      case 'semantic':
        return this.memoryManager.addToSemanticMemory(content, {
          category: metadata.category || 'general',
          relationships: metadata.relationships || [],
          confidence: metadata.confidence || 0.8,
          lastAccessed: new Date(),
          accessCount: 1
        }, metadata);
      default:
        throw new Error(`Unknown memory type: ${type}`);
    }
  }

  async consolidateMemories(): Promise<void> {
    await this.memoryManager.consolidateMemory();
  }

  // Validation and health check
  async validateSystem(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    performance: {
      averageClassificationTime: number;
      memoryUtilization: number;
      hierarchyHealth: number;
    };
  }> {
    const results = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      performance: {
        averageClassificationTime: 0,
        memoryUtilization: 0,
        hierarchyHealth: 0
      }
    };

    try {
      // Test classification performance
      const testQueries = [
        'Tell me about your work experience',
        'What programming languages do you know?',
        'How can I contact you?',
        'What are your current projects?',
        'Tell me about your background'
      ];

      let totalTime = 0;
      let successfulClassifications = 0;

      for (const query of testQueries) {
        try {
          const result = await this.classifyWithContext(query);
          totalTime += result.processingTime;
          
          if (result.confidence > 0.3) {
            successfulClassifications++;
          }
        } catch (error) {
          results.errors.push(`Classification failed for: "${query}"`);
          results.valid = false;
        }
      }

      results.performance.averageClassificationTime = totalTime / testQueries.length;
      
      if (successfulClassifications < testQueries.length * 0.8) {
        results.warnings.push('Low classification success rate');
      }

      // Check memory utilization
      const memoryStats = this.memoryManager.getMemoryStats();
      results.performance.memoryUtilization = 
        memoryStats.totalMemories / (memoryStats.working.maxSize + memoryStats.episodic.maxSize + memoryStats.semantic.maxSize);

      // Check hierarchy health
      const hierarchyValidation = this.hierarchyManager.validateHierarchy();
      results.performance.hierarchyHealth = hierarchyValidation.valid ? 1.0 : 0.5;
      
      if (!hierarchyValidation.valid) {
        results.warnings.push(...hierarchyValidation.errors);
      }

      // Performance thresholds
      if (results.performance.averageClassificationTime > 1000) {
        results.warnings.push('High classification latency detected');
      }

      if (results.performance.memoryUtilization > 0.9) {
        results.warnings.push('High memory utilization');
      }

    } catch (error) {
      results.errors.push(`System validation error: ${error}`);
      results.valid = false;
    }

    return results;
  }
}