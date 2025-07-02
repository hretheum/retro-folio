import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchAllCMSContent, normalizeContent } from '../../lib/content-extractor';
import { chunkContents } from '../../lib/text-chunker';
import { generateEmbeddings, type EmbeddingProgress } from '../../lib/embedding-generator';
import { PineconeVectorStore } from '../../lib/pinecone-vector-store';

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
    
    // Track progress
    const onProgress = (progress: EmbeddingProgress) => {
      console.log(`Progress: ${progress.processed}/${progress.total} chunks (Batch ${progress.currentBatch}/${progress.totalBatches})`);
    };
    
    // Generate embeddings
    console.log('Generating embeddings...');
    const result = await generateEmbeddings(chunks, onProgress);
    
    if (!result.success) {
      console.error(`Failed to generate embeddings: ${result.stats.failedChunks} chunks failed`);
    }
    
    // Store embeddings in Pinecone
    if (result.embeddings.length > 0) {
      try {
        const pineconeStore = new PineconeVectorStore('production');
        
        // Clear existing embeddings (optional - remove if you want to append)
        await pineconeStore.clear();
        
        // Add new embeddings
        await pineconeStore.add(result.embeddings);
        
        // Get stats
        const stats = await pineconeStore.getStats();
        console.log('Pinecone stats:', stats);
      } catch (error) {
        console.error('Failed to store embeddings in Pinecone:', error);
        return res.status(500).json({
          error: 'Failed to store embeddings',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
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
        ? `Successfully generated and stored ${result.stats.processedChunks} embeddings in Pinecone`
        : `Generated ${result.stats.processedChunks} embeddings, ${result.stats.failedChunks} failed`,
    });
  } catch (error) {
    console.error('Prepare endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to prepare embeddings',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}