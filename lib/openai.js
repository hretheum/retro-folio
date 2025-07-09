"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_MODELS = exports.openai = void 0;
exports.checkOpenAIStatus = checkOpenAIStatus;
exports.estimateTokens = estimateTokens;
const openai_1 = require("openai");
// Initialize OpenAI client
exports.openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Models configuration
exports.AI_MODELS = {
    chat: 'gpt-4-turbo-preview',
    embedding: 'text-embedding-3-large',
};
// Check API availability
async function checkOpenAIStatus() {
    try {
        // Try to list models to verify API key and connection
        const models = await exports.openai.models.list();
        // Check if our required models are available
        const availableModels = models.data.map(m => m.id);
        const hasChat = availableModels.some(id => id.includes('gpt-4'));
        const hasEmbedding = availableModels.some(id => id.includes('embedding'));
        return {
            status: 'connected',
            model: exports.AI_MODELS.chat,
            embeddingModel: exports.AI_MODELS.embedding,
            available: {
                chat: hasChat,
                embedding: hasEmbedding,
            },
        };
    }
    catch (error) {
        console.error('OpenAI API check failed:', error);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
// Helper to count tokens (approximate)
function estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
}
