import type { VercelRequest, VercelResponse } from '@vercel/node';
import { openai, AI_MODELS } from '../../lib/openai';
import { semanticSearch } from '../../lib/semantic-search';
import { buildMessages } from '../../lib/chat-prompts';
import { logChatInteraction } from '../../lib/analytics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId = 'anonymous' } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
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
    
    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: AI_MODELS.chat,
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Send the stream
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        // Send just the content string, not JSON
        res.write(`data: ${content}\n\n`);
      }
    }
    
    // Send [DONE] to signal completion
    res.write('data: [DONE]\n\n');
    res.end();
    
    // Log interaction
    const responseTime = Date.now() - startTime;
    logChatInteraction({
      sessionId,
      query: lastMessage.content,
      responseTime,
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
      contextFound: searchResults.results.length > 0,
      timestamp: new Date().toISOString(),
    }).catch(console.error);
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}