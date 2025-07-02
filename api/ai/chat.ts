import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Chat endpoint called with:', JSON.stringify(req.body));
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send a simple test response
    const testResponse = `Hello! You said: "${lastMessage.content}". I'm Eryk AI and I'm working now!`;
    
    // Send response character by character to simulate streaming
    for (const char of testResponse) {
      res.write(`data: ${JSON.stringify(char)}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    }
    
    // Send done signal
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('Chat error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}