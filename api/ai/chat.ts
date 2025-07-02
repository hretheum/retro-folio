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
    
    console.log('[CHAT] Sending JSON response');
    
    // Return simple JSON like portfolio does
    return res.status(200).json({
      content: responseText
    });
    
  } catch (error) {
    console.error('[CHAT] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}