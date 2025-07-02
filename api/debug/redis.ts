import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    
    if (!redisUrl) {
      return res.status(200).json({ 
        status: 'error',
        message: 'No Redis URL found in environment variables',
        env: {
          hasRedisUrl: !!process.env.REDIS_URL,
          hasKvUrl: !!process.env.KV_URL
        }
      });
    }

    const client = createClient({ url: redisUrl });
    
    await client.connect();
    
    // Try to get all keys
    const keys = await client.keys('content:*');
    
    // Get sample data
    const sampleData: any = {};
    for (const key of keys.slice(0, 5)) {
      if (typeof key === 'string') {
        const data = await client.get(key);
        try {
          sampleData[key] = data ? JSON.parse(data).length : 0;
        } catch {
          sampleData[key] = 'parse error';
        }
      }
    }
    
    await client.disconnect();
    
    return res.status(200).json({
      status: 'success',
      redisUrl: redisUrl.replace(/:[^:@]+@/, ':***@'), // Hide password
      totalKeys: keys.length,
      contentKeys: keys,
      sampleData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return res.status(200).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}