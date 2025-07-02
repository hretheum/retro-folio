import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(200).json({
    hasRedisUrl: !!process.env.REDIS_URL,
    hasKvUrl: !!process.env.KV_URL,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    domain: req.headers.host,
    timestamp: new Date().toISOString()
  });
}