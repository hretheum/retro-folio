"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbeddings = generateEmbeddings;
exports.generateQueryEmbedding = generateQueryEmbedding;
const openai_1 = require("./openai");
// Batch configuration
const BATCH_SIZE = 100;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second
// Cost estimation (as of 2024)
const COST_PER_1K_TOKENS = 0.00002; // $0.00002 per 1K tokens for text-embedding-3-small
// Helper to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Retry wrapper for API calls
async function retryWithBackoff(fn, attempts = RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (error) {
            if (i === attempts - 1)
                throw error;
            await sleep(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff
        }
    }
    throw new Error('Max retry attempts reached');
}
// Generate embedding for a single text
async function generateEmbedding(text) {
    const response = await openai_1.openai.embeddings.create({
        model: openai_1.AI_MODELS.embedding,
        input: text,
        dimensions: 1024, // Match Pinecone index dimension
    });
    return response.data[0].embedding;
}
// Generate embeddings for a batch of chunks
async function generateBatchEmbeddings(chunks, onProgress) {
    const embeddings = new Map();
    const failedChunks = new Set();
    // Process in batches
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
        const batch = chunks.slice(batchStart, batchEnd);
        // Report progress
        if (onProgress) {
            onProgress({
                processed: batchStart,
                total: chunks.length,
                failed: failedChunks.size,
                currentBatch: batchIndex + 1,
                totalBatches,
            });
        }
        // Process batch in parallel with individual retry logic
        const batchPromises = batch.map(async (chunk) => {
            try {
                const embedding = await retryWithBackoff(() => generateEmbedding(chunk.text));
                embeddings.set(chunk.id, embedding);
            }
            catch (error) {
                console.error(`Failed to generate embedding for chunk ${chunk.id}:`, error);
                failedChunks.add(chunk.id);
            }
        });
        await Promise.all(batchPromises);
        // Small delay between batches to avoid rate limiting
        if (batchIndex < totalBatches - 1) {
            await sleep(100);
        }
    }
    // Final progress report
    if (onProgress) {
        onProgress({
            processed: chunks.length,
            total: chunks.length,
            failed: failedChunks.size,
            currentBatch: totalBatches,
            totalBatches,
        });
    }
    return embeddings;
}
// Main function to generate embeddings for chunks
async function generateEmbeddings(chunks, onProgress) {
    const startTime = Date.now();
    try {
        // Generate embeddings
        const embeddingMap = await generateBatchEmbeddings(chunks, onProgress);
        // Combine chunks with embeddings
        const embeddedChunks = [];
        const failedChunks = [];
        for (const chunk of chunks) {
            const embedding = embeddingMap.get(chunk.id);
            if (embedding) {
                embeddedChunks.push({
                    ...chunk,
                    embedding,
                });
            }
            else {
                failedChunks.push(chunk);
            }
        }
        // Calculate cost
        const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
        const totalCost = (totalTokens / 1000) * COST_PER_1K_TOKENS;
        // Calculate duration
        const duration = Date.now() - startTime;
        return {
            success: failedChunks.length === 0,
            embeddings: embeddedChunks,
            stats: {
                processedChunks: embeddedChunks.length,
                failedChunks: failedChunks.length,
                totalCost,
                duration,
            },
        };
    }
    catch (error) {
        console.error('Embedding generation failed:', error);
        return {
            success: false,
            embeddings: [],
            stats: {
                processedChunks: 0,
                failedChunks: chunks.length,
                totalCost: 0,
                duration: Date.now() - startTime,
            },
        };
    }
}
// Generate embedding for a query
async function generateQueryEmbedding(query) {
    try {
        return await retryWithBackoff(() => generateEmbedding(query));
    }
    catch (error) {
        console.error('Failed to generate query embedding:', error);
        return null;
    }
}
