import { IntentHierarchy, IntentHierarchyManager } from './intent-hierarchy';
import { generateQueryEmbedding } from '../../embedding-generator';
import { cosineSimilarity } from '../../semantic-search';

export interface HierarchicalClassificationResult {
  level1: {
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
  overallConfidence: number;
  path: string[];
  alternativeIntents: {
    intent: IntentHierarchy;
    confidence: number;
    level: number;
  }[];
}

export interface ClassificationMetrics {
  processingTime: number;
  embeddingTime: number;
  classificationTime: number;
  totalCandidates: number;
  finalCandidates: number;
}

export class HierarchicalClassifier {
  private hierarchyManager: IntentHierarchyManager;
  private intentEmbeddings: Map<string, number[]> = new Map();
  private isInitialized = false;

  constructor(hierarchyManager: IntentHierarchyManager) {
    this.hierarchyManager = hierarchyManager;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing hierarchical classifier...');
    
    // Generate embeddings for all intents
    const allIntents = this.hierarchyManager.getAllIntents();
    const embeddingPromises = allIntents.map(async (intent) => {
      // Combine keywords and examples for embedding
      const textToEmbed = [
        intent.name,
        intent.description,
        ...intent.keywords,
        ...intent.examples
      ].join(' ');
      
      const embedding = await generateQueryEmbedding(textToEmbed);
      this.intentEmbeddings.set(intent.id, embedding);
    });

    await Promise.all(embeddingPromises);
    this.isInitialized = true;
    console.log(`Hierarchical classifier initialized with ${allIntents.length} intents`);
  }

  async classifyIntent(query: string): Promise<HierarchicalClassificationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    // Generate embedding for the query
    const embeddingStartTime = Date.now();
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const embeddingTime = Date.now() - embeddingStartTime;

    const classificationStartTime = Date.now();
    
    // Step 1: Classify at Level 1 (Domains)
    const level1Results = await this.classifyAtLevel(queryEmbedding, 1);
    const bestLevel1 = level1Results[0];
    
    if (!bestLevel1 || bestLevel1.confidence < bestLevel1.intent.confidence_threshold) {
      return this.createFallbackResult(level1Results, {
        processingTime: Date.now() - startTime,
        embeddingTime,
        classificationTime: Date.now() - classificationStartTime,
        totalCandidates: level1Results.length,
        finalCandidates: 0
      });
    }

    // Step 2: Classify at Level 2 (Categories) within the best Level 1 domain
    const level2Candidates = this.hierarchyManager.getChildrenOf(bestLevel1.intent.id);
    const level2Results = await this.classifyAmongCandidates(queryEmbedding, level2Candidates);
    const bestLevel2 = level2Results[0];

    if (!bestLevel2 || bestLevel2.confidence < bestLevel2.intent.confidence_threshold) {
      return this.createResult(bestLevel1, undefined, undefined, level1Results, {
        processingTime: Date.now() - startTime,
        embeddingTime,
        classificationTime: Date.now() - classificationStartTime,
        totalCandidates: level1Results.length + level2Results.length,
        finalCandidates: 1
      });
    }

    // Step 3: Classify at Level 3 (Specific Intents) within the best Level 2 category
    const level3Candidates = this.hierarchyManager.getChildrenOf(bestLevel2.intent.id);
    const level3Results = await this.classifyAmongCandidates(queryEmbedding, level3Candidates);
    const bestLevel3 = level3Results[0];

    if (!bestLevel3 || bestLevel3.confidence < bestLevel3.intent.confidence_threshold) {
      return this.createResult(bestLevel1, bestLevel2, undefined, [...level1Results, ...level2Results], {
        processingTime: Date.now() - startTime,
        embeddingTime,
        classificationTime: Date.now() - classificationStartTime,
        totalCandidates: level1Results.length + level2Results.length + level3Results.length,
        finalCandidates: 2
      });
    }

    // Return full hierarchical result
    const allAlternatives = [...level1Results, ...level2Results, ...level3Results];
    return this.createResult(bestLevel1, bestLevel2, bestLevel3, allAlternatives, {
      processingTime: Date.now() - startTime,
      embeddingTime,
      classificationTime: Date.now() - classificationStartTime,
      totalCandidates: level1Results.length + level2Results.length + level3Results.length,
      finalCandidates: 3
    });
  }

  private async classifyAtLevel(queryEmbedding: number[], level: 1 | 2 | 3): Promise<{
    intent: IntentHierarchy;
    confidence: number;
    level: number;
  }[]> {
    const candidates = this.hierarchyManager.getIntentsByLevel(level);
    return this.classifyAmongCandidates(queryEmbedding, candidates);
  }

  private async classifyAmongCandidates(
    queryEmbedding: number[],
    candidates: IntentHierarchy[]
  ): Promise<{
    intent: IntentHierarchy;
    confidence: number;
    level: number;
  }[]> {
    const results: {
      intent: IntentHierarchy;
      confidence: number;
      level: number;
    }[] = [];

    for (const candidate of candidates) {
      const candidateEmbedding = this.intentEmbeddings.get(candidate.id);
      if (!candidateEmbedding) continue;

      const similarity = this.similarityCalculator.cosineSimilarity(
        queryEmbedding,
        candidateEmbedding
      );

      results.push({
        intent: candidate,
        confidence: similarity,
        level: candidate.level
      });
    }

    // Sort by confidence (descending)
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private createResult(
    level1: { intent: IntentHierarchy; confidence: number; level: number },
    level2?: { intent: IntentHierarchy; confidence: number; level: number },
    level3?: { intent: IntentHierarchy; confidence: number; level: number },
    alternatives: { intent: IntentHierarchy; confidence: number; level: number }[] = [],
    metrics: ClassificationMetrics
  ): HierarchicalClassificationResult {
    const path: string[] = [level1.intent.id];
    if (level2) path.push(level2.intent.id);
    if (level3) path.push(level3.intent.id);

    // Calculate overall confidence as weighted average
    let overallConfidence = level1.confidence * 0.3;
    if (level2) overallConfidence += level2.confidence * 0.4;
    if (level3) overallConfidence += level3.confidence * 0.3;
    else if (level2) overallConfidence = level1.confidence * 0.4 + level2.confidence * 0.6;

    // Filter alternatives to exclude the selected intents
    const selectedIds = new Set(path);
    const alternativeIntents = alternatives
      .filter(alt => !selectedIds.has(alt.intent.id))
      .slice(0, 5); // Top 5 alternatives

    return {
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
      overallConfidence,
      path,
      alternativeIntents,
      metrics
    } as HierarchicalClassificationResult & { metrics: ClassificationMetrics };
  }

  private createFallbackResult(
    level1Results: { intent: IntentHierarchy; confidence: number; level: number }[],
    metrics: ClassificationMetrics
  ): HierarchicalClassificationResult {
    // Return the best level 1 result even if below threshold
    const bestLevel1 = level1Results[0];
    
    if (!bestLevel1) {
      // Ultimate fallback - return a generic intent
      const fallbackIntent: IntentHierarchy = {
        id: 'unknown',
        name: 'Unknown Intent',
        description: 'Could not classify the intent',
        level: 1,
        keywords: [],
        examples: [],
        confidence_threshold: 0.5
      };
      
      return {
        level1: {
          intent: fallbackIntent,
          confidence: 0.1
        },
        overallConfidence: 0.1,
        path: ['unknown'],
        alternativeIntents: level1Results.slice(0, 5),
        metrics
      } as HierarchicalClassificationResult & { metrics: ClassificationMetrics };
    }

    return {
      level1: {
        intent: bestLevel1.intent,
        confidence: bestLevel1.confidence
      },
      overallConfidence: bestLevel1.confidence,
      path: [bestLevel1.intent.id],
      alternativeIntents: level1Results.slice(1, 6),
      metrics
    } as HierarchicalClassificationResult & { metrics: ClassificationMetrics };
  }

  async batchClassify(queries: string[]): Promise<HierarchicalClassificationResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = await Promise.all(
      queries.map(query => this.classifyIntent(query))
    );

    return results;
  }

  async getIntentEmbedding(intentId: string): Promise<number[] | undefined> {
    return this.intentEmbeddings.get(intentId);
  }

  getClassificationStats(): {
    totalIntents: number;
    level1Intents: number;
    level2Intents: number;
    level3Intents: number;
    averageConfidenceThreshold: number;
  } {
    const allIntents = this.hierarchyManager.getAllIntents();
    const level1Count = this.hierarchyManager.getIntentsByLevel(1).length;
    const level2Count = this.hierarchyManager.getIntentsByLevel(2).length;
    const level3Count = this.hierarchyManager.getIntentsByLevel(3).length;
    
    const avgThreshold = allIntents.reduce((sum, intent) => sum + intent.confidence_threshold, 0) / allIntents.length;

    return {
      totalIntents: allIntents.length,
      level1Intents: level1Count,
      level2Intents: level2Count,
      level3Intents: level3Count,
      averageConfidenceThreshold: avgThreshold
    };
  }

  async validateClassifier(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if initialized
    if (!this.isInitialized) {
      errors.push('Classifier not initialized');
      return { isValid: false, errors, warnings };
    }

    // Check if all intents have embeddings
    const allIntents = this.hierarchyManager.getAllIntents();
    for (const intent of allIntents) {
      if (!this.intentEmbeddings.has(intent.id)) {
        errors.push(`Missing embedding for intent: ${intent.id}`);
      }
    }

    // Validate hierarchy structure
    const hierarchyValidation = this.hierarchyManager.validateHierarchy();
    if (!hierarchyValidation.valid) {
      errors.push(...hierarchyValidation.errors);
    }

    // Check for reasonable confidence thresholds
    for (const intent of allIntents) {
      if (intent.confidence_threshold < 0.1 || intent.confidence_threshold > 0.95) {
        warnings.push(`Unusual confidence threshold for ${intent.id}: ${intent.confidence_threshold}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}