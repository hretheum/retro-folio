import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT] === ENDPOINT START ===');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[CHAT] Body:', JSON.stringify(req.body));
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.log('[CHAT] No messages provided');
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const lastMessage = messages[messages.length - 1];
    console.log('[CHAT] Last message:', lastMessage);
    
    // For now, just return a simple test response
    const response = `Test response: "${lastMessage?.content || 'no content'}"`;
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    console.log('[CHAT] Sending response...');
    
    // Send response
    res.write(`data: ${response}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    
    console.log('[CHAT] === ENDPOINT END ===');
    
  } catch (error) {
    console.error('[CHAT] ERROR:', error);
    console.error('[CHAT] Stack:', error instanceof Error ? error.stack : 'No stack');
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}