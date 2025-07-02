import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';
import { fetchAllCMSContent, normalizeContent } from '../../lib/content-extractor';
import { chunkContents } from '../../lib/text-chunker';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let client = null;
  
  try {
    // Fetch raw content from Redis
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!redisUrl) {
      return res.status(400).json({ error: 'Redis URL not configured' });
    }
    
    client = createClient({ url: redisUrl });
    await client.connect();
    
    // Get specific content type
    const contentType = req.query.type || 'work';
    const key = `content:${contentType}`;
    const rawData = await client.get(key);
    
    if (!rawData) {
      return res.status(404).json({ error: `No content found for type: ${contentType}` });
    }
    
    const parsedData = JSON.parse(String(rawData));
    
    // Also get normalized content
    const allContent = await fetchAllCMSContent();
    const normalizedContent = normalizeContent(allContent);
    
    // Filter by type
    const typeContent = normalizedContent.filter(c => c.type === contentType);
    
    // Create chunks for the first item
    let chunks = [];
    if (typeContent.length > 0) {
      chunks = chunkContents([typeContent[0]], {
        maxTokens: 512,
        overlap: 50,
        preserveSentences: true,
      });
    }
    
    return res.status(200).json({
      contentType,
      rawDataCount: parsedData.length,
      rawDataSample: parsedData.slice(0, 2), // First 2 items
      normalizedCount: typeContent.length,
      normalizedSample: typeContent.slice(0, 2), // First 2 normalized items
      firstItemChunks: chunks.map(chunk => ({
        id: chunk.id,
        textLength: chunk.text.length,
        textPreview: chunk.text.substring(0, 200) + '...',
        fullText: chunk.text,
        tokens: chunk.tokens,
        metadata: chunk.metadata
      }))
    });
    
  } catch (error: any) {
    console.error('Content debug error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}