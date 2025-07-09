"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinecone = void 0;
exports.getPineconeIndex = getPineconeIndex;
exports.chunksToPineconeRecords = chunksToPineconeRecords;
exports.upsertEmbeddings = upsertEmbeddings;
exports.searchSimilar = searchSimilar;
exports.clearNamespace = clearNamespace;
exports.getIndexStats = getIndexStats;
const pinecone_1 = require("@pinecone-database/pinecone");
// Initialize Pinecone client
exports.pinecone = new pinecone_1.Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
// Get or create index
async function getPineconeIndex(indexName = 'retro-folio') {
    // Index already exists, just return it
    return exports.pinecone.index(indexName);
}
// Convert our chunks to Pinecone format
function chunksToPineconeRecords(chunks) {
    return chunks.map(chunk => {
        // Log first chunk for debugging
        if (chunk.id.endsWith('-chunk-0')) {
            console.log('[chunksToPineconeRecords] First chunk sample:', {
                id: chunk.id,
                textLength: chunk.text.length,
                textPreview: chunk.text.substring(0, 150),
                metadata: chunk.metadata
            });
        }
        return {
            id: chunk.id,
            values: chunk.embedding,
            metadata: {
                text: chunk.text,
                contentId: chunk.metadata.contentId,
                contentType: chunk.metadata.contentType,
                chunkIndex: chunk.metadata.chunkIndex,
                totalChunks: chunk.metadata.totalChunks,
                ...chunk.metadata,
            },
        };
    });
}
// Upsert embeddings to Pinecone
async function upsertEmbeddings(chunks, namespace = 'default') {
    const index = await getPineconeIndex();
    const records = chunksToPineconeRecords(chunks);
    // Pinecone recommends batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await index.namespace(namespace).upsert(batch);
    }
}
// Search similar vectors
async function searchSimilar(queryEmbedding, options = {}) {
    const { topK = 5, namespace = 'default', filter, includeMetadata = true, } = options;
    const index = await getPineconeIndex();
    const queryResponse = await index.namespace(namespace).query({
        vector: queryEmbedding,
        topK,
        filter,
        includeMetadata,
    });
    return queryResponse.matches || [];
}
// Delete all vectors in a namespace
async function clearNamespace(namespace = 'default') {
    const index = await getPineconeIndex();
    await index.namespace(namespace).deleteAll();
}
// Get index stats
async function getIndexStats() {
    const index = await getPineconeIndex();
    return index.describeIndexStats();
}
