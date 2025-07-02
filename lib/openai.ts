import { OpenAI } from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Models configuration
export const AI_MODELS = {
  chat: 'gpt-4-turbo-preview',
  embedding: 'text-embedding-3-large',
} as const;

// Check API availability
export async function checkOpenAIStatus() {
  try {
    // Try to list models to verify API key and connection
    const models = await openai.models.list();
    
    // Check if our required models are available
    const availableModels = models.data.map(m => m.id);
    const hasChat = availableModels.some(id => id.includes('gpt-4'));
    const hasEmbedding = availableModels.some(id => id.includes('embedding'));
    
    return {
      status: 'connected',
      model: AI_MODELS.chat,
      embeddingModel: AI_MODELS.embedding,
      available: {
        chat: hasChat,
        embedding: hasEmbedding,
      },
    };
  } catch (error) {
    console.error('OpenAI API check failed:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper to count tokens (approximate)
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}