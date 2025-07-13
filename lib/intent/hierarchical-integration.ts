import { CombinedClassifier, CombinedClassificationResult } from './combined-classifier';
import { IntentHierarchyManager } from './hierarchical/intent-hierarchy';
import { MemoryManager } from '../context/memory-manager';

export interface IntegratedClassificationResult {
  // Legacy format
  intent: string;
  confidence: number;
  
  // Enhanced format
  hierarchical: {
    path: string[];
    levels: {
      level1?: { id: string; name: string; confidence: number };
      level2?: { id: string; name: string; confidence: number };
      level3?: { id: string; name: string; confidence: number };
    };
    overallConfidence: number;
  };
  
  // Context integration
  context: {
    relevantMemories: any[];
    memoryCount: number;
    contextScore: number;
  };
  
  // Processing metadata
  processingTime: number;
  method: 'hierarchical' | 'fallback';
  timestamp: Date;
}

export class HierarchicalIntegration {
  private combinedClassifier: CombinedClassifier;
  private hierarchyManager: IntentHierarchyManager;
  private memoryManager: MemoryManager;
  private isInitialized = false;

  constructor() {
    this.combinedClassifier = new CombinedClassifier();
    this.hierarchyManager = new IntentHierarchyManager();
    this.memoryManager = new MemoryManager();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing hierarchical integration...');
    
    try {
      // Initialize the combined classifier
      await this.combinedClassifier.initialize();
      
      // Validate hierarchy structure
      const hierarchyValidation = this.hierarchyManager.validateHierarchy();
      if (!hierarchyValidation.valid) {
        console.warn('Hierarchy validation warnings:', hierarchyValidation.errors);
      }

      this.isInitialized = true;
      console.log('Hierarchical integration initialized successfully');
      
    } catch (error) {
      console.error('Error initializing hierarchical integration:', error);
      throw error;
    }
  }

  async classifyWithContext(
    query: string,
    sessionId?: string,
    userId?: string
  ): Promise<IntegratedClassificationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      // Step 1: Classify the intent hierarchically
      const classificationResult = await this.combinedClassifier.classifyIntent(query);
      
      // Step 2: Retrieve relevant context from memory
      const contextResult = await this.memoryManager.searchMemory({
        query,
        type: 'all',
        limit: 10,
        relevanceThreshold: 0.3,
        sessionId,
        userId
      });

      // Step 3: Calculate context score
      const contextScore = this.calculateContextScore(contextResult.memories, classificationResult);
      
      // Step 4: Store this interaction in working memory
      await this.memoryManager.addToWorkingMemory(
        query,
        {
          source: 'user_query',
          relevance: classificationResult.confidence,
          tags: [classificationResult.intent, 'classification'],
          sessionId,
          userId
        }
      );

      // Step 5: Build integrated result
      const result: IntegratedClassificationResult = {
        intent: classificationResult.intent,
        confidence: classificationResult.confidence,
        hierarchical: {
          path: classificationResult.hierarchical.path,
          levels: {
            level1: classificationResult.hierarchical.level1 ? {
              id: classificationResult.hierarchical.level1.intent.id,
              name: classificationResult.hierarchical.level1.intent.name,
              confidence: classificationResult.hierarchical.level1.confidence
            } : undefined,
            level2: classificationResult.hierarchical.level2 ? {
              id: classificationResult.hierarchical.level2.intent.id,
              name: classificationResult.hierarchical.level2.intent.name,
              confidence: classificationResult.hierarchical.level2.confidence
            } : undefined,
            level3: classificationResult.hierarchical.level3 ? {
              id: classificationResult.hierarchical.level3.intent.id,
              name: classificationResult.hierarchical.level3.intent.name,
              confidence: classificationResult.hierarchical.level3.confidence
            } : undefined
          },
          overallConfidence: classificationResult.hierarchical.overallConfidence
        },
        context: {
          relevantMemories: contextResult.memories,
          memoryCount: contextResult.totalFound,
          contextScore
        },
        processingTime: Date.now() - startTime,
        method: classificationResult.method,
        timestamp: new Date()
      };

      return result;

    } catch (error) {
      console.error('Error in hierarchical classification with context:', error);
      
      // Fallback result
      return {
        intent: 'general',
        confidence: 0.2,
        hierarchical: {
          path: ['general'],
          levels: {},
          overallConfidence: 0.2
        },
        context: {
          relevantMemories: [],
          memoryCount: 0,
          contextScore: 0
        },
        processingTime: Date.now() - startTime,
        method: 'fallback',
        timestamp: new Date()
      };
    }
  }

  private calculateContextScore(memories: any[], classificationResult: CombinedClassificationResult): number {
    if (memories.length === 0) return 0;

    let totalScore = 0;
    let relevantMemories = 0;

    for (const memory of memories) {
      // Check if memory is relevant to the classified intent
      const memoryText = memory.content.toLowerCase();
      const intentKeywords = this.getIntentKeywords(classificationResult.intent);
      
      let memoryScore = 0;
      for (const keyword of intentKeywords) {
        if (memoryText.includes(keyword.toLowerCase())) {
          memoryScore += 0.2;
        }
      }
      
      // Boost score based on memory type
      if (memory.type === 'semantic') {
        memoryScore *= 1.5;
      } else if (memory.type === 'episodic') {
        memoryScore *= 1.2;
      }
      
      // Consider memory relevance and decay
      memoryScore *= memory.metadata.relevance * memory.metadata.decay;
      
      if (memoryScore > 0.1) {
        totalScore += memoryScore;
        relevantMemories++;
      }
    }

    return relevantMemories > 0 ? Math.min(totalScore / relevantMemories, 1.0) : 0;
  }

  private getIntentKeywords(intentId: string): string[] {
    const intent = this.hierarchyManager.getIntentById(intentId);
    if (!intent) return [];
    
    return [...intent.keywords, intent.name];
  }

  // Legacy method for backward compatibility
  async classify(query: string): Promise<{ intent: string; confidence: number }> {
    const result = await this.classifyWithContext(query);
    return {
      intent: result.intent,
      confidence: result.confidence
    };
  }

  // Enhanced method with session context
  async classifyWithSession(
    query: string,
    sessionId: string,
    userId?: string
  ): Promise<IntegratedClassificationResult> {
    return this.classifyWithContext(query, sessionId, userId);
  }

  // Get detailed intent information
  async getIntentDetails(intentId: string): Promise<{
    intent: any;
    hierarchy: any[];
    relatedIntents: any[];
    examples: string[];
  } | null> {
    const intent = this.hierarchyManager.getIntentById(intentId);
    if (!intent) return null;

    const hierarchy = this.hierarchyManager.getHierarchyPath(intentId);
    const relatedIntents = intent.parent ? 
      this.hierarchyManager.getChildrenOf(intent.parent) : 
      [];

    return {
      intent,
      hierarchy,
      relatedIntents,
      examples: intent.examples
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