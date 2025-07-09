import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Test chat endpoint works!',
    timestamp: new Date().toISOString(),
    method: req.method,
    body: req.body
  });
}