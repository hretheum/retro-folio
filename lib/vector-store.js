"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStore = void 0;
exports.getVectorStore = getVectorStore;
const vectra_1 = require("vectra");
const redis_1 = require("redis");
class VectorStore {
    constructor() {
        this.index = null;
        this.chunks = new Map();
        this.lastSaved = null;
        this.REDIS_KEY = 'ai:vector-store';
        this.AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.autoSaveTimer = null;
        // Initialize empty - will be populated on first use
    }
    // Initialize or reinitialize the index
    async initializeIndex(dimension) {
        this.index = new vectra_1.LocalIndex(`.vectra-index-${dimension}`);
        if (!(await this.index.isIndexCreated())) {
            await this.index.createIndex();
        }
    }
    // Add embeddings to the store
    async add(embeddings) {
        if (embeddings.length === 0)
            return;
        // Initialize index if needed
        if (!this.index) {
            const dimension = embeddings[0].embedding.length;
            await this.initializeIndex(dimension);
        }
        // Add to index and map
        for (const chunk of embeddings) {
            await this.index.insertItem({
                vector: chunk.embedding,
                metadata: { id: chunk.id },
            });
            this.chunks.set(chunk.id, chunk);
        }
        // Schedule auto-save
        this.scheduleAutoSave();
    }
    // Search for similar vectors
    async search(queryEmbedding, options = {}) {
        const { topK = 5, minScore = 0 } = options;
        if (!this.index || this.chunks.size === 0) {
            return [];
        }
        // Query the index - try different approach
        const results = await this.index.queryItems(queryEmbedding, topK);
        // Map results to chunks with filtering
        const searchResults = [];
        for (const result of results) {
            const chunkId = result.item.metadata.id;
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
    async remove(chunkId) {
        if (!this.index)
            return;
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
    async clear() {
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
    getStats() {
        const memoryUsage = this.estimateMemoryUsage();
        return {
            totalVectors: this.chunks.size,
            lastUpdated: this.lastSaved,
            memoryUsage,
        };
    }
    // Estimate memory usage
    estimateMemoryUsage() {
        if (this.chunks.size === 0)
            return 0;
        // Estimate: ~4 bytes per float * embedding dimension * number of chunks
        const sampleChunk = this.chunks.values().next().value;
        if (!sampleChunk)
            return 0;
        const embeddingSize = sampleChunk.embedding.length * 4;
        const metadataSize = 1000; // Rough estimate for metadata per chunk
        const totalSize = this.chunks.size * (embeddingSize + metadataSize);
        return totalSize;
    }
    // Save to Redis
    async saveToRedis() {
        const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
        if (!redisUrl || this.chunks.size === 0)
            return;
        try {
            const client = (0, redis_1.createClient)({ url: redisUrl });
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
        }
        catch (error) {
            console.error('Failed to save vector store to Redis:', error);
        }
    }
    // Load from Redis
    async loadFromRedis() {
        const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
        if (!redisUrl)
            return false;
        try {
            const client = (0, redis_1.createClient)({ url: redisUrl });
            await client.connect();
            const data = await client.get(this.REDIS_KEY);
            await client.disconnect();
            if (!data)
                return false;
            const storeData = JSON.parse(String(data));
            const chunks = storeData.chunks;
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
        }
        catch (error) {
            console.error('Failed to load vector store from Redis:', error);
            return false;
        }
    }
    // Auto-save scheduling
    scheduleAutoSave() {
        this.cancelAutoSave();
        this.autoSaveTimer = setTimeout(() => {
            this.saveToRedis().catch(console.error);
        }, this.AUTO_SAVE_INTERVAL);
    }
    cancelAutoSave() {
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
exports.VectorStore = VectorStore;
// Singleton instance
let vectorStoreInstance = null;
function getVectorStore() {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new VectorStore();
    }
    return vectorStoreInstance;
}
