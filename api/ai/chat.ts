import type { VercelRequest, VercelResponse } from '@vercel/node';
import { openai, AI_MODELS } from '../../lib/openai';
import { semanticSearch } from '../../lib/semantic-search';
import { buildMessages } from '../../lib/chat-prompts';
import { logChatInteraction } from '../../lib/analytics';
import type { ChatMessage } from '../../lib/chat-prompts';

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

interface ChatRequest {
  message: string;
  sessionId?: string;
  previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// Simple in-memory rate limiter (in production, use Redis)
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

// Estimate token usage (rough approximation)
function estimateTokenUsage(messages: any[], response?: string): TokenUsage {
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, sessionId = 'anonymous', previousMessages = [] } = req.body as ChatRequest;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
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
      query: message,
      topK: 5,
      minScore: 0.7,
    });
    
    const contextFound = searchResults.results.length > 0;
    if (!contextFound) {
      console.log('No relevant context found');
    }
    
    // Build messages
    const messages = buildMessages(
      message,
      searchResults.context,
      previousMessages
    );
    
    // Create chat completion with streaming
    const stream = await openai.chat.completions.create({
      model: AI_MODELS.chat,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    let tokenCount = 0;

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        tokenCount++;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send done signal
    res.write('data: [DONE]\n\n');
    res.end();

    // Log interaction after completion
    const responseTime = Date.now() - startTime;
    const tokenUsage = estimateTokenUsage(messages, fullResponse);
    
    await logChatInteraction({
      sessionId,
      query: message,
      responseTime,
      tokenUsage,
      contextFound,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({
        error: 'OpenAI API is not configured. Please add OPENAI_API_KEY to environment variables.',
      });
    }
    
    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}