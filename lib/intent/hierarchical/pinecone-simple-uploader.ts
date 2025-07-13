import { upsertEmbeddings, searchSimilar, clearNamespace } from '../../pinecone-client';
import { IntentHierarchyManager } from './intent-hierarchy';
import { generateQueryEmbedding } from '../../embedding-generator';
import type { EmbeddedChunk } from '../../embedding-generator';

export interface HierarchicalTrainingResult {
  success: boolean;
  uploaded: {
    level1: number;
    level2: number;
    level3: number;
    total: number;
  };
  errors: string[];
}

export class SimplePineconeUploader {
  private hierarchyManager: IntentHierarchyManager;
  
  private namespaces = {
    level1: 'hierarchical-l1',
    level2: 'hierarchical-l2',
    level3: 'hierarchical-l3'
  };

  constructor() {
    this.hierarchyManager = new IntentHierarchyManager();
  }

  async uploadHierarchicalData(): Promise<HierarchicalTrainingResult> {
    const results: HierarchicalTrainingResult = {
      success: true,
      uploaded: { level1: 0, level2: 0, level3: 0, total: 0 },
      errors: []
    };

    try {
      // Generate and upload Level 1 data
      const level1Chunks = await this.generateLevelChunks(1);
      if (level1Chunks.length > 0) {
        await upsertEmbeddings(level1Chunks, this.namespaces.level1);
        results.uploaded.level1 = level1Chunks.length;
        console.log(`Uploaded ${level1Chunks.length} Level 1 intents`);
      }

      // Generate and upload Level 2 data
      const level2Chunks = await this.generateLevelChunks(2);
      if (level2Chunks.length > 0) {
        await upsertEmbeddings(level2Chunks, this.namespaces.level2);
        results.uploaded.level2 = level2Chunks.length;
        console.log(`Uploaded ${level2Chunks.length} Level 2 intents`);
      }

      // Generate and upload Level 3 data
      const level3Chunks = await this.generateLevelChunks(3);
      if (level3Chunks.length > 0) {
        await upsertEmbeddings(level3Chunks, this.namespaces.level3);
        results.uploaded.level3 = level3Chunks.length;
        console.log(`Uploaded ${level3Chunks.length} Level 3 intents`);
      }

      results.uploaded.total = results.uploaded.level1 + results.uploaded.level2 + results.uploaded.level3;
      
      console.log('Hierarchical training data upload completed:', results.uploaded);
      return results;

    } catch (error) {
      console.error('Error uploading hierarchical data:', error);
      results.success = false;
      results.errors.push(`Upload error: ${error}`);
      return results;
    }
  }

  private async generateLevelChunks(level: 1 | 2 | 3): Promise<EmbeddedChunk[]> {
    const intents = this.hierarchyManager.getIntentsByLevel(level);
    const chunks: EmbeddedChunk[] = [];

    for (const intent of intents) {
      // Create training examples for each intent
      const trainingTexts = [
        ...intent.examples,
        ...intent.keywords.map(k => `Tell me about ${k}`),
        ...this.generateSyntheticExamples(intent)
      ];

      for (let i = 0; i < trainingTexts.length; i++) {
        const text = trainingTexts[i];
        const embedding = await generateQueryEmbedding(text);
        
        if (embedding) {
                                 chunks.push({
              id: `${intent.id}-${level}-${i}`,
              text,
              embedding,
              metadata: {
                contentId: intent.id,
                contentType: 'work' as const,
                chunkIndex: i,
                totalChunks: trainingTexts.length,
                tags: [`level-${intent.level}`, intent.name],
                role: intent.parent || 'root',
                featured: intent.confidence_threshold > 0.75,
                url: `intent://${intent.id}`,
                technologies: intent.keywords
              }
            });
        }
      }
    }

    return chunks;
  }

  private generateSyntheticExamples(intent: any): string[] {
    const examples: string[] = [];
    
    // Generate based on intent level
    if (intent.level === 1) {
      examples.push(
        `I want to know about ${intent.name.toLowerCase()}`,
        `Tell me about ${intent.name.toLowerCase()}`,
        `Can you help with ${intent.name.toLowerCase()}?`
      );
    } else if (intent.level === 2) {
      examples.push(
        `Show me your ${intent.name.toLowerCase()}`,
        `What about your ${intent.name.toLowerCase()}?`,
        `I'm interested in ${intent.name.toLowerCase()}`
      );
    } else if (intent.level === 3) {
      examples.push(
        `Tell me more about ${intent.name.toLowerCase()}`,
        `I need details about ${intent.name.toLowerCase()}`,
        `Can you describe ${intent.name.toLowerCase()}?`
      );
    }

    return examples;
  }

  async queryHierarchicalIntent(
    query: string,
    level: 1 | 2 | 3,
    topK: number = 5
  ): Promise<{
    matches: Array<{
      id: string;
      score: number;
      metadata: any;
    }>;
    namespace: string;
  }> {
    const embedding = await generateQueryEmbedding(query);
    if (!embedding) {
      return { matches: [], namespace: '' };
    }

    const namespace = level === 1 ? this.namespaces.level1 :
                     level === 2 ? this.namespaces.level2 :
                     this.namespaces.level3;

    try {
      const results = await searchSimilar(embedding, {
        topK,
        namespace,
        includeMetadata: true
      });

      return {
        matches: results.matches || [],
        namespace
      };
    } catch (error) {
      console.error(`Error querying level ${level}:`, error);
      return { matches: [], namespace };
    }
  }

  async clearHierarchicalData(): Promise<void> {
    try {
      await clearNamespace(this.namespaces.level1);
      await clearNamespace(this.namespaces.level2);
      await clearNamespace(this.namespaces.level3);
      console.log('Cleared all hierarchical namespaces');
    } catch (error) {
      console.error('Error clearing hierarchical data:', error);
    }
  }

  async validateHierarchicalData(): Promise<{
    valid: boolean;
    stats: {
      level1: number;
      level2: number;
      level3: number;
      total: number;
    };
    errors: string[];
  }> {
    const results = {
      valid: true,
      stats: { level1: 0, level2: 0, level3: 0, total: 0 },
      errors: [] as string[]
    };

    try {
      // Test query each level to validate data exists
      const testQuery = "test query";
      
      const level1Results = await this.queryHierarchicalIntent(testQuery, 1, 1);
      results.stats.level1 = level1Results.matches.length;
      
      const level2Results = await this.queryHierarchicalIntent(testQuery, 2, 1);
      results.stats.level2 = level2Results.matches.length;
      
      const level3Results = await this.queryHierarchicalIntent(testQuery, 3, 1);
      results.stats.level3 = level3Results.matches.length;
      
      results.stats.total = results.stats.level1 + results.stats.level2 + results.stats.level3;

      // Validate minimum requirements
      if (results.stats.level1 === 0) {
        results.errors.push('No Level 1 data found');
        results.valid = false;
      }
      if (results.stats.level2 === 0) {
        results.errors.push('No Level 2 data found');
        results.valid = false;
      }
      if (results.stats.level3 === 0) {
        results.errors.push('No Level 3 data found');
        results.valid = false;
      }

    } catch (error) {
      console.error('Error validating hierarchical data:', error);
      results.errors.push(`Validation error: ${error}`);
      results.valid = false;
    }

    return results;
  }

  getNamespaces(): { level1: string; level2: string; level3: string } {
    return this.namespaces;
  }

  getHierarchyStats(): {
    totalIntents: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  } {
    return {
      totalIntents: this.hierarchyManager.getAllIntents().length,
      level1Count: this.hierarchyManager.getIntentsByLevel(1).length,
      level2Count: this.hierarchyManager.getIntentsByLevel(2).length,
      level3Count: this.hierarchyManager.getIntentsByLevel(3).length
    };
  }
}