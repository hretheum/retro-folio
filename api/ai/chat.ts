import type { VercelRequest, VercelResponse } from '@vercel/node';
import { openai, AI_MODELS } from '../../lib/openai';
import { semanticSearch } from '../../lib/semantic-search';
import { buildMessages } from '../../lib/chat-prompts';
import { logChatInteraction } from '../../lib/analytics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId = 'anonymous' } = req.body;
    
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }
    
    const startTime = Date.now();
    
    // Search for relevant context
    const searchResults = await semanticSearch({
      query: lastMessage.content,
      topK: 5,
      minScore: 0.7,
    });
    
    // Build messages for OpenAI
    const previousMessages = messages.slice(0, -1);
    const openAIMessages = buildMessages(
      lastMessage.content,
      searchResults.context,
      previousMessages
    );
    
    // Get completion from OpenAI (non-streaming for simplicity)
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.chat,
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    });
    
    const responseContent = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Log the interaction
    const responseTime = Date.now() - startTime;
    logChatInteraction({
      sessionId,
      query: lastMessage.content,
      responseTime,
      tokenUsage: {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      },
      contextFound: searchResults.results.length > 0,
      timestamp: new Date().toISOString(),
    }).catch(console.error);
    
    // Return JSON response - this is what useChat expects
    return res.status(200).json({
      content: responseContent,
    });
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}