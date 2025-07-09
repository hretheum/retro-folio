import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchAllCMSContent, normalizeContent } from '../../lib/content-extractor';
import { chunkContents } from '../../lib/text-chunker';
import { generateEmbeddings, type EmbeddingProgress } from '../../lib/embedding-generator';
import { createClient } from 'redis';

const EMBEDDINGS_CACHE_KEY = 'ai:embeddings';
const EMBEDDINGS_CACHE_TTL = 86400; // 24 hours

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and normalize content
    console.log('Fetching CMS content...');
    const content = await fetchAllCMSContent();
    const normalizedContent = normalizeContent(content);
    
    if (normalizedContent.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No content to process',
        processedChunks: 0,
        failedChunks: 0,
        totalCost: 0,
      });
    }
    
    // Chunk content
    console.log(`Chunking ${normalizedContent.length} content items...`);
    const chunks = chunkContents(normalizedContent, {
      maxTokens: 512,
      overlap: 50,
      preserveSentences: true,
    });
    
    console.log(`Created ${chunks.length} chunks`);
    
    // Track progress (in production, this could be sent via WebSocket or SSE)
    const onProgress = (progress: EmbeddingProgress) => {
      console.log(`Progress: ${progress.processed}/${progress.total} chunks (Batch ${progress.currentBatch}/${progress.totalBatches})`);
    };
    
    // Generate embeddings
    console.log('Generating embeddings...');
    const result = await generateEmbeddings(chunks, onProgress);
    
    if (!result.success) {
      console.error(`Failed to generate embeddings: ${result.stats.failedChunks} chunks failed`);
    }
    
    // Store embeddings in Redis
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (redisUrl && result.embeddings.length > 0) {
      try {
        const client = createClient({ url: redisUrl });
        await client.connect();
        
        // Store embeddings as JSON
        const embeddingsData = {
          embeddings: result.embeddings,
          metadata: {
            generatedAt: new Date().toISOString(),
            stats: result.stats,
            contentCount: normalizedContent.length,
            chunkCount: chunks.length,
          },
        };
        
        await client.setEx(
          EMBEDDINGS_CACHE_KEY,
          EMBEDDINGS_CACHE_TTL,
          JSON.stringify(embeddingsData)
        );
        
        await client.disconnect();
        console.log('Embeddings stored in Redis');
      } catch (error) {
        console.error('Failed to store embeddings in Redis:', error);
        // Continue anyway - embeddings can be regenerated
      }
    }
    
    // Return result
    return res.status(200).json({
      success: result.success,
      processedChunks: result.stats.processedChunks,
      failedChunks: result.stats.failedChunks,
      totalCost: result.stats.totalCost,
      duration: result.stats.duration,
      message: result.success 
        ? `Successfully generated embeddings for ${result.stats.processedChunks} chunks`
        : `Generated embeddings for ${result.stats.processedChunks} chunks, ${result.stats.failedChunks} failed`,
    });
  } catch (error) {
    console.error('Prepare endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to prepare embeddings',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}