import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  let client = null;
  
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return res.status(200).json({ 
        error: 'REDIS_URL not found',
        env: Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV'))
      });
    }

    // Create and connect client
    client = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 5000
      }
    });

    await client.connect();

    // Simple test
    const testKey = 'test:' + Date.now();
    await client.set(testKey, 'Hello Redis!');
    const value = await client.get(testKey);
    await client.del(testKey);

    // Get all content keys
    const keys = await client.keys('content:*');

    return res.status(200).json({
      success: true,
      redisUrl: redisUrl.replace(/:[^:@]+@/, ':***@'),
      testValue: value,
      contentKeys: keys,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}