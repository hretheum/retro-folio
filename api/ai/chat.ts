import type { VercelRequest, VercelResponse } from '@vercel/node';
import { openai, AI_MODELS } from '../../lib/openai';
import { semanticSearch } from '../../lib/semantic-search';
import { buildMessages } from '../../lib/chat-prompts';
import { logChatInteraction } from '../../lib/analytics';

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Estimate token usage
function estimateTokenUsage(messages: any[], response?: string) {
  const promptTokens = messages.reduce((sum, msg) => {
    return sum + Math.ceil(msg.content.length / 4);
  }, 0);
  
  const completionTokens = response ? Math.ceil(response.length / 4) : 0;
  
  return {
    prompt: promptTokens,
    completion: completionTokens,
    total: promptTokens + completionTokens,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
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
    
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || 'unknown';
    const rateLimitKey = `${clientIp}:${sessionId}`;
    
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    // Track start time
    const startTime = Date.now();
    
    // Search for relevant context
    console.log('Searching for context...');
    const searchResults = await semanticSearch({
      query: lastMessage.content,
      topK: 5,
      minScore: 0.7,
    });
    
    const contextFound = searchResults.results.length > 0;
    
    // Build messages for OpenAI
    const previousMessages = messages.slice(0, -1);
    const openAIMessages = buildMessages(
      lastMessage.content,
      searchResults.context,
      previousMessages
    );
    
    // Create streaming response compatible with Vercel AI SDK
    const stream = await openai.chat.completions.create({
      model: AI_MODELS.chat,
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullResponse = '';
    
    // Process the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        // Format for Vercel AI SDK
        const data = JSON.stringify({ 
          id: chunk.id,
          object: 'chat.completion.chunk',
          created: chunk.created,
          model: chunk.model,
          choices: [{
            index: 0,
            delta: { content },
            finish_reason: chunk.choices[0]?.finish_reason || null
          }]
        });
        res.write(`data: ${data}\n\n`);
      }
    }
    
    // Send done signal
    res.write('data: [DONE]\n\n');
    res.end();
    
    // Log the interaction
    const responseTime = Date.now() - startTime;
    const tokenUsage = estimateTokenUsage(openAIMessages, fullResponse);
    
    logChatInteraction({
      sessionId,
      query: lastMessage.content,
      responseTime,
      tokenUsage,
      contextFound,
      timestamp: new Date().toISOString(),
    }).catch(console.error);
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    // If headers haven't been sent yet, send error as JSON
    if (!res.headersSent) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return res.status(500).json({
            error: 'OpenAI API is not configured. Please add OPENAI_API_KEY to environment variables.',
          });
        }
        
        return res.status(500).json({
          error: 'Failed to process chat request',
          details: error.message,
        });
      }
      
      return res.status(500).json({
        error: 'An unexpected error occurred',
      });
    } else {
      // If we're already streaming, send error in stream format
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
}