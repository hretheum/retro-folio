import { Pinecone } from '@pinecone-database/pinecone';
import { generateQueryEmbedding } from '../embeddings/embedding-service';
import { calculateCosineSimilarity, calculateDynamicThreshold } from '../embeddings/similarity-calculator';

// Define QueryIntent type if not already defined
export type QueryIntent = 'SYNTHESIS' | 'EXPLORATION' | 'COMPARISON' | 'FACTUAL' | 'CASUAL';

export interface IntentClassificationResult {
  intent: QueryIntent;
  confidence: number;
  method: 'regex' | 'embedding';
  debugInfo?: {
    topMatches: Array<{
      intent: string;
      pattern: string;
      similarity: number;
    }>;
    processingTime: number;
    dynamicThreshold: number;
  };
}

export interface ClassifierOptions {
  includeDebugInfo?: boolean;
  confidenceThreshold?: number;
  namespace?: string;
}

export class EmbeddingIntentClassifier {
  private pinecone: Pinecone;
  private index: any;
  private namespace: string;
  private initialized: boolean = false;
  
  constructor(namespace: string = 'intent-patterns') {
    this.namespace = namespace;
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.index = this.pinecone.index(process.env.PINECONE_INDEX!);
      
      // Verify namespace exists
      const stats = await this.index.describeIndexStats();
      const namespaceStats = stats.namespaces?.[this.namespace];
      
      if (!namespaceStats || namespaceStats.recordCount === 0) {
        throw new Error(`Namespace '${this.namespace}' is empty or does not exist`);
      }
      
      console.log(`[CLASSIFIER] Initialized with ${namespaceStats.recordCount} patterns`);
      this.initialized = true;
    } catch (error) {
      console.error('[CLASSIFIER] Initialization failed:', error);
      throw error;
    }
  }
  
  async classifyIntent(
    query: string, 
    options: ClassifierOptions = {}
  ): Promise<IntentClassificationResult> {
    const startTime = Date.now();
    const { 
      includeDebugInfo = true,
      confidenceThreshold = 0.7
    } = options;
    
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Generate query embedding
      const queryEmbedding = await generateQueryEmbedding(query);
      
      // Search for similar patterns in Pinecone
      const searchResults = await this.index
        .namespace(this.namespace)
        .query({
          vector: queryEmbedding,
          topK: 10,
          includeMetadata: true,
        });
      
      if (!searchResults.matches || searchResults.matches.length === 0) {
        return {
          intent: 'CASUAL',
          confidence: 0,
          method: 'embedding',
          debugInfo: includeDebugInfo ? {
            topMatches: [],
            processingTime: Date.now() - startTime,
            dynamicThreshold: confidenceThreshold
          } : undefined
        };
      }
      
      // Group scores by intent
      const intentScores = new Map<string, number[]>();
      const topMatches: Array<{ intent: string; pattern: string; similarity: number }> = [];
      
      for (const match of searchResults.matches) {
        const intent = match.metadata?.intent as string;
        const pattern = match.metadata?.pattern as string;
        const score = match.score || 0;
        
        if (!intentScores.has(intent)) {
          intentScores.set(intent, []);
        }
        intentScores.get(intent)!.push(score);
        
        if (topMatches.length < 5) {
          topMatches.push({ intent, pattern, similarity: score });
        }
      }
      
      // Calculate average score per intent
      const intentAverages = Array.from(intentScores.entries()).map(([intent, scores]) => ({
        intent,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        maxScore: Math.max(...scores)
      }));
      
      // Sort by average score
      intentAverages.sort((a, b) => b.avgScore - a.avgScore);
      
      // Get best intent
      const bestIntent = intentAverages[0];
      
      // Calculate dynamic threshold
      const allScores = searchResults.matches.map(m => m.score || 0);
      const dynamicThreshold = calculateDynamicThreshold(allScores);
      
      // Determine final intent and confidence
      let finalIntent: QueryIntent = 'CASUAL';
      let confidence = 0;
      
      if (bestIntent && bestIntent.avgScore >= Math.min(confidenceThreshold, dynamicThreshold)) {
        finalIntent = bestIntent.intent as QueryIntent;
        confidence = bestIntent.avgScore;
      }
      
      return {
        intent: finalIntent,
        confidence,
        method: 'embedding',
        debugInfo: includeDebugInfo ? {
          topMatches,
          processingTime: Date.now() - startTime,
          dynamicThreshold
        } : undefined
      };
      
    } catch (error) {
      console.error('[CLASSIFIER] Classification error:', error);
      
      // Fallback to CASUAL on error
      return {
        intent: 'CASUAL',
        confidence: 0,
        method: 'embedding',
        debugInfo: includeDebugInfo ? {
          topMatches: [],
          processingTime: Date.now() - startTime,
          dynamicThreshold: confidenceThreshold
        } : undefined
      };
    }
  }
  
  // Batch classification for testing
  async classifyBatch(
    queries: string[],
    options: ClassifierOptions = {}
  ): Promise<IntentClassificationResult[]> {
    const results: IntentClassificationResult[] = [];
    
    for (const query of queries) {
      const result = await this.classifyIntent(query, options);
      results.push(result);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}