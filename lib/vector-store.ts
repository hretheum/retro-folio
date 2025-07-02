import { LocalIndex } from 'vectra';
import { createClient } from 'redis';
import type { EmbeddedChunk } from './embedding-generator';

export interface SearchResult {
  chunk: EmbeddedChunk;
  score: number;
}

export interface VectorStoreStats {
  totalVectors: number;
  lastUpdated: Date | null;
  memoryUsage: number;
}

export class VectorStore {
  private index: LocalIndex | null = null;
  private chunks: Map<string, EmbeddedChunk> = new Map();
  private lastSaved: Date | null = null;
  private readonly REDIS_KEY = 'ai:vector-store';
  private readonly AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize empty - will be populated on first use
  }

  // Initialize or reinitialize the index
  private async initializeIndex(dimension: number) {
    this.index = new LocalIndex(`.vectra-index-${dimension}`);
    if (!(await this.index.isIndexCreated())) {
      await this.index.createIndex();
    }
  }

  // Add embeddings to the store
  async add(embeddings: EmbeddedChunk[]): Promise<void> {
    if (embeddings.length === 0) return;

    // Initialize index if needed
    if (!this.index) {
      const dimension = embeddings[0].embedding.length;
      await this.initializeIndex(dimension);
    }

    // Add to index and map
    for (const chunk of embeddings) {
      await this.index!.insertItem({
        vector: chunk.embedding,
        metadata: { id: chunk.id },
      });
      this.chunks.set(chunk.id, chunk);
    }

    // Schedule auto-save
    this.scheduleAutoSave();
  }

  // Search for similar vectors
  async search(
    queryEmbedding: number[],
    options: { topK?: number; minScore?: number } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, minScore = 0 } = options;

    if (!this.index || this.chunks.size === 0) {
      return [];
    }

    // Query the index
    const results = await this.index.queryItems(queryEmbedding, topK, (item: any) => {
      // Optional filter function
      return true;
    });

    // Map results to chunks with filtering
    const searchResults: SearchResult[] = [];
    
    for (const result of results) {
      const chunkId = result.item.metadata.id as string;
      const chunk = this.chunks.get(chunkId);
      
      if (chunk && result.score >= minScore) {
        searchResults.push({
          chunk,
          score: result.score,
        });
      }
    }

    return searchResults;
  }

  // Remove a vector by ID
  async remove(chunkId: string): Promise<void> {
    if (!this.index) return;

    // Find and remove from index
    const items = await this.index.listItems();
    const itemToRemove = items.find(item => item.metadata.id === chunkId);
    
    if (itemToRemove) {
      await this.index.deleteItem(itemToRemove.id);
    }

    // Remove from map
    this.chunks.delete(chunkId);

    // Schedule auto-save
    this.scheduleAutoSave();
  }

  // Clear all vectors
  async clear(): Promise<void> {
    if (this.index) {
      // Clear by removing all items
      const items = await this.index.listItems();
      for (const item of items) {
        await this.index.deleteItem(item.id);
      }
    }
    this.chunks.clear();
    this.cancelAutoSave();
  }

  // Get store statistics
  getStats(): VectorStoreStats {
    const memoryUsage = this.estimateMemoryUsage();
    
    return {
      totalVectors: this.chunks.size,
      lastUpdated: this.lastSaved,
      memoryUsage,
    };
  }

  // Estimate memory usage
  private estimateMemoryUsage(): number {
    if (this.chunks.size === 0) return 0;

    // Estimate: ~4 bytes per float * embedding dimension * number of chunks
    const sampleChunk = this.chunks.values().next().value;
    if (!sampleChunk) return 0;

    const embeddingSize = sampleChunk.embedding.length * 4;
    const metadataSize = 1000; // Rough estimate for metadata per chunk
    const totalSize = this.chunks.size * (embeddingSize + metadataSize);

    return totalSize;
  }

  // Save to Redis
  async saveToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!redisUrl || this.chunks.size === 0) return;

    try {
      const client = createClient({ url: redisUrl });
      await client.connect();

      // Prepare data for storage
      const storeData = {
        chunks: Array.from(this.chunks.entries()),
        metadata: {
          savedAt: new Date().toISOString(),
          vectorCount: this.chunks.size,
          dimension: this.chunks.size > 0 ? 
            this.chunks.values().next().value.embedding.length : 0,
        },
      };

      // Save to Redis
      await client.set(this.REDIS_KEY, JSON.stringify(storeData));
      await client.disconnect();

      this.lastSaved = new Date();
      console.log(`Saved ${this.chunks.size} vectors to Redis`);
    } catch (error) {
      console.error('Failed to save vector store to Redis:', error);
    }
  }

  // Load from Redis
  async loadFromRedis(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!redisUrl) return false;

    try {
      const client = createClient({ url: redisUrl });
      await client.connect();

      const data = await client.get(this.REDIS_KEY);
      await client.disconnect();

      if (!data) return false;

      const storeData = JSON.parse(String(data));
      const chunks: [string, EmbeddedChunk][] = storeData.chunks;

      // Clear existing data
      await this.clear();

      // Rebuild from loaded data
      if (chunks.length > 0) {
        const embeddedChunks = chunks.map(([_, chunk]) => chunk);
        await this.add(embeddedChunks);
      }

      this.lastSaved = new Date(storeData.metadata.savedAt);
      console.log(`Loaded ${chunks.length} vectors from Redis`);
      
      return true;
    } catch (error) {
      console.error('Failed to load vector store from Redis:', error);
      return false;
    }
  }

  // Auto-save scheduling
  private scheduleAutoSave() {
    this.cancelAutoSave();
    
    this.autoSaveTimer = setTimeout(() => {
      this.saveToRedis().catch(console.error);
    }, this.AUTO_SAVE_INTERVAL);
  }

  private cancelAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Cleanup
  async destroy() {
    this.cancelAutoSave();
    await this.saveToRedis();
    await this.clear();
  }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}