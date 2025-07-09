import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkOpenAIStatus } from '../../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = await checkOpenAIStatus();
    return res.status(200).json(status);
  } catch (error) {
    console.error('OpenAI status check error:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to check OpenAI status',
    });
  }
}