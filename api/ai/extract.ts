import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchAllCMSContent, normalizeContent } from '../../lib/content-extractor';
import { createClient } from 'redis';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes in seconds
const CACHE_KEY = 'ai:extracted-content';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const forceRefresh = req.query.refresh === 'true';

  try {
    let extractedContent;
    
    // Try to get from cache first
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (redisUrl) {
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      // Check cache (unless force refresh)
      if (!forceRefresh) {
        const cached = await client.get(CACHE_KEY);
        if (cached) {
          await client.disconnect();
          return res.status(200).json({
            items: JSON.parse(cached),
            cached: true,
          });
        }
      }
      
      // Fetch fresh content
      extractedContent = await fetchAllCMSContent();
      extractedContent = normalizeContent(extractedContent);
      
      // Cache the result
      await client.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(extractedContent));
      await client.disconnect();
    } else {
      // No Redis, fetch directly
      extractedContent = await fetchAllCMSContent();
      extractedContent = normalizeContent(extractedContent);
    }
    
    return res.status(200).json({
      items: extractedContent,
      cached: false,
      count: extractedContent.length,
    });
  } catch (error) {
    console.error('Content extraction error:', error);
    return res.status(500).json({
      error: 'Failed to extract content',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}