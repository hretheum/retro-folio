import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import type { EmbeddedChunk } from './embedding-generator';

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Get or create index
export async function getPineconeIndex(indexName: string = 'retro-folio') {
  // Index already exists, just return it
  return pinecone.index(indexName);
}

// Convert our chunks to Pinecone format
export function chunksToPineconeRecords(chunks: EmbeddedChunk[]): PineconeRecord[] {
  return chunks.map(chunk => {
    // Log first chunk for debugging
    if (chunk.id.endsWith('-chunk-0')) {
      console.log('[chunksToPineconeRecords] First chunk sample:', {
        id: chunk.id,
        textLength: chunk.text.length,
        textPreview: chunk.text.substring(0, 150),
        metadata: chunk.metadata
      });
    }
    
    return {
      id: chunk.id,
      values: chunk.embedding,
      metadata: {
        text: chunk.text,
        contentId: chunk.metadata.contentId,
        contentType: chunk.metadata.contentType,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        ...chunk.metadata,
      },
    };
  });
}

// Upsert embeddings to Pinecone
export async function upsertEmbeddings(
  chunks: EmbeddedChunk[],
  namespace: string = 'default'
): Promise<void> {
  const index = await getPineconeIndex();
  const records = chunksToPineconeRecords(chunks);
  
  // Pinecone recommends batches of 100
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
  }
}

// Search similar vectors
export async function searchSimilar(
  queryEmbedding: number[],
  options: {
    topK?: number;
    namespace?: string;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
  } = {}
): Promise<any> {
  const {
    topK = 5,
    namespace = 'default',
    filter,
    includeMetadata = true,
  } = options;
  
  const index = await getPineconeIndex();
  
  const queryResponse = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    filter,
    includeMetadata,
  });
  
  return queryResponse.matches || [];
}

// Delete all vectors in a namespace
export async function clearNamespace(namespace: string = 'default'): Promise<void> {
  const index = await getPineconeIndex();
  await index.namespace(namespace).deleteAll();
}

// Get index stats
export async function getIndexStats(): Promise<any> {
  const index = await getPineconeIndex();
  return index.describeIndexStats();
}