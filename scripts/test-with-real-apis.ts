import { generateQueryEmbedding } from '../lib/embeddings/embedding-service';
import { EmbeddingIntentClassifier } from '../lib/intent/embedding-classifier';
import { calculateCosineSimilarity } from '../lib/embeddings/similarity-calculator';

async function testWithRealAPIs() {
  console.log('🧪 Testing with real APIs...\n');

  // Test 1: Embedding Generation
  console.log('1️⃣ Testing Embedding Generation...');
  try {
    const testQueries = [
      'What are your programming skills?',
      'Tell me about your experience',
      'How many years have you been coding?'
    ];

    for (const query of testQueries) {
      const startTime = Date.now();
      const embedding = await generateQueryEmbedding(query);
      const duration = Date.now() - startTime;

      console.log(`✅ "${query}" -> ${embedding.length} dimensions in ${duration}ms`);
    }
  } catch (error) {
    console.error('❌ Embedding test failed:', error);
  }

  console.log('\n2️⃣ Testing Intent Classification...');
  try {
    const classifier = new EmbeddingIntentClassifier();
    await classifier.initialize();

    const testQueries = [
      { query: 'What are your main skills?', expected: 'SYNTHESIS' },
      { query: 'Tell me more about your project', expected: 'EXPLORATION' },
      { query: 'How many years of experience?', expected: 'FACTUAL' },
      { query: 'Hello there', expected: 'CASUAL' }
    ];

    for (const { query, expected } of testQueries) {
      const startTime = Date.now();
      const result = await classifier.classifyIntent(query);
      const duration = Date.now() - startTime;

      const status = result.intent === expected ? '✅' : '⚠️';
      console.log(`${status} "${query}" -> ${result.intent} (expected: ${expected}) in ${duration}ms`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.error('❌ Classification test failed:', error);
  }

  console.log('\n3️⃣ Testing Similarity Calculator...');
  try {
    const vector1 = [1, 0, 0];
    const vector2 = [0, 1, 0];
    const vector3 = [1, 0, 0];

    const similarity1 = calculateCosineSimilarity(vector1, vector2);
    const similarity2 = calculateCosineSimilarity(vector1, vector3);

    console.log(`✅ Orthogonal vectors: ${similarity1.toFixed(3)} (expected: 0)`);
    console.log(`✅ Identical vectors: ${similarity2.toFixed(3)} (expected: 1)`);
  } catch (error) {
    console.error('❌ Similarity test failed:', error);
  }

  console.log('\n4️⃣ Testing Integration...');
  try {
    const query = 'What technologies do you know?';
    
    // Generate embedding
    const embedding = await generateQueryEmbedding(query);
    
    // Classify intent
    const classifier = new EmbeddingIntentClassifier();
    await classifier.initialize();
    const result = await classifier.classifyIntent(query);

    console.log(`✅ Integration test passed:`);
    console.log(`   Query: "${query}"`);
    console.log(`   Embedding: ${embedding.length} dimensions`);
    console.log(`   Intent: ${result.intent}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }

  console.log('\n🎉 All tests completed!');
}

// Run tests
testWithRealAPIs().catch(console.error);