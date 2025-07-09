import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hybridSearchPinecone } from '../../lib/pinecone-vector-store';

interface SearchRequest {
  query: string;
  topK?: number;
  filter?: Record<string, any>;
  namespace?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, topK = 5, filter, namespace = 'production' } = req.body as SearchRequest;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Perform hybrid search
    const results = await hybridSearchPinecone(query, {
      topK,
      namespace,
    });
    
    // Build context from results
    const context = results
      .map(r => `[${r.chunk.metadata.contentType}] ${r.chunk.text}`)
      .join('\n\n');
    
    return res.status(200).json({
      results: results.map(r => ({
        id: r.chunk.id,
        text: r.chunk.text,
        score: r.score,
        metadata: r.chunk.metadata,
      })),
      context,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}