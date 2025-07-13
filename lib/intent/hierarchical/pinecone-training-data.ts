import { pinecone, upsertEmbeddings, searchSimilar, clearNamespace, getIndexStats } from '../../pinecone-client';
import { IntentHierarchyManager, INTENT_HIERARCHY } from './intent-hierarchy';
import { generateQueryEmbedding } from '../../embedding-generator';

export interface TrainingDataPoint {
  id: string;
  text: string;
  intentId: string;
  level: 1 | 2 | 3;
  metadata: {
    intent: string;
    level: number;
    parent?: string;
    confidence: number;
    category: string;
    keywords: string[];
    examples: string[];
  };
  embedding: number[];
}

export class PineconeTrainingDataUploader {
  private hierarchyManager: IntentHierarchyManager;
  private indexName: string;
  
  private namespaces = {
    level1: 'hierarchical-intent-l1',
    level2: 'hierarchical-intent-l2',
    level3: 'hierarchical-intent-l3'
  };

  constructor(indexName: string = 'intent-classification') {
    this.hierarchyManager = new IntentHierarchyManager();
    this.indexName = indexName;
  }

  async uploadAllTrainingData(): Promise<{
    success: boolean;
    uploaded: {
      level1: number;
      level2: number;
      level3: number;
      total: number;
    };
    errors: string[];
  }> {
    const results = {
      success: true,
      uploaded: { level1: 0, level2: 0, level3: 0, total: 0 },
      errors: [] as string[]
    };

    try {
      // Upload Level 1 data
      const level1Data = await this.generateTrainingData(1);
      const level1Results = await this.uploadTrainingDataToNamespace(level1Data, this.namespaces.level1);
      results.uploaded.level1 = level1Results.uploaded;
      results.errors.push(...level1Results.errors);

      // Upload Level 2 data
      const level2Data = await this.generateTrainingData(2);
      const level2Results = await this.uploadTrainingDataToNamespace(level2Data, this.namespaces.level2);
      results.uploaded.level2 = level2Results.uploaded;
      results.errors.push(...level2Results.errors);

      // Upload Level 3 data
      const level3Data = await this.generateTrainingData(3);
      const level3Results = await this.uploadTrainingDataToNamespace(level3Data, this.namespaces.level3);
      results.uploaded.level3 = level3Results.uploaded;
      results.errors.push(...level3Results.errors);

      results.uploaded.total = results.uploaded.level1 + results.uploaded.level2 + results.uploaded.level3;
      results.success = results.errors.length === 0;

      console.log(`Training data upload completed:`, results);
      return results;

    } catch (error) {
      console.error('Error uploading training data:', error);
      results.success = false;
      results.errors.push(`Global error: ${error}`);
      return results;
    }
  }

  private async generateTrainingData(level: 1 | 2 | 3): Promise<TrainingDataPoint[]> {
    const intents = this.hierarchyManager.getIntentsByLevel(level);
    const trainingData: TrainingDataPoint[] = [];

    for (const intent of intents) {
      // Generate training data from examples
      for (let i = 0; i < intent.examples.length; i++) {
        const example = intent.examples[i];
        const embedding = await generateQueryEmbedding(example);
        
        if (embedding) {
          trainingData.push({
            id: `${intent.id}-example-${i}`,
            text: example,
            intentId: intent.id,
            level,
            metadata: {
              intent: intent.id,
              level: intent.level,
              parent: intent.parent,
              confidence: intent.confidence_threshold,
              category: intent.name,
              keywords: intent.keywords,
              examples: intent.examples
            },
            embedding
          });
        }
      }

      // Generate training data from keywords
      for (let i = 0; i < intent.keywords.length; i++) {
        const keyword = intent.keywords[i];
        const keywordText = `Tell me about ${keyword}`;
        const embedding = await generateQueryEmbedding(keywordText);
        
        if (embedding) {
          trainingData.push({
            id: `${intent.id}-keyword-${i}`,
            text: keywordText,
            intentId: intent.id,
            level,
            metadata: {
              intent: intent.id,
              level: intent.level,
              parent: intent.parent,
              confidence: intent.confidence_threshold,
              category: intent.name,
              keywords: intent.keywords,
              examples: intent.examples
            },
            embedding
          });
        }
      }

      // Generate synthetic training data
      const syntheticData = this.generateSyntheticTrainingData(intent);
      for (let i = 0; i < syntheticData.length; i++) {
        const syntheticText = syntheticData[i];
        const embedding = await generateQueryEmbedding(syntheticText);
        
        if (embedding) {
          trainingData.push({
            id: `${intent.id}-synthetic-${i}`,
            text: syntheticText,
            intentId: intent.id,
            level,
            metadata: {
              intent: intent.id,
              level: intent.level,
              parent: intent.parent,
              confidence: intent.confidence_threshold,
              category: intent.name,
              keywords: intent.keywords,
              examples: intent.examples
            },
            embedding
          });
        }
      }
    }

    return trainingData;
  }

  private generateSyntheticTrainingData(intent: any): string[] {
    const syntheticData: string[] = [];
    
    // Generate variations based on intent type
    if (intent.level === 1) {
      // Domain-level synthetic data
      syntheticData.push(
        `I want to know about ${intent.name.toLowerCase()}`,
        `Can you help me with ${intent.name.toLowerCase()}?`,
        `Tell me about your ${intent.name.toLowerCase()}`,
        `I'm interested in ${intent.name.toLowerCase()}`
      );
    } else if (intent.level === 2) {
      // Category-level synthetic data
      syntheticData.push(
        `Show me your ${intent.name.toLowerCase()}`,
        `I'd like to learn about your ${intent.name.toLowerCase()}`,
        `What can you tell me about ${intent.name.toLowerCase()}?`,
        `Describe your ${intent.name.toLowerCase()}`
      );
    } else if (intent.level === 3) {
      // Specific intent synthetic data
      syntheticData.push(
        `What about your ${intent.name.toLowerCase()}?`,
        `I need information about ${intent.name.toLowerCase()}`,
        `Can you share details about ${intent.name.toLowerCase()}?`,
        `Tell me more about ${intent.name.toLowerCase()}`
      );
    }

    // Add keyword-based variations
    for (const keyword of intent.keywords.slice(0, 3)) { // Limit to avoid too much data
      syntheticData.push(
        `I want to know about ${keyword}`,
        `Tell me about ${keyword}`,
        `What is your ${keyword}?`
      );
    }

    return syntheticData;
  }

  private async uploadTrainingDataToNamespace(
    data: TrainingDataPoint[],
    namespace: string
  ): Promise<{ uploaded: number; errors: string[] }> {
    const results = { uploaded: 0, errors: [] as string[] };
    const batchSize = 100;

    try {
      // Clear existing data in namespace
      await this.clearNamespace(namespace);

      // Upload in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        try {
          const vectors = batch.map(item => ({
            id: item.id,
            values: item.embedding,
            metadata: {
              ...item.metadata,
              text: item.text,
              intentId: item.intentId
            }
          }));

          await this.pineconeClient.upsert(this.indexName, vectors, namespace);
          results.uploaded += batch.length;
          
          console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1} to ${namespace}: ${batch.length} vectors`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error uploading batch to ${namespace}:`, error);
          results.errors.push(`Batch upload error: ${error}`);
        }
      }

    } catch (error) {
      console.error(`Error uploading to namespace ${namespace}:`, error);
      results.errors.push(`Namespace upload error: ${error}`);
    }

    return results;
  }

  private async clearNamespace(namespace: string): Promise<void> {
    try {
      // Delete all vectors in namespace
      await this.pineconeClient.deleteAll(this.indexName, namespace);
      console.log(`Cleared namespace: ${namespace}`);
    } catch (error) {
      console.error(`Error clearing namespace ${namespace}:`, error);
    }
  }

  async validateUploadedData(): Promise<{
    valid: boolean;
    stats: {
      level1: { count: number; sampleIds: string[] };
      level2: { count: number; sampleIds: string[] };
      level3: { count: number; sampleIds: string[] };
    };
    errors: string[];
  }> {
    const results = {
      valid: true,
      stats: {
        level1: { count: 0, sampleIds: [] as string[] },
        level2: { count: 0, sampleIds: [] as string[] },
        level3: { count: 0, sampleIds: [] as string[] }
      },
      errors: [] as string[]
    };

    try {
      // Check Level 1 namespace
      const level1Stats = await this.pineconeClient.describeIndexStats(this.indexName);
      const level1Namespace = level1Stats.namespaces?.[this.namespaces.level1];
      if (level1Namespace) {
        results.stats.level1.count = level1Namespace.vectorCount || 0;
        
        // Get sample IDs
        const level1Query = await this.pineconeClient.query(
          this.indexName,
          new Array(1536).fill(0), // Dummy embedding
          { topK: 5, namespace: this.namespaces.level1 }
        );
        results.stats.level1.sampleIds = level1Query.matches?.map(m => m.id) || [];
      }

      // Check Level 2 namespace
      const level2Namespace = level1Stats.namespaces?.[this.namespaces.level2];
      if (level2Namespace) {
        results.stats.level2.count = level2Namespace.vectorCount || 0;
        
        const level2Query = await this.pineconeClient.query(
          this.indexName,
          new Array(1536).fill(0),
          { topK: 5, namespace: this.namespaces.level2 }
        );
        results.stats.level2.sampleIds = level2Query.matches?.map(m => m.id) || [];
      }

      // Check Level 3 namespace
      const level3Namespace = level1Stats.namespaces?.[this.namespaces.level3];
      if (level3Namespace) {
        results.stats.level3.count = level3Namespace.vectorCount || 0;
        
        const level3Query = await this.pineconeClient.query(
          this.indexName,
          new Array(1536).fill(0),
          { topK: 5, namespace: this.namespaces.level3 }
        );
        results.stats.level3.sampleIds = level3Query.matches?.map(m => m.id) || [];
      }

      // Validate minimum data requirements
      if (results.stats.level1.count < 20) {
        results.errors.push(`Insufficient Level 1 data: ${results.stats.level1.count} < 20`);
        results.valid = false;
      }
      if (results.stats.level2.count < 50) {
        results.errors.push(`Insufficient Level 2 data: ${results.stats.level2.count} < 50`);
        results.valid = false;
      }
      if (results.stats.level3.count < 30) {
        results.errors.push(`Insufficient Level 3 data: ${results.stats.level3.count} < 30`);
        results.valid = false;
      }

    } catch (error) {
      console.error('Error validating uploaded data:', error);
      results.errors.push(`Validation error: ${error}`);
      results.valid = false;
    }

    return results;
  }

  async queryHierarchicalData(
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

    const results = await this.pineconeClient.query(
      this.indexName,
      embedding,
      { topK, namespace }
    );

    return {
      matches: results.matches || [],
      namespace
    };
  }

  getNamespaces(): { level1: string; level2: string; level3: string } {
    return this.namespaces;
  }
}