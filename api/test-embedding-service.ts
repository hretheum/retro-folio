import { NextApiRequest, NextApiResponse } from 'next';
import { generateQueryEmbedding } from '../../lib/embeddings/embedding-service';
import { EmbeddingIntentClassifier } from '../../lib/intent/embedding-classifier';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testType, query } = req.body;

    switch (testType) {
      case 'embedding':
        // Test embedding generation
        const startTime = Date.now();
        const embedding = await generateQueryEmbedding(query || 'Test query');
        const duration = Date.now() - startTime;

        return res.status(200).json({
          success: true,
          testType: 'embedding',
          query: query || 'Test query',
          embeddingLength: embedding.length,
          duration: `${duration}ms`,
          sampleValues: embedding.slice(0, 5)
        });

      case 'classification':
        // Test intent classification
        const classifier = new EmbeddingIntentClassifier();
        await classifier.initialize();
        
        const classificationStart = Date.now();
        const result = await classifier.classifyIntent(query || 'What are your skills?');
        const classificationDuration = Date.now() - classificationStart;

        return res.status(200).json({
          success: true,
          testType: 'classification',
          query: query || 'What are your skills?',
          result,
          duration: `${classificationDuration}ms`
        });

      case 'integration':
        // Test full integration
        const integrationStart = Date.now();
        
        // Generate embedding
        const testEmbedding = await generateQueryEmbedding(query || 'Test integration');
        
        // Classify intent
        const testClassifier = new EmbeddingIntentClassifier();
        await testClassifier.initialize();
        const classificationResult = await testClassifier.classifyIntent(query || 'Test integration');
        
        const integrationDuration = Date.now() - integrationStart;

        return res.status(200).json({
          success: true,
          testType: 'integration',
          query: query || 'Test integration',
          embeddingGenerated: testEmbedding.length > 0,
          classificationResult,
          duration: `${integrationDuration}ms`
        });

      default:
        return res.status(400).json({ error: 'Invalid test type' });
    }
  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}