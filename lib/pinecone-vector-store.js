"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeVectorStore = void 0;
exports.semanticSearchPinecone = semanticSearchPinecone;
exports.hybridSearchPinecone = hybridSearchPinecone;
const pinecone_client_1 = require("./pinecone-client");
const embedding_generator_1 = require("./embedding-generator");
class PineconeVectorStore {
    constructor(namespace = 'default') {
        this.namespace = namespace;
    }
    // Add embeddings to Pinecone
    async add(embeddings) {
        if (embeddings.length === 0)
            return;
        console.log(`Adding ${embeddings.length} embeddings to Pinecone...`);
        await (0, pinecone_client_1.upsertEmbeddings)(embeddings, this.namespace);
    }
    // Search for similar vectors
    async search(queryEmbedding, options = {}) {
        const { topK = 5, minScore = 0, filter } = options;
        const matches = await (0, pinecone_client_1.searchSimilar)(queryEmbedding, {
            topK,
            namespace: this.namespace,
            filter,
            includeMetadata: true,
        });
        // Log first match for debugging
        if (matches.length > 0) {
            console.log('[PineconeVectorStore] First match details:', {
                id: matches[0].id,
                score: matches[0].score,
                metadataKeys: Object.keys(matches[0].metadata || {}),
                textLength: matches[0].metadata?.text?.length || 0,
                textPreview: matches[0].metadata?.text?.substring(0, 100) || 'NO TEXT',
                fullMetadata: matches[0].metadata
            });
        }
        // Convert Pinecone results to our format
        return matches
            .filter((match) => match.score >= minScore)
            .map((match) => ({
            chunk: {
                id: match.id,
                text: match.metadata.text || 'NO TEXT FOUND',
                embedding: [], // We don't return embeddings from search
                metadata: match.metadata,
                tokens: match.metadata.tokens || 0,
            },
            score: match.score,
        }));
    }
    // Clear all vectors
    async clear() {
        console.log(`Clearing namespace: ${this.namespace}`);
        await (0, pinecone_client_1.clearNamespace)(this.namespace);
    }
    // Get store statistics
    async getStats() {
        const stats = await (0, pinecone_client_1.getIndexStats)();
        const namespaceStats = stats.namespaces?.[this.namespace] || { vectorCount: 0 };
        return {
            totalVectors: namespaceStats.vectorCount || 0,
            dimension: stats.dimension,
            indexFullness: stats.indexFullness,
            namespaces: Object.keys(stats.namespaces || {}),
        };
    }
}
exports.PineconeVectorStore = PineconeVectorStore;
// Advanced search with query text
async function semanticSearchPinecone(query, options = {}) {
    // Generate query embedding
    const queryEmbedding = await (0, embedding_generator_1.generateQueryEmbedding)(query);
    if (!queryEmbedding) {
        console.error('Failed to generate query embedding');
        return [];
    }
    const store = new PineconeVectorStore(options.namespace);
    return store.search(queryEmbedding, options);
}
// Hybrid search simulation (vector + keyword matching in metadata)
async function hybridSearchPinecone(query, options = {}) {
    const { topK = 5, namespace = 'default', vectorWeight = 0.7 } = options;
    // Get vector search results
    const vectorResults = await semanticSearchPinecone(query, {
        topK: topK * 2, // Get more for reranking
        namespace,
    });
    // Rerank based on keyword matching in metadata
    const queryLower = query.toLowerCase();
    const rerankedResults = vectorResults.map(result => {
        let keywordScore = 0;
        const text = result.chunk.text.toLowerCase();
        // Simple keyword matching
        const words = queryLower.split(' ');
        words.forEach(word => {
            if (text.includes(word)) {
                keywordScore += 1 / words.length;
            }
        });
        // Combine scores
        const combinedScore = (result.score * vectorWeight) + (keywordScore * (1 - vectorWeight));
        return {
            ...result,
            score: combinedScore,
        };
    });
    // Sort by combined score and return top K
    return rerankedResults
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}
