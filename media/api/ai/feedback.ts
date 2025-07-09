import type { VercelRequest, VercelResponse } from '@vercel/node';
import { submitFeedback } from '../../lib/analytics';

interface FeedbackRequest {
  sessionId: string;
  messageId: string;
  feedback: 'helpful' | 'not_helpful';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { sessionId, messageId, feedback } = req.body as FeedbackRequest;
    
    // Validate input
    if (!sessionId || !messageId || !feedback) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, messageId, feedback' 
      });
    }
    
    if (feedback !== 'helpful' && feedback !== 'not_helpful') {
      return res.status(400).json({ 
        error: 'Invalid feedback value. Must be "helpful" or "not_helpful"' 
      });
    }
    
    // Submit feedback
    await submitFeedback(sessionId, messageId, feedback);
    
    return res.status(200).json({ 
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Feedback endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}