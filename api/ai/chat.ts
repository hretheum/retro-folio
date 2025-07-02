import type { VercelRequest, VercelResponse } from '@vercel/node';
import { StreamingTextResponse } from 'ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT] Endpoint called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    console.log('[CHAT] Messages:', messages?.length);
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const lastMessage = messages[messages.length - 1];
    const response = `Test response: "${lastMessage?.content || 'no content'}"`;
    
    // Create a simple readable stream
    const stream = new ReadableStream({
      start(controller) {
        // Send the response text
        controller.enqueue(new TextEncoder().encode(response));
        controller.close();
      },
    });
    
    // Return StreamingTextResponse which handles all the SSE formatting
    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('[CHAT] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}