import { IntentHierarchy, IntentHierarchyManager } from './hierarchical/intent-hierarchy';
import { generateQueryEmbedding } from '../embedding-generator';
import { cosineSimilarity } from '../semantic-search';

export interface CombinedClassificationResult {
  // Legacy format for backward compatibility
  intent: string;
  confidence: number;
  
  // New hierarchical format
  hierarchical: {
    level1?: {
      intent: IntentHierarchy;
      confidence: number;
    };
    level2?: {
      intent: IntentHierarchy;
      confidence: number;
    };
    level3?: {
      intent: IntentHierarchy;
      confidence: number;
    };
    path: string[];
    overallConfidence: number;
  };
  
  // Processing metadata
  processingTime: number;
  method: 'hierarchical' | 'fallback';
}

export class CombinedClassifier {
  private hierarchyManager: IntentHierarchyManager;
  private intentEmbeddings: Map<string, number[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.hierarchyManager = new IntentHierarchyManager();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing combined classifier...');
    
    // Generate embeddings for all intents
    const allIntents = this.hierarchyManager.getAllIntents();
    
    for (const intent of allIntents) {
      try {
        const textToEmbed = [
          intent.name,
          intent.description,
          ...intent.keywords,
          ...intent.examples
        ].join(' ');
        
        const embedding = await generateQueryEmbedding(textToEmbed);
        if (embedding) {
          this.intentEmbeddings.set(intent.id, embedding);
        }
      } catch (error) {
        console.error(`Failed to generate embedding for intent ${intent.id}:`, error);
      }
    }

    this.isInitialized = true;
    console.log(`Combined classifier initialized with ${this.intentEmbeddings.size} intents`);
  }

  async classifyIntent(query: string): Promise<CombinedClassificationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateQueryEmbedding(query);
      if (!queryEmbedding) {
        return this.createFallbackResult(query, startTime);
      }

      // Step 1: Classify at Level 1 (Domains)
      const level1Results = this.classifyAtLevel(queryEmbedding, 1);
      const bestLevel1 = level1Results[0];
      
      if (!bestLevel1 || bestLevel1.confidence < bestLevel1.intent.confidence_threshold) {
        return this.createFallbackResult(query, startTime);
      }

      // Step 2: Classify at Level 2 (Categories) within the best Level 1 domain
      const level2Candidates = this.hierarchyManager.getChildrenOf(bestLevel1.intent.id);
      const level2Results = this.classifyAmongCandidates(queryEmbedding, level2Candidates);
      const bestLevel2 = level2Results[0];

             if (!bestLevel2 || bestLevel2.confidence < bestLevel2.intent.confidence_threshold) {
         return this.createHierarchicalResult(bestLevel1, startTime);
       }

       // Step 3: Classify at Level 3 (Specific Intents) within the best Level 2 category
       const level3Candidates = this.hierarchyManager.getChildrenOf(bestLevel2.intent.id);
       const level3Results = this.classifyAmongCandidates(queryEmbedding, level3Candidates);
       const bestLevel3 = level3Results[0];

       if (!bestLevel3 || bestLevel3.confidence < bestLevel3.intent.confidence_threshold) {
         return this.createHierarchicalResult(bestLevel1, startTime, bestLevel2);
       }

       // Return full hierarchical result
       return this.createHierarchicalResult(bestLevel1, startTime, bestLevel2, bestLevel3);

    } catch (error) {
      console.error('Error in hierarchical classification:', error);
      return this.createFallbackResult(query, startTime);
    }
  }

  private classifyAtLevel(queryEmbedding: number[], level: 1 | 2 | 3): {
    intent: IntentHierarchy;
    confidence: number;
  }[] {
    const candidates = this.hierarchyManager.getIntentsByLevel(level);
    return this.classifyAmongCandidates(queryEmbedding, candidates);
  }

  private classifyAmongCandidates(
    queryEmbedding: number[],
    candidates: IntentHierarchy[]
  ): {
    intent: IntentHierarchy;
    confidence: number;
  }[] {
    const results: {
      intent: IntentHierarchy;
      confidence: number;
    }[] = [];

    for (const candidate of candidates) {
      const candidateEmbedding = this.intentEmbeddings.get(candidate.id);
      if (!candidateEmbedding) continue;

      const similarity = cosineSimilarity(queryEmbedding, candidateEmbedding);

      results.push({
        intent: candidate,
        confidence: similarity
      });
    }

    // Sort by confidence (descending)
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private createHierarchicalResult(
    level1: { intent: IntentHierarchy; confidence: number },
    startTime: number,
    level2?: { intent: IntentHierarchy; confidence: number },
    level3?: { intent: IntentHierarchy; confidence: number }
  ): CombinedClassificationResult {
    const path: string[] = [level1.intent.id];
    if (level2) path.push(level2.intent.id);
    if (level3) path.push(level3.intent.id);

    // Calculate overall confidence as weighted average
    let overallConfidence = level1.confidence * 0.3;
    if (level2) overallConfidence += level2.confidence * 0.4;
    if (level3) overallConfidence += level3.confidence * 0.3;
    else if (level2) overallConfidence = level1.confidence * 0.4 + level2.confidence * 0.6;

    // For backward compatibility, use the most specific intent as the main intent
    const mainIntent = level3 || level2 || level1;

    return {
      intent: mainIntent.intent.id,
      confidence: mainIntent.confidence,
      hierarchical: {
        level1: {
          intent: level1.intent,
          confidence: level1.confidence
        },
        level2: level2 ? {
          intent: level2.intent,
          confidence: level2.confidence
        } : undefined,
        level3: level3 ? {
          intent: level3.intent,
          confidence: level3.confidence
        } : undefined,
        path,
        overallConfidence
      },
      processingTime: Date.now() - startTime,
      method: 'hierarchical'
    };
  }

  private createFallbackResult(query: string, startTime: number): CombinedClassificationResult {
    // Simple keyword-based fallback
    const lowerQuery = query.toLowerCase();
    let fallbackIntent = 'general';
    let fallbackConfidence = 0.3;

    if (lowerQuery.includes('work') || lowerQuery.includes('job') || lowerQuery.includes('career')) {
      fallbackIntent = 'professional';
      fallbackConfidence = 0.4;
    } else if (lowerQuery.includes('code') || lowerQuery.includes('programming') || lowerQuery.includes('tech')) {
      fallbackIntent = 'technical';
      fallbackConfidence = 0.4;
    } else if (lowerQuery.includes('contact') || lowerQuery.includes('email') || lowerQuery.includes('reach')) {
      fallbackIntent = 'contact';
      fallbackConfidence = 0.4;
    }

    return {
      intent: fallbackIntent,
      confidence: fallbackConfidence,
      hierarchical: {
        path: [fallbackIntent],
        overallConfidence: fallbackConfidence
      },
      processingTime: Date.now() - startTime,
      method: 'fallback'
    };
  }

  // Legacy method for backward compatibility
  async classify(query: string): Promise<{ intent: string; confidence: number }> {
    const result = await this.classifyIntent(query);
    return {
      intent: result.intent,
      confidence: result.confidence
    };
  }

  getStats(): {
    totalIntents: number;
    initializedIntents: number;
    isInitialized: boolean;
  } {
    return {
      totalIntents: this.hierarchyManager.getAllIntents().length,
      initializedIntents: this.intentEmbeddings.size,
      isInitialized: this.isInitialized
    };
  }
}