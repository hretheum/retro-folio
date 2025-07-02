import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pinecone } from '../../lib/pinecone-client';
import { PineconeVectorStore } from '../../lib/pinecone-vector-store';
import { generateQueryEmbedding } from '../../lib/embedding-generator';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const namespace = 'production';
    const query = req.query.query as string || 'Eryk experience';
    
    // Get index stats
    const store = new PineconeVectorStore(namespace);
    const stats = await store.getStats();
    
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'Failed to generate query embedding' });
    }
    
    // Get Pinecone index
    const index = pinecone.index('retro-folio');
    
    // Query directly with Pinecone client to see raw results
    const queryResponse = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
      includeValues: false
    });
    
    // Map results for easier reading
    const results = queryResponse.matches?.map((match, idx) => ({
      index: idx + 1,
      id: match.id,
      score: match.score,
      metadata: match.metadata,
      textLength: (match.metadata as any)?.text?.length || 0,
      textPreview: (match.metadata as any)?.text?.substring(0, 200) || 'NO TEXT',
      fullText: (match.metadata as any)?.text || 'NO TEXT FOUND'
    })) || [];
    
    return res.status(200).json({
      query,
      namespace,
      stats,
      totalResults: results.length,
      results
    });
    
  } catch (error: any) {
    console.error('Pinecone debug error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}