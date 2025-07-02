import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== CHAT ENDPOINT DEBUG ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    console.log('Messages:', messages);
    
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('No messages provided');
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    console.log('Last message:', lastMessage);
    
    if (!lastMessage || lastMessage.role !== 'user') {
      console.error('Last message is not from user');
      return res.status(400).json({ error: 'Last message must be from user' });
    }
    
    // For now, just return a simple response to test
    const responseContent = `Test response: You said "${lastMessage.content}". This is a test from Eryk AI!`;
    
    console.log('Sending response:', responseContent);
    
    // Try different response formats to see what works
    const response = {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
    };
    
    console.log('Full response object:', response);
    
    // Return the response
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('=== CHAT ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}