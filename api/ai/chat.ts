export default async function handler(req, res) {
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
    const responseText = `Test response: "${lastMessage?.content || 'no content'}"`;
    
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    
    // useChat expects this exact format for streaming
    // Send the entire response as one chunk
    res.write(`data: ${JSON.stringify(responseText)}\n\n`);
    
    // Send the final done message
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('[CHAT] Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}